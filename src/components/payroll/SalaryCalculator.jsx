import { useState } from "react";
import { Eye, PlusCircle, Save, Trash2 } from "lucide-react";
import { blankAdjustment, calculatePayroll, formatVnd, loadPayrollSettings, payrollKey, savePayrollSettings } from "../../utils/payroll";

function Summary({ label, value, tone = "text-slate-950", onDelete, isDeleted, onRestore }) {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between min-h-[90px]">
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
        {onDelete && (
          isDeleted ? (
            <button
              type="button"
              onClick={onRestore}
              className="text-[10px] font-black uppercase tracking-wide text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors"
              title="Restore hours"
            >
              Undo
            </button>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition-all"
              title="Delete hours"
            >
              <Trash2 size={14} />
            </button>
          )
        )}
      </div>
      <p className={`mt-2 text-xl font-black ${isDeleted ? "text-slate-400 line-through" : tone}`}>{value}</p>
    </div>
  );
}

function MoneyInput({ label, value, onChange, note, onNoteChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input type="number" value={value || ""} onChange={(event) => onChange(event.target.value)} className="input-field" placeholder="0" />
      {onNoteChange && <input value={note || ""} onChange={(event) => onNoteChange(event.target.value)} className="input-field mt-2 h-9 text-xs" placeholder="Reason or note" />}
    </label>
  );
}

