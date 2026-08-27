import { Fragment } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { daysInMonth, getCellEntries, positionTone, requirementFor, rosterCellKey, SHIFT_OPTIONS } from "../../utils/roster";

const ROSTER_COLUMN_WIDTHS = {
  branch: 112,
  position: 240,
  day: 140,
};

function staffingTone(required, assigned) {
  if (!required) return "bg-slate-100 text-slate-500 hover:bg-slate-200";
  if (assigned < required) return "bg-rose-50 text-rose-700 hover:bg-rose-100";
  if (assigned > required) return "bg-orange-50 text-orange-700 hover:bg-orange-100";
  return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
}

function staffingLabel(required, assigned) {
  if (!required) return "-";
  if (assigned < required) return `Need ${required - assigned}`;
  if (assigned > required) return `+${assigned - required}`;
  return "OK";
}

export default function RosterTable({ month, branches, positions, roster, requirements, collapsed, toggleCollapsed, onCellClick, weekFilter = "all" }) {
  let days = daysInMonth(month);
  if (weekFilter === "1") days = days.slice(0, 7);
  else if (weekFilter === "2") days = days.slice(7, 14);
  else if (weekFilter === "3") days = days.slice(14, 21);
  else if (weekFilter === "4") days = days.slice(21, 28);
  else if (weekFilter === "5") days = days.slice(28);

  const departments = ["Kitchen Staff", "Management Staff"];
  const tableWidth = ROSTER_COLUMN_WIDTHS.branch + ROSTER_COLUMN_WIDTHS.position + (days.length * ROSTER_COLUMN_WIDTHS.day);

  return (
    <section id="staff-roster-print" className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-auto max-h-[80vh]">
        <table className="min-w-max table-fixed border-separate border-spacing-0 text-sm" style={{ width: tableWidth }}>
          <colgroup>
            <col style={{ width: ROSTER_COLUMN_WIDTHS.branch }} />
            <col style={{ width: ROSTER_COLUMN_WIDTHS.position }} />
            {days.map((day) => <col key={day.date} style={{ width: ROSTER_COLUMN_WIDTHS.day }} />)}
          </colgroup>
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 z-40 border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 shadow-sm">Branch</th>
              <th className="sticky z-40 border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 shadow-sm" style={{ left: ROSTER_COLUMN_WIDTHS.branch }}>Position</th>
              {days.map((day) => (
                <th key={day.date} className={`border-b border-r border-slate-200 px-2 py-2 text-center shadow-sm ${day.isToday ? "bg-violet-100" : day.isWeekend ? "bg-slate-200" : "bg-slate-50"}`}>
                  <p className="text-[11px] font-black text-slate-900">{day.label}</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase text-slate-500">{day.day}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              departments.map((department, departmentIndex) => {
                const sectionKey = `${branch}-${department}`;
                const sectionPositions = positions.filter((row) => row.department === department);
                if (!sectionPositions.length) return null;
                const isCollapsed = collapsed.has(sectionKey);
                return (
                  <Fragment key={sectionKey}>
                    <tr>
                      <td colSpan={days.length + 2} className={`border-b border-slate-200 px-3 py-2 ${departmentIndex === 0 ? "bg-slate-900 text-white" : "bg-orange-50 text-orange-950"}`}>
                        <button type="button" onClick={() => toggleCollapsed(sectionKey)} className="flex w-full items-center gap-2 text-left text-xs font-black">
                          <ChevronDown size={14} className={`transition ${isCollapsed ? "-rotate-90" : ""}`} />
                          {branch} / {department}
                        </button>
                      </td>
                    </tr>
                    {!isCollapsed && sectionPositions.flatMap(({ position }) => SHIFT_OPTIONS.map((shift) => (
                      <tr key={`${sectionKey}-${position}-${shift}`} className="hover:bg-slate-50/50">
                        <td className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white px-3 py-2 align-middle text-xs font-black text-slate-900">{branch}</td>
                        <td className="sticky z-20 border-b border-r border-slate-200 bg-white p-1.5 align-middle" style={{ left: ROSTER_COLUMN_WIDTHS.branch }}>
                          <div className={`flex h-full flex-col justify-center rounded border px-2 py-1.5 ${positionTone(position, department)}`}>
                            <p className="text-[11px] font-black leading-tight">{position}</p>
                            <p className="mt-0.5 text-[9px] font-bold">{shift === "Morning" ? "Morning (9:30-5:00)" : "Evening (4:40PM-12:00AM)"}</p>
                          </div>
                        </td>
                        {days.map((day) => {
                          const key = rosterCellKey({ month, branch, department, position, shift, date: day.date });
                          const entries = getCellEntries(roster, key);
                          const workingCount = entries.filter((entry) => entry.status === "Working").length;
                          const required = requirementFor(requirements, branch, shift, position);
                          return (
                          <td key={key} className={`border-b border-r border-slate-200 p-1 align-middle ${day.isToday ? "bg-violet-50/40" : day.isWeekend ? "bg-slate-50" : "bg-white"}`}>
                              <button
                                type="button"
                                onClick={() => onCellClick({ branch, department, position, shift, date: day.date })}
                                className={`group relative flex h-auto min-h-10 w-full flex-col items-start justify-start rounded border border-transparent p-1.5 pr-6 transition-all ${staffingTone(required, workingCount)}`}
                                title="Assign employee"
                              >
                                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded bg-white/75 text-current shadow-sm ring-1 ring-black/5 transition group-hover:bg-white">
                                  <Plus size={10} strokeWidth={3} />
                                </span>
                                <span className="text-[11px] font-black">{workingCount} / {required || 0}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{staffingLabel(required, workingCount)}</span>
                                {entries.filter((e) => e.status === "Working" && e.employeeName).map((e) => (
                                  <span key={e.id} className="mt-0.5 block w-full truncate text-[9px] font-semibold leading-tight opacity-90">{e.employeeName}</span>
                                ))}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    )))}
                  </Fragment>
                );
              })
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
