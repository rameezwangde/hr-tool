import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, CalendarCheck2, FileText, History, WalletCards } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AttendanceEntry from "../components/payroll/AttendanceEntry";
import CalculationBreakdown from "../components/payroll/CalculationBreakdown";
import PayrollDashboard from "../components/payroll/PayrollDashboard";
import PayrollHistory from "../components/payroll/PayrollHistory";
import PayrollWarnings from "../components/payroll/PayrollWarnings";
import SalaryCalculator from "../components/payroll/SalaryCalculator";
import SalarySlipPreview from "../components/payroll/SalarySlipPreview";
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
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-700">Month:</span>
              <label className="relative block w-40">
                <input type="month" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-300" />
              </label>
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
