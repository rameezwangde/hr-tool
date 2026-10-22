import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserX,
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
  ExternalLink
} from "lucide-react";
import {
  getTerminationCases,
  TERMINATION_TYPES,
  TERMINATION_STATUSES
} from "../utils/terminations";
import CreateTerminationModal from "../components/terminations/CreateTerminationModal";
import TerminationAnalyticsTab from "../components/terminations/TerminationAnalyticsTab";
import { exportToPDF, printDocument } from "../utils/pdfGenerator";
import useAuth from "../auth/useAuth";

export default function Terminations() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [termCases, setTermCases] = useState(() => getTerminationCases());
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOption, setSortOption] = useState("effectiveDateDesc");
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard", "analytics"

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const reloadData = () => {
    setTermCases(getTerminationCases());
  };

  useEffect(() => {
    window.addEventListener("terminationsChanged", reloadData);
    return () => window.removeEventListener("terminationsChanged", reloadData);
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const active = termCases.filter((c) => c.status !== "Completed" && c.status !== "Cancelled");
    const awaitingApproval = termCases.filter((c) => c.status === "Awaiting Approval" || c.status === "Under HR Review");
    const scheduled = termCases.filter((c) => c.status === "Scheduled");
    const noticePeriod = termCases.filter((c) => c.status === "Notice Period");
    const immediate = termCases.filter((c) => c.terminationNature === "Immediate" && c.status !== "Completed");

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const completedThisMonth = termCases.filter((c) => c.status === "Completed" && c.updatedAt?.startsWith(currentMonthStr));

    return {
      activeCases: active.length,
      awaitingApproval: awaitingApproval.length,
      scheduled: scheduled.length,
      noticePeriod: noticePeriod.length,
      immediate: immediate.length,
      completedThisMonth: completedThisMonth.length
    };
  }, [termCases]);

  const departments = useMemo(() => {
    return [...new Set(termCases.map((c) => c.department).filter(Boolean))];
  }, [termCases]);

  // Filtered Cases
  const filteredCases = useMemo(() => {
    return termCases
      .filter((c) => {
        const matchesSearch =
          !searchTerm ||
          c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.primaryReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.manager && c.manager.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDept = deptFilter === "all" || c.department === deptFilter;
        const matchesType = typeFilter === "all" || c.terminationType === typeFilter;
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;

        let matchesDate = true;
        if (dateFilter === "thisMonth") {
          const nowStr = new Date().toISOString().slice(0, 7);
          matchesDate = Boolean(c.effectiveDate && c.effectiveDate.startsWith(nowStr));
        }

        return matchesSearch && matchesDept && matchesType && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        if (sortOption === "effectiveDateDesc") {
          return new Date(b.effectiveDate || 0) - new Date(a.effectiveDate || 0);
        }
        if (sortOption === "effectiveDateAsc") {
          return new Date(a.effectiveDate || 0) - new Date(b.effectiveDate || 0);
        }
        if (sortOption === "nameAsc") {
          return a.employeeName.localeCompare(b.employeeName);
        }
        return 0;
      });
  }, [termCases, searchTerm, deptFilter, typeFilter, statusFilter, dateFilter, sortOption]);

  const handleCreatedCase = (newCase) => {
    reloadData();
    navigate(`/terminations/${newCase.id}`);
  };

  const handleExportPDF = () => {
    exportToPDF("terminations-table-container", `Terminations_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-700 text-white shadow-md shadow-rose-600/20">
            <UserX size={24} strokeWidth={2.4} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Terminations</h1>
              <span className="rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 border border-rose-200">
                Employer Action & Governance
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage employee termination cases, approvals, documentation and offboarding.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveView(activeView === "dashboard" ? "analytics" : "dashboard")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <TrendingUp size={14} className="text-violet-600" />
            {activeView === "dashboard" ? "View Analytics" : "Back to Cases"}
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Download size={14} /> Export PDF
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-700/20 hover:bg-violet-800 transition"
          >
            <Plus size={16} strokeWidth={2.5} /> + New Termination Case
          </button>
        </div>
      </div>

      {activeView === "analytics" ? (
        <TerminationAnalyticsTab />
      ) : (
        <>
          {/* Summary Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Active Cases */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Active Cases
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:scale-105 transition-transform">
                  <UserX size={16} />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{metrics.activeCases}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                <span>Under review / notice</span>
              </div>
            </div>

            {/* Awaiting Approval */}
            <div className="group relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/70 to-white p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Awaiting Approval
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                  <Clock size={16} />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight text-amber-950">{metrics.awaitingApproval}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-700/80 font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Pending management</span>
              </div>
            </div>

            {/* Scheduled Terminations */}
            <div className="group relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-b from-blue-50/70 to-white p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  Scheduled
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                  <Calendar size={16} />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight text-blue-950">{metrics.scheduled}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-700/80 font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                <span>Hearing / meeting set</span>
              </div>
            </div>

            {/* Notice Period */}
            <div className="group relative overflow-hidden rounded-2xl border border-purple-200/80 bg-gradient-to-b from-purple-50/70 to-white p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                  Notice Period
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
                  <Layers size={16} />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight text-purple-950">{metrics.noticePeriod}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-purple-700/80 font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                <span>Active notice window</span>
              </div>
            </div>

            {/* Immediate Terminations */}
            <div className="group relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/70 to-white p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                  Immediate
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 group-hover:scale-105 transition-transform">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight text-rose-950">{metrics.immediate}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-700/80 font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                <span>Zero notice actions</span>
              </div>
            </div>

            {/* Completed This Month */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/70 to-white p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Completed
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={16} />
                </span>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight text-emerald-950">{metrics.completedThisMonth}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700/80 font-medium">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Archived this month</span>
              </div>
            </div>
          </section>

          {/* Filters, Search & Sort */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by employee name, ID, reason or manager..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-violet-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort by:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-violet-600 focus:bg-white focus:outline-none"
                >
                  <option value="effectiveDateDesc">Effective Date (Latest)</option>
                  <option value="effectiveDateAsc">Effective Date (Earliest)</option>
                  <option value="nameAsc">Employee Name (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:border-violet-600 focus:outline-none"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:border-violet-600 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  {TERMINATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:border-violet-600 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  {TERMINATION_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Date:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:border-violet-600 focus:outline-none"
                >
                  <option value="all">All Dates</option>
                  <option value="thisMonth">Effective This Month</option>
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
                  className="text-violet-700 font-bold hover:underline ml-2 text-xs"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div id="terminations-table-container" className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            {filteredCases.length === 0 ? (
              <div className="p-12 text-center">
                <UserX className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-base font-bold text-slate-800">No termination cases found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm || deptFilter !== "all" || statusFilter !== "all"
                    ? "No records matched your search parameters."
                    : "No employee termination cases are currently logged."}
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
                >
                  <Plus size={14} /> Start Termination Case
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">Employee ID</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5">Termination Type</th>
                      <th className="px-4 py-3.5">Primary Reason</th>
                      <th className="px-4 py-3.5">Initiated</th>
                      <th className="px-4 py-3.5">Effective</th>
                      <th className="px-4 py-3.5">Current Stage</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCases.map((term) => {
                      const isDropdownOpen = openDropdownId === term.id;
                      const initials = term.employeeName
                        ? term.employeeName
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((p) => p.charAt(0).toUpperCase())
                            .join("")
                        : "TM";

                      return (
                        <tr
                          key={term.id}
                          onClick={() => navigate(`/terminations/${term.id}`)}
                          className="hover:bg-violet-50/30 transition cursor-pointer group"
                        >
                          {/* Employee */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-xs font-black text-white shadow-xs">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 group-hover:text-violet-700 transition block truncate">
                                  {term.employeeName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium block truncate">
                                  {term.designation}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Employee ID */}
                          <td className="px-4 py-3.5 font-mono text-slate-600 font-semibold">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
                              {term.employeeId}
                            </span>
                          </td>

                          {/* Department */}
                          <td className="px-4 py-3.5 text-slate-700 font-semibold">
                            {term.department}
                          </td>

                          {/* Termination Type */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800">
                                {term.terminationType}
                              </span>
                              <span className={`text-[10px] font-bold ${
                                term.terminationNature === "Immediate" ? "text-rose-600" : "text-purple-600"
                              }`}>
                                {term.terminationNature}
                              </span>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="px-4 py-3.5 max-w-xs text-slate-700 font-medium truncate" title={term.primaryReason}>
                            {term.primaryReason}
                          </td>

                          {/* Initiated Date */}
                          <td className="px-4 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                            {term.initiatedDate}
                          </td>

                          {/* Effective Date */}
                          <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {term.effectiveDate}
                          </td>

                          {/* Current Stage */}
                          <td className="px-4 py-3.5 font-semibold text-violet-900 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] text-violet-700 font-bold border border-violet-100">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-600 animate-pulse" />
                              {term.currentStage}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide border ${
                                term.status === "Approved" || term.status === "Termination Executed" || term.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : term.status === "Rejected"
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : term.status === "Notice Period"
                                  ? "bg-purple-50 text-purple-800 border-purple-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {term.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="px-4 py-3.5 text-right no-print relative whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => navigate(`/terminations/${term.id}`)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition"
                              >
                                View
                              </button>
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={() => setOpenDropdownId(isDropdownOpen ? null : term.id)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                                >
                                  <MoreVertical size={15} />
                                </button>

                                {isDropdownOpen && (
                                  <div className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-20 text-xs font-semibold text-slate-700">
                                    <button
                                      onClick={() => navigate(`/terminations/${term.id}`)}
                                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 transition"
                                    >
                                      <Eye size={14} className="text-violet-600" /> View Case
                                    </button>
                                    <button
                                      onClick={() => navigate(`/terminations/${term.id}`)}
                                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 transition"
                                    >
                                      <FileText size={14} className="text-slate-500" /> Review / Approvals
                                    </button>
                                    {term.linkedExitCaseId && (
                                      <button
                                        onClick={() => navigate(`/exit-interviews/${term.linkedExitCaseId}`)}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-violet-700 hover:bg-violet-50 transition font-bold"
                                      >
                                        <ExternalLink size={14} /> Open Offboarding
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
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

      {/* New Termination Case Modal */}
      <CreateTerminationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreatedCase}
      />
    </div>
  );
}
