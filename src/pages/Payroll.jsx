import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, CalendarCheck2, FileText, History, Sparkles, WalletCards } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AttendanceEntry from "../components/payroll/AttendanceEntry";
import CalculationBreakdown from "../components/payroll/CalculationBreakdown";
import PayrollDashboard from "../components/payroll/PayrollDashboard";
import PayrollHistory from "../components/payroll/PayrollHistory";
import PayrollWarnings from "../components/payroll/PayrollWarnings";
import SalaryCalculator from "../components/payroll/SalaryCalculator";
import SalarySlipPreview from "../components/payroll/SalarySlipPreview";
import { getStaffProfiles, saveStaffProfile } from "../utils/storage";
import {
  calculatePayroll,
  loadAdjustments,
  loadAttendance,
  loadPayrollEmployees,
  loadSlips,
  monthKey,
  payrollKey,
  saveAdjustments,
  saveAttendance,
  saveSlips,
  todayKey,
} from "../utils/payroll";

const tabs = [
  { id: "attendance", label: "Attendance Entry", icon: CalendarCheck2 },
  { id: "calculation", label: "Salary Calculation", icon: Calculator },
  { id: "slips", label: "Salary Slips", icon: FileText },
  { id: "history", label: "Payroll History", icon: History },
];

const defaultFilters = {
  month: monthKey(),
  date: todayKey(),
  branch: "",
  department: "",
  position: "",
  shift: "",
  status: "",
  search: "",
};

