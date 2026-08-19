import { getContracts, getStaffProfiles } from "./storage";

export const ATTENDANCE_KEY = "payrollAttendanceRecordsV1";
export const ADJUSTMENTS_KEY = "payrollAdjustmentsV1";
export const SLIPS_KEY = "payrollSalarySlipsV1";
export const SETTINGS_KEY = "payrollSettingsV1";

export const SHIFT_OPTIONS = ["Morning", "Evening"];
export const ATTENDANCE_STATUSES = ["Present", "Absent", "Paid Leave", "Unpaid Leave", "Holiday", "Sick Leave", "Training", "Day Off"];
export const SLIP_STATUSES = ["Draft", "Ready for Review", "Approved", "Paid", "On Hold"];

export const statusStyles = {
  Present: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Absent: "bg-rose-50 text-rose-700 ring-rose-100",
  "Paid Leave": "bg-blue-50 text-blue-700 ring-blue-100",
  "Unpaid Leave": "bg-orange-50 text-orange-700 ring-orange-100",
  Holiday: "bg-purple-50 text-purple-700 ring-purple-100",
  "Sick Leave": "bg-yellow-50 text-yellow-800 ring-yellow-100",
  Training: "bg-teal-50 text-teal-700 ring-teal-100",
  "Day Off": "bg-slate-100 text-slate-600 ring-slate-200",
  Draft: "bg-slate-100 text-slate-700 ring-slate-200",
  "Ready for Review": "bg-blue-50 text-blue-700 ring-blue-100",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Paid: "bg-violet-50 text-violet-700 ring-violet-100",
  "On Hold": "bg-orange-50 text-orange-700 ring-orange-100",
};

export const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

export const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("payrollDataChanged"));
  return value;
};

export const formatVnd = (value) => `${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} VND`;
export const numberValue = (value) => Number(String(value ?? "").replace(/,/g, "")) || 0;
export const monthKey = (date = new Date()) => new Date(date).toISOString().slice(0, 7);
export const todayKey = () => new Date().toISOString().slice(0, 10);

