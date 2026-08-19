import { getContracts, getJobPositions, getStaffProfiles, getWorkLocations } from "./storage";

export const ROSTER_KEY = "staffRosterSchedulesV1";
export const ROSTER_STATUS_KEY = "staffRosterStatusesV1";
export const STATUS_REPORT_KEY = "staffStatusReportConfigV2";

export const ROSTER_STATUSES = ["Draft", "Pending Review", "Approved", "Published", "Archived"];
export const ENTRY_STATUSES = ["Working", "OFF", "Paid Leave", "Unpaid Leave", "Sick Leave", "Training", "Holiday", "Absent", "Half Day"];
export const SHIFT_OPTIONS = ["Morning", "Evening"];

export const entryStatusStyles = {
  Working: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  OFF: "bg-slate-100 text-slate-600 ring-slate-200",
  "Paid Leave": "bg-blue-50 text-blue-700 ring-blue-100",
  "Unpaid Leave": "bg-orange-50 text-orange-700 ring-orange-100",
  "Sick Leave": "bg-yellow-50 text-yellow-800 ring-yellow-100",
  Training: "bg-purple-50 text-purple-700 ring-purple-100",
  Holiday: "bg-teal-50 text-teal-700 ring-teal-100",
  Absent: "bg-rose-50 text-rose-700 ring-rose-100",
  "Half Day": "bg-sky-50 text-sky-700 ring-sky-100",
};

export const rosterStatusStyles = {
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
  "Pending Review": "bg-blue-50 text-blue-700 ring-blue-100",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Published: "bg-violet-50 text-violet-700 ring-violet-100",
  Archived: "bg-slate-200 text-slate-600 ring-slate-300",
};

export const positionTone = (position = "", department = "") => {
  const text = `${position} ${department}`.toLowerCase();
  if (text.includes("cashier")) return "bg-amber-50 text-amber-900 border-amber-200";
  if (text.includes("wrap")) return "bg-pink-50 text-pink-900 border-pink-200";
  if (text.includes("cook")) return "bg-emerald-50 text-emerald-900 border-emerald-200";
  if (text.includes("dough")) return "bg-slate-100 text-slate-800 border-slate-200";
  if (text.includes("help")) return "bg-sky-50 text-sky-900 border-sky-200";
  if (text.includes("trainee")) return "bg-purple-50 text-purple-900 border-purple-200";
  if (department.toLowerCase().includes("management") || /manager|admin|account|hr|human|purchase|supervisor/.test(text)) return "bg-orange-50 text-orange-900 border-orange-200";
  return "bg-cyan-50 text-cyan-900 border-cyan-200";
};

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

export const writeRosterJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("staffRosterChanged"));
  return value;
};

const activeSigned = (person) => {
  const employment = String(person.employmentStatus || "Active").toLowerCase();
  const contract = String(person.contractStatus || person.status || "Signed").toLowerCase();
  return !["inactive", "terminated", "resigned"].includes(employment) && ["signed", "active", "pending signature"].includes(contract);
};

export const splitList = (value) => Array.isArray(value)
  ? value.map((item) => String(item || "").trim()).filter(Boolean)
  : String(value || "").split(";").map((item) => item.trim()).filter(Boolean);

export const profileBranches = (profile) => {
  const values = [profile.statusReportBranch, profile.workLocation1, profile.workLocation2, profile.workLocation3, profile.workLocation, profile.branch].flatMap(splitList).filter(Boolean);
  return values.length ? [...new Set(values)] : ["Available for Transfer"];
};

export const profileShifts = (profile) => {
  const shifts = splitList(profile.assignedShifts || profile.assignedShift);
  return shifts.length ? shifts : SHIFT_OPTIONS;
};

export const monthKey = (date = new Date()) => new Date(date).toISOString().slice(0, 7);
export const daysInMonth = (month) => {
  const [year, monthIndex] = month.split("-").map(Number);
  const count = new Date(year, monthIndex, 0).getDate();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, monthIndex - 1, index + 1);
    return {
      date: `${month}-${String(index + 1).padStart(2, "0")}`,
      day: date.toLocaleDateString(undefined, { weekday: "short" }),
      label: String(index + 1).padStart(2, "0"),
      isWeekend: [0, 6].includes(date.getDay()),
      isToday: date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10),
    };
  });
};

const defaultDepartmentFor = (position = "", fallback = "") => {
  if (fallback) return fallback;
  return /manager|admin|account|hr|human|purchase|supervisor|director|controller/i.test(position) ? "Management Staff" : "Kitchen Staff";
};

export const loadRosterEmployees = () => {
  const map = new Map();
  getStaffProfiles().forEach((profile) => {
    const key = profile.employeeId || profile.contractNumber || profile.fullName;
    if (!key || !profile.fullName) return;
    map.set(key, {
      ...profile,
      employeeId: profile.employeeId || profile.contractNumber,
      contractStatus: profile.contractStatus || "Signed",
      employmentStatus: profile.employmentStatus || "Active",
      department: profile.department || defaultDepartmentFor(profile.jobTitle),
      branch: profile.statusReportBranch || profile.workLocation1 || profile.workLocation || "",
    });
  });
  return [...map.values()].filter(activeSigned);
};

export const loadRosterData = () => readJson(ROSTER_KEY, {});
export const saveRosterData = (data) => writeRosterJson(ROSTER_KEY, data);
export const loadRosterStatuses = () => readJson(ROSTER_STATUS_KEY, {});
export const saveRosterStatuses = (data) => writeRosterJson(ROSTER_STATUS_KEY, data);

