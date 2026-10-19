import { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  ArrowRight
} from "lucide-react";
import {
  calculateExitProgress,
  completeOffboarding
} from "../../utils/exitInterviews";

export default function FinalReviewTab({ exitCase, onUpdateCase, currentUser }) {
  const [hrNotes, setHrNotes] = useState(exitCase.finalReview?.finalComments || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const progress = useMemo(() => calculateExitProgress(exitCase), [exitCase]);
  const isAlreadyCompleted = exitCase.status === "Completed" || exitCase.currentStage === "Completed";

  const checklistItems = [
    {
      label: "Knowledge Handover Verified",
      passed: progress.summaryCounts.totalHandover > 0 && progress.summaryCounts.pendingHandover === 0,
      details: `${progress.summaryCounts.verifiedHandover} of ${progress.summaryCounts.totalHandover} items verified`
    },
    {
      label: "Manager Approval Complete",
      passed: exitCase.managerApproval?.status === "Approved",
      details: `Manager status: ${exitCase.managerApproval?.status || "Pending"}`
    },
    {
      label: "IT Clearance Complete",
      passed: progress.summaryCounts.itPending === 0,
      details: `${progress.summaryCounts.itPending} items pending`
    },
    {
      label: "Asset Clearance Complete",
      passed: progress.summaryCounts.assetPending === 0,
      details: `${progress.summaryCounts.assetPending} items pending return`
    },
    {
      label: "Finance Clearance Complete",
      passed: progress.summaryCounts.financePending === 0,
      details: `${progress.summaryCounts.financePending} items pending settlement`
    },
    {
      label: "HR Clearance Complete",
      passed: progress.summaryCounts.hrPending === 0,
      details: `${progress.summaryCounts.hrPending} items pending`
    },
    {
      label: "Exit Interview Completed",
      passed: progress.summaryCounts.interviewStatus === "Submitted",
      details: `Status: ${progress.summaryCounts.interviewStatus}`
    },
    {
      label: "Required Documents Prepared",
      passed: (exitCase.documents || []).length > 0,
      details: `${(exitCase.documents || []).length} documents on file`
    }
  ];

  const canComplete = checklistItems.every((item) => item.passed) && !isAlreadyCompleted;

  const handleCompleteOffboarding = () => {
    setError("");
    if (!canComplete) {
      setError("Cannot complete offboarding while mandatory requirements or clearances are outstanding.");
      return;
    }

    if (!window.confirm("Confirm final offboarding completion? This will update the employee's employment status to 'Former Employee / Inactive' and lock the exit case as Completed.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = completeOffboarding(exitCase.id, hrNotes, currentUser);
      onUpdateCase(updated);
      setSuccess("Offboarding formally completed! Staff profile status updated to Former Employee / Inactive.");
    } catch (err) {
      setError(err.message || "Failed to complete offboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-2">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Final HR Review & Offboarding Sign-Off</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit all handover verifications, department clearances, asset returns, and legal settlements before closing employment.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          <ShieldCheck size={14} className="text-violet-600" />
          <span>Governance Checkpoint</span>
        </div>
      </div>

      {/* Completion Banner if already done */}
      {isAlreadyCompleted && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <h4 className="font-bold text-emerald-950 text-base">Offboarding Formally Completed</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Closed by {exitCase.finalReview?.completedBy || "HR"} on{" "}
                {exitCase.finalReview?.completedAt ? new Date(exitCase.finalReview.completedAt).toLocaleDateString() : "Recent"}.
                Staff profile employment status set to <strong>Former Employee / Inactive</strong>. Historical records are preserved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error or Blockers notification */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {!isAlreadyCompleted && progress.blockers.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Cannot Complete Offboarding</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                There are {progress.blockers.length} outstanding mandatory requirement(s) that must be cleared first:
              </p>
              <ul className="mt-2.5 space-y-1.5 text-xs font-semibold text-rose-800">
                {progress.blockers.map((b, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm">Prerequisites & Clearance Checklist</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checklistItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                item.passed
                  ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                  : "border-slate-200 bg-slate-50/60 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.passed ? (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-amber-500 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{item.details}</span>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  item.passed
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {item.passed ? "Passed" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* HR Sign-Off Notes and Action */}
      {!isAlreadyCompleted && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">HR Final Sign-Off & Closing Notes</h4>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              HR Offboarding Verification Notes
            </label>
            <textarea
              rows={3}
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              placeholder="Confirm that all exit clearances, employee dues, experience letters, and non-disclosure obligations are finalized..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-100 gap-3">
            <div className="text-xs text-slate-500 font-medium">
              Action updates employment status from <strong className="text-slate-700">Active</strong> to{" "}
              <strong className="text-slate-700">Former Employee / Inactive</strong>.
            </div>

            <button
              type="button"
              disabled={!canComplete || isSubmitting}
              onClick={handleCompleteOffboarding}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition ${
                canComplete
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? "Finalizing Offboarding..." : "Complete Offboarding"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
