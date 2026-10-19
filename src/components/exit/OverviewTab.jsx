import { useState, useMemo } from "react";
import {
  FileText,
  UserCheck,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { calculateExitProgress } from "../../utils/exitInterviews";

export default function OverviewTab({ exitCase, onNavigateTab }) {
  const progressInfo = useMemo(() => calculateExitProgress(exitCase), [exitCase]);

  // Days until last working day
  const daysUntilLastDay = useMemo(() => {
    if (!exitCase.lastWorkingDay) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDay = new Date(exitCase.lastWorkingDay);
    lastDay.setHours(0, 0, 0, 0);
    const diffTime = lastDay.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [exitCase.lastWorkingDay]);

  const handoverCount = (exitCase.handoverItems || []).length;
  const verifiedHandover = (exitCase.handoverItems || []).filter(
    (i) => i.verificationStatus === "Verified"
  ).length;

  const totalClearances =
    (exitCase.clearance?.it || []).length +
    (exitCase.clearance?.asset || []).length +
    (exitCase.clearance?.finance || []).length +
    (exitCase.clearance?.hr || []).length;

  const completedClearances =
    (exitCase.clearance?.it || []).filter((c) => c.status === "Completed" || c.status === "Not Applicable").length +
    (exitCase.clearance?.asset || []).filter((c) => c.returnStatus === "Returned" || c.returnStatus === "Not Applicable").length +
    (exitCase.clearance?.finance || []).filter((c) => c.status === "Cleared" || c.status === "Not Applicable").length +
    (exitCase.clearance?.hr || []).filter((c) => c.status === "Cleared" || c.status === "Not Applicable").length;

  return (
    <div className="space-y-6">
      {/* Top 5 Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Handover Progress */}
        <div
          onClick={() => onNavigateTab("handover")}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-violet-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Handover Items</span>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
              {handoverCount > 0 ? `${Math.round((verifiedHandover / handoverCount) * 100)}%` : "0%"}
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {verifiedHandover} / {handoverCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Verified items
          </p>
        </div>

        {/* Clearance Progress */}
        <div
          onClick={() => onNavigateTab("clearance")}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-violet-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Clearance Items</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {totalClearances > 0 ? `${Math.round((completedClearances / totalClearances) * 100)}%` : "0%"}
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {completedClearances} / {totalClearances}
          </div>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Cleared across 4 depts
          </p>
        </div>

        {/* Exit Interview Status */}
        <div
          onClick={() => onNavigateTab("interview")}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-violet-300 hover:shadow-sm"
        >
          <div className="text-xs font-semibold text-slate-500">Exit Interview</div>
          <div className="mt-2 text-lg font-bold text-slate-900 truncate">
            {exitCase.exitInterview?.status === "Submitted" ? (
              <span className="text-emerald-700 flex items-center gap-1 text-base">
                <CheckCircle2 size={18} /> Completed
              </span>
            ) : exitCase.exitInterview?.status === "Draft" ? (
              <span className="text-amber-700 flex items-center gap-1 text-base">
                <Clock size={18} /> In Progress (Draft)
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1 text-base">
                <Clock size={18} /> Not Started
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {exitCase.exitInterview?.status === "Submitted"
              ? "Questionnaire locked"
              : "Questionnaire pending"}
          </p>
        </div>

        {/* Documents count */}
        <div
          onClick={() => onNavigateTab("documents")}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-violet-300 hover:shadow-sm"
        >
          <div className="text-xs font-semibold text-slate-500">Exit Documents</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {(exitCase.documents || []).length}
          </div>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <FileText size={13} className="text-slate-400" />
            Uploaded certificates & letters
          </p>
        </div>

        {/* Days Until Last Working Day */}
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 shadow-xs">
          <div className="text-xs font-semibold text-violet-800">Days Until Exit</div>
          <div className="mt-2 text-2xl font-black text-violet-950">
            {daysUntilLastDay !== null ? (
              daysUntilLastDay < 0 ? (
                <span className="text-rose-600 text-lg">Passed ({Math.abs(daysUntilLastDay)}d ago)</span>
              ) : daysUntilLastDay === 0 ? (
                <span className="text-amber-600 text-lg">Today is Last Day</span>
              ) : (
                `${daysUntilLastDay} Days`
              )
            ) : (
              "TBD"
            )}
          </div>
          <p className="mt-1 text-xs text-violet-700/80">
            Target: {exitCase.lastWorkingDay || "Not set"}
          </p>
        </div>
      </div>

      {/* Outstanding Actions Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle size={16} />
            </span>
            <h3 className="font-bold text-slate-900 text-sm">Outstanding Actions Required</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {progressInfo.outstandingActions.length} Actions
          </span>
        </div>

        {progressInfo.outstandingActions.length === 0 ? (
          <div className="flex items-center gap-2 py-3 text-sm text-emerald-700 font-semibold">
            <CheckCircle2 size={18} />
            <span>All action items completed. Ready for HR Final Offboarding Sign-off.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {progressInfo.outstandingActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 text-xs font-semibold text-slate-800"
              >
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <span>{action}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Grid: Exit & Employee & Manager Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Exit Information Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building2 size={15} />
            Exit Case Information
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Exit Type:</span>
              <span className="font-bold text-slate-800 text-sm">{exitCase.exitType}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Exit Reason:</span>
              <span className="font-bold text-slate-800 text-sm">{exitCase.exitReason || "Not specified"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Notice Given Date:</span>
              <span className="font-semibold text-slate-700">{exitCase.resignationDate || "Not provided"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Last Working Day:</span>
              <span className="font-semibold text-slate-700">{exitCase.lastWorkingDay || "Not set"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Notice Period:</span>
              <span className="font-semibold text-slate-700">{exitCase.noticePeriod || "30 Days"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Case Created:</span>
              <span className="font-semibold text-slate-700">
                {exitCase.createdAt ? new Date(exitCase.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>

          {exitCase.hrNotes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-slate-400 block font-medium text-xs mb-1">HR Confidential Notes:</span>
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed font-medium">
                {exitCase.hrNotes}
              </p>
            </div>
          )}
        </div>

        {/* Employee & Manager Information Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <UserCheck size={15} />
            Employee & Reporting Line
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Employee Name:</span>
              <span className="font-bold text-slate-800 text-sm">{exitCase.employeeName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Employee ID:</span>
              <span className="font-bold text-slate-800 text-sm">{exitCase.employeeId}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Department:</span>
              <span className="font-semibold text-slate-700">{exitCase.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Designation:</span>
              <span className="font-semibold text-slate-700">{exitCase.designation}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Reporting Manager:</span>
              <span className="font-semibold text-slate-700">{exitCase.manager || "Branch Manager"}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Company Joining Date:</span>
              <span className="font-semibold text-slate-700">{exitCase.joiningDate || "Not provided"}</span>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-violet-900">Direct Manager Handover Review</p>
                <p className="text-[11px] text-violet-700 mt-0.5">
                  Manager Status: <span className="font-bold uppercase">{exitCase.managerApproval?.status || "Pending"}</span>
                </p>
              </div>
              <button
                onClick={() => onNavigateTab("handover")}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-violet-700 shadow-xs hover:bg-violet-100/50 transition border border-violet-200"
              >
                Review Handover <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