export const loadRequirements = () => readJson(STATUS_REPORT_KEY, {});
export const requirementFor = (requirements, branch, shift, position) => Number(requirements.requirements?.[`${branch}::${shift}::${position}`]) || 0;

export const rosterCellKey = ({ month, branch, department, position, shift, date }) => [month, branch, department, position, shift, date].join("::");
export const getCellEntries = (roster, key) => roster[key] || [];

export const branchOptions = (employees) => {
  const configured = getWorkLocations().map((location) => location.name);
  const fromEmployees = employees.flatMap(profileBranches);
  return [...new Set([...configured, ...fromEmployees].filter(Boolean))].sort();
};

export const positionOptions = (employees) => {
  const jobs = getJobPositions().map((job) => ({ position: job.title, department: job.department || defaultDepartmentFor(job.title) }));
  const people = employees.map((person) => ({ position: person.jobTitle, department: person.department || defaultDepartmentFor(person.jobTitle) }));
  const map = new Map([...jobs, ...people].filter((row) => row.position).map((row) => [`${row.department}::${row.position}`, row]));
  return [...map.values()].sort((a, b) => a.department.localeCompare(b.department) || a.position.localeCompare(b.position));
};

export const employeesForCell = (employees, { branch, position, shift }, roster, date) => employees.map((employee) => {
  const branches = profileBranches(employee);
  const shifts = profileShifts(employee);
  const matchingPosition = employee.jobTitle === position;
  const matchingBranch = branches.includes(branch) || branches.includes("Available for Transfer") || !employee.branch;
  const matchingShift = shifts.includes(shift);
  const sameTime = Object.values(roster).flat().find((entry) => entry.employeeId === employee.employeeId && entry.date === date && entry.shift === shift && entry.status === "Working");
  const sameDayOtherShift = Object.values(roster).flat().find((entry) => entry.employeeId === employee.employeeId && entry.date === date && entry.shift !== shift && entry.status === "Working");
  const disabledReason = sameTime
    ? `Already assigned to ${sameTime.branch} ${sameTime.shift}`
    : "";
  
  const warningList = [];
  if (!matchingPosition) warningList.push(`Different position (${employee.jobTitle || "No Position"})`);
  if (!matchingBranch) warningList.push(`Assigned to ${branches[0]}`);
  if (!matchingShift) warningList.push(`Not available for ${shift}`);
  if (sameDayOtherShift) warningList.push("Already scheduled on the other shift");
  
  const warning = warningList.join(", ");
  return { employee, available: !disabledReason, warning, disabledReason };
});

export const buildRosterEntry = ({ employee, date, branch, department, position, shift, status = "Working" }) => ({
  id: `${employee.employeeId}-${date}-${branch}-${position}-${shift}-${Date.now()}`,
  employeeId: employee.employeeId,
  employeeName: employee.fullName,
  phoneNumber: employee.phoneNumber || "",
  department,
  position,
  branch,
  shift,
  date,
  status,
});

export const calculateRosterSummary = ({ employees, roster, month, requirements, branches, positions }) => {
  const monthEntries = Object.values(roster).flat().filter((entry) => entry.date?.startsWith(month));
  const scheduledIds = new Set(monthEntries.filter((entry) => entry.status === "Working").map((entry) => entry.employeeId));
  const leaveCount = monthEntries.filter((entry) => ["Paid Leave", "Unpaid Leave", "Sick Leave"].includes(entry.status)).length;
  const offDays = monthEntries.filter((entry) => entry.status === "OFF").length;
  const days = daysInMonth(month);
  let morningRequired = 0;
  let morningAssigned = 0;
  let eveningRequired = 0;
  let eveningAssigned = 0;
  let understaffed = 0;
  branches.forEach((branch) => {
    positions.forEach(({ position }) => {
      SHIFT_OPTIONS.forEach((shift) => {
        days.forEach(({ date }) => {
          const required = requirementFor(requirements, branch, shift, position);
          const assigned = monthEntries.filter((entry) => entry.branch === branch && entry.position === position && entry.shift === shift && entry.date === date && entry.status === "Working").length;
          if (shift === "Morning") {
            morningRequired += required;
            morningAssigned += assigned;
          } else {
            eveningRequired += required;
            eveningAssigned += assigned;
          }
          if (required && assigned < required) understaffed += 1;
        });
      });
    });
  });
  const pct = (assigned, required) => required ? Math.round((assigned / required) * 100) : 100;
  return {
    totalActive: employees.length,
    scheduled: scheduledIds.size,
    unscheduled: Math.max(0, employees.length - scheduledIds.size),
    morningCoverage: pct(morningAssigned, morningRequired),
    eveningCoverage: pct(eveningAssigned, eveningRequired),
    understaffed,
    leaveCount,
    offDays,
  };
};

export const workloadFor = (employee, roster, month) => {
  const entries = Object.values(roster).flat().filter((entry) => entry.employeeId === employee.employeeId && entry.date?.startsWith(month));
  const working = entries.filter((entry) => entry.status === "Working");
  return {
    workingDays: new Set(working.map((entry) => entry.date)).size,
    morning: working.filter((entry) => entry.shift === "Morning").length,
    evening: working.filter((entry) => entry.shift === "Evening").length,
    off: entries.filter((entry) => entry.status === "OFF").length,
    leave: entries.filter((entry) => entry.status.includes("Leave") || entry.status === "Sick Leave").length,
    training: entries.filter((entry) => entry.status === "Training").length,
    hours: working.length * 8,
  };
};
