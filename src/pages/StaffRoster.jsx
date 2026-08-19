import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarRange, Copy, Download, FileSpreadsheet, Printer, RotateCcw, Send, Trash2, Users } from "lucide-react";
import AssignmentPanel from "../components/roster/AssignmentPanel";
import RosterFilters from "../components/roster/RosterFilters";
import RosterStatusBadge from "../components/roster/RosterStatusBadge";
import RosterSummary from "../components/roster/RosterSummary";
import RosterTable from "../components/roster/RosterTable";
import StaffProfileModal from "../components/StaffProfileModal";
import { exportToPDF, printDocument } from "../utils/pdfGenerator";
import {
  branchOptions,
  calculateRosterSummary,
  daysInMonth,
  loadRequirements,
  loadRosterData,
  loadRosterEmployees,
  loadRosterStatuses,
  monthKey,
  positionOptions,
  saveRosterData,
  saveRosterStatuses,
  workloadFor,
} from "../utils/roster";

const defaultFilters = {
  month: monthKey(),
  branch: "",
  department: "",
  position: "",
  shift: "",
  search: "",
  week: "all",
};

function addMonths(month, diff) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + diff, 1);
  return date.toISOString().slice(0, 7);
}

function ActionButton({ icon: Icon, label, onClick, primary = false }) {
  return (
    <button type="button" onClick={onClick} className={`${primary ? "btn-primary" : "btn-secondary"} inline-flex h-10 items-center gap-2`}>
      <Icon size={16} /> {label}
    </button>
  );
}

