import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserX,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  ShieldCheck,
  Activity as ActivityIcon,
  ChevronRight,
  TrendingUp,
  Download,
  Printer,
  ExternalLink,
  Layers,
  MessageSquare,
  FileCheck2,
  Lock,
  RotateCcw,
  Plus
} from "lucide-react";
import {
  getTerminationCaseById,
  saveTerminationCase,
  executeTermination,
  linkOrCreateOffboardingCase,
  logTerminationActivity
} from "../utils/terminations";
import { getExitCaseById } from "../utils/exitInterviews";
import useAuth from "../auth/useAuth";
import TerminationDocumentsTab from "../components/terminations/TerminationDocumentsTab";
import { exportToPDF, printDocument } from "../utils/pdfGenerator";

export default function TerminationCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [termCase, setTermCase] = useState(() => getTerminationCaseById(id));
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "details", "supporting", "approvals", "meeting", "letter", "offboarding", "documents", "activity"
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const handleReload = () => setTermCase(getTerminationCaseById(id));
    window.addEventListener("terminationsChanged", handleReload);
    return () => window.removeEventListener("terminationsChanged", handleReload);
  }, [id]);

  if (!termCase) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h3 className="mt-3 text-lg font-bold text-slate-800">Termination Case Not Found</h3>
        <p className="mt-1 text-xs text-slate-500">The requested record ({id}) could not be found.</p>
        <button
          onClick={() => navigate("/terminations")}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
        >
          <ArrowLeft size={14} /> Back to Terminations Dashboard
        </button>
      </div>
    );
  }

  const currentUserName = user?.user_metadata?.full_name || "HR Staff";

  const allApproved = (termCase.approvals || []).every((a) => a.status === "Approved");
  const anyRejected = (termCase.approvals || []).some((a) => a.status === "Rejected");

  // Workflow stages
  const workflowStages = [
    { name: "Case Created", key: "Case Created" },
    { name: "HR Review", key: "HR Review" },
    { name: "Approval", key: "Approval" },
    { name: "Employee Notification", key: "Employee Notification" },
    { name: "Termination Effective", key: "Termination Effective" },
    { name: "Offboarding", key: "Offboarding" },
    { name: "Completed", key: "Completed" }
  ];

  const getStageStatus = (stageKey) => {
    if (termCase.status === "Completed") return "Completed";
    if (termCase.status === "Cancelled" || anyRejected) {
      if (stageKey === "Approval" && anyRejected) return "Rejected / Blocked";
    }

    const order = ["Case Created", "HR Review", "Approval", "Employee Notification", "Termination Effective", "Offboarding", "Completed"];
    const currentIndex = order.indexOf(termCase.currentStage || "Case Created");
    const stageIndex = order.indexOf(stageKey);

    if (stageIndex < currentIndex) return "Completed";
    if (stageIndex === currentIndex) return "Current";
    return "Pending";
  };

  // HR Review Handlers
  const handleHrReviewDecision = (decision) => {
    setActionError("");
    setActionMsg("");

    const comments = window.prompt(`Enter HR review commentary for decision '${decision}':`);
    if (comments === null) return;

    let nextStatus = "Under HR Review";
    let nextStage = "HR Review";

    if (decision === "Approved") {
      nextStatus = "Awaiting Approval";
      nextStage = "Approval";
    } else if (decision === "On Hold") {
      nextStatus = "Draft";
    } else if (decision === "Cancelled") {
      nextStatus = "Cancelled";
    }

    const updated = {
      ...termCase,
      status: nextStatus,
      currentStage: nextStage,
      hrReview: {
        ...(termCase.hrReview || {}),
        status: decision,
        reviewerName: currentUserName,
        reviewedAt: new Date().toISOString(),
        comments
      }
    };

    saveTerminationCase(updated);
    logTerminationActivity(termCase.id, `HR Review decision: ${decision}`, currentUserName, comments);
    setTermCase(updated);
    setActionMsg(`HR review updated to '${decision}'.`);
  };

  // Approval Handlers
  const handleApprovalDecision = (apprId, decision) => {
    setActionError("");
    setActionMsg("");

    const comment = window.prompt(`Enter approval comments for status '${decision}':`);
    if (comment === null) return;
    if (decision === "Rejected" && !comment.trim()) {
      alert("A rejection reason is required.");
      return;
    }

    const updatedApprovals = (termCase.approvals || []).map((a) => {
      if (a.id === apprId) {
        return {
          ...a,
          status: decision,
          decisionDate: new Date().toISOString(),
          comment
        };
      }
      return a;
    });

    const isNowAllApproved = updatedApprovals.every((a) => a.status === "Approved");
    const hasRejection = updatedApprovals.some((a) => a.status === "Rejected");

    let nextStatus = termCase.status;
    let nextStage = termCase.currentStage;

    if (hasRejection) {
      nextStatus = "Rejected";
    } else if (isNowAllApproved) {
      nextStatus = "Approved";
      nextStage = "Employee Notification";
    }

    const updated = {
      ...termCase,
      approvals: updatedApprovals,
      status: nextStatus,
      currentStage: nextStage
    };

    saveTerminationCase(updated);
    logTerminationActivity(termCase.id, `Approval decision by ${currentUserName}: ${decision}`, currentUserName, comment);
    setTermCase(updated);
    setActionMsg(`Approval marked as ${decision}.`);
  };

  // Execute Termination
  const handleExecute = () => {
    setActionError("");
    setActionMsg("");

    if (!window.confirm("Execute formal termination? This updates the employee's status and automatically generates the linked Offboarding Case.")) {
      return;
    }

    try {
      const updated = executeTermination(termCase.id, user);
      setTermCase(updated);
      setActionMsg("Termination executed successfully and Offboarding Case created!");
    } catch (err) {
      setActionError(err.message || "Failed to execute termination.");
    }
  };

  // Automatic Offboarding connector
  const handleConnectOffboarding = () => {
    try {
      const exitCase = linkOrCreateOffboardingCase(termCase, user);
      setTermCase(getTerminationCaseById(termCase.id));
      navigate(`/exit-interviews/${exitCase.id}`);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleExportPDF = () => {
    exportToPDF("termination-case-container", `Termination_Case_${termCase.id}_${termCase.employeeName.replace(/\s+/g, "_")}.pdf`);
  };

  const initials = termCase.employeeName
    ? termCase.employeeName
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join("")
    : "TM";

  return (
    <div id="termination-case-container" className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-3 no-print">
        <button
          onClick={() => navigate("/terminations")}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-violet-700 transition"
        >
          <ArrowLeft size={16} /> Back to Terminations Dashboard
        </button>

        <div className="flex items-center gap-2">
          {termCase.linkedExitCaseId && (
            <button
              onClick={() => navigate(`/exit-interviews/${termCase.linkedExitCaseId}`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-bold text-violet-700 shadow-xs hover:bg-violet-100 transition"
            >
              <ExternalLink size={13} />
              Open Linked Offboarding ({termCase.linkedExitCaseId})
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Download size={13} /> Export PDF
          </button>
          <button
            onClick={() => printDocument("termination-case-container")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* Messages */}
      {actionMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} /> <span>{actionMsg}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
          <AlertTriangle size={16} /> <span>{actionError}</span>
        </div>
      )}

      {/* Main Dossier Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-700 text-xl font-black text-white shadow-sm">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">{termCase.employeeName}</h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-600">
                  {termCase.employeeId}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                    termCase.status === "Approved" || termCase.status === "Termination Executed" || termCase.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : termCase.status === "Rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {termCase.status}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-600">
                {termCase.designation} • <span className="font-bold text-slate-800">{termCase.department}</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 pt-2 text-[11px] text-slate-500">
                <div>
                  <span className="text-slate-400">Termination Type: </span>
                  <span className="font-semibold text-slate-800">{termCase.terminationType}</span>
                </div>
                <div>
                  <span className="text-slate-400">Nature: </span>
                  <span className="font-semibold text-slate-800">{termCase.terminationNature}</span>
                </div>
                <div>
                  <span className="text-slate-400">Effective Date: </span>
                  <span className="font-bold text-slate-900">{termCase.effectiveDate}</span>
                </div>
                <div>
                  <span className="text-slate-400">Case Manager: </span>
                  <span className="font-semibold text-slate-700">{termCase.manager}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Decision / Execution Actions */}
          <div className="flex flex-col items-start lg:items-end justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 min-w-[200px] space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Action</span>
            {allApproved && termCase.status !== "Termination Executed" && termCase.status !== "Offboarding" && termCase.status !== "Completed" && (
              <button
                onClick={handleExecute}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
              >
                <UserX size={15} /> Execute Termination
              </button>
            )}

            {!termCase.linkedExitCaseId && (allApproved || termCase.status === "Termination Executed") && (
              <button
                onClick={handleConnectOffboarding}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
              >
                <ExternalLink size={14} /> Start Offboarding
              </button>
            )}

            {termCase.linkedExitCaseId && (
              <div className="text-xs text-right">
                <span className="text-slate-400 block font-medium">Offboarding Case:</span>
                <span className="font-bold text-violet-700">{termCase.linkedExitCaseId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Visual Workflow Steps */}
        <div className="mt-6 border-t border-slate-100 pt-5 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
            {workflowStages.map((stage, idx) => {
              const status = getStageStatus(stage.key);
              const isCompleted = status === "Completed";
              const isCurrent = status === "Current";
              const isRejected = status === "Rejected / Blocked";

              return (
                <div key={idx} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                        isCompleted
                          ? "bg-emerald-500 text-white shadow-xs"
                          : isCurrent
                          ? "bg-violet-600 text-white ring-4 ring-violet-100 shadow-xs"
                          : isRejected
                          ? "bg-rose-600 text-white"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span
                      className={`mt-2 text-[11px] font-bold line-clamp-1 max-w-[100px] ${
                        isCurrent
                          ? "text-violet-700"
                          : isCompleted
                          ? "text-slate-800"
                          : isRejected
                          ? "text-rose-600"
                          : "text-slate-400"
                      }`}
                    >
                      {stage.name}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase mt-0.5 ${
                        isCompleted
                          ? "text-emerald-600"
                          : isCurrent
                          ? "text-violet-600"
                          : isRejected
                          ? "text-rose-600"
                          : "text-slate-400"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  {idx < workflowStages.length - 1 && (
                    <div
                      className={`h-0.5 w-6 sm:w-10 shrink-0 ${
                        isCompleted ? "bg-emerald-400" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 no-print">
        {[
          { id: "overview", label: "Overview", icon: Building },
          { id: "details", label: "Case Details", icon: FileText },
          { id: "supporting", label: "Supporting Records", icon: ShieldCheck },
          { id: "approvals", label: "Approvals", icon: UserCheck },
          { id: "meeting", label: "Meeting & Notice", icon: MessageSquare },
          { id: "offboarding", label: "Offboarding Status", icon: Layers },
          { id: "documents", label: "Documents", icon: FileCheck2 },
          { id: "activity", label: "Activity Log", icon: ActivityIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition ${
                isActive
                  ? "border-violet-600 text-violet-700 bg-white rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Case Status</span>
              <p className="mt-1 text-sm font-black text-slate-900">{termCase.status}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Type</span>
              <p className="mt-1 text-sm font-black text-slate-900 truncate">{termCase.terminationType}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Effective Date</span>
              <p className="mt-1 text-sm font-black text-slate-900">{termCase.effectiveDate}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approvals</span>
              <p className="mt-1 text-sm font-black text-slate-900">
                {(termCase.approvals || []).filter((a) => a.status === "Approved").length} / {(termCase.approvals || []).length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notice Mode</span>
              <p className="mt-1 text-sm font-black text-slate-900">{termCase.terminationNature}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Offboarding</span>
              <p className="mt-1 text-sm font-black text-violet-700">
                {termCase.linkedExitCaseId ? "Linked" : "Not Started"}
              </p>
            </div>
          </div>

          {/* Primary Reason & Case Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Primary Termination Reason & Summary
            </h3>
            <p className="text-sm font-bold text-slate-900">{termCase.primaryReason}</p>
            {termCase.detailedReason && (
              <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                {termCase.detailedReason}
              </p>
            )}
          </div>

          {/* HR Review Decision Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">HR Review Verification</h4>
                <p className="text-xs text-slate-500">
                  Status: <strong>{termCase.hrReview?.status || "Pending"}</strong> • Verified by {termCase.hrReview?.reviewerName || "HR"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleHrReviewDecision("Approved")}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Approve for Approval Process
                </button>
                <button
                  onClick={() => handleHrReviewDecision("Changes Requested")}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Return for More Info
                </button>
                <button
                  onClick={() => handleHrReviewDecision("On Hold")}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 transition"
                >
                  Place On Hold
                </button>
              </div>
            </div>

            {termCase.hrReview?.comments && (
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 font-medium">
                <strong>HR Note:</strong> {termCase.hrReview.comments}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CASE DETAILS */}
      {activeTab === "details" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Termination Parameters & Contractual Milestones
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Initiation Date</span>
              <span className="font-bold text-slate-800 text-sm">{termCase.initiatedDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Effective Termination Date</span>
              <span className="font-bold text-slate-800 text-sm">{termCase.effectiveDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Proposed Last Working Day</span>
              <span className="font-bold text-slate-800 text-sm">{termCase.proposedLastWorkingDay || termCase.effectiveDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Notice Period</span>
              <span className="font-semibold text-slate-800">{termCase.noticePeriod}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Initiated By</span>
              <span className="font-semibold text-slate-800">{termCase.initiatedBy}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">HR Representative</span>
              <span className="font-semibold text-slate-800">{termCase.hrRepresentative}</span>
            </div>
          </div>

          {termCase.internalHrNotes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block mb-1">
                Restricted HR Case Notes (Confidential)
              </span>
              <p className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-800 font-medium border border-slate-100 leading-relaxed">
                {termCase.internalHrNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUPPORTING RECORDS */}
      {activeTab === "supporting" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Linked Supporting Evidence & System Records</h3>
              <p className="text-xs text-slate-500">
                Direct references to previous warnings, attendance audit logs, and performance improvement records.
              </p>
            </div>
            <button
              onClick={() => {
                const title = window.prompt("Enter record title:");
                if (!title) return;
                const newRec = {
                  id: `sup-${Date.now()}`,
                  type: "HR Observation",
                  title,
                  date: new Date().toISOString().slice(0, 10),
                  source: "HR System",
                  linkText: "View Record",
                  summary: "Referenced supporting document."
                };
                const updated = {
                  ...termCase,
                  supportingRecords: [...(termCase.supportingRecords || []), newRec]
                };
                saveTerminationCase(updated);
                setTermCase(updated);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
            >
              <Plus size={14} /> Link Supporting Record
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(termCase.supportingRecords || []).map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-md bg-violet-100 text-violet-800 px-2 py-0.5 font-bold text-[10px] uppercase">
                    {rec.type}
                  </span>
                  <span className="text-slate-400 font-semibold">{rec.date}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{rec.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{rec.summary}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400 text-[11px]">Source: {rec.source}</span>
                  <button
                    onClick={() => alert(`Opening linked system record: ${rec.title}`)}
                    className="text-violet-700 hover:underline flex items-center gap-1 font-bold"
                  >
                    {rec.linkText} <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: APPROVALS */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Required Management Approval Chain</h3>
            <p className="text-xs text-slate-500">
              All mandatory approvers must formally sign off before termination execution.
            </p>
          </div>

          <div className="space-y-3">
            {(termCase.approvals || []).map((appr) => (
              <div
                key={appr.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{appr.role}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        appr.status === "Approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : appr.status === "Rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {appr.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Designated Signee: <strong className="text-slate-700">{appr.approverName}</strong>
                    {appr.decisionDate && ` • Decided on ${new Date(appr.decisionDate).toLocaleDateString()}`}
                  </p>
                  {appr.comment && (
                    <p className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{appr.comment}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprovalDecision(appr.id, "Approved")}
                    className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprovalDecision(appr.id, "Rejected")}
                    className="rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MEETING & NOTICE */}
      {activeTab === "meeting" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Termination Notification Meeting</h4>
                <p className="text-xs text-slate-500">Schedule hearing and record delivery of termination decision.</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                  termCase.meeting?.status === "Completed"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {termCase.meeting?.status || "Not Scheduled"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Meeting Date</span>
                <span className="font-bold text-slate-800">{termCase.meeting?.meetingDate || "Pending"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Meeting Time</span>
                <span className="font-bold text-slate-800">{termCase.meeting?.meetingTime || "Pending"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Location</span>
                <span className="font-bold text-slate-800">{termCase.meeting?.location || "Head Office"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Format</span>
                <span className="font-bold text-slate-800">{termCase.meeting?.meetingType || "In Person"}</span>
              </div>
            </div>

            {termCase.meeting?.notes && (
              <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
                <strong>Meeting Notes:</strong>
                <p>{termCase.meeting.notes}</p>
              </div>
            )}

            {termCase.meeting?.employeeResponse && (
              <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
                <strong>Employee Response:</strong>
                <p>{termCase.meeting.employeeResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: OFFBOARDING STATUS */}
      {activeTab === "offboarding" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h4 className="font-bold text-slate-900 text-base">Integrated Offboarding Workflow</h4>
              <p className="text-xs text-slate-500">
                Connected to the Exit Interviews & Clearances module for equipment recovery, system closures, and gratuity payout.
              </p>
            </div>
            {termCase.linkedExitCaseId ? (
              <button
                onClick={() => navigate(`/exit-interviews/${termCase.linkedExitCaseId}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
              >
                <ExternalLink size={14} /> Open Offboarding Case ({termCase.linkedExitCaseId})
              </button>
            ) : (
              <button
                onClick={handleConnectOffboarding}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
              >
                <Plus size={14} /> Create Linked Offboarding Case
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-slate-400 block font-medium">Knowledge Handover</span>
              <span className="font-bold text-slate-900 text-sm">Managed in Offboarding</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-slate-400 block font-medium">IT & Access Clearance</span>
              <span className="font-bold text-slate-900 text-sm">Coordinated with IT</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-slate-400 block font-medium">Asset Recovery</span>
              <span className="font-bold text-slate-900 text-sm">Laptop, badge & keys</span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-slate-400 block font-medium">Finance Settlement</span>
              <span className="font-bold text-slate-900 text-sm">Final pay & gratuity</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: DOCUMENTS */}
      {activeTab === "documents" && (
        <TerminationDocumentsTab termCase={termCase} onUpdateCase={(u) => setTermCase(u)} currentUser={user} />
      )}

      {/* TAB 8: ACTIVITY LOG */}
      {activeTab === "activity" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Immutable Audit Log Timeline
          </h4>
          <div className="space-y-4">
            {(termCase.activity || []).map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <span className="h-2 w-2 rounded-full bg-violet-600 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{act.action}</span>
                    <span className="text-slate-400 font-normal">
                      {act.date} • {act.time}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{act.details}</p>
                  <span className="text-[11px] text-slate-400 font-medium">By: {act.performedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
