import { Download, Printer, Stamp } from "lucide-react";
import { calculatePayroll, formatVnd, payrollKey } from "../../utils/payroll";
import PayrollStatusBadge from "./PayrollStatusBadge";

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr] border-b border-slate-200 text-sm last:border-b-0 bg-white">
      <div className="px-3 py-2 font-bold text-slate-700 border-r border-slate-200" style={{ backgroundColor: "#f8fafc" }}>{label}</div>
      <div className="px-3 py-2 font-semibold text-slate-900 bg-white">{value}</div>
    </div>
  );
}

export default function SalarySlipPreview({ employee, employees = [], onEmployeeChange, month, attendance, adjustments, slip, onSaveSlip, onExport, onPrint }) {
  if (!employee) return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center font-bold text-slate-500">Choose filters that include at least one payroll employee.</div>;
  const calculation = calculatePayroll(employee, month, attendance, adjustments[payrollKey(employee.employeeId, month)] || {});
  const status = slip?.status || "Draft";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm no-print">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Salary Slip Generator</h2>
            <p className="mt-1 text-sm text-slate-500">Formal A4 salary slip using the current payroll calculation.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={employee.employeeId} onChange={(event) => onEmployeeChange?.(event.target.value)} className="input-field h-10 w-64">
              {employees.map((person) => <option key={person.employeeId} value={person.employeeId}>{person.fullName} / {person.employeeId}</option>)}
            </select>
            <PayrollStatusBadge status={status} />
            <button 
              type="button" 
              onClick={() => {
                onSaveSlip(employee, calculation, "Ready for Review");
                const el = document.getElementById("salary-slip-print");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }} 
              className="btn-secondary inline-flex h-10 items-center gap-2 cursor-pointer hover:bg-slate-50"
            >
              <Stamp size={16} className="text-violet-600" />
              <span>Preview Salary Slip</span>
            </button>
            <button 
              type="button" 
              onClick={() => onExport("salary-slip-print", `Salary_Slip_${employee.employeeId}_${month}.pdf`)} 
              className="btn-secondary inline-flex h-10 items-center gap-2 cursor-pointer hover:bg-slate-50"
            >
              <Download size={16} className="text-violet-600" />
              <span>Export PDF</span>
            </button>
            <button 
              type="button" 
              onClick={() => onPrint("salary-slip-print")} 
              className="btn-secondary inline-flex h-10 items-center gap-2 cursor-pointer hover:bg-slate-50"
            >
              <Printer size={16} className="text-violet-600" />
              <span>Print</span>
            </button>
            <button type="button" onClick={() => onSaveSlip(employee, calculation, "Approved")} className="btn-primary h-10 cursor-pointer">Mark as Approved</button>
            <button type="button" onClick={() => onSaveSlip(employee, calculation, "Paid")} className="btn-primary h-10 bg-emerald-600 hover:bg-emerald-700 cursor-pointer">Mark as Paid</button>
          </div>
        </div>
      </section>

      <article 
        id="salary-slip-print" 
        className="mx-auto max-w-3xl rounded-xl border border-slate-300 bg-white p-6 shadow-sm print:shadow-none text-slate-900"
        style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
      >
        <header className="border-b-2 border-slate-900 pb-3 text-center">
          <h1 className="text-xl font-black uppercase tracking-wide text-slate-950" style={{ color: "#0f172a" }}>Salary Slip</h1>
          <p className="mt-0.5 text-xs font-bold text-slate-600" style={{ color: "#475569" }}>Payroll Month: {month}</p>
        </header>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <section className="overflow-hidden rounded-lg border border-slate-200">
            <Row label="Employee name" value={employee.fullName} />
            <Row label="Employee ID" value={employee.employeeId} />
            <Row label="Branch (M)" value={calculation.branchM || "Not provided"} />
            <Row label="Branch (E)" value={calculation.branchE || "Not provided"} />
            <Row label="Position (M)" value={calculation.positionM || "Not provided"} />
            <Row label="Position (E)" value={calculation.positionE || "Not provided"} />
            <Row label="Payment method" value={employee.paymentMethod || "Not provided"} />
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200">
            <Row label="Monthly Salary (M)" value={formatVnd(calculation.monthlyM)} />
            <Row label="Monthly Salary (E)" value={formatVnd(calculation.monthlyE)} />
            <Row label="Monthly Days (M)" value={calculation.daysM} />
            <Row label="Monthly Days (E)" value={calculation.daysE} />
            <Row label="Standard Hours (M)" value={calculation.standardM} />
            <Row label="Standard Hours (E)" value={calculation.standardE} />
            <Row label="Cumulative Hours" value={calculation.cumulativeHours.toFixed(2)} />
          </section>
        </div>

        <section className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          <Row label="Hourly Rate (M)" value={formatVnd(calculation.hourlyM)} />
          <Row label="Hourly Rate (E)" value={formatVnd(calculation.hourlyE)} />
          <Row label="Morning Salary" value={formatVnd(calculation.salaryM)} />
          <Row label="Evening Salary" value={formatVnd(calculation.salaryE)} />
          <Row label="Additional Earnings" value={formatVnd(calculation.totalEarnings)} />
          <Row label="Insurance and Deductions" value={formatVnd(calculation.totalDeductions)} />
          <Row label="Total Salary Payable (M)" value={formatVnd(calculation.payableM)} />
          <Row label="Total Salary Payable (E)" value={formatVnd(calculation.payableE)} />
          <Row label="Final Total Salary" value={formatVnd(calculation.finalPayable)} />
        </section>

        <footer className="mt-8 grid grid-cols-2 gap-8 text-xs text-slate-800" style={{ color: "#1e293b" }}>
          <div className="border-t border-slate-400 pt-2"><p className="font-black text-slate-900">Employee Signature</p><p className="mt-0.5 text-slate-500">Name and signature</p></div>
          <div className="border-t border-slate-400 pt-2"><p className="font-black text-slate-900">Prepared By</p><p className="mt-0.5 text-slate-500">HR / Date prepared: {new Date().toLocaleDateString()}</p></div>
        </footer>
      </article>
    </div>
  );
}
