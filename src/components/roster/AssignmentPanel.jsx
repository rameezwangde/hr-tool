import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, UserPlus, X } from "lucide-react";
import { buildRosterEntry, employeesForCell, ENTRY_STATUSES, getCellEntries, rosterCellKey, workloadFor } from "../../utils/roster";
import RosterStatusBadge from "./RosterStatusBadge";

export default function AssignmentPanel({ cell, employees, roster, setRoster, month, onClose, onProfile }) {
  const [query, setQuery] = useState("");
  if (!cell) return null;
  const key = rosterCellKey({ ...cell, month });
  const entries = getCellEntries(roster, key);
  const candidates = employeesForCell(employees, cell, roster, cell.date);
  const filtered = candidates.filter(({ employee }) => `${employee.fullName} ${employee.employeeId}`.toLowerCase().includes(query.toLowerCase()));

  const setCellEntries = (nextEntries) => setRoster({ ...roster, [key]: nextEntries });

  const addEmployee = (candidate) => {
    if (!candidate.available) return;
    if (entries.some((entry) => entry.employeeId === candidate.employee.employeeId)) return;
    if (candidate.warning && !window.confirm(`${candidate.employee.fullName} has the following warning(s):\n- ${candidate.warning.split(", ").join("\n- ")}\n\nAssign anyway?`)) return;
    setCellEntries([...entries, buildRosterEntry({ employee: candidate.employee, ...cell, status: "Working" })]);
  };

  const setStatus = (status) => {
    if (status === "Working") return;
    setCellEntries([...entries.filter((entry) => entry.status === "Working"), { id: `${status}-${cell.date}-${cell.position}-${cell.shift}`, employeeId: "", employeeName: status, ...cell, status }]);
  };

  const removeEntry = (entryId) => setCellEntries(entries.filter((entry) => entry.id !== entryId));

  return (
    <AnimatePresence>
      <motion.aside initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-sm" onMouseDown={onClose}>
        <motion.section initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={{ type: "spring", damping: 28, stiffness: 260 }} onMouseDown={(event) => event.stopPropagation()} className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b border-slate-200 p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-violet-600">Assign Staff</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{cell.position} / {cell.shift}</h2>
              <p className="mt-1 text-sm text-slate-500">{cell.branch} / {cell.department} / {cell.date}</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><X size={18} /></button>
          </header>

          <div className="border-b border-slate-200 p-5">
            <p className="text-sm font-black text-slate-900">Current assignments</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {entries.map((entry) => (
                <span key={entry.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold">
                  <button type="button" onClick={() => entry.employeeId && onProfile(entry.employeeId)} className="font-black text-slate-900">{entry.employeeName}</button>
                  <RosterStatusBadge status={entry.status} />
                  <button type="button" onClick={() => removeEntry(entry.id)} className="text-slate-400 hover:text-rose-600"><X size={13} /></button>
                </span>
              ))}
              {!entries.length && <p className="text-sm font-semibold text-slate-500">No one assigned yet.</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {ENTRY_STATUSES.filter((status) => status !== "Working").map((status) => (
                <button key={status} type="button" onClick={() => setStatus(status)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-black hover:bg-slate-50">{status}</button>
              ))}
            </div>
          </div>

          <div className="p-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="input-field pl-10" placeholder="Search employee" />
            </label>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-5">
            {filtered.map((candidate) => {
              const workload = workloadFor(candidate.employee, roster, month);
              return (
                <button key={candidate.employee.employeeId} type="button" disabled={!candidate.available} onClick={() => addEmployee(candidate)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${candidate.available ? "border-slate-200 hover:border-violet-300 hover:bg-violet-50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-xs font-black text-violet-700">{candidate.employee.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm text-slate-900">{candidate.employee.fullName}</strong>
                    <small className="text-slate-500">{candidate.employee.employeeId} / {workload.workingDays} days / {workload.hours} hrs</small>
                    {(candidate.disabledReason || candidate.warning) && <small className={`block font-bold ${candidate.disabledReason ? "text-rose-600" : "text-orange-600"}`}>{candidate.disabledReason || candidate.warning}</small>}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm"><UserPlus size={15} /></span>
                </button>
              );
            })}
          </div>
        </motion.section>
      </motion.aside>
    </AnimatePresence>
  );
}
