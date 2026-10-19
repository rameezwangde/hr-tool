import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DoorOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderGit2,
  Monitor,
  FileText,
  UserCheck,
  Building,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  ArrowRight,
  TrendingUp,
  Download,
  Printer,
  ChevronDown,
  Layers,
  Sparkles
} from "lucide-react";
import {
  getExitCases,
  calculateExitProgress,
  EXIT_TYPES,
  EXIT_STAGES,
  SEED_EXIT_CASES
} from "../utils/exitInterviews";
import StartExitModal from "../components/exit/StartExitModal";
import AnalyticsTab from "../components/exit/AnalyticsTab";
import { exportToPDF, printDocument } from "../utils/pdfGenerator";
import useAuth from "../auth/useAuth";

export default function ExitInterviews() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exitCases, setExitCases] = useState(() => getExitCases());
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "thisMonth", "past"
  const [sortOption, setSortOption] = useState("lastWorkingDayDesc");
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard", "analytics"

  // Start Exit Modal state
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [openActionDropdownId, setOpenActionDropdownId] = useState(null);

  // Reload handler
  const reloadData = () => {
    setExitCases(getExitCases());
  };

  useEffect(() => {
    window.addEventListener("exitCasesChanged", reloadData);
    return () => window.removeEventListener("exitCasesChanged", reloadData);
  }, []);

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    const active = exitCases.filter((c) => c.status !== "Completed");
    const awaitingHandover = exitCases.filter((c) => {
      const p = calculateExitProgress(c);
      return c.status !== "Completed" && p.summaryCounts.pendingHandover > 0;
    });
    const pendingClearance = exitCases.filter((c) => {
      const p = calculateExitProgress(c);
      return (
        c.status !== "Completed" &&
        (p.summaryCounts.itPending > 0 ||
          p.summaryCounts.assetPending > 0 ||
          p.summaryCounts.financePending > 0 ||
          p.summaryCounts.hrPending > 0)
      );
    });
    const pendingInterview = exitCases.filter((c) => {
      return c.status !== "Completed" && c.exitInterview?.status !== "Submitted";
    });

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const completedThisMonth = exitCases.filter((c) => {
      if (c.status !== "Completed") return false;
      const closedDate = c.finalReview?.completedAt || c.updatedAt || "";
      return closedDate.startsWith(currentYearMonth);
    });

    return {
      activeExits: active.length,
      awaitingHandover: awaitingHandover.length,
      pendingClearance: pendingClearance.length,
      pendingInterview: pendingInterview.length,
      completedThisMonth: completedThisMonth.length
    };
  }, [exitCases]);

  // Unique departments from cases
  const availableDepartments = useMemo(() => {
    return [...new Set(exitCases.map((c) => c.department).filter(Boolean))];
  }, [exitCases]);

  // Filtered and Sorted Cases
  const filteredCases = useMemo(() => {
    return exitCases
      .filter((c) => {
        const matchesSearch =
          !searchTerm ||
          c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.manager && c.manager.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (c.designation && c.designation.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDept = deptFilter === "all" || c.department === deptFilter;
        const matchesType = typeFilter === "all" || c.exitType === typeFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "Completed" && c.status === "Completed") ||
          (statusFilter === "Active" && c.status !== "Completed") ||
          c.status === statusFilter;

        let matchesDate = true;
        if (dateFilter === "thisMonth") {
          const nowStr = new Date().toISOString().slice(0, 7);
          matchesDate = Boolean(c.lastWorkingDay && c.lastWorkingDay.startsWith(nowStr));
        }

        return matchesSearch && matchesDept && matchesType && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        if (sortOption === "lastWorkingDayDesc") {
          return new Date(b.lastWorkingDay || 0) - new Date(a.lastWorkingDay || 0);
        }
        if (sortOption === "lastWorkingDayAsc") {
          return new Date(a.lastWorkingDay || 0) - new Date(b.lastWorkingDay || 0);
        }
        if (sortOption === "nameAsc") {
          return a.employeeName.localeCompare(b.employeeName);
        }
        if (sortOption === "progressDesc") {
          return calculateExitProgress(b).percentage - calculateExitProgress(a).percentage;
        }
        return 0;
      });
  }, [exitCases, searchTerm, deptFilter, typeFilter, statusFilter, dateFilter, sortOption]);

  const handleCreatedCase = (newCase) => {
    reloadData();
    navigate(`/exit-interviews/${newCase.id}`);
  };

  const handleResetSampleData = () => {
    if (window.confirm("Reset exit interview cases to demonstration data?")) {
      localStorage.setItem("exitCasesV1", JSON.stringify(SEED_EXIT_CASES));
      reloadData();
    }
  };

  const handleExportPDF = () => {
    exportToPDF("exit-dashboard-table-container", `Exit_Interviews_Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePrint = () => {
    printDocument("exit-dashboard-table-container");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-700 to-indigo-600 text-white shadow-md shadow-violet-700/20">
            <DoorOpen size={24} strokeWidth={2.4} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Exit Interviews</h1>
              <span className="rounded-full bg-violet-100 text-violet-800 text-[11px] font-bold px-2.5 py-0.5 border border-violet-200">
                Offboarding & Clearance
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage employee exits, handovers, clearances and exit feedback.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveView(activeView === "dashboard" ? "analytics" : "dashboard")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <TrendingUp size={14} className="text-violet-600" />
            {activeView === "dashboard" ? "View Analytics" : "Back to Dashboard"}
          </button>

          <button
            onClick={handleResetSampleData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            title="Reload realistic enterprise demonstration records"
          >
            <Sparkles size={14} className="text-amber-500" />
            Reset Demo Data
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Download size={14} />
            Export PDF
          </button>

          <button
            onClick={() => setIsStartModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-700/20 hover:bg-violet-800 transition"
          >
            <Plus size={16} strokeWidth={2.5} />
            + Start Exit Process
          </button>
        </div>
      </div>

      {activeView === "analytics" ? (
        <AnalyticsTab />
      ) : (
        <>
          {/* Summary Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Active Exits */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Exits
              </span>
              <p className="mt-1 text-2xl font-black text-slate-900">{metrics.activeExits}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">In-progress workflows</p>
            </div>

            {/* Awaiting Handover */}
            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                Awaiting Handover
              </span>
              <p className="mt-1 text-2xl font-black text-purple-950">{metrics.awaitingHandover}</p>
              <p className="mt-0.5 text-[11px] text-purple-600/80">Pending manager sign-off</p>
            </div>

            {/* Pending Clearance */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Pending Clearance
              </span>
              <p className="mt-1 text-2xl font-black text-amber-950">{metrics.pendingClearance}</p>
              <p className="mt-0.5 text-[11px] text-amber-600/80">IT / Assets / Finance</p>
            </div>

            {/* Exit Interviews Pending */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Exit Interviews Pending
              </span>
              <p className="mt-1 text-2xl font-black text-blue-950">{metrics.pendingInterview}</p>
              <p className="mt-0.5 text-[11px] text-blue-600/80">Awaiting questionnaire</p>
            </div>

            {/* Completed This Month */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Completed This Month
              </span>
              <p className="mt-1 text-2xl font-black text-emerald-950">{metrics.completedThisMonth}</p>
              <p className="mt-0.5 text-[11px] text-emerald-600/80">Former employees closed</p>
            </div>
          </section>

          {/* Filters, Search & Sorting Controls */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by employee name, ID, manager or designation..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-violet-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-violet-600 focus:outline-none"
                >
                  <option value="lastWorkingDayDesc">Last Working Day (Latest)</option>
                  <option value="lastWorkingDayAsc">Last Working Day (Earliest)</option>
                  <option value="progressDesc">Overall Progress (High to Low)</option>
                  <option value="nameAsc">Employee Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {/* Department */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium focus:border-violet-600 focus:outline-none"
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exit Type */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Exit Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium focus:border-violet-600 focus:outline-none"
                >
                  <option value="all">All Exit Types</option>
                  {EXIT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium focus:border-violet-600 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Exit Initiated">Exit Initiated</option>
                  <option value="Handover In Progress">Handover In Progress</option>
                  <option value="Manager Review">Manager Review</option>
                  <option value="Clearance In Progress">Clearance In Progress</option>
                  <option value="Exit Interview Pending">Exit Interview Pending</option>
                  <option value="Final HR Review">Final HR Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Date:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium focus:border-violet-600 focus:outline-none"
                >
                  <option value="all">All Dates</option>
                  <option value="thisMonth">Exiting This Month</option>
                </select>
              </div>

              {(searchTerm || deptFilter !== "all" || typeFilter !== "all" || statusFilter !== "all" || dateFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDeptFilter("all");
                    setTypeFilter("all");
                    setStatusFilter("all");
                    setDateFilter("all");
                  }}
                  className="text-violet-700 font-bold hover:underline ml-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table / List of Employee Exit Cases */}
          <div id="exit-dashboard-table-container" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {filteredCases.length === 0 ? (
              <div className="p-12 text-center">
                <DoorOpen className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-base font-bold text-slate-800">No active exit processes found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm || deptFilter !== "all" || statusFilter !== "all"
                    ? "No exit records matched your filter criteria."
                    : "No employee offboarding is currently active in the system."}
                </p>
                <button
                  onClick={() => setIsStartModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
                >
                  <Plus size={14} /> Start Exit Process
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">Employee ID</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5">Manager</th>
                      <th className="px-4 py-3.5">Exit Type</th>
                      <th className="px-4 py-3.5">Last Working Day</th>
                      <th className="px-4 py-3.5">Current Stage</th>
                      <th className="px-4 py-3.5">Overall Progress</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCases.map((exit) => {
                      const progressInfo = calculateExitProgress(exit);
                      const isDropdownOpen = openActionDropdownId === exit.id;

                      const initials = exit.employeeName
                        ? exit.employeeName
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((p) => p.charAt(0).toUpperCase())
                            .join("")
                        : "EX";

                      return (
                        <tr
                          key={exit.id}
                          onClick={() => navigate(`/exit-interviews/${exit.id}`)}
                          className="hover:bg-slate-50/70 transition cursor-pointer group"
                        >
                          {/* Employee */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {exit.employeePhoto ? (
                                <img
                                  src={exit.employeePhoto}
                                  alt=""
                                  className="h-9 w-9 rounded-xl object-cover shrink-0 border border-slate-100"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-black text-violet-700">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 group-hover:text-violet-700 transition block truncate">
                                  {exit.employeeName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium block truncate">
                                  {exit.designation}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Employee ID */}
                          <td className="px-4 py-3.5 font-mono text-slate-600 font-semibold">
                            {exit.employeeId}
                          </td>

                          {/* Department */}
                          <td className="px-4 py-3.5 text-slate-700 font-medium">
                            {exit.department}
                          </td>

                          {/* Manager */}
                          <td className="px-4 py-3.5 text-slate-600">
                            {exit.manager || "Branch Manager"}
                          </td>

                          {/* Exit Type */}
                          <td className="px-4 py-3.5">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              {exit.exitType}
                            </span>
                          </td>

                          {/* Last Working Day */}
                          <td className="px-4 py-3.5 font-semibold text-slate-800">
                            {exit.lastWorkingDay || "Not set"}
                          </td>

                          {/* Current Stage */}
                          <td className="px-4 py-3.5 font-semibold text-violet-900">
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                              {exit.currentStage}
                            </span>
                          </td>

                          {/* Overall Progress */}
                          <td className="px-4 py-3.5">
                            <div className="w-28">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                                <span>{progressInfo.percentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    progressInfo.percentage === 100
                                      ? "bg-emerald-500"
                                      : "bg-violet-600"
                                  }`}
                                  style={{ width: `${progressInfo.percentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                exit.status === "Completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : exit.status === "Handover In Progress"
                                  ? "bg-purple-100 text-purple-800"
                                  : exit.status === "Clearance In Progress"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {exit.status}
                            </span>
                          </td>

                          {/* Actions Menu */}
                          <td
                            className="px-4 py-3.5 text-right no-print relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-block text-left">
                              <button
                                onClick={() =>
                                  setOpenActionDropdownId(
                                    isDropdownOpen ? null : exit.id
                                  )
                                }
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {isDropdownOpen && (
                                <div className="absolute right-4 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-20 text-xs font-semibold text-slate-700">
                                  <button
                                    onClick={() => navigate(`/exit-interviews/${exit.id}`)}
                                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 transition"
                                  >
                                    <Eye size={14} className="text-violet-600" />
                                    View Exit Case
                                  </button>
                                  <button
                                    onClick={() => navigate(`/exit-interviews/${exit.id}`)}
                                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 transition"
                                  >
                                    <ArrowRight size={14} className="text-violet-600" />
                                    Continue Process
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigate(`/exit-interviews/${exit.id}`);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 transition"
                                  >
                                    <FolderGit2 size={14} className="text-slate-500" />
                                    View Handover
                                  </button>
                                  <button
                                    onClick={() => navigate(`/exit-interviews/${exit.id}`)}
                                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 transition"
                                  >
                                    <Monitor size={14} className="text-slate-500" />
                                    View Clearance
                                  </button>
                                  <button
                                    onClick={() => navigate(`/exit-interviews/${exit.id}`)}
                                    className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 transition"
                                  >
                                    <FileText size={14} className="text-slate-500" />
                                    View Exit Interview
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    onClick={() => navigate(`/exit-interviews/${exit.id}`)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50 transition font-bold"
                                  >
                                    <CheckCircle2 size={14} />
                                    Complete Offboarding
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Start Exit Process Modal */}
      <StartExitModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onCreated={handleCreatedCase}
      />
    </div>
  );
}
