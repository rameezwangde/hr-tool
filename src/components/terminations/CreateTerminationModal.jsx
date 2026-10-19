import { useState } from "react";
import {
  X,
  UserX,
  AlertCircle,
  Calendar,
  Briefcase,
  Building,
  Clock,
  FileText,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Check
} from "lucide-react";
import { getStaffProfiles } from "../../utils/storage";
import {
  createTerminationCase,
  TERMINATION_TYPES,
  TERMINATION_NATURES
} from "../../utils/terminations";
import useAuth from "../../auth/useAuth";

export default function CreateTerminationModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1); // 1: Employee, 2: Type & Nature, 3: Details & Dates

  const storedStaff = getStaffProfiles();
  const fallbackStaff = [
    { employeeId: "EMP-1001", fullName: "Ahmed Al Mansoori", jobTitle: "Cashier Lead", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2023-01-10", employmentStatus: "Active", employmentType: "Full-Time Permanent" },
    { employeeId: "EMP-1003", fullName: "Chef Maria Santos", jobTitle: "Head Cooking Specialist", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2022-11-05", employmentStatus: "Active", employmentType: "Full-Time Permanent" },
    { employeeId: "EMP-1004", fullName: "Tariq Mahmoud", jobTitle: "Senior Grill Cook", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2023-05-18", employmentStatus: "Active", employmentType: "Full-Time Permanent" },
    { employeeId: "EMP-1006", fullName: "Hassan Ali", jobTitle: "Wrapping Specialist", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2023-06-20", employmentStatus: "Active", employmentType: "Full-Time Permanent" },
    { employeeId: "EMP-1007", fullName: "Kavita Patel", jobTitle: "Kitchen Operations Assistant", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2024-02-01", employmentStatus: "Active", employmentType: "Full-Time Permanent" },
    { employeeId: "EMP-1008", fullName: "Rami Haddad", jobTitle: "Branch Manager", department: "Management Staff", manager: "General Manager", joiningDate: "2021-08-15", employmentStatus: "Active", employmentType: "Full-Time Permanent" },
    { employeeId: "EMP-1009", fullName: "Sara Jenkins", jobTitle: "HR & People Officer", department: "Management Staff", manager: "HR Director", joiningDate: "2022-04-12", employmentStatus: "Active", employmentType: "Full-Time Permanent" },
    { employeeId: "EMP-1010", fullName: "Omar Qasim", jobTitle: "Senior Accountant", department: "Management Staff", manager: "Finance Lead", joiningDate: "2022-09-01", employmentStatus: "Active", employmentType: "Full-Time Permanent" }
  ];

  const rawStaffList = storedStaff.length > 0 ? storedStaff : fallbackStaff;
  const activeStaffList = rawStaffList.filter(
    (s) => String(s.employmentStatus || "").toLowerCase() !== "inactive" && String(s.employmentStatus || "").toLowerCase() !== "former employee"
  );

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [terminationType, setTerminationType] = useState("Performance Related");
  const [terminationNature, setTerminationNature] = useState("With Notice");
  const [primaryReason, setPrimaryReason] = useState("");
  const [detailedReason, setDetailedReason] = useState("");
  const [initiatedDate, setInitiatedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [effectiveDate, setEffectiveDate] = useState("");
  const [proposedLastWorkingDay, setProposedLastWorkingDay] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("30 Days");
  const [hrRepresentative, setHrRepresentative] = useState(
    user?.user_metadata?.full_name || "Sara Jenkins (HR Lead)"
  );
  const [internalHrNotes, setInternalHrNotes] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const selectedStaff = activeStaffList.find((s) => s.employeeId === selectedEmpId);

  const handleSelectEmployee = (empId) => {
    setSelectedEmpId(empId);
    setError("");
    const emp = activeStaffList.find((s) => s.employeeId === empId);
    if (emp) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      const targetDate = d.toISOString().slice(0, 10);
      setEffectiveDate(targetDate);
      setProposedLastWorkingDay(targetDate);
    }
  };

  const handleNatureChange = (nature) => {
    setTerminationNature(nature);
    if (nature === "Immediate") {
      const today = new Date().toISOString().slice(0, 10);
      setEffectiveDate(today);
      setProposedLastWorkingDay(today);
      setNoticePeriod("Immediate / Zero Notice");
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      const targetDate = d.toISOString().slice(0, 10);
      setEffectiveDate(targetDate);
      setProposedLastWorkingDay(targetDate);
      setNoticePeriod("30 Days");
    }
  };

  const handleNext = () => {
    setError("");
    if (currentStep === 1) {
      if (!selectedStaff) {
        setError("Please choose an active employee from the company staff database.");
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      setCurrentStep(3);
      return;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!primaryReason.trim()) {
      setError("Please provide a concise primary termination reason.");
      return;
    }

    if (!effectiveDate) {
      setError("Please specify the effective termination date.");
      return;
    }

    try {
      const created = createTerminationCase(
        {
          employeeId: selectedStaff.employeeId,
          employeeName: selectedStaff.fullName,
          employeePhoto: selectedStaff.profilePhoto || "",
          designation: selectedStaff.jobTitle || "Staff",
          department: selectedStaff.department || "General",
          manager: selectedStaff.manager || "Branch Manager",
          joiningDate: selectedStaff.joiningDate || "",
          employmentType: selectedStaff.employmentType || "Full-Time Permanent",
          terminationType,
          terminationNature,
          primaryReason,
          detailedReason,
          initiatedDate,
          effectiveDate,
          proposedLastWorkingDay: proposedLastWorkingDay || effectiveDate,
          noticePeriod,
          initiatedBy: selectedStaff.manager || "Branch Manager",
          hrRepresentative,
          internalHrNotes
        },
        user
      );

      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create termination case.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <UserX size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">New Termination Case</h2>
              <p className="text-xs text-slate-500">Initiate formal employer-directed termination proceedings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="border-b border-slate-100 px-6 py-3 bg-slate-50/70">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className={currentStep === 1 ? "text-violet-700 flex items-center gap-1.5" : "text-slate-500"}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${currentStep === 1 ? "bg-violet-700 text-white" : "bg-slate-200 text-slate-700"}`}>1</span>
              Step 1: Employee
            </span>
            <span>•</span>
            <span className={currentStep === 2 ? "text-violet-700 flex items-center gap-1.5" : "text-slate-500"}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${currentStep === 2 ? "bg-violet-700 text-white" : "bg-slate-200 text-slate-700"}`}>2</span>
              Step 2: Type & Nature
            </span>
            <span>•</span>
            <span className={currentStep === 3 ? "text-violet-700 flex items-center gap-1.5" : "text-slate-500"}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] ${currentStep === 3 ? "bg-violet-700 text-white" : "bg-slate-200 text-slate-700"}`}>3</span>
              Step 3: Details & Timeline
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT ACTIVE EMPLOYEE */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Active Employee *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                  required
                >
                  <option value="">-- Choose active employee from staff database --</option>
                  {activeStaffList.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} ({emp.employeeId}) • {emp.jobTitle || "Staff"} • {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStaff && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-violet-700">
                    Employee Profile Details (Auto-populated from Staff Database)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Employee Name:</span>
                      <span className="font-bold text-slate-800">{selectedStaff.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Employee ID:</span>
                      <span className="font-bold text-slate-800">{selectedStaff.employeeId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Department:</span>
                      <span className="font-semibold text-slate-800">{selectedStaff.department || "Kitchen Staff"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Designation:</span>
                      <span className="font-semibold text-slate-800">{selectedStaff.jobTitle || "Staff"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Reporting Manager:</span>
                      <span className="font-semibold text-slate-800">{selectedStaff.manager || "Branch Manager"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Joining Date:</span>
                      <span className="font-semibold text-slate-800">{selectedStaff.joiningDate || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: TERMINATION TYPE & NATURE */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Termination Type / Category *
                </label>
                <select
                  value={terminationType}
                  onChange={(e) => setTerminationType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none"
                >
                  {TERMINATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Select the primary category governing the formal termination.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Termination Nature *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {TERMINATION_NATURES.map((nature) => (
                    <button
                      key={nature}
                      type="button"
                      onClick={() => handleNatureChange(nature)}
                      className={`rounded-xl border p-3 text-left transition ${
                        terminationNature === nature
                          ? "border-violet-600 bg-violet-50/70 text-violet-900 shadow-xs"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="font-bold text-xs block">{nature}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {nature === "Immediate"
                          ? "Summary departure with zero notice"
                          : nature === "With Notice"
                          ? "Standard contractual notice period"
                          : "Contractual term conclusion"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900 leading-relaxed font-medium">
                <strong>Governance Principle:</strong> The software records and manages HR decisions and evidence; it does not automatically conclude statutory liability or legal justification.
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS, TIMELINE & NOTES */}
          {currentStep === 3 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Primary Reason Summary *
                </label>
                <input
                  type="text"
                  value={primaryReason}
                  onChange={(e) => setPrimaryReason(e.target.value)}
                  placeholder="e.g. Chronic unexcused shift absenteeism impacting kitchen operations"
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Detailed Reason & Background
                </label>
                <textarea
                  rows={3}
                  value={detailedReason}
                  onChange={(e) => setDetailedReason(e.target.value)}
                  placeholder="Summarize context, supervisory interventions, dates of discussions..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Initiation Date *
                  </label>
                  <input
                    type="date"
                    value={initiatedDate}
                    onChange={(e) => setInitiatedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-medium focus:border-violet-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 font-medium focus:border-violet-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Notice Period
                  </label>
                  <input
                    type="text"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    placeholder="e.g. 30 Days"
                    className="w-full rounded-xl border border-slate-300 p-2 font-medium focus:border-violet-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Confidential Internal HR Notes
                </label>
                <textarea
                  rows={2}
                  value={internalHrNotes}
                  onChange={(e) => setInternalHrNotes(e.target.value)}
                  placeholder="Sensitive internal observations, replacement sourcing details, witness records..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
                >
                  Next Step <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-violet-700/20 hover:bg-violet-800 transition"
                >
                  <UserX size={15} /> Create Termination Case
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
