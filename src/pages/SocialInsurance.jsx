import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Building2,
  Users,
  Wallet,
  TrendingUp,
  Receipt,
  FileText,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  ExternalLink,
  Info,
  Calendar,
  AlertCircle,
  Percent,
  CheckCircle2,
  PieChart as PieChartIcon,
  HelpCircle,
  Eye,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  loadCompanyInsuranceOverview,
  calculateCumulativeInsuranceBudget,
  formatMoneyVnd,
  getInsuranceSettings,
  saveInsuranceSettings,
  DEFAULT_INSURANCE_RATES,
} from "../utils/socialInsurance.js";
import { exportToPDF, printDocument } from "../utils/pdfGenerator";
import StaffProfileModal from "../components/StaffProfileModal";

export default function SocialInsurance() {
  const navigate = useNavigate();
  const [records, setRecords] = useState(() => loadCompanyInsuranceOverview());
  const [ratesConfig, setRatesConfig] = useState(() => getInsuranceSettings());
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configRates, setConfigRates] = useState(ratesConfig);
  const [profileModalEmployee, setProfileModalEmployee] = useState(null);

  // Reload data when contracts or staff change
  const reloadData = () => {
    setRecords(loadCompanyInsuranceOverview());
    setRatesConfig(getInsuranceSettings());
  };

  useEffect(() => {
    window.addEventListener("contractsChanged", reloadData);
    window.addEventListener("staffProfilesChanged", reloadData);
    window.addEventListener("insuranceSettingsChanged", reloadData);
    return () => {
      window.removeEventListener("contractsChanged", reloadData);
      window.removeEventListener("staffProfilesChanged", reloadData);
      window.removeEventListener("insuranceSettingsChanged", reloadData);
    };
  }, []);

  // Filtered employees list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        !searchTerm ||
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = departmentFilter === "all" || r.department === departmentFilter;
      const matchStatus = statusFilter === "all" || r.employmentStatus.toLowerCase() === statusFilter.toLowerCase();
      const matchLoc = locationFilter === "all" || r.workLocation.toLowerCase().includes(locationFilter.toLowerCase());

      return matchSearch && matchDept && matchStatus && matchLoc;
    });
  }, [records, searchTerm, departmentFilter, statusFilter, locationFilter]);

  // Cumulative metrics across filtered or total
  const cumulativeBudget = useMemo(() => {
    return calculateCumulativeInsuranceBudget(records);
  }, [records]);

  const filteredCumulative = useMemo(() => {
    return calculateCumulativeInsuranceBudget(filteredRecords);
  }, [filteredRecords]);

  // Extract dynamic filter values
  const departments = useMemo(() => {
    return [...new Set(records.map((r) => r.department).filter(Boolean))];
  }, [records]);

  const locations = useMemo(() => {
    return [...new Set(records.map((r) => r.workLocation).filter(Boolean))];
  }, [records]);

  const handleSaveRates = (e) => {
    e.preventDefault();
    saveInsuranceSettings(configRates);
    setRatesConfig(configRates);
    setIsConfigModalOpen(false);
    reloadData();
  };

  const handleResetRates = () => {
    setConfigRates(DEFAULT_INSURANCE_RATES);
  };

  const handleExportPDF = () => {
    exportToPDF("social-insurance-report", `Company_Social_Insurance_Budget_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePrint = () => {
    printDocument("social-insurance-report");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header / Action Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck size={22} strokeWidth={2.3} />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Social Insurance & Benefits</h1>
              <p className="text-xs text-slate-500">
                Interlinked dynamically from employment contracts and staff statutory clauses (Article 11).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setConfigRates(ratesConfig);
              setIsConfigModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Sliders size={14} />
            Contribution Rates
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Download size={14} />
            Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition"
          >
            <Printer size={14} />
            Print Report
          </button>
        </div>
      </div>

      <div id="social-insurance-report" className="space-y-6">
        {/* Cumulative Budget Spent Banner / Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Cumulative Insurance Budget Spent by Company */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-5 text-white shadow-lg shadow-emerald-950/10">
            <div className="flex items-center justify-between opacity-80 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase text-emerald-100">
                Company Insurance Budget
              </span>
              <Building2 size={18} className="text-emerald-200" />
            </div>
            <div className="text-2xl lg:text-3xl font-black tracking-tight text-white mb-1">
              {formatMoneyVnd(cumulativeBudget.totalCompanyBudgetSpent)}
            </div>
            <p className="text-xs text-emerald-100/90 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Monthly budget spent for {cumulativeBudget.activeCount} active staff
            </p>
            <div className="mt-3 pt-3 border-t border-emerald-400/20 text-[11px] text-emerald-100/80 flex justify-between">
              <span>Avg / Employee:</span>
              <span className="font-semibold text-white">
                {cumulativeBudget.activeCount > 0
                  ? formatMoneyVnd(cumulativeBudget.totalCompanyBudgetSpent / cumulativeBudget.activeCount)
                  : "0 VND"}
              </span>
            </div>
          </div>

          {/* Card 2: Total Insurance Base Salary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">Total Insurance Base</span>
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Wallet size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              {formatMoneyVnd(cumulativeBudget.totalBaseSalary)}
            </div>
            <p className="text-xs text-slate-500">
              Cumulative contract base salaries used as statutory insurance assessment base
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Coverage:</span>
              <span className="font-semibold text-slate-800">
                {cumulativeBudget.activeCount} / {cumulativeBudget.totalEmployees} Employees
              </span>
            </div>
          </div>

          {/* Card 3: Employee Deductions (8% + 1.5% + 1%) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">Employee Withholding</span>
              <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Receipt size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              {formatMoneyVnd(cumulativeBudget.totalEmployeeDeductions)}
            </div>
            <p className="text-xs text-slate-500">
              Employee statutory share (10.5%) withheld directly through contracts & payroll
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Statutory Rate:</span>
              <span className="font-semibold text-amber-700">10.5% (BHXH 8%, BHYT 1.5%, BHTN 1%)</span>
            </div>
          </div>

          {/* Card 4: Total Combined Insurance Fund */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">Total Statutory Fund</span>
              <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <TrendingUp size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">
              {formatMoneyVnd(cumulativeBudget.totalCombinedInsuranceFund)}
            </div>
            <p className="text-xs text-slate-500">
              Combined Social + Health + Unemployment fund payable to authorities (32%)
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Fund Split:</span>
              <span className="font-semibold text-purple-700">
                Company 67.2% / Staff 32.8%
              </span>
            </div>
          </div>
        </section>

        {/* Detailed Statutory Breakdown by Fund */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon size={18} className="text-emerald-600" />
                Statutory Insurance Breakdown by Fund
              </h2>
              <p className="text-xs text-slate-500">
                Vietnamese statutory breakdown mandated in Article 11 (Compulsory Insurance)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <Info size={14} className="text-slate-400" />
              <span>Assessment Base: Contract Base Salary</span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {/* Social Insurance (BHXH) */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  BHXH / Social Insurance
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5">
                  Total 25.5%
                </span>
              </div>
              <div className="mt-3 flex justify-between items-baseline border-b border-slate-200/60 pb-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">Company Budget (17.5%):</span>
                  <span className="font-bold text-sm text-slate-900">
                    {formatMoneyVnd(cumulativeBudget.companySocialFund)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Employee (8%):</span>
                  <span className="font-semibold text-xs text-slate-700">
                    {formatMoneyVnd(cumulativeBudget.employeeSocialFund)}
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-1 flex justify-between text-xs font-bold text-slate-800">
                <span>Fund Total:</span>
                <span>{formatMoneyVnd(cumulativeBudget.companySocialFund + cumulativeBudget.employeeSocialFund)}</span>
              </div>
            </div>

            {/* Health Insurance (BHYT) */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  BHYT / Health Insurance
                </span>
                <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5">
                  Total 4.5%
                </span>
              </div>
              <div className="mt-3 flex justify-between items-baseline border-b border-slate-200/60 pb-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">Company Budget (3%):</span>
                  <span className="font-bold text-sm text-slate-900">
                    {formatMoneyVnd(cumulativeBudget.companyHealthFund)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Employee (1.5%):</span>
                  <span className="font-semibold text-xs text-slate-700">
                    {formatMoneyVnd(cumulativeBudget.employeeHealthFund)}
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-1 flex justify-between text-xs font-bold text-slate-800">
                <span>Fund Total:</span>
                <span>{formatMoneyVnd(cumulativeBudget.companyHealthFund + cumulativeBudget.employeeHealthFund)}</span>
              </div>
            </div>

            {/* Unemployment Insurance (BHTN) */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  BHTN / Unemployment Insurance
                </span>
                <span className="rounded-full bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5">
                  Total 2%
                </span>
              </div>
              <div className="mt-3 flex justify-between items-baseline border-b border-slate-200/60 pb-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">Company Budget (1%):</span>
                  <span className="font-bold text-sm text-slate-900">
                    {formatMoneyVnd(cumulativeBudget.companyUnemploymentFund)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Employee (1%):</span>
                  <span className="font-semibold text-xs text-slate-700">
                    {formatMoneyVnd(cumulativeBudget.employeeUnemploymentFund)}
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-1 flex justify-between text-xs font-bold text-slate-800">
                <span>Fund Total:</span>
                <span>{formatMoneyVnd(cumulativeBudget.companyUnemploymentFund + cumulativeBudget.employeeUnemploymentFund)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar & Controls */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, ID, or contract..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Employment Statuses</option>
                <option value="active">Active Only</option>
                <option value="probation">Probation / Trial</option>
                <option value="inactive">Inactive / Resigned</option>
              </select>
            </div>
          </div>
        </section>

        {/* Employee Insurance Contracts Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Employee Contracts & Insurance Allocation
              </h3>
              <p className="text-xs text-slate-500">
                Showing {filteredRecords.length} of {records.length} employees linked to contract terms
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
              Subtotal Company Budget: {formatMoneyVnd(filteredCumulative.totalCompanyBudgetSpent)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Linked Contract</th>
                  <th className="py-3 px-3 text-right">Insurance Base</th>
                  <th className="py-3 px-3 text-right">
                    Company Budget
                    <span className="block text-[10px] font-normal text-slate-500">(21.5% Paid)</span>
                  </th>
                  <th className="py-3 px-3 text-right">
                    Staff Deduction
                    <span className="block text-[10px] font-normal text-slate-500">(10.5% Withheld)</span>
                  </th>
                  <th className="py-3 px-3 text-right">Total Fund</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-sm text-slate-600">No employee contract records found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Generate employment contracts or add staff profiles to populate social insurance.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{record.fullName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-slate-600">{record.employeeId}</span>
                          <span>•</span>
                          <span>{record.jobTitle}</span>
                        </div>
                      </td>

                      {/* Contract Link */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <FileText size={13} className="text-emerald-600" />
                          <span>{record.contractNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {record.contractDuration} • Start after {record.probationMonths} mo
                        </div>
                      </td>

                      {/* Insurance Base Salary */}
                      <td className="py-3 px-3 text-right font-medium text-slate-800">
                        {formatMoneyVnd(record.baseSalary)}
                      </td>

                      {/* Employer Budget Spent */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-emerald-700">
                          {formatMoneyVnd(record.employerTotalCost)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          BHXH {formatMoneyVnd(record.employerSocialAmount)}
                        </div>
                      </td>

                      {/* Employee Deduction */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-slate-700">
                          {formatMoneyVnd(record.employeeTotalDeduction)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          BHXH {formatMoneyVnd(record.employeeSocialAmount)}
                        </div>
                      </td>

                      {/* Combined Total */}
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        {formatMoneyVnd(record.combinedTotalInsurance)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            record.employmentStatus.toLowerCase() === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {record.employmentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="View Full Breakdown"
                            onClick={() => setSelectedRecord(record)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            title="View Staff Profile"
                            onClick={() => {
                              setProfileModalEmployee(record);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          >
                            <ExternalLink size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Detail Slideover / Modal for Selected Employee */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20">
                    {selectedRecord.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{selectedRecord.fullName}</h3>
                    <p className="text-xs text-slate-500">
                      {selectedRecord.employeeId} • {selectedRecord.jobTitle} • {selectedRecord.department}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Contract Meta Banner */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/50">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <FileText size={15} className="text-emerald-700" />
                      Interlinked Contract Reference: {selectedRecord.contractNumber}
                    </span>
                    <span className="font-semibold text-emerald-800">
                      Status: {selectedRecord.contractStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contract Duration:</span>
                      <span className="font-medium text-slate-800">{selectedRecord.contractDuration}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Base Salary:</span>
                      <span className="font-bold text-emerald-900">{formatMoneyVnd(selectedRecord.baseSalary)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Probation Waiting:</span>
                      <span className="font-medium text-slate-800">{selectedRecord.probationMonths} Months</span>
                    </div>
                  </div>
                </div>

                {/* Company Budget Spent Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Building2 size={15} className="text-emerald-600" />
                    Company Insurance Budget Spent (Employer Contribution)
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between p-3 bg-slate-50/70 font-semibold text-slate-700">
                      <span>Fund Item</span>
                      <span>Statutory Rate</span>
                      <span>Company Expense</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-slate-800">Bảo hiểm xã hội (Social Insurance)</span>
                      <span className="font-medium text-slate-500">{selectedRecord.rates.employerSocialPct}%</span>
                      <span className="font-bold text-slate-900">{formatMoneyVnd(selectedRecord.employerSocialAmount)}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-slate-800">Bảo hiểm y tế (Health Insurance)</span>
                      <span className="font-medium text-slate-500">{selectedRecord.rates.employerHealthPct}%</span>
                      <span className="font-bold text-slate-900">{formatMoneyVnd(selectedRecord.employerHealthAmount)}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-slate-800">Bảo hiểm thất nghiệp (Unemployment Insurance)</span>
                      <span className="font-medium text-slate-500">{selectedRecord.rates.employerUnemploymentPct}%</span>
                      <span className="font-bold text-slate-900">{formatMoneyVnd(selectedRecord.employerUnemploymentAmount)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-emerald-50/80 font-bold text-emerald-950">
                      <span>Total Company Insurance Budget:</span>
                      <span>{selectedRecord.rates.employerTotalPct}%</span>
                      <span className="text-sm font-black text-emerald-700">
                        {formatMoneyVnd(selectedRecord.employerTotalCost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Employee Deductions Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Receipt size={15} className="text-amber-600" />
                    Employee Statutory Deductions (Withheld from Salary)
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between p-3 bg-slate-50/70 font-semibold text-slate-700">
                      <span>Fund Item</span>
                      <span>Statutory Rate</span>
                      <span>Employee Withheld</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-slate-800">Bảo hiểm xã hội (Social Insurance)</span>
                      <span className="font-medium text-slate-500">{selectedRecord.rates.employeeSocialPct}%</span>
                      <span className="font-bold text-slate-900">{formatMoneyVnd(selectedRecord.employeeSocialAmount)}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-slate-800">Bảo hiểm y tế (Health Insurance)</span>
                      <span className="font-medium text-slate-500">{selectedRecord.rates.employeeHealthPct}%</span>
                      <span className="font-bold text-slate-900">{formatMoneyVnd(selectedRecord.employeeHealthAmount)}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-slate-800">Bảo hiểm thất nghiệp (Unemployment Insurance)</span>
                      <span className="font-medium text-slate-500">{selectedRecord.rates.employeeUnemploymentPct}%</span>
                      <span className="font-bold text-slate-900">{formatMoneyVnd(selectedRecord.employeeUnemploymentAmount)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-amber-50/80 font-bold text-amber-950">
                      <span>Total Employee Deduction:</span>
                      <span>{selectedRecord.rates.employeeTotalPct}%</span>
                      <span className="text-sm font-black text-amber-800">
                        {formatMoneyVnd(selectedRecord.employeeTotalDeduction)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grand Total Contribution */}
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-black text-purple-950 text-sm block">
                      Total Statutory Contribution Fund:
                    </span>
                    <span className="text-purple-700 text-[11px]">
                      Employer + Employee combined total ({selectedRecord.rates.employerTotalPct + selectedRecord.rates.employeeTotalPct}%)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-purple-900">
                      {formatMoneyVnd(selectedRecord.combinedTotalInsurance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rates Configuration Modal */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Statutory Insurance Rates</h3>
                  <p className="text-xs text-slate-500">Configure default employer and employee contribution percentages</p>
                </div>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRates} className="p-6 space-y-4 text-xs">
                {/* Employer Rates */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <h4 className="font-bold text-emerald-950 mb-3 flex items-center gap-1.5">
                    <Building2 size={15} />
                    Company Contribution Rates (% of Contract Base Salary)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">BHXH (Social)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={configRates.employerSocialPct}
                        onChange={(e) =>
                          setConfigRates({ ...configRates, employerSocialPct: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">BHYT (Health)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={configRates.employerHealthPct}
                        onChange={(e) =>
                          setConfigRates({ ...configRates, employerHealthPct: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">BHTN (Unemployment)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={configRates.employerUnemploymentPct}
                        onChange={(e) =>
                          setConfigRates({ ...configRates, employerUnemploymentPct: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-right text-[11px] font-bold text-emerald-800">
                    Total Company Rate:{" "}
                    {(
                      configRates.employerSocialPct +
                      configRates.employerHealthPct +
                      configRates.employerUnemploymentPct
                    ).toFixed(1)}
                    %
                  </div>
                </div>

                {/* Employee Rates */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                    <Users size={15} />
                    Employee Deduction Rates (% of Contract Base Salary)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">BHXH (Social)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={configRates.employeeSocialPct}
                        onChange={(e) =>
                          setConfigRates({ ...configRates, employeeSocialPct: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">BHYT (Health)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={configRates.employeeHealthPct}
                        onChange={(e) =>
                          setConfigRates({ ...configRates, employeeHealthPct: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">BHTN (Unemployment)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={configRates.employeeUnemploymentPct}
                        onChange={(e) =>
                          setConfigRates({ ...configRates, employeeUnemploymentPct: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-right text-[11px] font-bold text-slate-700">
                    Total Employee Rate:{" "}
                    {(
                      configRates.employeeSocialPct +
                      configRates.employeeHealthPct +
                      configRates.employeeUnemploymentPct
                    ).toFixed(1)}
                    %
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleResetRates}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Reset to Statutory Defaults
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfigModalOpen(false)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Staff Profile Modal Popup if User Clicks External Link */}
      {profileModalEmployee && (
        <StaffProfileModal
          profile={profileModalEmployee}
          onClose={() => setProfileModalEmployee(null)}
          onUpdate={(updated) => {
            setProfileModalEmployee(null);
            reloadData();
          }}
        />
      )}
    </div>
  );
}
