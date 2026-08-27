import dagre from "dagre";
import { entryStatusStyles } from "../../utils/roster";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 280;
const nodeHeight = 120;

export const buildOrgChart = (employees, branches, requirements, rosterData, onEmployeeClick, dateStr) => {
  const nodes = [];
  const edges = [];
  const today = dateStr || new Date().toISOString().slice(0, 10);
  
  // Helper to add node
  const addNode = (id, type, data) => {
    nodes.push({ id, type, data: { ...data, id }, position: { x: 0, y: 0 } });
  };
  
  // Helper to add edge
  const addEdge = (source, target) => {
    edges.push({ id: `e-${source}-${target}`, source, target, type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 } });
  };

  const getInitials = (name) => String(name || "").split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase();
  
  const getRosterBadge = (employeeId) => {
    const todayEntries = Object.values(rosterData).flat().filter(e => e.employeeId === employeeId && e.date === today);
    if (!todayEntries.length) return null;
    const entry = todayEntries[0];
    let badgeText = entry.status === "Working" ? entry.shift : entry.status;
    let badgeClass = entry.status === "Working" 
      ? (entry.shift === "Morning" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800")
      : (entryStatusStyles[entry.status] || "bg-slate-100 text-slate-700");
    return { text: badgeText, class: badgeClass };
  };

  const createEmployeeData = (emp) => {
    const badge = getRosterBadge(emp.employeeId);
    return {
      profile: emp,
      employeeId: emp.employeeId,
      name: emp.fullName,
      initials: getInitials(emp.fullName),
      position: emp.jobTitle,
      status: emp.employmentStatus,
      rosterStatus: badge?.text,
      rosterBadgeClass: badge?.class,
      onClick: onEmployeeClick
    };
  };

  // 1. Executive Level
  const ceo = employees.find(e => /\bceo\b|chief executive|general manager/i.test(`${e.jobTitle} ${e.department}`));
  const coo = employees.find(e => /\bcoo\b|chief operating|operations manager/i.test(`${e.jobTitle} ${e.department}`));
  
  if (ceo) addNode("ceo", "executive", { title: "CEO", name: ceo.fullName, employeesCount: employees.length });
  else addNode("ceo", "executive", { title: "CEO", name: "Vacant", employeesCount: employees.length });
  
  if (coo) {
    addNode("coo", "executive", { title: "COO", name: coo.fullName });
    addEdge("ceo", "coo");
  }

  const rootParent = coo ? "coo" : "ceo";

  // 2. Departments
  const departments = [
    { id: "dept-operations", name: "Operations", keywords: ["operation", "branch manager"] },
    { id: "dept-hr", name: "Human Resources", keywords: ["hr", "human resource"] },
    { id: "dept-accounts", name: "Finance & Accounts", keywords: ["account", "finance"] },
    { id: "dept-purchase", name: "Purchase", keywords: ["purchase", "inventory"] },
    { id: "dept-admin", name: "Administration", keywords: ["admin", "document controller"] }
  ];

  departments.forEach(dept => {
    // Find management employees for this dept (excluding CEO/COO)
    const deptEmployees = employees.filter(e => {
      if (e === ceo || e === coo) return false;
      const text = `${e.jobTitle} ${e.department}`.toLowerCase();
      // If it's Operations, branch managers go here
      if (dept.id === "dept-operations") {
        return text.includes("branch manager") || text.includes("store manager") || text.includes("operation");
      }
      return dept.keywords.some(k => text.includes(k));
    });

    addNode(dept.id, "department", { title: dept.name, count: deptEmployees.length });
    addEdge(rootParent, dept.id);

    // If it's not Operations, attach employees directly to the department
    if (dept.id !== "dept-operations") {
      deptEmployees.forEach(emp => {
        const empId = `emp-${emp.employeeId}`;
        addNode(empId, "employee", createEmployeeData(emp));
        addEdge(dept.id, empId);
      });
    }
  });

  // 3. Branches under Operations
  const branchList = branches.map(b => b.name).filter(Boolean);
  
  branchList.forEach(branchName => {
    const branchId = `branch-${branchName}`;
    const branchEmployees = employees.filter(e => {
      const bList = [e.statusReportBranch, e.workLocation1, e.workLocation2, e.workLocation, e.branch].filter(Boolean);
      return bList.includes(branchName) || bList.length === 0 && e.department?.includes("Kitchen");
    });
    
    const branchManagers = branchEmployees.filter(e => /branch manager|store manager/i.test(e.jobTitle));
    const kitchenStaff = branchEmployees.filter(e => !branchManagers.includes(e));
    
    // Calculate Branch Coverage
    let mReq = 0, mAss = 0, eReq = 0, eAss = 0, openReq = 0;
    const positions = ["Cooking", "Wrapping", "Dough", "Helping", "Cashier", "Trainee"];
    
    positions.forEach(pos => {
      const mr = Number(requirements.requirements?.[`${branchName}::Morning::${pos}`]) || 0;
      const er = Number(requirements.requirements?.[`${branchName}::Evening::${pos}`]) || 0;
      mReq += mr;
      eReq += er;
      
      const posEmps = kitchenStaff.filter(e => {
        const text = (e.jobTitle || "").toLowerCase();
        if (pos === "Cooking") return text.includes("cook");
        if (pos === "Wrapping") return text.includes("wrap");
        if (pos === "Dough") return text.includes("dough");
        if (pos === "Helping") return text.includes("help");
        if (pos === "Cashier") return text.includes("cashier");
        if (pos === "Trainee") return text.includes("trainee");
        return false;
      });
      
      // Rough assignment calculation based on Staff Status Report logic
      // In SSR, assignments are mapped from shifts. Here we just take raw employee count as an approximation
      // Wait, Staff Status Report looks at the actual roster or the profile shifts.
      // Profile shifts:
      const mStaff = posEmps.filter(e => (e.assignedShifts || e.assignedShift || "Morning").includes("Morning")).length;
      const eStaff = posEmps.filter(e => (e.assignedShifts || e.assignedShift || "Evening").includes("Evening")).length;
      
      mAss += mStaff;
      eAss += eStaff;
      
      if (mStaff < mr) openReq += (mr - mStaff);
      if (eStaff < er) openReq += (er - eStaff);
    });

    const morningCoverage = mReq ? Math.min(100, Math.round((mAss / mReq) * 100)) : 100;
    const eveningCoverage = eReq ? Math.min(100, Math.round((eAss / eReq) * 100)) : 100;

    addNode(branchId, "branch", {
      title: branchName,
      managerName: branchManagers[0]?.fullName,
      morningCoverage,
      eveningCoverage,
      openRequirements: openReq
    });
    addEdge("dept-operations", branchId);

    // Link Branch Manager Employee Node
    let parentForPositions = branchId;
    if (branchManagers.length > 0) {
      const bmId = `emp-${branchManagers[0].employeeId}`;
      addNode(bmId, "employee", createEmployeeData(branchManagers[0]));
      addEdge(branchId, bmId);
      parentForPositions = bmId; // Positions flow under Branch Manager
    }

    // 4. Position Groups
    positions.forEach(pos => {
      const mr = Number(requirements.requirements?.[`${branchName}::Morning::${pos}`]) || 0;
      const er = Number(requirements.requirements?.[`${branchName}::Evening::${pos}`]) || 0;
      
      const posEmps = kitchenStaff.filter(e => {
        const text = (e.jobTitle || "").toLowerCase();
        if (pos === "Cooking") return text.includes("cook");
        if (pos === "Wrapping") return text.includes("wrap");
        if (pos === "Dough") return text.includes("dough");
        if (pos === "Helping") return text.includes("help");
        if (pos === "Cashier") return text.includes("cashier");
        if (pos === "Trainee") return text.includes("trainee");
        return false;
      });

      if (posEmps.length === 0 && mr === 0 && er === 0) return; // Skip empty unrequired positions

      const mAssigned = posEmps.filter(e => (e.assignedShifts || e.assignedShift || "Morning").includes("Morning")).length;
      const eAssigned = posEmps.filter(e => (e.assignedShifts || e.assignedShift || "Evening").includes("Evening")).length;
      
      const missing = Math.max(0, mr - mAssigned) + Math.max(0, er - eAssigned);
      const over = Math.max(0, mAssigned - mr) + Math.max(0, eAssigned - er);
      
      let status = "NONE";
      if (missing > 0) status = "NEED_STAFF";
      else if (over > 0 && (mr > 0 || er > 0)) status = "OVERSTAFFED";
      else if (mr > 0 || er > 0) status = "FULL";

      const posId = `pos-${branchName}-${pos}`;
      addNode(posId, "position", {
        title: pos,
        status,
        missingCount: missing,
        overCount: over,
        morningRequired: mr,
        morningAssigned: mAssigned,
        eveningRequired: er,
        eveningAssigned: eAssigned,
        totalAssigned: posEmps.length
      });
      addEdge(parentForPositions, posId);

      // 5. Kitchen Employees
      posEmps.forEach(emp => {
        const empId = `emp-${emp.employeeId}`;
        addNode(empId, "employee", createEmployeeData(emp));
        addEdge(posId, empId);
      });
    });
  });

  // Apply Dagre layout
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });
  
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(dagreGraph);
  
  nodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};
