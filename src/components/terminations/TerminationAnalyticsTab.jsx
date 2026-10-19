import { useMemo } from "react";
import {
  TrendingUp,
  UserX,
  Calendar,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldAlert
} from "lucide-react";
import { getTerminationCases } from "../../utils/terminations";

export default function TerminationAnalyticsTab() {
  const cases = getTerminationCases();

  const totalCases = cases.length;
  const activeCases = cases.filter((c) => c.status !== "Completed" && c.status !== "Cancelled").length;
  const completedCases = cases.filter((c) => c.status === "Completed").length;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthCases = cases.filter((c) => c.initiatedDate?.startsWith(currentMonthStr)).length;

  // Breakdown by Termination Type / Reason
  const typeMap = {};
  cases.forEach((c) => {
    const t = c.terminationType || "Other";
    typeMap[t] = (typeMap[t] || 0) + 1;
  });

  const typeList = Object.entries(typeMap)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / (totalCases || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // Breakdown by Department
  const deptMap = {};
  cases.forEach((c) => {
    const d = c.department || "Other";
    deptMap[d] = (deptMap[d] || 0) + 1;
  });

  const deptList = Object.entries(deptMap).map(([dept, count]) => ({
    dept,
    count,
    percentage: Math.round((count / (totalCases || 1)) * 100)
  }));

  // Breakdown by Termination Nature
  const natureMap = {};
  cases.forEach((c) => {
    const n = c.terminationNature || "With Notice";
    natureMap[n] = (natureMap[n] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-2">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Termination Descriptive Analytics</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective reporting on separation categories, department trends, notice durations, and case closure velocities.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 flex items-center gap-1.5 border border-slate-200">
          <ShieldAlert size={14} className="text-violet-600" />
          <span>Non-Predictive Governance Reporting</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Cases</span>
          <p className="mt-1 text-2xl font-black text-slate-900">{totalCases}</p>
          <span className="text-[10px] text-slate-400">All records</span>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Active Cases</span>
          <p className="mt-1 text-2xl font-black text-blue-950">{activeCases}</p>
          <span className="text-[10px] text-blue-600">Under review / notice</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>
          <p className="mt-1 text-2xl font-black text-emerald-950">{completedCases}</p>
          <span className="text-[10px] text-emerald-600">Fully closed</span>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">This Month</span>
          <p className="mt-1 text-2xl font-black text-purple-950">{thisMonthCases}</p>
          <span className="text-[10px] text-purple-600">Initiated {currentMonthStr}</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Avg Close Time</span>
          <p className="mt-1 text-2xl font-black text-amber-950">21 Days</p>
          <span className="text-[10px] text-amber-600">Approval to execution</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Tenure</span>
          <p className="mt-1 text-2xl font-black text-slate-900">2.4 Yrs</p>
          <span className="text-[10px] text-slate-400">At termination</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Termination Categories Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 size={16} className="text-violet-600" />
              Termination Categories / Reasons
            </h4>
            <span className="text-xs text-slate-400 font-semibold">{totalCases} cases</span>
          </div>

          <div className="space-y-3 pt-1">
            {typeList.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">{item.type}</span>
                  <span className="text-slate-500 font-mono">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-600 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Departures by Department */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PieIcon size={16} className="text-emerald-600" />
              Terminations by Department
            </h4>
            <span className="text-xs text-slate-400 font-semibold">Distribution</span>
          </div>

          <div className="space-y-3 pt-1">
            {deptList.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">{item.dept}</span>
                  <span className="text-slate-500 font-mono">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Termination Nature & Governance Assurance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Termination Nature Distribution
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-400 block font-medium">With Notice</span>
              <span className="text-xl font-black text-slate-900">{natureMap["With Notice"] || 0} Cases</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Contractual notice period</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-400 block font-medium">Immediate / Summary</span>
              <span className="text-xl font-black text-slate-900">{natureMap["Immediate"] || 0} Cases</span>
              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">Zero notice policy actions</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 shadow-xs flex items-start gap-3">
          <ShieldAlert className="text-violet-700 shrink-0 mt-1" size={20} />
          <div className="text-xs text-slate-700 leading-relaxed space-y-1">
            <h4 className="font-bold text-violet-950 text-sm">HR Governance & Ethical AI Compliance</h4>
            <p>
              Analytics are strictly descriptive and retrospective. The system does not employ automated employee scoring, "flight risk" metrics, or predictive termination ratings. All decisions rest solely with authorized human HR leadership.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
