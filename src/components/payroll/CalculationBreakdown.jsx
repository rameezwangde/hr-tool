import { X } from "lucide-react";
import { formatVnd } from "../../utils/payroll";

function Formula({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 text-sm font-bold leading-6 text-slate-800">{children}</div>
    </div>
  );
}

export default function CalculationBreakdown({ calculation, onClose }) {
  if (!calculation) return null;
  const a = calculation.adjustments;
  return (
    <aside className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-200 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-violet-600">Calculation Breakdown</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{calculation.employee.fullName}</h2>
          <p className="mt-1 text-sm text-slate-500">{calculation.month}</p>
        </div>
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" title="Close breakdown"><X size={18} /></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <Formula title="Morning Hourly Rate">{formatVnd(calculation.monthlyM)} / {calculation.standardM} = {formatVnd(calculation.hourlyM)}</Formula>
        <Formula title="Morning Salary">{calculation.hoursM.toFixed(2)} x {formatVnd(calculation.hourlyM)} = {formatVnd(calculation.salaryM)}</Formula>
        <Formula title="Morning Allowances">{formatVnd(a.parkingAllowanceM)} + {formatVnd(a.commissionM)} + {formatVnd(a.nightSupportM)} + {formatVnd(a.holidayPayM)} = {formatVnd(calculation.earningsM)}</Formula>
        <Formula title="Morning Payable">{formatVnd(calculation.salaryM)} + {formatVnd(calculation.earningsM)} - {formatVnd(calculation.deductionsM)} = {formatVnd(calculation.payableM)}</Formula>
        <Formula title="Evening Hourly Rate">{formatVnd(calculation.monthlyE)} / {calculation.standardE} = {formatVnd(calculation.hourlyE)}</Formula>
        <Formula title="Evening Salary">{calculation.hoursE.toFixed(2)} x {formatVnd(calculation.hourlyE)} = {formatVnd(calculation.salaryE)}</Formula>
        <Formula title="Evening Allowances">{formatVnd(a.parkingAllowanceE)} + {formatVnd(a.commissionE)} + {formatVnd(a.nightSupportE)} + {formatVnd(a.holidayPayE)} = {formatVnd(calculation.earningsE)}</Formula>
        <Formula title="Evening Payable">{formatVnd(calculation.salaryE)} + {formatVnd(calculation.earningsE)} - {formatVnd(calculation.deductionsE)} = {formatVnd(calculation.payableE)}</Formula>
        <Formula title="Final Payable">{formatVnd(calculation.payableM)} + {formatVnd(calculation.payableE)} + {formatVnd(a.customEarning)} - {formatVnd(a.personalIncomeTax)} - {formatVnd(a.customDeduction)} = {formatVnd(calculation.finalPayable)}</Formula>
      </div>
    </aside>
  );
}