export default function StaffRoster() {
  const [employees, setEmployees] = useState(() => loadRosterEmployees());
  const [roster, setRoster] = useState(() => loadRosterData());
  const [statuses, setStatuses] = useState(() => loadRosterStatuses());
  const [requirements, setRequirements] = useState(() => loadRequirements());
  const [filters, setFilters] = useState(defaultFilters);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [activeCell, setActiveCell] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const refresh = useCallback(() => {
    setEmployees(loadRosterEmployees());
    setRoster(loadRosterData());
    setStatuses(loadRosterStatuses());
    setRequirements(loadRequirements());
  }, []);

  useEffect(() => {
    window.addEventListener("staffProfilesChanged", refresh);
    window.addEventListener("jobPositionsChanged", refresh);
    window.addEventListener("workLocationsChanged", refresh);
    window.addEventListener("staffRosterChanged", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("staffProfilesChanged", refresh);
      window.removeEventListener("jobPositionsChanged", refresh);
      window.removeEventListener("workLocationsChanged", refresh);
      window.removeEventListener("staffRosterChanged", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const branches = useMemo(() => branchOptions(employees).filter((branch) => !filters.branch || branch === filters.branch), [employees, filters.branch]);
  const positions = useMemo(() => positionOptions(employees).filter((row) => {
    if (filters.department && row.department !== filters.department) return false;
    if (filters.position && row.position !== filters.position) return false;
    return true;
  }), [employees, filters.department, filters.position]);

  const filteredEmployees = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return employees.filter((employee) => {
      if (filters.department && employee.department !== filters.department) return false;
      if (filters.position && employee.jobTitle !== filters.position) return false;
      return !query || `${employee.fullName} ${employee.employeeId}`.toLowerCase().includes(query);
    });
  }, [employees, filters.department, filters.position, filters.search]);

  const options = useMemo(() => ({
    branches: branchOptions(employees),
    departments: [...new Set(positionOptions(employees).map((row) => row.department))].sort(),
    positions: [...new Set(positionOptions(employees).map((row) => row.position))].sort(),
  }), [employees]);

  const status = statuses[filters.month] || "Draft";
  const summary = useMemo(() => calculateRosterSummary({ employees: filteredEmployees, roster, month: filters.month, requirements, branches, positions }), [branches, filteredEmployees, filters.month, positions, requirements, roster]);

  const persistRoster = (next) => setRoster(saveRosterData(next));
  const persistStatus = (nextStatus) => setStatuses(saveRosterStatuses({ ...statuses, [filters.month]: nextStatus }));
  const toggleCollapsed = (key) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  const copyDay = (sourceDate, targetDate) => {
    if (!window.confirm(`Copy assignments from ${sourceDate} to ${targetDate}?`)) return;
    const next = { ...roster };
    Object.entries(roster).forEach(([key, entries]) => {
      if (!key.includes(sourceDate)) return;
      const targetKey = key.replace(sourceDate, targetDate);
      next[targetKey] = entries.map((entry) => ({ ...entry, id: `${entry.id}-${targetDate}`, date: targetDate }));
    });
    persistRoster(next);
  };

  const copyPreviousDay = () => {
    const days = daysInMonth(filters.month);
    if (days.length < 2) return;
    copyDay(days[0].date, days[1].date);
  };

  const copyPreviousWeek = () => {
    if (!window.confirm("Copy the first week pattern into the second week?")) return;
    const days = daysInMonth(filters.month);
    const next = { ...roster };
    days.slice(0, 7).forEach((source, index) => {
      const target = days[index + 7];
      if (!target) return;
      Object.entries(roster).forEach(([key, entries]) => {
        if (!key.includes(source.date)) return;
        next[key.replace(source.date, target.date)] = entries.map((entry) => ({ ...entry, id: `${entry.id}-${target.date}`, date: target.date }));
      });
    });
    persistRoster(next);
  };

  const copyPreviousMonth = () => {
    const previous = addMonths(filters.month, -1);
    if (!window.confirm(`Copy roster from ${previous} to ${filters.month}?`)) return;
    const next = { ...roster };
    Object.entries(roster).forEach(([key, entries]) => {
      if (!key.startsWith(previous)) return;
      const targetKey = key.replace(previous, filters.month);
      next[targetKey] = entries.map((entry) => ({ ...entry, id: `${entry.id}-${filters.month}`, date: entry.date.replace(previous, filters.month) }));
    });
    persistRoster(next);
  };

  const clearDay = () => {
    const date = daysInMonth(filters.month)[0]?.date;
    if (!date || !window.confirm(`Clear all assignments for ${date}?`)) return;
    const next = Object.fromEntries(Object.entries(roster).filter(([key]) => !key.includes(date)));
    persistRoster(next);
  };

  const clearWeek = () => {
    if (!window.confirm("Clear assignments for the first week of this month?")) return;
    const dates = new Set(daysInMonth(filters.month).slice(0, 7).map((day) => day.date));
    const next = Object.fromEntries(Object.entries(roster).filter(([key]) => ![...dates].some((date) => key.includes(date))));
    persistRoster(next);
  };

  const exportCsv = () => {
    const rows = [["Month", "Branch", "Department", "Position", "Shift", "Date", "Employee", "Status"]];
    Object.entries(roster).forEach(([key, entries]) => {
      if (!key.startsWith(filters.month)) return;
      entries.forEach((entry) => rows.push([filters.month, entry.branch, entry.department, entry.position, entry.shift, entry.date, entry.employeeName, entry.status]));
    });
    const csv = rows.map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Staff_Roster_${filters.month}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openProfile = (employeeId) => {
    const profile = employees.find((employee) => employee.employeeId === employeeId);
    if (profile) setSelectedProfile(profile);
  };

  const warnings = useMemo(() => filteredEmployees.flatMap((employee) => {
    const workload = workloadFor(employee, roster, filters.month);
    const list = [];
    if (workload.workingDays > 24) list.push(`${employee.fullName} has ${workload.workingDays} working days this month.`);
    if (workload.off === 0 && workload.workingDays > 6) list.push(`${employee.fullName} has no OFF day recorded.`);
    if (workload.hours > 240) list.push(`${employee.fullName} has excessive scheduled hours.`);
    return list;
  }), [filteredEmployees, filters.month, roster]);

  return (
    <div className="mx-auto max-w-[1800px] space-y-5">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="relative isolate px-5 py-6 sm:px-7">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#fff7ed_0%,#ecfeff_45%,#f8fafc_100%)]" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-orange-700"><CalendarRange size={14} /> Staff Roster</p>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Monthly Workforce Scheduling</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Branch-wise monthly roster for Kitchen Staff and Management Staff, connected to active signed employees and staffing requirements.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton icon={FileSpreadsheet} label="Export CSV" onClick={exportCsv} />
              <ActionButton icon={Download} label="Export PDF" onClick={() => exportToPDF("staff-roster-print", `Staff_Roster_${filters.month}.pdf`)} />
              <ActionButton icon={Printer} label="Print" onClick={() => printDocument("staff-roster-print")} />
            </div>
          </div>
        </div>
      </section>

      <RosterFilters
        filters={filters}
        setFilters={setFilters}
        onPrev={() => setFilters({ ...filters, month: addMonths(filters.month, -1) })}
        onNext={() => setFilters({ ...filters, month: addMonths(filters.month, 1) })}
        onToday={() => setFilters({ ...filters, month: monthKey() })}
      />

      <RosterSummary summary={summary} status={status} />

      {warnings.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {warnings.slice(0, 5).map((warning) => <p key={warning}>{warning}</p>)}
        </section>
      )}


      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <RosterTable month={filters.month} branches={branches} positions={positions} roster={roster} requirements={requirements} collapsed={collapsed} toggleCollapsed={toggleCollapsed} onCellClick={setActiveCell} onEmployeeClick={openProfile} weekFilter={filters.week} />
      </motion.div>

      <AssignmentPanel cell={activeCell} employees={filteredEmployees} roster={roster} setRoster={persistRoster} month={filters.month} onClose={() => setActiveCell(null)} onProfile={openProfile} />

      {selectedProfile && (
        <StaffProfileModal
          key={selectedProfile.employeeId || selectedProfile.contractNumber}
          profile={selectedProfile}
          profiles={employees}
          initialTab="overview"
          onProfileUpdate={(profile) => setSelectedProfile(profile)}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}
