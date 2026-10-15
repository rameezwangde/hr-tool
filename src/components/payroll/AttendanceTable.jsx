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
        <div className="flex items-start gap-2.5 border-b border-rose-200 bg-rose-50/80 px-5 py-3 text-xs font-bold text-rose-800">
          <span className="shrink-0 mt-0.5 rounded-full bg-rose-200 p-0.5 text-rose-900 font-black">!</span>
          <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1">
            {validationErrors.slice(0, 3).map((err, i) => (
              <span key={i} className="inline-flex items-center gap-1">• {err}</span>
            ))}
            {validationErrors.length > 3 && <span className="font-black underline">+{validationErrors.length - 3} more notices</span>}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-xs border-collapse">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Employee</th>
              <th className="px-3 py-3.5">ID</th>
              <th className="px-3 py-3.5">Branch</th>
              <th className="px-3 py-3.5">Position</th>
              <th className="px-3 py-3.5">Shift</th>
              <th className="px-3 py-3.5">Check-In</th>
              <th className="px-3 py-3.5">Check-Out</th>
              <th className="px-3 py-3.5">Break (min)</th>
              <th className="px-3 py-3.5 text-center">Worked Hours</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Notes</th>
              <th className="px-3 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-[10px] font-black text-violet-700">
                      {String(row.employeeName || "E").split(/\s+/).map((p) => p[0]).slice(0, 2).join("")}
                    </span>
                    <strong className="font-black text-slate-900 truncate max-w-44">{row.employeeName}</strong>
                  </div>
                </td>
                <td className="px-3 py-3 font-semibold text-slate-400 text-[11px]">{row.employeeId}</td>
                <td className="px-3 py-3 font-bold text-slate-700 truncate">{row.branch || "—"}</td>
                <td className="px-3 py-3 font-semibold text-slate-600 truncate">{row.position || "—"}</td>
                <td className="px-3 py-3">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${row.shift === "Morning" ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-indigo-50 text-indigo-800 border border-indigo-200"}`}>
                    {row.shift}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <input
                    type="time"
                    value={row.checkIn || ""}
                    onChange={(event) => updateRow(row, { checkIn: event.target.value })}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 shadow-2xs"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="time"
                    value={row.checkOut || ""}
                    onChange={(event) => updateRow(row, { checkOut: event.target.value })}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 shadow-2xs"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={row.breakMinutes ?? 0}
                    onChange={(event) => updateRow(row, { breakMinutes: event.target.value })}
                    className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-bold text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 shadow-2xs"
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-black ${Number(row.workedHours) > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                    {Number(row.workedHours || 0).toFixed(2)} hrs
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.status}
                    onChange={(event) => updateRow(row, { status: event.target.value })}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none focus:border-violet-500 shadow-2xs cursor-pointer"
                  >
                    {ATTENDANCE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    value={row.notes || ""}
                    onChange={(event) => updateRow(row, { notes: event.target.value })}
                    className="h-8 w-full min-w-36 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 placeholder-slate-300 outline-none focus:border-violet-500"
                    placeholder="Optional note..."
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => deleteRow(row)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                    title="Delete attendance row"
                  >
                    <Trash2 size={15} />
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
