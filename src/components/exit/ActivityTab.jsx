import {
  Clock,
  CheckCircle2,
  User,
  ShieldCheck,
  Calendar,
  Activity as ActivityIcon
} from "lucide-react";

export default function ActivityTab({ exitCase }) {
  const activities = exitCase.activity || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-2">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Activity & Audit Timeline</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological audit trail recording all stage transitions, handovers, approvals, asset returns, and sign-offs.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          <ShieldCheck size={14} className="text-violet-600" />
          <span>Audit Log Protected</span>
        </div>
      </div>

      {/* Timeline List */}
      {activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ActivityIcon className="mx-auto h-10 w-10 text-slate-300" />
          <h4 className="mt-2 text-sm font-bold text-slate-700">No activity logged yet.</h4>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-4">
              <span className="absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white ring-4 ring-white">
                <CheckCircle2 size={12} />
              </span>

              <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">{act.action}</h4>
                  <div className="flex items-center gap-2 text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {act.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {act.time}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <User size={13} className="text-violet-600" />
                  <span>
                    Action performed by: <strong className="text-slate-800">{act.performedBy}</strong>
                  </span>
                </div>

                {act.details && (
                  <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 leading-relaxed font-normal border border-slate-100">
                    {act.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
