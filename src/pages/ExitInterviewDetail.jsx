import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  FolderGit2,
  Monitor,
  CheckSquare,
  ShieldCheck,
  Activity as ActivityIcon,
  ChevronRight,
  TrendingUp,
  Download,
  Printer
} from "lucide-react";
import {
  getExitCaseById,
  saveExitCase,
  calculateExitProgress,
  EXIT_STAGES
} from "../utils/exitInterviews";
import useAuth from "../auth/useAuth";
import OverviewTab from "../components/exit/OverviewTab";
import KnowledgeHandoverTab from "../components/exit/KnowledgeHandoverTab";
import ClearanceTab from "../components/exit/ClearanceTab";
import ExitInterviewTab from "../components/exit/ExitInterviewTab";
import DocumentsTab from "../components/exit/DocumentsTab";
import ActivityTab from "../components/exit/ActivityTab";
import FinalReviewTab from "../components/exit/FinalReviewTab";
import { exportToPDF, printDocument } from "../utils/pdfGenerator";

export default function ExitInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exitCase, setExitCase] = useState(() => getExitCaseById(id));
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const handleExitChange = () => {
      setExitCase(getExitCaseById(id));
    };
    window.addEventListener("exitCasesChanged", handleExitChange);
    return () => window.removeEventListener("exitCasesChanged", handleExitChange);
  }, [id]);

  const progress = useMemo(() => calculateExitProgress(exitCase), [exitCase]);

  if (!exitCase) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h3 className="mt-3 text-lg font-bold text-slate-800">Exit Case Not Found</h3>
        <p className="mt-1 text-xs text-slate-500">
          The requested exit process record ({id}) could not be located in local storage.
        </p>
        <button
          onClick={() => navigate("/exit-interviews")}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
        >
          <ArrowLeft size={14} /> Back to Exit Interviews
        </button>
      </div>
    );
  }

  const handleUpdateCase = (updated) => {
    setExitCase(updated);
  };

  const handleExportPDF = () => {
    exportToPDF("exit-case-detail-container", `Exit_Case_${exitCase.id}_${exitCase.employeeName.replace(/\s+/g, "_")}.pdf`);
  };

  const handlePrint = () => {
    printDocument("exit-case-detail-container");
  };

  // Avatar initials
  const initials = exitCase.employeeName
    ? exitCase.employeeName
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join("")
    : "EX";

  const workflowStages = [
    { name: "Exit Initiated", key: "Exit Initiated" },
    { name: "Knowledge Handover", key: "Knowledge Handover" },
    { name: "Manager Approval", key: "Manager Approval" },
    { name: "Department Clearances", key: "Department Clearances" },
    { name: "Exit Interview", key: "Exit Interview" },
    { name: "HR Final Review", key: "HR Final Review" },
    { name: "Completed", key: "Completed" }
  ];

  return (
    <div id="exit-case-detail-container" className="space-y-6 pb-12">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-3 no-print">
        <button
          onClick={() => navigate("/exit-interviews")}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-violet-700 transition"
        >
          <ArrowLeft size={16} />
          Back to Exit Interviews Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Download size={13} />
            Export Dossier PDF
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Printer size={13} />
            Print
          </button>
        </div>
      </div>

      {/* Main Employee Exit Dossier Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Employee Avatar & Identity */}
          <div className="flex items-start gap-4">
            {exitCase.employeePhoto ? (
              <img
                src={exitCase.employeePhoto}
                alt=""
                className="h-20 w-16 rounded-2xl object-cover shadow-sm border border-slate-100"
              />
            ) : (
              <div className="flex h-20 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-700 text-xl font-black text-white shadow-sm">
                {initials}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">{exitCase.employeeName}</h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-600">
                  {exitCase.employeeId}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                    exitCase.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-violet-100 text-violet-800"
                  }`}
                >
                  {exitCase.status}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-600">
                {exitCase.designation} • <span className="font-bold text-slate-800">{exitCase.department}</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 pt-2 text-[11px] text-slate-500">
                <div>
                  <span className="text-slate-400">Manager: </span>
                  <span className="font-semibold text-slate-700">{exitCase.manager || "Branch Manager"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Exit Type: </span>
                  <span className="font-semibold text-slate-700">{exitCase.exitType}</span>
                </div>
                <div>
                  <span className="text-slate-400">Joining Date: </span>
                  <span className="font-semibold text-slate-700">{exitCase.joiningDate || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Last Working Day: </span>
                  <span className="font-bold text-slate-900">{exitCase.lastWorkingDay || "TBD"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Offboarding Overall Progress Gauge */}
          <div className="flex flex-col items-start lg:items-end justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 min-w-[210px]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Offboarding Progress
            </span>
            <div className="text-3xl font-black text-violet-700 mt-1">
              {progress.percentage}% Complete
            </div>
            <div className="mt-2 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Stage: <strong className="text-slate-700">{exitCase.currentStage}</strong>
            </p>
          </div>
        </div>

        {/* Visual Workflow Steps */}
        <div className="mt-6 border-t border-slate-100 pt-5 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
            {workflowStages.map((stage, idx) => {
              const stageStatus = progress.stageStatuses[stage.key] || "Pending";
              const isCompleted = stageStatus === "Completed";
              const isCurrent = stageStatus === "Current";
              const isBlocked = stageStatus === "Blocked";

              return (
                <div key={idx} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                        isCompleted
                          ? "bg-emerald-500 text-white shadow-xs"
                          : isCurrent
                          ? "bg-violet-600 text-white ring-4 ring-violet-100 shadow-xs"
                          : isBlocked
                          ? "bg-rose-500 text-white"
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
                          : isBlocked
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
                          : isBlocked
                          ? "text-rose-600"
                          : "text-slate-400"
                      }`}
                    >
                      {stageStatus}
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
          { id: "handover", label: "Knowledge Handover", icon: FolderGit2 },
          { id: "clearance", label: "Department Clearances", icon: Monitor },
          { id: "interview", label: "Exit Interview", icon: FileText },
          { id: "documents", label: "Documents", icon: CheckSquare },
          { id: "review", label: "Final HR Review", icon: ShieldCheck },
          { id: "activity", label: "Activity / Audit", icon: ActivityIcon }
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

      {/* Tab Panels */}
      <div>
        {activeTab === "overview" && (
          <OverviewTab exitCase={exitCase} onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === "handover" && (
          <KnowledgeHandoverTab
            exitCase={exitCase}
            onUpdateCase={handleUpdateCase}
            currentUser={user}
          />
        )}

        {activeTab === "clearance" && (
          <ClearanceTab
            exitCase={exitCase}
            onUpdateCase={handleUpdateCase}
            currentUser={user}
          />
        )}

        {activeTab === "interview" && (
          <ExitInterviewTab
            exitCase={exitCase}
            onUpdateCase={handleUpdateCase}
            currentUser={user}
          />
        )}

        {activeTab === "documents" && (
          <DocumentsTab
            exitCase={exitCase}
            onUpdateCase={handleUpdateCase}
            currentUser={user}
          />
        )}

        {activeTab === "review" && (
          <FinalReviewTab
            exitCase={exitCase}
            onUpdateCase={handleUpdateCase}
            currentUser={user}
          />
        )}

        {activeTab === "activity" && <ActivityTab exitCase={exitCase} />}
      </div>
    </div>
  );
}