function Section({ title, rows }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        {rows.map(([label, value], index) => (
          <div key={label} className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${index ? "border-t border-slate-100" : ""}`}>
            <span className="font-semibold text-slate-500">{label}</span>
            <span className="font-black text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SalaryCalculator({ employees, month, attendance, setAttendance, saveAttendance, adjustments, setAdjustments, saveAdjustments, onBreakdown }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [settings, setSettings] = useState(() => loadPayrollSettings());
  const selectedEmployee = employees.find((employee) => employee.employeeId === selectedEmployeeId) || employees[0];
  const key = selectedEmployee ? payrollKey(selectedEmployee.employeeId, month) : "";
  const employeeAdjustments = { ...blankAdjustment, ...(adjustments[key] || {}) };
  const calculation = selectedEmployee ? calculatePayroll(selectedEmployee, month, attendance, employeeAdjustments) : null;

  const updateAdjustment = (field, value) => {
    setAdjustments({ ...adjustments, [key]: { ...employeeAdjustments, [field]: value } });
  };

  const updateStandardHours = (shift, value) => {
    const next = {
      ...settings,
      employeeHours: {
        ...(settings.employeeHours || {}),
        [`${selectedEmployee.employeeId}-${shift}`]: value,
      },
    };
    setSettings(savePayrollSettings(next));
  };

  const clearAdjustments = () => {
    if (!window.confirm(`Clear all additional earnings and deductions for ${selectedEmployee.fullName} in ${month}?`)) return;
    const next = { ...adjustments };
    delete next[key];
    setAdjustments(next);
    saveAdjustments(next);
  };

  const deleteMonthlyCalculations = () => {
    if (!window.confirm(`Are you sure you want to delete all salary calculations, adjustments, and attendance records for ALL employees for the month of ${month}? This will completely reset calculations for this month and cannot be undone.`)) return;

    // Filter out attendance records for this month
    const nextAttendance = attendance.filter((record) => !record.date?.startsWith(month));
    setAttendance(nextAttendance);
    saveAttendance(nextAttendance);

    // Filter out adjustments for this month
    const nextAdjustments = { ...adjustments };
    Object.keys(nextAdjustments).forEach((adjKey) => {
      if (adjKey.endsWith(`::${month}`)) {
        delete nextAdjustments[adjKey];
      }
    });
    setAdjustments(nextAdjustments);
    saveAdjustments(nextAdjustments);

    alert(`Successfully deleted all calculations and attendance records for ${month}.`);
  };

  if (!selectedEmployee || !calculation) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center font-bold text-slate-500">No active signed employees match the current filters.</div>;
  }

  const health = calculation.finalPayable < 0 ? "text-rose-600" : calculation.hoursM + calculation.hoursE ? "text-emerald-600" : "text-orange-600";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-violet-600">Salary Calculation</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedEmployee.fullName}</h2>
            <p className="mt-1 text-sm text-slate-500">{selectedEmployee.employeeId} / {month}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={selectedEmployee.employeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} className="input-field h-10 w-64">
              {employees.map((employee) => <option key={employee.employeeId} value={employee.employeeId}>{employee.fullName} / {employee.employeeId}</option>)}
            </select>
            <button type="button" onClick={() => onBreakdown(calculation)} className="btn-secondary inline-flex h-10 items-center gap-2"><Eye size={16} /> View Calculation Breakdown</button>
            <button type="button" onClick={clearAdjustments} className="btn-secondary inline-flex h-10 items-center gap-2 text-rose-600 hover:text-rose-700"><Trash2 size={16} /> Clear adjustments</button>
            <button type="button" onClick={deleteMonthlyCalculations} className="btn-secondary inline-flex h-10 items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"><Trash2 size={16} /> Delete Calculations</button>
            <button type="button" onClick={() => saveAdjustments(adjustments)} className="btn-primary inline-flex h-10 items-center gap-2"><Save size={16} /> Save Calculation</button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <Summary label="Monthly Base Salary" value={formatVnd(calculation.monthlyM + calculation.monthlyE)} />
        <Summary
          label="Morning Hours"
          value={calculation.hoursM.toFixed(2)}
          onDelete={() => updateAdjustment("excludeMorningHours", true)}
          isDeleted={employeeAdjustments.excludeMorningHours}
          onRestore={() => updateAdjustment("excludeMorningHours", false)}
        />
        <Summary
          label="Evening Hours"
          value={calculation.hoursE.toFixed(2)}
          onDelete={() => updateAdjustment("excludeEveningHours", true)}
          isDeleted={employeeAdjustments.excludeEveningHours}
          onRestore={() => updateAdjustment("excludeEveningHours", false)}
        />
        <Summary
          label="Cumulative Hours"
          value={calculation.cumulativeHours.toFixed(2)}
          onDelete={() => updateAdjustment("excludeCumulativeHours", true)}
          isDeleted={employeeAdjustments.excludeCumulativeHours}
          onRestore={() => updateAdjustment("excludeCumulativeHours", false)}
        />
        <Summary label="Total Earnings" value={formatVnd(calculation.totalEarnings)} />
        <Summary label="Total Deductions" value={formatVnd(calculation.totalDeductions)} />
        <Summary label="Final Payable Salary" value={formatVnd(calculation.finalPayable)} tone={health} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Morning Salary" rows={[
          ["Branch", calculation.branchM || "Not provided"],
          ["Position", calculation.positionM || "Not provided"],
          ["Monthly Salary", formatVnd(calculation.monthlyM)],
          ["Total Monthly Days", calculation.daysM],
          ["Standard Monthly Hours", calculation.standardM],
          ["Total Hours Worked", calculation.hoursM.toFixed(2)],
          ["Hourly Rate", formatVnd(calculation.hourlyM)],
          ["Calculated Salary", formatVnd(calculation.salaryM)],
          ["Allowances", formatVnd(calculation.earningsM)],
          ["Insurance and Deductions", formatVnd(calculation.deductionsM)],
          ["Salary Payable", formatVnd(calculation.payableM)],
        ]} />
        <Section title="Evening Salary" rows={[
          ["Branch", calculation.branchE || "Not provided"],
          ["Position", calculation.positionE || "Not provided"],
          ["Monthly Salary", formatVnd(calculation.monthlyE)],
          ["Total Monthly Days", calculation.daysE],
          ["Standard Monthly Hours", calculation.standardE],
          ["Total Hours Worked", calculation.hoursE.toFixed(2)],
          ["Hourly Rate", formatVnd(calculation.hourlyE)],
          ["Calculated Salary", formatVnd(calculation.salaryE)],
          ["Allowances", formatVnd(calculation.earningsE)],
          ["Insurance and Deductions", formatVnd(calculation.deductionsE)],
          ["Salary Payable", formatVnd(calculation.payableE)],
        ]} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Standard Monthly Hours</h3>
        <p className="mt-1 text-sm text-slate-500">Configure this employee's standard hours for payroll calculation.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Morning standard hours</span>
            <input type="number" value={calculation.standardM} onChange={(event) => updateStandardHours("Morning", event.target.value)} className="input-field" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Evening standard hours</span>
            <input type="number" value={calculation.standardE} onChange={(event) => updateStandardHours("Evening", event.target.value)} className="input-field" />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <PlusCircle className="text-violet-600" size={20} />
          <h3 className="text-lg font-black text-slate-950">Additional Earnings & Deductions</h3>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["parkingAllowanceM", "Parking allowance (M)"],
            ["parkingAllowanceE", "Parking allowance (E)"],
            ["commissionM", "Commission (M)"],
            ["commissionE", "Commission (E)"],
            ["nightSupportM", "Night support (M)"],
            ["nightSupportE", "Night support (E)"],
            ["holidayPayM", "Holiday pay (M)"],
            ["holidayPayE", "Holiday pay (E)"],
            ["socialInsuranceM", "Social insurance (M)"],
            ["socialInsuranceE", "Social insurance (E)"],
            ["deductionM", "Other deduction (M)"],
            ["deductionE", "Other deduction (E)"],
            ["personalIncomeTax", "Personal income tax"],
            ["customEarning", "Custom earning"],
            ["customDeduction", "Custom deduction"],
          ].map(([field, label]) => <MoneyInput key={field} label={label} value={employeeAdjustments[field]} onChange={(value) => updateAdjustment(field, value)} />)}
          <label className="block md:col-span-2 xl:col-span-4">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Reason or adjustment note</span>
            <textarea value={employeeAdjustments.notes || ""} onChange={(event) => updateAdjustment("notes", event.target.value)} className="input-field h-24" placeholder="Example: Deduction 60,000 VND - Uniform damage" />
          </label>
        </div>
      </section>
    </div>
  );
}