export default function Payroll() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [employees, setEmployees] = useState(() => loadPayrollEmployees());
  const [attendance, setAttendance] = useState(() => loadAttendance());
  const [adjustments, setAdjustments] = useState(() => loadAdjustments());
  const [slips, setSlips] = useState(() => loadSlips());
  const [filters, setFilters] = useState(defaultFilters);
  const [breakdown, setBreakdown] = useState(null);
  const [selectedSlipEmployeeId, setSelectedSlipEmployeeId] = useState("");

  const refresh = useCallback(() => {
    setEmployees(loadPayrollEmployees());
    setAttendance(loadAttendance());
    setAdjustments(loadAdjustments());
    setSlips(loadSlips());
  }, []);

  useEffect(() => {
    window.addEventListener("staffProfilesChanged", refresh);
    window.addEventListener("payrollDataChanged", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("staffProfilesChanged", refresh);
      window.removeEventListener("payrollDataChanged", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const options = useMemo(() => ({
    branches: [...new Set(employees.flatMap((employee) => [employee.branchM, employee.branchE]).filter(Boolean))].sort(),
    departments: [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort(),
    positions: [...new Set(employees.flatMap((employee) => [employee.positionM, employee.positionE, employee.jobTitle]).filter(Boolean))].sort(),
  }), [employees]);

  const filteredEmployees = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return employees.filter((employee) => {
      if (filters.branch && ![employee.branchM, employee.branchE].includes(filters.branch)) return false;
      if (filters.department && employee.department !== filters.department) return false;
      if (filters.position && ![employee.positionM, employee.positionE, employee.jobTitle].includes(filters.position)) return false;
      if (filters.shift === "Morning" && !employee.positionM) return false;
      if (filters.shift === "Evening" && !employee.positionE) return false;
      return !query || `${employee.fullName} ${employee.employeeId}`.toLowerCase().includes(query);
    });
  }, [employees, filters]);

  const calculations = useMemo(() => filteredEmployees.map((employee) => calculatePayroll(employee, filters.month, attendance, adjustments[payrollKey(employee.employeeId, filters.month)] || {})), [adjustments, attendance, filteredEmployees, filters.month]);
  const selectedEmployee = filteredEmployees.find((employee) => employee.employeeId === selectedSlipEmployeeId) || filteredEmployees[0];
  const selectedSlip = slips.find((slip) => slip.employeeId === selectedEmployee?.employeeId && slip.month === filters.month);
  const filteredSlips = slips.filter((slip) => {
    if (filters.month && slip.month !== filters.month) return false;
    if (filters.status && slip.status !== filters.status) return false;
    if (filters.search && !`${slip.employeeName} ${slip.employeeId}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const summary = useMemo(() => {
    const paid = filteredSlips.filter((slip) => slip.status === "Paid").length;
    return {
      totalEmployees: filteredEmployees.length,
      ready: filteredSlips.filter((slip) => ["Ready for Review", "Approved", "Paid"].includes(slip.status)).length,
      pendingAttendance: calculations.filter((calculation) => calculation.cumulativeHours === 0).length,
      pendingApproval: filteredSlips.filter((slip) => ["Draft", "Ready for Review", "On Hold"].includes(slip.status)).length,
      totalPayroll: calculations.reduce((sum, calculation) => sum + calculation.finalPayable, 0),
      totalDeductions: calculations.reduce((sum, calculation) => sum + calculation.totalDeductions, 0),
      paid,
      unpaid: Math.max(0, filteredEmployees.length - paid),
    };
  }, [calculations, filteredEmployees.length, filteredSlips]);

  const warnings = useMemo(() => {
    const list = [];
    calculations.forEach((calculation) => {
      if (!calculation.monthlyM && !calculation.monthlyE) list.push(`${calculation.employee.fullName} has no salary configuration.`);
      if (calculation.cumulativeHours > calculation.standardM + calculation.standardE + 40) list.push(`${calculation.employee.fullName} has hours significantly above standard monthly hours.`);
      if (!calculation.employee.socialInsuranceAmount && !calculation.employee.socialInsurancePct) list.push(`${calculation.employee.fullName} is missing insurance configuration.`);
      if (calculation.finalPayable < 0) list.push(`${calculation.employee.fullName} has a negative final salary.`);
    });
    attendance.filter((record) => record.date?.startsWith(filters.month)).forEach((record) => {
      if (record.status === "Present" && (!record.checkIn || !record.checkOut)) list.push(`${record.employeeName} has missing check-in or check-out on ${record.date}.`);
    });
    filteredSlips.forEach((slip) => {
      if (slip.status !== "Approved" && slip.status !== "Paid") list.push(`${slip.employeeName}'s salary slip is not approved.`);
    });
    return [...new Set(list)];
  }, [attendance, calculations, filteredSlips, filters.month]);

  const persistAttendance = (records) => {
    setAttendance(saveAttendance(records));
  };

  const persistAdjustments = (next) => {
    setAdjustments(saveAdjustments(next));
  };

  const saveSlip = (employee, calculation, status) => {
    const slip = {
      id: `${employee.employeeId}-${filters.month}`,
      month: filters.month,
      employeeName: employee.fullName,
      employeeId: employee.employeeId,
      branch: calculation.branchM || calculation.branchE,
      position: calculation.positionM || calculation.positionE,
      hoursM: calculation.hoursM,
      hoursE: calculation.hoursE,
      grossEarnings: calculation.combined + calculation.totalEarnings,
      deductions: calculation.totalDeductions,
      finalPayable: calculation.finalPayable,
      status,
      paymentDate: status === "Paid" ? new Date().toISOString().slice(0, 10) : "",
      preparedAt: new Date().toISOString(),
      calculation,
    };
    const next = [slip, ...slips.filter((item) => item.id !== slip.id)];
    setSlips(saveSlips(next));
  };

  const updateSlipStatus = (slip, status) => {
    const next = slips.map((item) => item.id === slip.id ? { ...item, status, paymentDate: status === "Paid" ? new Date().toISOString().slice(0, 10) : item.paymentDate } : item);
    setSlips(saveSlips(next));
  };

  const deleteSlip = (slip) => {
    const paidText = slip.status === "Paid" ? " This payroll is already marked Paid." : "";
    if (!window.confirm(`Delete payroll record for ${slip.employeeName} (${slip.month})?${paidText}`)) return;
    setSlips(saveSlips(slips.filter((item) => item.id !== slip.id)));
  };

  const exportPdf = async (id) => {
    const element = document.getElementById(id);
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("Salary_Slip.pdf");
  };

  const printSection = () => window.print();

  const populatePayrollTestData = () => {
    // 1. Ensure staff profiles have valid salaries, contract status, and insurance
    const existing = getStaffProfiles();
    const salaryCatalog = {
      "Cashier": 12000000,
      "Cooking": 15000000,
      "Dough": 13000000,
      "Wrapping": 11000000,
      "Helping": 9000000,
      "Branch Manager": 28000000,
      "HR": 22000000,
      "Accountant": 20000000,
      "Purchase and Inventory Controller": 18000000,
    };

    const updatedProfiles = existing.map((p) => {
      const standardSalary = salaryCatalog[p.jobTitle] || 12000000;
      return {
        ...p,
        contractStatus: "Signed",
        employmentStatus: "Active",
        baseSalary: p.baseSalary || standardSalary,
        grossSalary: p.grossSalary || standardSalary,
        morningMonthlySalary: p.morningMonthlySalary || standardSalary,
        eveningMonthlySalary: p.eveningMonthlySalary || Math.round(standardSalary * 0.9),
        socialInsuranceAmount: p.socialInsuranceAmount || Math.round(standardSalary * 0.08),
        socialInsurancePct: p.socialInsurancePct || 8,
        healthInsurancePct: p.healthInsurancePct || 1.5,
        unemploymentInsurancePct: p.unemploymentInsurancePct || 1,
        standardMonthlyHours: 208,
      };
    });

    updatedProfiles.forEach((p) => saveStaffProfile(p));

    // 2. Populate attendance records for the month
    const newAttendance = [];
    const [year, monthNum] = filters.month.split("-").map(Number);
    const daysInCurrentMonth = new Date(year, monthNum, 0).getDate();

    updatedProfiles.slice(0, 10).forEach((employee) => {
      for (let day = 1; day <= Math.min(24, daysInCurrentMonth); day++) {
        const dateStr = `${filters.month}-${String(day).padStart(2, "0")}`;
        const isOff = day % 7 === 0;
        newAttendance.push({
          id: `${employee.employeeId}-${dateStr}-Morning`,
          date: dateStr,
          employeeId: employee.employeeId,
          employeeName: employee.fullName,
          branch: employee.workLocation || "Dubai",
          department: employee.department || "Kitchen Staff",
          position: employee.jobTitle || "Cashier",
          shift: "Morning",
          checkIn: isOff ? "" : "09:30",
          checkOut: isOff ? "" : "17:30",
          breakMinutes: isOff ? 0 : 60,
          workedHours: isOff ? 0 : 7,
          status: isOff ? "Day Off" : "Present",
          hourlyRate: Math.round((salaryCatalog[employee.jobTitle] || 12000000) / 208),
          earnedSalary: isOff ? 0 : Math.round(((salaryCatalog[employee.jobTitle] || 12000000) / 208) * 7),
          notes: "",
        });
      }
    });

    saveAttendance(newAttendance);

    // 3. Generate sample salary slips
    const newSlips = updatedProfiles.slice(0, 6).map((employee, idx) => {
      const base = salaryCatalog[employee.jobTitle] || 12000000;
      const status = idx === 0 ? "Paid" : idx < 3 ? "Approved" : "Ready for Review";
      return {
        id: `${employee.employeeId}-${filters.month}`,
        month: filters.month,
        employeeName: employee.fullName,
        employeeId: employee.employeeId,
        branch: employee.workLocation || "Dubai",
        position: employee.jobTitle || "Cashier",
        hoursM: 168,
        hoursE: 0,
        grossEarnings: base,
        deductions: Math.round(base * 0.105),
        finalPayable: Math.round(base * 0.895),
        status,
        paymentDate: status === "Paid" ? new Date().toISOString().slice(0, 10) : "",
        preparedAt: new Date().toISOString(),
      };
    });

    saveSlips(newSlips);

    // Sync all tabs
    refresh();
    window.dispatchEvent(new Event("staffProfilesChanged"));
    window.dispatchEvent(new Event("payrollDataChanged"));

    window.alert(`Payroll test data generated for ${filters.month}!\n- Configured salaries & insurance for all staff\n- Populated attendance records\n- Generated sample processed slips`);
  };

  const workflow = ["Attendance Entered", "Salary Automatically Calculated", "HR Reviews Calculation", "Salary Slip Generated", "Payroll Approved", "Marked as Paid"];

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="relative isolate px-5 py-6 sm:px-7">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#eef2ff_0%,#ecfdf5_48%,#f8fafc_100%)]" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-violet-700"><WalletCards size={14} /> Payroll</p>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Payroll Management</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Attendance, automatic salary calculation, formal salary slips, and payroll history from signed contracts and active staff profiles.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={populatePayrollTestData}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-3.5 text-xs font-black text-white hover:bg-violet-700 transition shadow-xs cursor-pointer"
              >
                <Sparkles size={15} />
                Load Test Data
              </button>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-black text-slate-600">Month:</span>
                <input
                  type="month"
                  value={filters.month}
                  onChange={(event) => setFilters({ ...filters, month: event.target.value })}
                  className="bg-transparent text-xs font-black text-slate-900 outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <PayrollDashboard summary={summary} />
      <PayrollWarnings warnings={warnings} />

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 md:grid-cols-6">
          {workflow.map((step, index) => <div key={step} className="rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-600 ring-1 ring-slate-100">{index + 1}. {step}</div>)}
        </div>
      </section>

      <nav className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)} className={`inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-black transition ${activeTab === id ? "bg-violet-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </nav>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        {activeTab === "attendance" && <AttendanceEntry employees={filteredEmployees} records={attendance} setRecords={setAttendance} filters={filters} setFilters={setFilters} saveRecords={persistAttendance} options={options} />}
        {activeTab === "calculation" && <SalaryCalculator employees={filteredEmployees} month={filters.month} attendance={attendance} setAttendance={setAttendance} saveAttendance={persistAttendance} adjustments={adjustments} setAdjustments={setAdjustments} saveAdjustments={persistAdjustments} onBreakdown={setBreakdown} />}
        {activeTab === "slips" && <SalarySlipPreview employee={selectedEmployee} employees={filteredEmployees} onEmployeeChange={setSelectedSlipEmployeeId} month={filters.month} attendance={attendance} adjustments={adjustments} slip={selectedSlip} onSaveSlip={saveSlip} onExport={exportPdf} onPrint={printSection} />}
        {activeTab === "history" && <PayrollHistory slips={filteredSlips} onStatus={updateSlipStatus} onDelete={deleteSlip} onExport={exportPdf} onPrint={printSection} onView={(slip) => { setSelectedSlipEmployeeId(slip.employeeId); setActiveTab("slips"); }} />}
      </motion.div>

      <CalculationBreakdown calculation={breakdown} onClose={() => setBreakdown(null)} />
    </div>
  );
}
