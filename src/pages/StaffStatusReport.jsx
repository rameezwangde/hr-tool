import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BriefcaseBusiness, Building2, Download, Filter, LayoutGrid, MinusCircle, Plus, Printer, Save, Search, SunMedium, Sunset, UserCheck, UserRoundSearch, Users, X } from "lucide-react";
import StaffProfileModal from "../components/StaffProfileModal";
import { exportToPDF, printDocument } from "../utils/pdfGenerator";
import { getContractDrafts, getContracts, getJobPositions, getStaffProfiles, getWorkLocations, saveStaffProfile, updateStaffProfile } from "../utils/storage";

const REPORT_KEY = "staffStatusReportConfigV2";
const TABLE_COLUMN_WIDTHS = {
  branch: 128,
  shift: 104,
  position: 210,
  notes: 192,
};
const cardTones = {
  violet: "bg-violet-50 text-violet-600", blue: "bg-blue-50 text-blue-600", rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600", sky: "bg-sky-50 text-sky-600", indigo: "bg-indigo-50 text-indigo-600", emerald: "bg-emerald-50 text-emerald-600",
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
const noteKey = (branch, shift) => `${branch}::${shift}`;
const eligible = (profile) => (profile.contractStatus === "Signed" || profile.contractStatus === "Pending Signature" || !profile.contractStatus) && (profile.employmentStatus || "Active") !== "Inactive";
const pct = (assigned, required) => required ? Math.min(100, Math.round(assigned / required * 100)) : 100;

const toneFor = (required, assigned) => {
  if (!required) return { key: "none", label: "No requirement", cell: "border-slate-200 bg-slate-50 text-slate-500", badge: "bg-slate-200 text-slate-600", dot: "bg-slate-400" };
  if (assigned < required) return { key: "under", label: `Need ${required - assigned}`, cell: "border-rose-200 bg-rose-50/70 text-rose-700", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-400" };
  return { key: "met", label: "", cell: "border-slate-200 bg-white text-slate-700", badge: "hidden", dot: "bg-slate-300" };
};

export default function StaffStatusReport() {
  const [profiles, setProfiles] = useState(getStaffProfiles);
  const [contracts, setContracts] = useState(getContracts);
  const [jobs, setJobs] = useState(getJobPositions);
  const [locations, setLocations] = useState(getWorkLocations);
  const [config, setConfig] = useState(loadConfig);
  const [editNeeds, setEditNeeds] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [dialogSearch, setDialogSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("Kitchen Staff");

  useEffect(() => {
    const staff = () => setProfiles(getStaffProfiles());
    const contractList = () => setContracts(getContracts());
    const positions = () => setJobs(getJobPositions());
    const branches = () => setLocations(getWorkLocations());
    const all = () => { staff(); contractList(); positions(); branches(); };
    window.addEventListener("staffProfilesChanged", staff);
    window.addEventListener("jobPositionsChanged", positions);
    window.addEventListener("workLocationsChanged", branches);
    window.addEventListener("storage", all);
    return () => {
      window.removeEventListener("staffProfilesChanged", staff);
      window.removeEventListener("jobPositionsChanged", positions);
      window.removeEventListener("workLocationsChanged", branches);
      window.removeEventListener("storage", all);
    };
  }, []);

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

    // 1. Check configured jobs from getJobPositions()
    const job = jobs.find((j) => j.title === title);
    if (job?.department) return job.department;

    // 2. Direct default mappings for standard roles to avoid misclassification from defaulted profile/contract data
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

    // 3. Keyword/text matching fallback for dynamic titles
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

  const allPositions = useMemo(() => {
    const drafts = getContractDrafts();
    return [...new Set([
      ...jobs.map((j) => j.title),
      ...candidateStaff.map((p) => p.jobTitle),
      ...contracts.map((c) => c.jobTitle),
      ...drafts.map((d) => d.formData?.jobTitle),
    ].filter(Boolean))];
  }, [jobs, candidateStaff, contracts]);

  const positions = useMemo(() => {
    return allPositions.filter((pos) => getPositionDepartment(pos) === activeTab);
  }, [allPositions, getPositionDepartment, activeTab]);

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
    return [...new Set(list)].filter(Boolean);
  }, [locations, candidateStaff]);
  const scheduled = candidateStaff.filter((p) => profileBranch(p) && profileShifts(p).length > 0);
  
  const departmentStaff = useMemo(() => {
    return candidateStaff.filter((p) => getStaffDepartment(p) === activeTab);
  }, [candidateStaff, getStaffDepartment, activeTab]);

  const departmentScheduled = useMemo(() => {
    return scheduled.filter((p) => departmentStaff.some((ds) => ds.employeeId === p.employeeId));
  }, [scheduled, departmentStaff]);

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

  const assigned = useCallback((branch, shift, position) => candidateStaff.filter((p) => personHasShift(p, branch, shift) && p.jobTitle === position), [candidateStaff]);
  const required = useCallback((branch, shift, position) => Math.max(0, Number(config.requirements?.[cellKey(branch, shift, position)]) || 0), [config.requirements]);
  const visibleRows = () => shownShifts;

  const totals = useMemo(() => {
    let need = 0, have = 0, morningNeed = 0, morningHave = 0, eveningNeed = 0, eveningHave = 0;
    const weakBranches = new Set();
    branches.forEach((branch) => shownShifts.forEach((shift) => positions.forEach((position) => {
      const r = required(branch, shift, position), a = assigned(branch, shift, position).length;
      need += r; have += a;
      if (shift === "Morning") { morningNeed += r; morningHave += a; } 
      else if (shift === "Evening") { eveningNeed += r; eveningHave += a; }
      if (a < r) weakBranches.add(branch);
    })));
    return { open: Math.max(0, need - have), weak: weakBranches.size, morning: pct(morningHave, morningNeed), evening: pct(eveningHave, eveningNeed), overall: pct(have, need) };
  }, [branches, shownShifts, positions, required, assigned]);

  const saveConfig = (next) => { setConfig(next); localStorage.setItem(REPORT_KEY, JSON.stringify(next)); };
  const updateNeed = (branch, shift, position, value) => saveConfig({ ...config, requirements: { ...config.requirements, [cellKey(branch, shift, position)]: value } });
  const updateNote = (branch, shift, value) => saveConfig({ ...config, notes: { ...config.notes, [noteKey(branch, shift)]: value } });
  const openAssign = (branch = shownBranches[0] || branches[0] || "", shift = shownShifts[0] || "Morning", position = shownPositions[0] || positions[0] || "") => { setDialog({ mode: "assign", branch, shift, position }); setDialogSearch(""); };
  const openRemove = (branch = "", shift = "", position = "") => { setDialog({ mode: "remove", branch, shift, position }); setDialogSearch(""); };
  
  const assignPerson = (person) => {
    const currentAssignments = profileShiftAssignments(person).map(a => `${a.shift}@${a.branch}`);
    const newAssignment = `${dialog.shift}@${dialog.branch}`;
    if (currentAssignments.includes(newAssignment)) {
      setDialog(null);
      return;
    }
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
    setDialog(null);
  };
  
  const removePerson = (person, targetShift, targetBranch) => {
    const currentAssignments = profileShiftAssignments(person).map(a => `${a.shift}@${a.branch}`);
    const shiftToRemove = targetShift || dialog?.shift;
    const branchToRemove = targetBranch || dialog?.branch;
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
      if (person.jobTitle !== dialog.position) return false;
      if (personHasShift(person, null, dialog.shift)) return false;
    }
    if (dialog?.mode === "remove") {
      if (!profileShifts(person).length) return false;
      if (dialog.branch && !personHasBranch(person, dialog.branch)) return false;
      if (dialog.shift && !personHasShift(person, dialog.branch, dialog.shift)) return false;
      if (dialog.position && person.jobTitle !== dialog.position) return false;
    }
    const q = dialogSearch.trim().toLowerCase();
    return !q || `${person.fullName} ${person.employeeId} ${person.phoneNumber}`.toLowerCase().includes(q);
  });

  const cards = useMemo(() => {
    const list = [
      ["Total Employees", departmentStaff.length, Users, "violet"],
      ["Scheduled Today", new Set(departmentScheduled.map((p) => p.employeeId)).size, UserCheck, "blue"],
      ["Open Positions", totals.open, BriefcaseBusiness, "rose"],
      ["Understaffed Branches", totals.weak, AlertTriangle, "amber"],
      ["Morning Coverage", `${totals.morning}%`, SunMedium, "sky"],
      ["Evening Coverage", `${totals.evening}%`, Sunset, "indigo"],
      ["Overall Staffing", `${totals.overall}%`, LayoutGrid, "emerald"],
    ];
    return list;
  }, [departmentStaff.length, departmentScheduled, totals]);

  return <div className="mx-auto max-w-full px-4 pb-4">
    <header className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950 px-4 py-3 text-white lg:flex-row lg:items-center lg:justify-between">
        <div><h1 className="text-xl font-black">Staff Status Report</h1></div>
        <div className="flex flex-wrap gap-2 no-print"><Action icon={editNeeds ? Save : Filter} label={editNeeds ? "Save" : "Edit Required"} onClick={() => setEditNeeds(!editNeeds)} primary={editNeeds} /><Action icon={Plus} label="Assign" primary={!editNeeds} onClick={() => openAssign()} /><Action icon={MinusCircle} label="Remove" onClick={() => openRemove()} /><Action icon={Download} label="PDF" onClick={() => exportToPDF("staff-status-report-print", "Staff_Status_Report.pdf")} /><Action icon={Printer} label="Print" onClick={() => printDocument("staff-status-report-print")} /></div>
      </div>
    </header>

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
      <div className="hidden print-only mb-3">
        <h1 className="text-lg font-black text-slate-900">Staff Status Report - {activeTab}</h1>
      </div>

      <section className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
        {cards.map(([label, value, Icon, color]) => (
          <article key={label} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cardTones[color]}`}><Icon size={15} /></span>
            <div>
              <p className="text-sm font-black leading-none text-slate-900">{value}</p>
              <p className="mt-0.5 text-[10px] font-bold text-slate-500 leading-none">{label}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-bold">
        <Legend color="bg-rose-400" text="Staff required" />
        <Legend color="bg-slate-300" text="No requirement" />
        <span className="ml-auto text-slate-400">Updated {new Date().toLocaleString()}</span>
      </div>

      <section className="mt-3 hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="overflow-x-auto">
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
                        {branch}
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
                        value={config.notes?.[noteKey(branch, shift)] || ""} 
                        onChange={(e) => updateNote(branch, shift, e.target.value)} 
                        placeholder="Notes..." 
                      />
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
          {!shownPositions.length && <Empty text="No positions configured." />}
          {!shownBranches.length && <Empty text="No branches configured." />}
        </div>
      </section>

      <section className="mt-3 space-y-3 lg:hidden">
        {shownBranches.map((branch) => (
          <article key={branch} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b bg-slate-50 p-3">
              <Building2 size={16} className="text-violet-600" />
              <h3 className="font-black text-xs">{branch}</h3>
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
                  value={config.notes?.[noteKey(branch, shift)] || ""} 
                  onChange={(e) => updateNote(branch, shift, e.target.value)} 
                  placeholder="Shift notes..." 
                />
              </div>
            ))}
          </article>
        ))}
      </section>
    </div>

    <AnimatePresence>
      {dialog && <AssignDialog dialog={dialog} setDialog={setDialog} branches={branches} positions={positions} people={dialogPeople} search={dialogSearch} setSearch={setDialogSearch} assign={assignPerson} remove={removePerson} profileShifts={profileShifts} profileBranch={profileBranch} shifts={shownShifts} />}
    </AnimatePresence>
    {selectedProfile && <StaffProfileModal profile={selectedProfile} profiles={profiles} onProfileUpdate={updateSelected} onClose={() => setSelectedProfile(null)} />}
  </div>;
}

function Action({ icon: Icon, label, onClick, primary }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${primary ? "bg-violet-500 text-white shadow shadow-violet-950/20 hover:bg-violet-400" : "border border-white/15 bg-white/10 text-white hover:bg-white/15"}`}><Icon size={14} />{label}</button>;
}
function Legend({ color, text }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600"><span className={`h-2 w-2 rounded-full ${color}`} />{text}</span>;
}
function Select({ label, value, options, all, change, disabled }) {
  return <label><span className="mb-1 block text-[10px] font-bold text-slate-500">{label}</span><select className="input-field h-8 py-0.5 text-xs disabled:bg-slate-100" value={value} onChange={(e) => change(e.target.value)} disabled={disabled}><option value="">{all}</option>{options.map((option) => { const item = typeof option === "string" ? { value: option, label: option } : option; return <option key={item.value} value={item.value}>{item.label}</option>; })}</select></label>;
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
    <td onClick={() => openAssign(branch, shift, position)} className={`cursor-pointer border-b border-r p-1.5 align-middle transition hover:ring-2 hover:ring-inset hover:ring-violet-300 ${tone.cell}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between mb-0.5 border-b border-current/10 pb-0.5">
          <span className="text-[9px] font-bold opacity-60">Staff ({people.length})</span>
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); openAssign(branch, shift, position); }}
            className="flex h-4 w-4 items-center justify-center rounded bg-black/5 hover:bg-black/10 text-current transition-colors"
            title="Assign employee"
          >
            <Plus size={10} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {people.map((person) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: .95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: .95 }}
              key={person.employeeId}
              onClick={(e) => { e.stopPropagation(); setSelectedProfile(person); }}
              className="group relative flex items-center justify-between gap-1 rounded bg-white px-1.5 py-0.5 shadow-sm hover:border-violet-200"
            >
              <span className="truncate text-[11px] font-bold text-slate-800" title={person.fullName}>{person.fullName}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); removePerson(person, shift, branch); }} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100">
                <X size={11} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {!people.length && (
          <span className="text-center text-[10px] font-bold text-slate-400 border border-dashed border-slate-200 py-1 rounded">Assign</span>
        )}
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-between pt-0.5 text-[10px] font-bold opacity-75">
          {editNeeds ? (
            <label className="flex items-center gap-1">
              <span>Req</span>
              <input className="h-6 w-10 rounded border bg-white text-center text-xs font-black text-slate-900" type="number" min="0" value={required} onChange={(e) => updateNeed(branch, shift, position, e.target.value)} />
            </label>
          ) : (
            <span className="ml-auto">{people.length}/{required}</span>
          )}
        </div>
      </div>
    </td>
  );
}

function AssignDialog({ dialog, setDialog, branches, positions, people, search, setSearch, assign, remove, profileShifts, profileBranch, shifts }) {
  const assigning = dialog.mode === "assign";
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setDialog(null)} className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><motion.section initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} onMouseDown={(e) => e.stopPropagation()} className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"><header className="flex justify-between border-b p-5"><div><p className="text-xs font-black uppercase tracking-wider text-violet-600">Quick Action</p><h2 className="mt-1 text-xl font-black">{assigning ? "Assign Employee" : "Remove Assignment"}</h2><p className="mt-1 text-sm text-slate-500">{assigning ? "Active employees in this position eligible for shift assignment." : "Choose a scheduled employee to remove."}</p></div><button onClick={() => setDialog(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100"><X size={17} /></button></header><div className="grid gap-3 border-b bg-slate-50 p-5 sm:grid-cols-3"><Select label="Branch" value={dialog.branch} options={branches} all="All branches" change={(v) => setDialog({ ...dialog, branch: v })} /><Select label="Shift" value={dialog.shift} options={shifts} all="All shifts" change={(v) => setDialog({ ...dialog, shift: v })} /><Select label="Position" value={dialog.position} options={positions} all="All positions" change={(v) => setDialog({ ...dialog, position: v })} /></div><div className="p-5"><label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input autoFocus className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID, or phone" /></label></div><div className="flex-1 space-y-2 overflow-y-auto px-5 pb-5">{people.map((person) => { const s = profileShifts(person); return <button key={person.employeeId} onClick={() => assigning ? assign(person) : remove(person, dialog.shift)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left hover:border-violet-300 hover:bg-violet-50"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-sm font-black text-violet-700">{String(person.fullName || "E").split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{person.fullName}</strong><small className="text-slate-500">{person.employeeId} · {person.jobTitle}{s.length ? ` · ${profileBranch(person)} (${s.join(", ")})` : ""}</small></span><span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${assigning ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{assigning ? "Assign" : "Remove"}</span></button>; })}{!people.length && <div className="rounded-2xl border border-dashed bg-slate-50 py-12 text-center"><UserRoundSearch className="mx-auto text-slate-300" size={32} /><p className="mt-3 font-bold text-slate-700">No available employees found</p><p className="mt-1 text-sm text-slate-500">Check the position, status, or current assignment.</p></div>}</div></motion.section></motion.div>;
}
function Empty({ text }) { return <div className="p-12 text-center text-sm font-semibold text-slate-500">{text}</div>; }
