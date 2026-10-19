import { useState } from "react";
import {
  FileText,
  Star,
  CheckCircle2,
  Lock,
  Save,
  Send,
  AlertCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";
import {
  EXIT_REASONS,
  SATISFACTION_CATEGORIES,
  logExitActivity,
  saveExitCase
} from "../../utils/exitInterviews";

export default function ExitInterviewTab({ exitCase, onUpdateCase, currentUser }) {
  const currentUserName = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || "HR Staff";

  const interview = exitCase.exitInterview || {
    status: "Not Started",
    primaryReason: exitCase.exitReason || "Career Growth",
    reasonExplanation: "",
    ratings: {},
    feedback: {}
  };

  const isLocked = interview.status === "Submitted";

  // Form State
  const [primaryReason, setPrimaryReason] = useState(interview.primaryReason || exitCase.exitReason || "Career Growth");
  const [reasonExplanation, setReasonExplanation] = useState(interview.reasonExplanation || "");
  const [ratings, setRatings] = useState(interview.ratings || {});
  const [feedback, setFeedback] = useState(interview.feedback || {});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [formError, setFormError] = useState("");

  const handleRatingChange = (categoryId, rating) => {
    if (isLocked) return;
    setRatings((prev) => ({ ...prev, [categoryId]: rating }));
  };

  const handleFeedbackChange = (questionKey, value) => {
    if (isLocked) return;
    setFeedback((prev) => ({ ...prev, [questionKey]: value }));
  };

  // Save Draft
  const handleSaveDraft = (e) => {
    if (e) e.preventDefault();
    setSaveSuccessMsg("");
    setFormError("");

    const updatedInterview = {
      ...interview,
      status: "Draft",
      primaryReason,
      reasonExplanation,
      ratings,
      feedback
    };

    const updatedCase = {
      ...exitCase,
      exitInterview: updatedInterview
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, "Exit Interview draft saved", currentUserName);
    onUpdateCase(updatedCase);
    setSaveSuccessMsg("Draft saved successfully.");
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  // Submit Interview (Locks form)
  const handleSubmitInterview = (e) => {
    if (e) e.preventDefault();
    setSaveSuccessMsg("");
    setFormError("");

    // Validate ratings completed
    const unrated = SATISFACTION_CATEGORIES.filter((cat) => !ratings[cat.id]);
    if (unrated.length > 0) {
      setFormError(`Please provide 1-5 ratings for all categories (${unrated.length} category ratings remaining).`);
      return;
    }

    if (!window.confirm("Are you sure you want to submit the Exit Interview? Once submitted, the questionnaire is locked for confidentiality and audit compliance.")) {
      return;
    }

    const now = new Date().toISOString();
    const updatedInterview = {
      ...interview,
      status: "Submitted",
      submittedAt: now,
      submittedBy: currentUserName,
      primaryReason,
      reasonExplanation,
      ratings,
      feedback
    };

    // Update HR clearance item 6 automatically: Exit interview completed
    const updatedHrClearance = (exitCase.clearance?.hr || []).map((h) => {
      if (h.item.toLowerCase().includes("exit interview")) {
        return {
          ...h,
          status: "Cleared",
          clearedBy: currentUserName,
          clearedAt: now,
          remarks: "Exit interview submitted and verified"
        };
      }
      return h;
    });

    const updatedCase = {
      ...exitCase,
      exitInterview: updatedInterview,
      clearance: {
        ...(exitCase.clearance || {}),
        hr: updatedHrClearance
      }
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, "Exit Interview questionnaire submitted and locked", currentUserName);
    onUpdateCase(updatedCase);
    setSaveSuccessMsg("Exit interview submitted and locked.");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm ${
              isLocked ? "bg-emerald-600" : "bg-violet-600"
            }`}
          >
            {isLocked ? <Lock size={20} /> : <FileText size={20} />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Structured Exit Interview</h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase ${
                  interview.status === "Submitted"
                    ? "bg-emerald-100 text-emerald-800"
                    : interview.status === "Draft"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {interview.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isLocked
                ? `Submitted by ${interview.submittedBy || "Employee"} on ${new Date(interview.submittedAt).toLocaleDateString()}. Responses are protected against casual modification.`
                : "Gather candid employee feedback, work satisfaction ratings, and institutional insights."}
            </p>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={15} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {formError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* SECTION 1: REASON FOR LEAVING */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-violet-700">Section 1</span>
          <h4 className="text-base font-bold text-slate-900">Reason for Leaving</h4>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Primary Reason for Departure *
            </label>
            <select
              disabled={isLocked}
              value={primaryReason}
              onChange={(e) => setPrimaryReason(e.target.value)}
              className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            >
              {EXIT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Additional Details & Circumstances (Optional)
            </label>
            <textarea
              disabled={isLocked}
              rows={3}
              value={reasonExplanation}
              onChange={(e) => setReasonExplanation(e.target.value)}
              placeholder="Provide background, context, or key factors regarding this departure..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: EMPLOYEE EXPERIENCE RATINGS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-violet-700">Section 2</span>
            <h4 className="text-base font-bold text-slate-900">Employee Experience Ratings (1–5 Scale)</h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>1 = Very Dissatisfied</span>
            <span>•</span>
            <span>5 = Very Satisfied</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SATISFACTION_CATEGORIES.map((cat) => {
            const currentRating = ratings[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
              >
                <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleRatingChange(cat.id, star)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                        currentRating >= star
                          ? "bg-amber-400 text-white shadow-xs"
                          : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-100"
                      } disabled:cursor-not-allowed`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: IN-DEPTH FEEDBACK QUESTIONS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-violet-700">Section 3</span>
          <h4 className="text-base font-bold text-slate-900">Detailed Institutional Feedback</h4>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              1. What did you enjoy most about working here?
            </label>
            <textarea
              disabled={isLocked}
              rows={2}
              value={feedback.enjoyedMost || ""}
              onChange={(e) => handleFeedbackChange("enjoyedMost", e.target.value)}
              placeholder="e.g. Team camaraderie, culinary standard, helpful management..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              2. What could the company improve?
            </label>
            <textarea
              disabled={isLocked}
              rows={2}
              value={feedback.couldImprove || ""}
              onChange={(e) => handleFeedbackChange("couldImprove", e.target.value)}
              placeholder="e.g. Equipment upgrades, shift flexibility, communication..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              3. Did you have the tools and resources needed to perform your job effectively?
            </label>
            <textarea
              disabled={isLocked}
              rows={2}
              value={feedback.toolsAndResources || ""}
              onChange={(e) => handleFeedbackChange("toolsAndResources", e.target.value)}
              placeholder="Describe access to systems, ingredients, POS equipment..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              4. How would you describe your relationship with your manager?
            </label>
            <textarea
              disabled={isLocked}
              rows={2}
              value={feedback.relationshipWithManager || ""}
              onChange={(e) => handleFeedbackChange("relationshipWithManager", e.target.value)}
              placeholder="e.g. Collaborative, responsive, supportive..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              5. What influenced your decision to leave?
            </label>
            <textarea
              disabled={isLocked}
              rows={2}
              value={feedback.decisionFactors || ""}
              onChange={(e) => handleFeedbackChange("decisionFactors", e.target.value)}
              placeholder="Key trigger factors..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              6. What could have encouraged you to stay?
            </label>
            <textarea
              disabled={isLocked}
              rows={2}
              value={feedback.encouragedToStay || ""}
              onChange={(e) => handleFeedbackChange("encouragedToStay", e.target.value)}
              placeholder="e.g. Higher compensation, promotion pathway, different schedule..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Recommend Company as Workplace?
              </label>
              <select
                disabled={isLocked}
                value={feedback.recommendCompany || "Yes"}
                onChange={(e) => handleFeedbackChange("recommendCompany", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50"
              >
                <option value="Yes, definitely">Yes, definitely</option>
                <option value="Yes, with reservations">Yes, with reservations</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Consider Working Here Again?
              </label>
              <select
                disabled={isLocked}
                value={feedback.considerWorkingAgain || "Yes"}
                onChange={(e) => handleFeedbackChange("considerWorkingAgain", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50"
              >
                <option value="Yes">Yes</option>
                <option value="Maybe in the future">Maybe in the future</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Rehire Interest *
              </label>
              <select
                disabled={isLocked}
                value={feedback.rehireInterest || "Yes"}
                onChange={(e) => handleFeedbackChange("rehireInterest", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50"
              >
                <option value="Yes">Yes (Eligible for Rehire)</option>
                <option value="Maybe">Maybe</option>
                <option value="No">No (Ineligible for Rehire)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Additional Confidential Comments for HR
            </label>
            <textarea
              disabled={isLocked}
              rows={2}
              value={feedback.confidentialComments || ""}
              onChange={(e) => handleFeedbackChange("confidentialComments", e.target.value)}
              placeholder="Any other confidential feedback..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        {!isLocked && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <Save size={15} />
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleSubmitInterview}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
            >
              <Send size={15} />
              Submit Exit Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
