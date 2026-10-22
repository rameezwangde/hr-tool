import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BriefcaseBusiness, Building2, Calendar, CalendarDays, Check, ChevronLeft, ChevronRight, Download, Filter, MinusCircle, Plus, Printer, RotateCcw, Save, Search, SunMedium, Sunset, Trash2, UserCheck, UserRoundSearch, Users, X } from "lucide-react";
import StaffProfileModal from "../components/StaffProfileModal";
import { exportToPDF, printDocument } from "../utils/pdfGenerator";
import { deleteWorkLocation, getContractDrafts, getContracts, getJobPositions, getStaffProfiles, getWorkLocations, saveStaffProfile, saveWorkLocation, updateStaffProfile } from "../utils/storage";
import { daysInMonth, getCellEntries, loadRosterData, monthKey, rosterCellKey, saveRosterData, buildRosterEntry } from "../utils/roster";

const REPORT_KEY = "staffStatusReportConfigV2";
const TABLE_COLUMN_WIDTHS = {
  branch: 130,
  shift: 104,
  position: 210,
  notes: 192,
};
const cardTones = {
  violet: "bg-violet-50 text-violet-600",
  blue: "bg-blue-50 text-blue-600",
  rose: "bg-rose-50 text-rose-600",
};

const loadConfig = () => {
  try { return JSON.parse(localStorage.getItem(REPORT_KEY) || "{}") || {}; }
  catch { return {}; }
};

const profileShiftAssignments = (profile) => {
  const shifts = String(profile.assignedShift || "").split(";").map((s) => s.trim()).filter(Boolean);
  return shifts.map((s) => {
    if (s.includes("@")) {
      const [shift, branch] = s.split("@");
      return { shift: shift.trim(), branch: branch.trim() };
    }
    const defaultBranch = String(profile.workLocation || profile.workLocation1 || profile.branch || profile.statusReportBranch || "").split(";")[0].trim();
    return { shift: s, branch: defaultBranch };
  });
};

const profileBranch = (profile) => {
  const assignments = profileShiftAssignments(profile);
  if (assignments.length > 0) return assignments[0].branch;
  return String(profile.workLocation || profile.workLocation1 || profile.branch || profile.statusReportBranch || "").split(";")[0].trim();
};

const profileShifts = (profile) => {
  const rawShifts = profile.assignedShifts || profile.assignedShift || "";
  if (Array.isArray(rawShifts)) return rawShifts;
  return String(rawShifts)
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.includes("@") ? s.split("@")[0].trim() : s));
};

const personHasShift = (profile, branch, shift) => {
  const assignments = profileShiftAssignments(profile);
  return assignments.some((a) => a.shift === shift && (!branch || a.branch === branch));
};

const personHasBranch = (profile, branch) => {
  const assignments = profileShiftAssignments(profile);
  if (assignments.length === 0) {
    return profileBranch(profile) === branch;
  }
  return assignments.some((a) => a.branch === branch);
};

const cellKey = (branch, shift, position) => `${branch}::${shift}::${position}`;
const noteKey = (branch, shift, date) => date ? `${branch}::${shift}::${date}` : `${branch}::${shift}`;
const eligible = (profile) => (profile.contractStatus === "Signed" || profile.contractStatus === "Pending Signature" || !profile.contractStatus) && (profile.employmentStatus || "Active") !== "Inactive";

const toneFor = (required, assigned) => {
  if (!required) return { key: "none", label: "No requirement", cell: "border-slate-200 bg-slate-50 text-slate-500", badge: "bg-slate-200 text-slate-600", dot: "bg-slate-400" };
  if (assigned < required) return { key: "under", label: `Need ${required - assigned}`, cell: "border-rose-200 bg-rose-50/70 text-rose-700", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-400" };
  return { key: "met", label: "", cell: "border-slate-200 bg-white text-slate-700", badge: "hidden", dot: "bg-slate-300" };
};

function addMonths(month, diff) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + diff, 1);
  return date.toISOString().slice(0, 7);
}

