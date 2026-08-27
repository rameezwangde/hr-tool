import { useState } from "react";
import { CalendarDays, FileSpreadsheet, UserCheck } from "lucide-react";
import { SHIFT_OPTIONS, todayKey } from "../../utils/payroll";
import AttendanceTable from "./AttendanceTable";
import ExcelImport from "./ExcelImport";

export default function AttendanceEntry({ employees, records, setRecords, filters, setFilters, saveRecords, options }) {
  const [showImport, setShowImport] = useState(false);
  const update = (patch) => setFilters({ ...filters, ...patch });

  const handleImport = (merged) => {
    setRecords(saveRecords(merged));
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid flex-1 gap-3 md:grid-cols-[180px_160px_repeat(3,minmax(160px,1fr))]">
            <label className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input type="date" value={filters.date || todayKey()} onChange={(event) => update({ date: event.target.value })} className="input-field pl-10" />
            </label>
            <select value={filters.shift || "Morning"} onChange={(event) => update({ shift: event.target.value })} className="input-field">
              {SHIFT_OPTIONS.map((shift) => <option key={shift}>{shift}</option>)}
            </select>
            <select value={filters.branch} onChange={(event) => update({ branch: event.target.value })} className="input-field"><option value="">All branches</option>{options.branches.map((value) => <option key={value}>{value}</option>)}</select>
            <select value={filters.department} onChange={(event) => update({ department: event.target.value })} className="input-field"><option value="">All departments</option>{options.departments.map((value) => <option key={value}>{value}</option>)}</select>
            <label className="relative block">
              <UserCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input value={filters.search} onChange={(event) => update({ search: event.target.value })} className="input-field pl-10" placeholder="Search employee" />
            </label>
          </div>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 text-sm font-black text-violet-700 transition hover:bg-violet-100 shrink-0"
          >
            <FileSpreadsheet size={16} /> Import from Excel
          </button>
        </div>
      </section>

      <AttendanceTable employees={employees} records={records} setRecords={setRecords} filters={filters} saveRecords={saveRecords} />

      {showImport && (
        <ExcelImport
          employees={employees}
          records={records}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