export const parseMinutes = (time) => {
  if (!time) return null;
  const [hours, minutes] = String(time).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

export const calculateWorkedHours = (checkIn, checkOut, breakMinutes = 0) => {
  const start = parseMinutes(checkIn);
  let end = parseMinutes(checkOut);
  if (start === null || end === null) return 0;
  if (end < start) end += 24 * 60;
  return Math.max(0, (end - start - numberValue(breakMinutes)) / 60);
};

export const getProfileBranches = (profile) => {
  const values = [profile.statusReportBranch, profile.workLocation1, profile.workLocation2, profile.workLocation3, profile.workLocation, profile.branch]
    .flatMap((value) => String(value || "").split(";"))
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length ? [...new Set(values)] : ["Unassigned Branch"];
};

export const getProfileShifts = (profile) => {
  const shifts = profile.assignedShifts || profile.assignedShift || "";
  return Array.isArray(shifts) ? shifts : String(shifts).split(";").map((value) => value.trim()).filter(Boolean);
};

const signed = (profile) => ["signed", "active"].includes(String(profile.contractStatus || profile.status || "").toLowerCase());
const active = (profile) => !["inactive", "terminated", "resigned"].includes(String(profile.employmentStatus || "").toLowerCase());

export const loadPayrollEmployees = () => {
  const profiles = getStaffProfiles();
  const map = new Map();

  profiles.forEach((profile) => {
    const key = profile.employeeId || profile.contractNumber || profile.fullName;
    if (!key || !profile.fullName) return;
    map.set(key, {
      ...profile,
      employeeId: profile.employeeId || profile.contractNumber,
      contractStatus: profile.contractStatus || "Signed",
      employmentStatus: profile.employmentStatus || "Active",
      branchM: profile.branchM || profile.morningBranch || profile.statusReportBranch || profile.workLocation1 || getProfileBranches(profile)[0] || "",
      branchE: profile.branchE || profile.eveningBranch || profile.statusReportBranch || profile.workLocation2 || getProfileBranches(profile)[0] || "",
      positionM: profile.positionM || profile.morningPosition || profile.jobTitle || "",
      positionE: profile.positionE || profile.eveningPosition || profile.jobTitle || "",
      morningMonthlySalary: numberValue(profile.morningMonthlySalary || profile.baseSalary || profile.grossSalary || profile.netSalary || 0),
      eveningMonthlySalary: numberValue(profile.eveningMonthlySalary || 0),
    });
  });

  return [...map.values()].filter((employee) => employee.fullName && signed(employee) && active(employee));
};

export const defaultStandardHours = (employee, shift) => {
  const settings = readJson(SETTINGS_KEY, {});
  const employeeKey = `${employee.employeeId}-${shift}`;
  const position = shift === "Morning" ? employee.positionM : employee.positionE;
  return numberValue(settings.employeeHours?.[employeeKey] || settings.positionHours?.[position] || employee[`standardMonthlyHours${shift[0]}`] || employee.standardMonthlyHours || 208);
};

export const loadAttendance = () => readJson(ATTENDANCE_KEY, []);
export const saveAttendance = (records) => writeJson(ATTENDANCE_KEY, records);
export const loadAdjustments = () => readJson(ADJUSTMENTS_KEY, {});
export const saveAdjustments = (adjustments) => writeJson(ADJUSTMENTS_KEY, adjustments);
export const loadSlips = () => readJson(SLIPS_KEY, []);
export const saveSlips = (slips) => writeJson(SLIPS_KEY, slips);
export const loadPayrollSettings = () => readJson(SETTINGS_KEY, {});
export const savePayrollSettings = (settings) => writeJson(SETTINGS_KEY, settings);

export const blankAdjustment = {
  parkingAllowanceM: 0,
  parkingAllowanceE: 0,
  commissionM: 0,
  commissionE: 0,
  nightSupportM: 0,
  nightSupportE: 0,
  holidayPayM: 0,
  holidayPayE: 0,
  socialInsuranceM: 0,
  socialInsuranceE: 0,
  deductionM: 0,
  deductionE: 0,
  personalIncomeTax: 0,
  customEarning: 0,
  customDeduction: 0,
  excludeMorningHours: false,
  excludeEveningHours: false,
  excludeCumulativeHours: false,
  notes: "",
};

export const payrollKey = (employeeId, month) => `${employeeId}::${month}`;

export const hoursFor = (records, employeeId, month, shift) =>
  records
    .filter((record) => record.employeeId === employeeId && record.date?.startsWith(month) && record.shift === shift)
    .filter((record) => ["Present", "Paid Leave", "Holiday", "Sick Leave", "Training"].includes(record.status))
    .reduce((sum, record) => sum + numberValue(record.workedHours), 0);

export const daysFor = (records, employeeId, month, shift) =>
  new Set(records.filter((record) => record.employeeId === employeeId && record.date?.startsWith(month) && record.shift === shift).map((record) => record.date)).size;

export const calculatePayroll = (employee, month, records, adjustmentInput = {}) => {
  const adjustments = { ...blankAdjustment, ...adjustmentInput };
  let hoursM = hoursFor(records, employee.employeeId, month, "Morning");
  let hoursE = hoursFor(records, employee.employeeId, month, "Evening");
  
  if (adjustments.excludeMorningHours || adjustments.excludeCumulativeHours) {
    hoursM = 0;
  }
  if (adjustments.excludeEveningHours || adjustments.excludeCumulativeHours) {
    hoursE = 0;
  }

  const daysM = adjustments.excludeMorningHours || adjustments.excludeCumulativeHours ? 0 : daysFor(records, employee.employeeId, month, "Morning");
  const daysE = adjustments.excludeEveningHours || adjustments.excludeCumulativeHours ? 0 : daysFor(records, employee.employeeId, month, "Evening");
  const standardM = defaultStandardHours(employee, "Morning");
  const standardE = defaultStandardHours(employee, "Evening");
  const monthlyM = numberValue(employee.morningMonthlySalary);
  const monthlyE = numberValue(employee.eveningMonthlySalary);
  const hourlyM = standardM ? monthlyM / standardM : 0;
  const hourlyE = standardE ? monthlyE / standardE : 0;
  const salaryM = hourlyM * hoursM;
  const salaryE = hourlyE * hoursE;
  const earningsM = numberValue(adjustments.parkingAllowanceM) + numberValue(adjustments.commissionM) + numberValue(adjustments.nightSupportM) + numberValue(adjustments.holidayPayM);
  const earningsE = numberValue(adjustments.parkingAllowanceE) + numberValue(adjustments.commissionE) + numberValue(adjustments.nightSupportE) + numberValue(adjustments.holidayPayE);
  const deductionsM = numberValue(adjustments.socialInsuranceM || employee.socialInsuranceAmount / 2) + numberValue(adjustments.deductionM);
  const deductionsE = numberValue(adjustments.socialInsuranceE || employee.socialInsuranceAmount / 2) + numberValue(adjustments.deductionE);
  const payableM = salaryM + earningsM - deductionsM;
  const payableE = salaryE + earningsE - deductionsE;
  const combined = salaryM + salaryE;
  const totalEarnings = earningsM + earningsE + numberValue(adjustments.customEarning);
  const totalDeductions = deductionsM + deductionsE + numberValue(adjustments.personalIncomeTax) + numberValue(adjustments.customDeduction);
  const finalPayable = payableM + payableE + numberValue(adjustments.customEarning) - numberValue(adjustments.personalIncomeTax) - numberValue(adjustments.customDeduction);

  return {
    employee,
    month,
    branchM: employee.branchM,
    branchE: employee.branchE,
    positionM: employee.positionM,
    positionE: employee.positionE,
    monthlyM,
    monthlyE,
    daysM,
    daysE,
    standardM,
    standardE,
    hoursM,
    hoursE,
    cumulativeHours: hoursM + hoursE,
    hourlyM,
    hourlyE,
    salaryM,
    salaryE,
    combined,
    earningsM,
    earningsE,
    deductionsM,
    deductionsE,
    payableM,
    payableE,
    totalEarnings,
    totalDeductions,
    finalPayable,
    adjustments,
  };
};

export const validateAttendance = (draft, records) => {
  const errors = [];
  const duration = calculateWorkedHours(draft.checkIn, draft.checkOut, draft.breakMinutes);
  const shiftDuration = calculateWorkedHours(draft.checkIn, draft.checkOut, 0);
  if (draft.checkIn && draft.checkOut && duration < 0) errors.push("Working hours cannot be negative.");
  if (numberValue(draft.breakMinutes) > shiftDuration) errors.push("Break duration cannot be greater than the shift duration.");
  if (!draft.allowOvernight && draft.checkIn && draft.checkOut && parseMinutes(draft.checkOut) < parseMinutes(draft.checkIn)) {
    errors.push("Check-out is earlier than check-in. Turn on overnight shift if checkout is next day.");
  }
  const duplicate = records.some((record) =>
    record.id !== draft.id
    && record.employeeId === draft.employeeId
    && record.date === draft.date
    && record.shift === draft.shift
  );
  if (duplicate) errors.push("Duplicate attendance exists for this employee, date, and shift.");
  const overlap = records.some((record) =>
    record.id !== draft.id
    && record.employeeId === draft.employeeId
    && record.date === draft.date
    && record.shift !== draft.shift
    && draft.checkIn
    && draft.checkOut
    && record.checkIn
    && record.checkOut
    && Math.max(parseMinutes(draft.checkIn), parseMinutes(record.checkIn)) < Math.min(parseMinutes(draft.checkOut), parseMinutes(record.checkOut))
  );
  if (overlap) errors.push("Morning and Evening attendance times overlap.");
  return errors;
};
