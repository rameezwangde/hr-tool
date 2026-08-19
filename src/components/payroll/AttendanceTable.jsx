import { Copy, Save, Trash2, UserCheck, UserX } from "lucide-react";
import { ATTENDANCE_STATUSES, calculateWorkedHours, todayKey, validateAttendance } from "../../utils/payroll";
import PayrollStatusBadge from "./PayrollStatusBadge";

const emptyRow = (employee, date, shift) => ({
  id: `${employee.employeeId}-${date}-${shift}`,
  employeeId: employee.employeeId,
  employeeName: employee.fullName,
  date,
  shift,
  branch: shift === "Morning" ? employee.branchM : employee.branchE,
  position: shift === "Morning" ? employee.positionM : employee.positionE,
  checkIn: "",
  checkOut: "",
  breakMinutes: 0,
  workedHours: 0,
  status: "Present",
  notes: "",
  allowOvernight: shift === "Evening",
});

export default function AttendanceTable({ employees, records, setRecords, filters, saveRecords }) {
  const date = filters.date || todayKey();
  const shift = filters.shift || "Morning";
  const rows = employees.map((employee) => records.find((record) => record.employeeId === employee.employeeId && record.date === date && record.shift === shift) || emptyRow(employee, date, shift));

  const updateRow = (row, patch) => {
    const next = { ...row, ...patch };
    next.workedHours = calculateWorkedHours(next.checkIn, next.checkOut, next.breakMinutes);
    const without = records.filter((record) => record.id !== next.id);
    setRecords([...without, next]);
  };

  const deleteRow = (row) => {
    if (!window.confirm(`Delete attendance for ${row.employeeName} on ${row.date} (${row.shift})?`)) return;
    setRecords(records.filter((record) => record.id !== row.id));
  };

  const markAllPresent = () => setRecords([...records.filter((record) => !(record.date === date && record.shift === shift)), ...rows.map((row) => ({ ...row, status: "Present" }))]);
  const markSelectedAbsent = () => setRecords([...records.filter((record) => !(record.date === date && record.shift === shift)), ...rows.map((row) => ({ ...row, status: "Absent", checkIn: "", checkOut: "", workedHours: 0 }))]);
  const applySameTime = () => {
    const first = rows.find((row) => row.checkIn && row.checkOut);
    if (!first) return;
    setRecords([...records.filter((record) => !(record.date === date && record.shift === shift)), ...rows.map((row) => ({ ...row, checkIn: first.checkIn, checkOut: first.checkOut, breakMinutes: first.breakMinutes, workedHours: calculateWorkedHours(first.checkIn, first.checkOut, first.breakMinutes), status: row.status || "Present" }))]);
  };
  const copyPreviousDay = () => {
    const previous = new Date(date);
    previous.setDate(previous.getDate() - 1);
    const prevKey = previous.toISOString().slice(0, 10);
    const copied = rows.map((row) => {
      const previousRecord = records.find((record) => record.employeeId === row.employeeId && record.date === prevKey && record.shift === shift);
      return previousRecord ? { ...previousRecord, id: row.id, date } : row;
    });
    setRecords([...records.filter((record) => !(record.date === date && record.shift === shift)), ...copied]);
  };

  const validationErrors = rows.flatMap((row) => validateAttendance(row, records).map((error) => `${row.employeeName}: ${error}`));

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">Daily Attendance Entry</h2>
          <p className="mt-1 text-sm text-slate-500">Enter check-in and check-out. Worked hours calculate immediately.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyPreviousDay} className="btn-secondary inline-flex h-10 items-center gap-2"><Copy size={16} /> Copy previous day</button>
          <button type="button" onClick={applySameTime} className="btn-secondary inline-flex h-10 items-center gap-2"><Copy size={16} /> Apply same time</button>
          <button type="button" onClick={markAllPresent} className="btn-secondary inline-flex h-10 items-center gap-2"><UserCheck size={16} /> Mark all present</button>
          <button type="button" onClick={markSelectedAbsent} className="btn-secondary inline-flex h-10 items-center gap-2"><UserX size={16} /> Mark selected absent</button>
          <button type="button" onClick={() => saveRecords(records)} className="btn-primary inline-flex h-10 items-center gap-2"><Save size={16} /> Bulk save</button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {validationErrors.slice(0, 3).join(" ")}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              {["Employee", "Employee ID", "Branch", "Position", "Shift", "Check-in", "Check-out", "Break", "Worked Hours", "Status", "Notes", "Actions"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-4 py-3 font-bold text-slate-900">{row.employeeName}</td>
                <td className="px-4 py-3 font-semibold text-slate-500">{row.employeeId}</td>
                <td className="px-4 py-3">{row.branch}</td>
                <td className="px-4 py-3">{row.position}</td>
                <td className="px-4 py-3">{row.shift}</td>
                <td className="px-4 py-3"><input type="time" value={row.checkIn} onChange={(event) => updateRow(row, { checkIn: event.target.value })} className="input-field h-9 min-w-28 py-1" /></td>
                <td className="px-4 py-3"><input type="time" value={row.checkOut} onChange={(event) => updateRow(row, { checkOut: event.target.value })} className="input-field h-9 min-w-28 py-1" /></td>
                <td className="px-4 py-3"><input type="number" min="0" value={row.breakMinutes} onChange={(event) => updateRow(row, { breakMinutes: event.target.value })} className="input-field h-9 w-20 py-1" /></td>
                <td className="px-4 py-3 font-black text-slate-900">{Number(row.workedHours || 0).toFixed(2)} hrs</td>
                <td className="px-4 py-3">
                  <select value={row.status} onChange={(event) => updateRow(row, { status: event.target.value })} className="input-field h-9 min-w-32 py-1">
                    {ATTENDANCE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <div className="mt-1"><PayrollStatusBadge status={row.status} /></div>
                </td>
                <td className="px-4 py-3"><input value={row.notes || ""} onChange={(event) => updateRow(row, { notes: event.target.value })} className="input-field h-9 min-w-52 py-1" placeholder="Optional note" /></td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => deleteRow(row)} className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50" title="Delete attendance record">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
