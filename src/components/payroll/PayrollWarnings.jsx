import { useState } from "react";
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, UserX, Wallet } from "lucide-react";

export default function PayrollWarnings({ warnings }) {
  const [expanded, setExpanded] = useState(false);
  if (!warnings?.length) return null;

  // Group warnings into categorized items
  const categorized = warnings.map((text, idx) => {
    let category = "General";
    let icon = AlertTriangle;
    let tone = "amber";

    if (text.includes("no salary configuration")) {
      category = "Missing Salary";
      icon = Wallet;
      tone = "rose";
    } else if (text.includes("insurance")) {
      category = "Insurance Setup";
      icon = ShieldAlert;
      tone = "blue";
    } else if (text.includes("check-in") || text.includes("check-out")) {
      category = "Attendance Gap";
      icon = AlertCircle;
      tone = "amber";
    } else if (text.includes("not approved")) {
      category = "Slip Approval";
      icon = AlertTriangle;
      tone = "orange";
    }

    return { id: idx, text, category, icon, tone };
  });

  const displayed = expanded ? categorized : categorized.slice(0, 4);

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/70 to-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/70 px-5 py-3.5 bg-amber-100/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
            <ShieldAlert size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
              Payroll Issues & Compliance Notices ({warnings.length})
            </h3>
            <p className="text-[11px] font-semibold text-amber-800/80">
              Items requiring attention before approving final salary disbursements
            </p>
          </div>
        </div>

        {warnings.length > 4 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-black text-amber-900 shadow-2xs hover:bg-amber-50 transition cursor-pointer"
          >
            <span>{expanded ? "Show Less" : `View All (${warnings.length})`}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <div className="grid gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayed.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-amber-200/70 bg-white p-3 shadow-2xs transition hover:border-amber-400"
            >
              <div className="min-w-0 flex-1">
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                  item.tone === "rose" 
                    ? "bg-rose-50 text-rose-700 border border-rose-200" 
                    : item.tone === "blue"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}>
                  <Icon size={10} /> {item.category}
                </span>
                <p className="mt-2 text-xs font-bold leading-relaxed text-slate-800">
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
