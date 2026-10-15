import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Building, Calendar, Check, Clock, Filter, Plus, Search, UserCheck, UserPlus, X } from "lucide-react";
import { buildRosterEntry, employeesForCell, ENTRY_STATUSES, getCellEntries, rosterCellKey, workloadFor } from "../../utils/roster";
import RosterStatusBadge from "./RosterStatusBadge";

export default function AssignmentPanel({ cell, employees, roster, setRoster, month, onClose, onProfile }) {
  const [query, setQuery] = useState("");
  const [tabFilter, setTabFilter] = useState("all"); // 'all' | 'eligible' | 'other'

  if (!cell) return null;
  const key = rosterCellKey({ ...cell, month });
  const entries = getCellEntries(roster, key);
  const candidates = employeesForCell(employees, cell, roster, cell.date);

  const filtered = useMemo(() => {
    return candidates.filter(({ employee, available, matchingPosition, matchingBranch }) => {
      const q = query.toLowerCase();
      const matchSearch = !query || `${employee.fullName} ${employee.employeeId} ${employee.jobTitle}`.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (tabFilter === "eligible") return available && matchingPosition;
      if (tabFilter === "other") return !matchingPosition;
      return true;
    });
  }, [candidates, query, tabFilter]);

  const setCellEntries = (nextEntries) => setRoster({ ...roster, [key]: nextEntries });

  const addEmployee = (candidate) => {
    if (!candidate.available) return;
    if (entries.some((entry) => entry.employeeId === candidate.employee.employeeId)) return;
    if (candidate.warning && !window.confirm(`Notice for ${candidate.employee.fullName}:\n- ${candidate.warning}\n\nAssign anyway?`)) return;
    setCellEntries([...entries, buildRosterEntry({ employee: candidate.employee, ...cell, status: "Working" })]);
  };

  const setStatus = (status) => {
    if (status === "Working") return;
    setCellEntries([...entries.filter((entry) => entry.status === "Working"), { id: `${status}-${cell.date}-${cell.position}-${cell.shift}`, employeeId: "", employeeName: status, ...cell, status }]);
  };

  const removeEntry = (entryId) => setCellEntries(entries.filter((entry) => entry.id !== entryId));

  return (
    <AnimatePresence>
      <motion.aside initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-sm" onMouseDown={onClose}>
        <motion.section 
          initial={{ x: 520 }} 
          animate={{ x: 0 }} 
          exit={{ x: 520 }} 
          transition={{ type: "spring", damping: 30, stiffness: 300 }} 
          onMouseDown={(event) => event.stopPropagation()} 
          className="ml-auto flex h-full w-full max-w-lg flex-col bg-slate-50 shadow-2xl border-l border-slate-200"
        >
          {/* Header */}
          <header className="border-b border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-violet-800">
                  <UserPlus size={12} /> Staff Assignment
                </span>
                <h2 className="mt-1.5 text-xl font-black text-slate-950 tracking-tight">{cell.position}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                    <Clock size={12} className="text-violet-600" /> {cell.shift}
                  </span>
                  <span>•</span>
                  <span>{cell.branch}</span>
                  <span>•</span>
                  <span>{cell.department}</span>
                  <span>•</span>
                  <span className="text-slate-900 font-black">{cell.date}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* Current Assignments Bar */}
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Assigned ({entries.length})
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Click staff to view profile</span>
            </div>
            
            <div className="mt-2.5 flex flex-wrap gap-2">
              {entries.map((entry) => (
                <span key={entry.id} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 pl-3 pr-2 py-1 text-xs font-bold text-violet-900 shadow-2xs">
                  <button type="button" onClick={() => entry.employeeId && onProfile(entry.employeeId)} className="font-black hover:underline cursor-pointer">
                    {entry.employeeName}
                  </button>
                  <RosterStatusBadge status={entry.status} />
                  <button type="button" onClick={() => removeEntry(entry.id)} className="text-violet-400 hover:text-rose-600 p-0.5 rounded cursor-pointer" title="Remove">
                    <X size={13} />
                  </button>
                </span>
              ))}
              {!entries.length && (
                <p className="text-xs font-semibold text-slate-400 italic py-1">No staff assigned for this slot yet.</p>
              )}
            </div>

            {/* Quick Status Toggles */}
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Quick Day Status</p>
              <div className="flex flex-wrap gap-1.5">
                {ENTRY_STATUSES.filter((status) => status !== "Working").map((status) => (
                  <button 
                    key={status} 
                    type="button" 
                    onClick={() => setStatus(status)} 
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800 transition cursor-pointer"
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="px-5 pt-4 pb-2 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                value={query} 
                onChange={(event) => setQuery(event.target.value)} 
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15" 
                placeholder="Search by staff name, ID, or job title..." 
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-200/70 p-1 text-[11px] font-black">
              <button
                type="button"
                onClick={() => setTabFilter("all")}
                className={`flex-1 rounded-md py-1 text-center transition cursor-pointer ${tabFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                All Staff ({candidates.length})
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("eligible")}
                className={`flex-1 rounded-md py-1 text-center transition cursor-pointer ${tabFilter === "eligible" ? "bg-white text-violet-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Direct Role
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("other")}
                className={`flex-1 rounded-md py-1 text-center transition cursor-pointer ${tabFilter === "other" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
              >
                Cross-Role
              </button>
            </div>
          </div>

          {/* Candidates List */}
          <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-5 pt-1">
            {filtered.map((candidate) => {
              const workload = workloadFor(candidate.employee, roster, month);
              const isAssignedHere = entries.some(e => e.employeeId === candidate.employee.employeeId);
              
              return (
                <div 
                  key={candidate.employee.employeeId} 
                  className={`group relative flex items-center justify-between gap-3 rounded-xl border p-3 transition shadow-2xs ${
                    isAssignedHere 
                      ? "border-violet-300 bg-violet-50/50" 
                      : candidate.available 
                        ? "border-slate-200/80 bg-white hover:border-violet-300 hover:shadow-xs" 
                        : "border-slate-200/60 bg-slate-100/60 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-black text-violet-800">
                      {candidate.employee.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}
                    </span>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="truncate text-xs font-black text-slate-900">
                          {candidate.employee.fullName}
                        </strong>
                        <span className="text-[10px] font-bold text-slate-400">
                          {candidate.employee.employeeId}
                        </span>
                      </div>

                      {/* Job title and Workload Stats */}
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500 truncate">
                        <span className="font-bold text-slate-700">{candidate.employee.jobTitle || "No role"}</span>
                        {" • "}
                        <span>{candidate.employee.workLocation || candidate.employee.branch || "All Branches"}</span>
                        {" • "}
                        <span className={workload.workingDays > 24 ? "text-amber-700 font-bold" : "text-slate-500"}>
                          {workload.workingDays}d ({workload.hours}h)
                        </span>
                      </p>

                      {/* Warnings or Disabled Pills */}
                      {candidate.disabledReason ? (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-rose-700">
                          <AlertCircle size={12} className="shrink-0" />
                          <span className="truncate">{candidate.disabledReason}</span>
                        </div>
                      ) : candidate.warnings?.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {candidate.warnings.map((w, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-800"
                            >
                              {w.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 pl-1">
                    {isAssignedHere ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 text-emerald-800 px-2 py-1 text-xs font-bold">
                        <Check size={13} strokeWidth={3} /> Assigned
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!candidate.available}
                        onClick={() => addEmployee(candidate)}
                        className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black transition cursor-pointer ${
                          candidate.available
                            ? "bg-violet-600 text-white shadow-2xs hover:bg-violet-700 hover:shadow-xs"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <Plus size={14} strokeWidth={3} />
                        <span>Assign</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!filtered.length && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
                <Search className="mx-auto text-slate-300" size={28} />
                <p className="mt-2 text-xs font-bold text-slate-700">No staff matching criteria</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Try adjusting your search query or tab filter.</p>
              </div>
            )}
          </div>
        </motion.section>
      </motion.aside>
    </AnimatePresence>
  );
}