export default function StaffStatusReport() {
  const [profiles, setProfiles] = useState(getStaffProfiles);
  const [contracts, setContracts] = useState(getContracts);
  const [jobs, setJobs] = useState(getJobPositions);
  const [locations, setLocations] = useState(getWorkLocations);
  const [config, setConfig] = useState(loadConfig);
  const [roster, setRoster] = useState(() => loadRosterData());
  const [editNeeds, setEditNeeds] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [dialogSearch, setDialogSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("Kitchen Staff");

  // Date controls: Month, Week, Day
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey());
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedDay, setSelectedDay] = useState(todayStr);

  // Add Row / Branch controls
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  const handleAddBranch = (e) => {
    if (e) e.preventDefault();
    const trimmed = newBranchName.trim();
    if (!trimmed) return;
    
    // Check if branch already exists
    if (branches.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
      window.alert(`Branch "${trimmed}" already exists.`);
      return;
    }

    saveWorkLocation(trimmed);
    setNewBranchName("");
    setIsAddingBranch(false);
  };

  const handleRemoveBranch = (branchName) => {
    if (!window.confirm(`Are you sure you want to remove row/branch "${branchName}"?`)) return;
    const loc = locations.find(l => l.name === branchName);
    if (loc && loc.id) {
      deleteWorkLocation(loc.id);
    } else {
      // If it's a default or assigned branch, save an empty workLocation list without it or remove staff associations
      const updatedLocs = locations.filter(l => l.name !== branchName);
      localStorage.setItem('workLocations', JSON.stringify(updatedLocs));
      window.dispatchEvent(new Event("workLocationsChanged"));
    }
  };

  useEffect(() => {
    const staff = () => setProfiles(getStaffProfiles());
    const contractList = () => setContracts(getContracts());
    const positions = () => setJobs(getJobPositions());
    const branches = () => setLocations(getWorkLocations());
    const syncRoster = () => setRoster(loadRosterData());
    const all = () => { staff(); contractList(); positions(); branches(); syncRoster(); };
    window.addEventListener("staffProfilesChanged", staff);
    window.addEventListener("jobPositionsChanged", positions);
    window.addEventListener("workLocationsChanged", branches);
    window.addEventListener("staffRosterChanged", syncRoster);
    window.addEventListener("storage", all);
    return () => {
      window.removeEventListener("staffProfilesChanged", staff);
      window.removeEventListener("jobPositionsChanged", positions);
      window.removeEventListener("workLocationsChanged", branches);
      window.removeEventListener("staffRosterChanged", syncRoster);
      window.removeEventListener("storage", all);
    };
  }, []);

  const monthDaysList = useMemo(() => {
    return daysInMonth(selectedMonth);
  }, [selectedMonth]);

  // Keep selectedDay valid when selectedMonth changes
  useEffect(() => {
    if (!selectedDay.startsWith(selectedMonth)) {
      const firstDay = monthDaysList[0]?.date || `${selectedMonth}-01`;
      setSelectedDay(firstDay);
    }
  }, [selectedMonth, selectedDay, monthDaysList]);

  // Filter days by week
  const filteredDays = useMemo(() => {
    if (selectedWeek === "1") return monthDaysList.slice(0, 7);
    if (selectedWeek === "2") return monthDaysList.slice(7, 14);
    if (selectedWeek === "3") return monthDaysList.slice(14, 21);
    if (selectedWeek === "4") return monthDaysList.slice(21, 28);
    if (selectedWeek === "5") return monthDaysList.slice(28);
    return monthDaysList;
  }, [monthDaysList, selectedWeek]);

  // If active selected day is outside current week filter, adjust selected day
  useEffect(() => {
    if (filteredDays.length && !filteredDays.some(d => d.date === selectedDay)) {
      setSelectedDay(filteredDays[0].date);
    }
  }, [filteredDays, selectedDay]);

  const candidateStaff = useMemo(() => {
    const staffMap = new Map();
    profiles.forEach((p) => {
      if (p.fullName && eligible(p)) {
        staffMap.set(p.employeeId || p.contractNumber || p.fullName, p);
      }
    });
    return Array.from(staffMap.values());
  }, [profiles]);

  const getPositionDepartment = useCallback((title) => {
    if (!title) return "Kitchen Staff";
    const job = jobs.find((j) => j.title === title);
    if (job?.department) return job.department;

    const managementTitles = [
      "HR",
      "Branch Manager",
      "Purchase and Inventory Controller",
      "Office Admin and Doument Controller",
      "Accountant",
      "Marketing Executive",
    ];
    if (managementTitles.includes(title)) {
      return "Management Staff";
    }

    const kitchenTitles = [
      "Cashier",
      "Dough",
      "Cooking",
      "Wrapping",
      "Helping",
    ];
    if (kitchenTitles.includes(title)) {
      return "Kitchen Staff";
    }

    const titleLower = title.toLowerCase();
    if (
      titleLower.includes("manager") ||
      titleLower.includes("admin") ||
      titleLower.includes("accountant") ||
      titleLower.includes("controller") ||
      titleLower.includes("hr") ||
      titleLower.includes("director") ||
      titleLower.includes("executive")
    ) {
      return "Management Staff";
    }

    return "Kitchen Staff";
  }, [jobs]);

  const getStaffDepartment = useCallback((p) => {
    return getPositionDepartment(p.jobTitle);
  }, [getPositionDepartment]);

  const defaultPositionsByDept = useMemo(() => ({
    "Kitchen Staff": ["Cashier", "Dough", "Cooking", "Wrapping", "Helping"],
    "Management Staff": ["Branch Manager", "HR", "Accountant", "Purchase and Inventory Controller", "Office Admin and Doument Controller", "Marketing Executive"]
  }), []);

  const allPositions = useMemo(() => {
    const drafts = getContractDrafts();
    const defaults = [...defaultPositionsByDept["Kitchen Staff"], ...defaultPositionsByDept["Management Staff"]];
    return [...new Set([
      ...defaults,
      ...jobs.map((j) => j.title),
      ...candidateStaff.map((p) => p.jobTitle),
      ...contracts.map((c) => c.jobTitle),
      ...drafts.map((d) => d.formData?.jobTitle),
    ].filter(Boolean))];
  }, [jobs, candidateStaff, contracts, defaultPositionsByDept]);

  const positions = useMemo(() => {
    const list = allPositions.filter((pos) => getPositionDepartment(pos) === activeTab);
    return list.length ? list : (defaultPositionsByDept[activeTab] || []);
  }, [allPositions, getPositionDepartment, activeTab, defaultPositionsByDept]);

  const branches = useMemo(() => {
    const list = [];
    locations.forEach((l) => {
      if (l.name) list.push(l.name);
    });
    candidateStaff.forEach((p) => {
      profileShiftAssignments(p).forEach((a) => {
        if (a.branch) list.push(a.branch);
      });
      const defaultB = String(p.workLocation || p.workLocation1 || p.branch || p.statusReportBranch || "").split(";")[0].trim();
      if (defaultB) list.push(defaultB);
    });
    const unique = [...new Set(list)].filter(Boolean);
    return unique.length ? unique : ["Dubai", "Abu Dhabi"];
  }, [locations, candidateStaff]);

  const departmentStaff = useMemo(() => {
    return candidateStaff.filter((p) => getStaffDepartment(p) === activeTab);
  }, [candidateStaff, getStaffDepartment, activeTab]);

  const kitchenStaffCount = useMemo(() => {
    return candidateStaff.filter((p) => getStaffDepartment(p) === "Kitchen Staff").length;
  }, [candidateStaff, getStaffDepartment]);

  const managementStaffCount = useMemo(() => {
    return candidateStaff.filter((p) => getStaffDepartment(p) === "Management Staff").length;
  }, [candidateStaff, getStaffDepartment]);

  const shownBranches = branches;
  const shownPositions = positions;
  const shownShifts = useMemo(() => {
    return ["Morning", "Evening"];
  }, []);

  // Assigned employees for a specific cell on the selected day
  const assigned = useCallback((branch, shift, position) => {
    // 1. Check roster entries for this specific day first
    const rKey = rosterCellKey({
      month: selectedMonth,
      branch,
      department: activeTab,
      position,
      shift,
      date: selectedDay,
    });
    const rosterEntries = getCellEntries(roster, rKey);
    const rosterWorkingIds = rosterEntries.filter(e => e.status === "Working").map(e => e.employeeId);

    if (rosterWorkingIds.length > 0) {
      return candidateStaff.filter(p => rosterWorkingIds.includes(p.employeeId));
    }

    // 2. Default to standing shift assignments for the position and branch
    return candidateStaff.filter((p) => personHasShift(p, branch, shift) && p.jobTitle === position);
  }, [candidateStaff, roster, selectedMonth, selectedDay, activeTab]);

  const required = useCallback((branch, shift, position) => Math.max(0, Number(config.requirements?.[cellKey(branch, shift, position)]) || 0), [config.requirements]);
  const visibleRows = () => shownShifts;

  // Department scheduled on the selected day
  const departmentScheduledIds = useMemo(() => {
    const scheduledIds = new Set();
    branches.forEach((b) => {
      shownShifts.forEach((s) => {
        positions.forEach((pos) => {
          assigned(b, s, pos).forEach(p => scheduledIds.add(p.employeeId));
        });
      });
    });
    return scheduledIds;
  }, [branches, shownShifts, positions, assigned]);

  const totals = useMemo(() => {
    let need = 0, have = 0;
    branches.forEach((branch) => shownShifts.forEach((shift) => positions.forEach((position) => {
      const r = required(branch, shift, position);
      const a = assigned(branch, shift, position).length;
      need += r;
      have += a;
    })));
    return {
      open: Math.max(0, need - have),
    };
  }, [branches, shownShifts, positions, required, assigned]);

  const saveConfig = (next) => { setConfig(next); localStorage.setItem(REPORT_KEY, JSON.stringify(next)); };
  const updateNeed = (branch, shift, position, value) => saveConfig({ ...config, requirements: { ...config.requirements, [cellKey(branch, shift, position)]: value } });
  const updateNote = (branch, shift, value) => saveConfig({ ...config, notes: { ...config.notes, [noteKey(branch, shift, selectedDay)]: value } });
  const openAssign = (branch = shownBranches[0] || branches[0] || "", shift = shownShifts[0] || "Morning", position = shownPositions[0] || positions[0] || "") => { setDialog({ mode: "assign", branch, shift, position }); setDialogSearch(""); };
  const openRemove = (branch = "", shift = "", position = "") => { setDialog({ mode: "remove", branch, shift, position }); setDialogSearch(""); };

  const assignPerson = (person) => {
    // Save to daily roster schedule for selectedDay
    const rKey = rosterCellKey({
      month: selectedMonth,
      branch: dialog.branch,
      department: activeTab,
      position: dialog.position,
      shift: dialog.shift,
      date: selectedDay,
    });
    const currentRosterEntries = getCellEntries(roster, rKey);
    if (!currentRosterEntries.some(e => e.employeeId === person.employeeId)) {
      const newEntry = buildRosterEntry({
        employee: person,
        date: selectedDay,
        branch: dialog.branch,
        department: activeTab,
        position: dialog.position,
        shift: dialog.shift,
        status: "Working",
      });
      const updatedRoster = {
        ...roster,
        [rKey]: [...currentRosterEntries, newEntry],
      };
      saveRosterData(updatedRoster);
      setRoster(updatedRoster);
    }

    // Also sync standing shift assignment
    const currentAssignments = profileShiftAssignments(person).map(a => `${a.shift}@${a.branch}`);
    const newAssignment = `${dialog.shift}@${dialog.branch}`;
    if (!currentAssignments.includes(newAssignment)) {
      const nextAssignments = [...currentAssignments, newAssignment].join("; ");
      saveStaffProfile({
        ...person,
        assignedShift: nextAssignments,
        statusReportBranch: dialog.branch,
        workLocation: dialog.branch,
        workLocation1: dialog.branch,
        contractStatus: person.contractStatus || "Signed",
        employmentStatus: "Active",
      });
      setProfiles(getStaffProfiles());
    }

    setDialog(null);
  };

  const removePerson = (person, targetShift, targetBranch, targetPosition) => {
    const shiftToRemove = targetShift || dialog?.shift;
    const branchToRemove = targetBranch || dialog?.branch;
    const posToRemove = targetPosition || dialog?.position || person.jobTitle;

    // Remove from roster for selectedDay
    const rKey = rosterCellKey({
      month: selectedMonth,
      branch: branchToRemove,
      department: activeTab,
      position: posToRemove,
      shift: shiftToRemove,
      date: selectedDay,
    });
    const currentRosterEntries = getCellEntries(roster, rKey);
    const updatedEntries = currentRosterEntries.filter(e => e.employeeId !== person.employeeId);
    const updatedRoster = {
      ...roster,
      [rKey]: updatedEntries,
    };
    saveRosterData(updatedRoster);
    setRoster(updatedRoster);

    // Also update standing assignments
    const currentAssignments = profileShiftAssignments(person).map(a => `${a.shift}@${a.branch}`);
    const assignmentToRemove = `${shiftToRemove}@${branchToRemove}`;
    const nextAssignments = currentAssignments
      .filter((a) => a !== assignmentToRemove && a !== shiftToRemove && a !== `${shiftToRemove}@${branchToRemove}`)
      .join("; ");
    saveStaffProfile({
      ...person,
      assignedShift: nextAssignments,
    });
    setProfiles(getStaffProfiles());
  };

  const updateSelected = (person) => { updateStaffProfile(person.employeeId, person); setSelectedProfile(person); };

  const dialogPeople = candidateStaff.filter((person) => {
    if (dialog?.mode === "assign") {
      // If position is chosen, match by jobTitle (or allow transfer/flexible if none specified)
      if (dialog.position && person.jobTitle && person.jobTitle !== dialog.position) return false;
      const alreadyAssigned = assigned(dialog.branch, dialog.shift, dialog.position || person.jobTitle).some(p => p.employeeId === person.employeeId);
      if (alreadyAssigned) return false;
    }
    if (dialog?.mode === "remove") {
      if (dialog.position && person.jobTitle && person.jobTitle !== dialog.position) return false;
      // Only show people actually assigned to this branch and shift
      const isAssigned = assigned(dialog.branch, dialog.shift, dialog.position || person.jobTitle).some(p => p.employeeId === person.employeeId);
      if (!isAssigned) return false;
    }
    const q = dialogSearch.trim().toLowerCase();
    return !q || `${person.fullName} ${person.employeeId} ${person.phoneNumber} ${person.jobTitle}`.toLowerCase().includes(q);
  });

  // Only 3 clean KPI cards: Total Employees, Scheduled Today, Open Positions
  const cards = useMemo(() => {
    return [
      ["Total Employees", departmentStaff.length, Users, "violet"],
      ["Scheduled Today", departmentScheduledIds.size, UserCheck, "blue"],
      ["Open Positions", totals.open, BriefcaseBusiness, "rose"],
    ];
  }, [departmentStaff.length, departmentScheduledIds.size, totals.open]);

  const [yearStr, monthNumStr] = selectedMonth.split("-");
  const monthName = new Date(Number(yearStr), Number(monthNumStr) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const selectedDayFormatted = new Date(selectedDay).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="mx-auto max-w-full px-4 pb-8">
      {/* Top Header */}
      <header className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950 px-4 py-3 text-white lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-black">Staff Status Report</h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">Real-time daily staffing overview, position requirements, and assignment tracking.</p>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <Action icon={Plus} label="Add Row" onClick={() => setIsAddingBranch(true)} />
            <Action icon={editNeeds ? Save : Filter} label={editNeeds ? "Save" : "Edit Required"} onClick={() => setEditNeeds(!editNeeds)} primary={editNeeds} />
            <Action icon={Plus} label="Assign" primary={!editNeeds} onClick={() => openAssign()} />
            <Action icon={MinusCircle} label="Remove" onClick={() => openRemove()} />
            <Action icon={Download} label="PDF" onClick={() => exportToPDF("staff-status-report-print", `Staff_Status_Report_${selectedDay}.pdf`)} />
            <Action icon={Printer} label="Print" onClick={() => printDocument("staff-status-report-print")} />
          </div>
        </div>
      </header>

      {/* Date Navigation Bar (Month, Week, Day controls) */}
      <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm no-print">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Month & Week Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
                className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:shadow-sm transition"
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(monthKey());
                  setSelectedDay(todayStr);
                  setSelectedWeek("all");
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-violet-700 transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:shadow-sm transition"
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="relative">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-300 focus:bg-white"
              />
            </div>

            <div className="relative">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-violet-300 focus:bg-white cursor-pointer"
              >
                <option value="all">All Weeks</option>
                <option value="1">Week 1 (Days 1 - 7)</option>
                <option value="2">Week 2 (Days 8 - 14)</option>
                <option value="3">Week 3 (Days 15 - 21)</option>
                <option value="4">Week 4 (Days 22 - 28)</option>
                <option value="5">Week 5 (Days 29+)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 pl-2 text-xs font-black text-violet-700">
              <Calendar size={14} />
              <span>{monthName}</span>
            </div>
          </div>

          {/* Active Viewing Day Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Viewing Date:</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black text-violet-800">
              <CalendarDays size={13} />
              {selectedDayFormatted}
            </span>
          </div>
        </div>

        {/* Days Pill Strip */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          {filteredDays.map((d) => {
            const isSelected = d.date === selectedDay;
            const isToday = d.date === todayStr;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDay(d.date)}
                className={`flex shrink-0 flex-col items-center justify-center rounded-lg border px-3 py-1.5 text-xs transition cursor-pointer ${
                  isSelected
                    ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                    : isToday
                    ? "border-violet-300 bg-violet-50/70 text-violet-900 hover:bg-violet-100"
                    : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-violet-200" : "text-slate-400"}`}>
                  {d.day}
                </span>
                <span className="text-sm font-black leading-tight">
                  {d.label}
                </span>
                {isToday && (
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-violet-600"}`} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="mt-3 border-b border-slate-200 no-print">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab("Kitchen Staff")}
            className={`pb-2 font-bold text-xs border-b-2 transition-all cursor-pointer ${activeTab === "Kitchen Staff" ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Kitchen Staff ({kitchenStaffCount})
          </button>
          <button 
            onClick={() => setActiveTab("Management Staff")}
            className={`pb-2 font-bold text-xs border-b-2 transition-all cursor-pointer ${activeTab === "Management Staff" ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Management Staff ({managementStaffCount})
          </button>
        </div>
      </div>

      <div id="staff-status-report-print">
        {/* Printable Header */}
        <div className="hidden print-only mb-4 border-b border-slate-300 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">Staff Status Report - {activeTab}</h1>
              <p className="text-xs text-slate-600 mt-0.5">Date: {selectedDayFormatted} ({selectedMonth})</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-bold text-slate-800">Greek Souvlaki HR</p>
              <p>Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Clean 3 KPI Cards */}
        <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cards.map(([label, value, Icon, color]) => (
            <article key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cardTones[color]}`}>
                <Icon size={20} />
              </span>
              <div>
                <p className="text-xl font-black leading-tight text-slate-900">{value}</p>
                <p className="text-xs font-bold text-slate-500">{label}</p>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold no-print">
          <Legend color="bg-rose-400" text="Staff required" />
          <Legend color="bg-slate-300" text="No requirement" />
          <span className="ml-auto text-slate-400 text-[11px]">Selected: {selectedDayFormatted}</span>
        </div>

        {/* Status Report Table with Full Scroll and Sticky Headers */}
        <section className="mt-3 hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="overflow-auto max-h-[72vh]">
            <table
              className="min-w-max table-fixed border-separate border-spacing-0 text-left text-xs"
              style={{
                width: TABLE_COLUMN_WIDTHS.branch + TABLE_COLUMN_WIDTHS.shift + TABLE_COLUMN_WIDTHS.notes + (shownPositions.length * TABLE_COLUMN_WIDTHS.position),
              }}
            >
            <colgroup>
              <col style={{ width: TABLE_COLUMN_WIDTHS.branch }} />
              <col style={{ width: TABLE_COLUMN_WIDTHS.shift }} />
              {shownPositions.map((position) => <col key={position} style={{ width: TABLE_COLUMN_WIDTHS.position }} />)}
              <col style={{ width: TABLE_COLUMN_WIDTHS.notes }} />
            </colgroup>
            <thead className="sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 z-40 border-b border-r border-slate-700 bg-slate-900 px-2 py-2 text-[11px] font-black uppercase text-white shadow-sm">Branch</th>
                <th className="sticky z-40 border-b border-r border-slate-700 bg-slate-900 px-2 py-2 text-[11px] font-black uppercase text-white shadow-sm" style={{ left: TABLE_COLUMN_WIDTHS.branch }}>Shift</th>
                {shownPositions.map((position) => {
                  const r = shownBranches.reduce((sum, b) => sum + shownShifts.reduce((n, s) => n + required(b, s, position), 0), 0);
                  const a = shownBranches.reduce((sum, b) => sum + shownShifts.reduce((n, s) => n + assigned(b, s, position).length, 0), 0);
                  return <PositionHead key={position} position={position} required={r} assigned={a} />;
                })}
                <th className="border-b border-slate-700 bg-slate-900 px-2 py-2 text-[11px] font-black uppercase text-white shadow-sm">Notes</th>
              </tr>
            </thead>
            <tbody>
              {shownBranches.map((branch) => {
                const rows = visibleRows(branch);
                return rows.map((shift, index) => (
                  <tr key={`${branch}-${shift}`} className="hover:bg-slate-50/30">
                    {index === 0 && (
                      <th rowSpan={rows.length} className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white px-2 py-2 text-left font-black text-slate-900 align-middle">
                        <div className="flex items-center justify-between gap-1 group">
                          <span className="truncate">{branch}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBranch(branch)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-600 p-0.5 rounded no-print"
                            title={`Remove branch ${branch}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </th>
                    )}
                    <th className="sticky z-20 border-b border-r border-slate-200 bg-white px-2 py-2 align-middle" style={{ left: TABLE_COLUMN_WIDTHS.branch }}>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${shift === "Morning" ? "bg-sky-50 text-sky-700" : "bg-indigo-50 text-indigo-700"}`}>
                        {shift === "Morning" ? <SunMedium size={10} /> : <Sunset size={10} />}
                        {activeTab === "Management Staff" ? (shift === "Morning" ? "Morning (9:30-5:00)" : "Evening (4:40PM-12:00AM)") : shift}
                      </span>
                    </th>
                    {shownPositions.map((position) => {
                      const people = assigned(branch, shift, position);
                      const r = required(branch, shift, position);
                      return <StaffCell key={position} {...{ branch, shift, position, people, required: r, tone: toneFor(r, people.length), editNeeds, updateNeed, openAssign, removePerson, setSelectedProfile }} />;
                    })}
                    <td className="border-b border-slate-200 bg-white p-1.5 align-middle">
                      <input 
                        className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs outline-none focus:border-violet-300 focus:bg-white" 
                        value={config.notes?.[noteKey(branch, shift, selectedDay)] || config.notes?.[noteKey(branch, shift)] || ""} 
                        onChange={(e) => updateNote(branch, shift, e.target.value)} 
                        placeholder="Notes..." 
                      />
                    </td>
                  </tr>
                ));
              })}

              {/* Bottom Add Row / Branch Interactive Row */}
              <tr className="no-print bg-slate-50/60 hover:bg-slate-50 transition">
                <td colSpan={shownPositions.length + 3} className="border-t border-slate-200 p-2">
                  {isAddingBranch ? (
                    <form onSubmit={handleAddBranch} className="flex items-center gap-2 max-w-md">
                      <div className="relative flex-1">
                        <Building2 size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          autoFocus
                          type="text"
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                          placeholder="Enter new branch or row name (e.g. Sharjah, Marina, Branch 3)..."
                          className="w-full rounded-lg border border-violet-400 bg-white py-1.5 pl-8 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-black text-white hover:bg-violet-700 transition cursor-pointer shadow-xs"
                      >
                        <Check size={14} />
                        Add Row
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingBranch(false);
                          setNewBranchName("");
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingBranch(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-700 transition cursor-pointer"
                    >
                      <Plus size={14} className="text-violet-600" />
                      <span>Add Row / Branch</span>
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          {!shownPositions.length && <Empty text="No positions configured." />}
          {!shownBranches.length && <Empty text="No branches configured." />}
        </div>
      </section>

      <section className="mt-3 space-y-3 lg:hidden">
        {shownBranches.map((branch) => (
          <article key={branch} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-violet-600" />
                <h3 className="font-black text-xs">{branch}</h3>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveBranch(branch)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded"
                title={`Remove ${branch}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            {visibleRows(branch).map((shift) => (
              <div key={shift} className="border-b p-3 last:border-0">
                <h4 className="mb-2 flex items-center gap-1.5 font-black text-xs text-slate-700">
                  {shift === "Morning" ? <SunMedium size={14} /> : <Sunset size={14} />}
                  {activeTab === "Management Staff" ? (shift === "Morning" ? "Morning (9:30-5:00)" : "Evening (4:40PM-12:00AM)") : shift}
                </h4>
                <div className="space-y-1.5">
                  {shownPositions.map((position) => {
                    const people = assigned(branch, shift, position);
                    const r = required(branch, shift, position);
                    const tone = toneFor(r, people.length);
                    return (
                      <button key={position} onClick={() => openAssign(branch, shift, position)} className={`w-full rounded-lg border p-2 text-left text-xs ${tone.cell}`}>
                        <span className="flex justify-between gap-2 font-black">
                          <span>{position}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${tone.badge}`}>{tone.label}</span>
                        </span>
                        <span className="mt-1 block text-[10px]">{people.length ? people.map((p) => p.fullName).join(", ") : "Tap to assign"}</span>
                      </button>
                    );
                  })}
                </div>
                <input 
                  className="mt-2 w-full rounded border border-slate-200 bg-slate-50 p-2 text-xs" 
                  value={config.notes?.[noteKey(branch, shift, selectedDay)] || config.notes?.[noteKey(branch, shift)] || ""} 
                  onChange={(e) => updateNote(branch, shift, e.target.value)} 
                  placeholder="Shift notes..." 
                />
              </div>
            ))}
          </article>
        ))}

        {/* Mobile Add Row / Branch button */}
        <div className="pt-2 no-print">
          {isAddingBranch ? (
            <form onSubmit={handleAddBranch} className="rounded-xl border border-violet-200 bg-white p-3 shadow-xs space-y-2">
              <label className="block text-xs font-bold text-slate-700">Add New Row / Branch</label>
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Branch or location name..."
                  className="flex-1 rounded-lg border border-slate-300 p-2 text-xs font-semibold outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-700 cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingBranch(false);
                    setNewBranchName("");
                  }}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={14} />
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingBranch(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-xs font-bold text-slate-700 hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-700 transition"
            >
              <Plus size={16} className="text-violet-600" />
              <span>Add Row / Branch</span>
            </button>
          )}
        </div>
      </section>
    </div>

    <AnimatePresence>
      {dialog && <AssignDialog dialog={dialog} setDialog={setDialog} branches={branches} positions={positions} people={dialogPeople} search={dialogSearch} setSearch={setDialogSearch} assign={assignPerson} remove={removePerson} profileShifts={profileShifts} profileBranch={profileBranch} shifts={shownShifts} />}
    </AnimatePresence>
    {selectedProfile && <StaffProfileModal profile={selectedProfile} profiles={profiles} onProfileUpdate={updateSelected} onClose={() => setSelectedProfile(null)} />}
  </div>
  );
}

function Action({ icon: Icon, label, onClick, primary }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${primary ? "bg-violet-500 text-white shadow shadow-violet-950/20 hover:bg-violet-400" : "border border-white/15 bg-white/10 text-white hover:bg-white/15"}`}><Icon size={14} />{label}</button>;
}
function Legend({ color, text }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600"><span className={`h-2 w-2 rounded-full ${color}`} />{text}</span>;
}
function Select({ label, value, options, all, change, disabled }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-slate-600">{label}</span>
      <select 
        className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-100 cursor-pointer" 
        value={value} 
        onChange={(e) => change(e.target.value)} 
        disabled={disabled}
      >
        <option value="">{all}</option>
        {options.map((option) => { 
          const item = typeof option === "string" ? { value: option, label: option } : option; 
          return <option key={item.value} value={item.value}>{item.label}</option>; 
        })}
      </select>
    </label>
  );
}

function PositionHead({ position, required, assigned }) {
  return (
    <th className="border-b border-r border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
      <div className="flex flex-col gap-0.5">
        <p className="truncate font-black" title={position}>{position}</p>
        <div className="flex items-center gap-1.5 opacity-80 text-[10px] font-bold">
          <span>Req: {required}</span>
          <span>·</span>
          <span>Asgn: {assigned}</span>
        </div>
      </div>
    </th>
  );
}

function StaffCell({ branch, shift, position, people, required, tone, editNeeds, updateNeed, openAssign, removePerson, setSelectedProfile }) {
  return (
    <td onClick={() => openAssign(branch, shift, position)} className={`cursor-pointer border-b border-r p-2 align-top transition hover:ring-2 hover:ring-inset hover:ring-violet-300 ${tone.cell}`}>
      <div className="flex min-h-[92px] flex-col justify-between gap-1.5">
        <div>
          <div className="flex items-center justify-between mb-1 border-b border-current/10 pb-1">
            <span className="text-[10px] font-bold opacity-70">Staff ({people.length})</span>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); openAssign(branch, shift, position); }}
              className="flex h-5 w-5 items-center justify-center rounded bg-black/5 hover:bg-black/10 text-current transition-colors"
              title="Assign employee"
            >
              <Plus size={11} />
            </button>
          </div>
          <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5">
            <AnimatePresence initial={false}>
              {people.map((person) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: .95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: .95 }}
                  key={person.employeeId}
                  onClick={(e) => { e.stopPropagation(); setSelectedProfile(person); }}
                  className="group relative flex items-center justify-between gap-1 rounded border border-slate-200/80 bg-white px-2 py-1 shadow-sm hover:border-violet-300"
                >
                  <span className="truncate text-[11px] font-bold text-slate-800" title={person.fullName}>{person.fullName}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removePerson(person, shift, branch, position); }} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {!people.length && (
              <span className="block text-center text-[11px] font-semibold text-slate-400 border border-dashed border-slate-300 py-1.5 rounded bg-white/40 hover:bg-white/70">
                + Add staff
              </span>
            )}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-between pt-1 border-t border-current/10 text-[10px] font-bold opacity-80">
          {editNeeds ? (
            <label className="flex items-center gap-1">
              <span>Req:</span>
              <input className="h-6 w-11 rounded border border-slate-300 bg-white text-center text-xs font-black text-slate-900 shadow-sm" type="number" min="0" value={required} onChange={(e) => updateNeed(branch, shift, position, e.target.value)} />
            </label>
          ) : (
            <span className="ml-auto text-[11px]">{people.length}/{required}</span>
          )}
        </div>
      </div>
    </td>
  );
}

function AssignDialog({ dialog, setDialog, branches, positions, people, search, setSearch, assign, remove, profileShifts, profileBranch, shifts }) {
  const assigning = dialog.mode === "assign";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setDialog(null)} className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <motion.section initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} onMouseDown={(e) => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${assigning ? "bg-violet-600" : "bg-rose-600"}`} />
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{assigning ? "Staff Assignment" : "Shift Removal"}</p>
            </div>
            <h2 className="mt-0.5 text-lg font-black text-slate-900">{assigning ? "Assign Staff to Shift" : "Remove Staff from Shift"}</h2>
          </div>
          <button type="button" onClick={() => setDialog(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition">
            <X size={16} />
          </button>
        </header>

        {/* Dropdowns */}
        <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-3">
          <Select label="Branch" value={dialog.branch} options={branches} all="All branches" change={(v) => setDialog({ ...dialog, branch: v })} />
          <Select label="Shift" value={dialog.shift} options={shifts} all="All shifts" change={(v) => setDialog({ ...dialog, shift: v })} />
          <Select label="Position" value={dialog.position} options={positions} all="All positions" change={(v) => setDialog({ ...dialog, position: v })} />
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              autoFocus 
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by employee name, ID, position, or phone..." 
            />
          </div>
        </div>

        {/* Staff List */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4 min-h-[220px]">
          {people.map((person) => { 
            const s = profileShifts(person); 
            return (
              <div 
                key={person.employeeId} 
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 hover:border-violet-300 hover:bg-violet-50/40 transition shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-black text-violet-700">
                    {String(person.fullName || "E").split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-900">{person.fullName}</p>
                    <p className="truncate text-[11px] font-semibold text-slate-500 mt-0.5">
                      <span className="text-violet-700 font-bold">{person.jobTitle || "No role"}</span> · {person.employeeId} · {person.workLocation || profileBranch(person)}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => assigning ? assign(person) : remove(person, dialog.shift, dialog.branch, dialog.position)} 
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    assigning 
                      ? "bg-violet-600 text-white shadow-xs hover:bg-violet-700" 
                      : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  {assigning ? "Assign" : "Remove"}
                </button>
              </div>
            ); 
          })}

          {!people.length && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
              <UserRoundSearch className="mx-auto text-slate-300" size={32} />
              <p className="mt-2.5 text-xs font-bold text-slate-700">No matching employees found</p>
              <p className="mt-1 text-[11px] text-slate-400">
                {assigning ? "Try changing or clearing the position/branch filter above." : "No employees currently scheduled for this shift/cell."}
              </p>
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
function Empty({ text }) { return <div className="p-12 text-center text-sm font-semibold text-slate-500">{text}</div>; }
