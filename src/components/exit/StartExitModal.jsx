import { useState } from "react";
import { X, UserPlus, AlertCircle, Calendar, Briefcase, Building, Clock, FileText } from "lucide-react";
import { getStaffProfiles } from "../../utils/storage";
import { createExitCase, EXIT_TYPES, EXIT_REASONS } from "../../utils/exitInterviews";
import useAuth from "../../auth/useAuth";

export default function StartExitModal({ isOpen, onClose, onCreated }) {
  const storedStaff = getStaffProfiles();
  const fallbackStaff = [
    { employeeId: "EMP-1001", fullName: "Ahmed Al Mansoori", jobTitle: "Cashier Lead", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2023-01-10", employmentStatus: "Active" },
    { employeeId: "EMP-1003", fullName: "Chef Maria Santos", jobTitle: "Head Cooking Specialist", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2022-11-05", employmentStatus: "Active" },
    { employeeId: "EMP-1004", fullName: "Tariq Mahmoud", jobTitle: "Senior Grill Cook", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2023-05-18", employmentStatus: "Active" },
    { employeeId: "EMP-1006", fullName: "Hassan Ali", jobTitle: "Wrapping Specialist", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2023-06-20", employmentStatus: "Active" },
    { employeeId: "EMP-1007", fullName: "Kavita Patel", jobTitle: "Kitchen Operations Assistant", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2024-02-01", employmentStatus: "Active" },
    { employeeId: "EMP-1008", fullName: "Rami Haddad", jobTitle: "Branch Manager", department: "Management Staff", manager: "General Manager", joiningDate: "2021-08-15", employmentStatus: "Active" },
    { employeeId: "EMP-1009", fullName: "Sara Jenkins", jobTitle: "HR & People Officer", department: "Management Staff", manager: "HR Director", joiningDate: "2022-04-12", employmentStatus: "Active" },
    { employeeId: "EMP-1010", fullName: "Omar Qasim", jobTitle: "Senior Accountant", department: "Management Staff", manager: "Finance Lead", joiningDate: "2022-09-01", employmentStatus: "Active" },
    { employeeId: "EMP-1011", fullName: "Bilal Khan", jobTitle: "Cashier", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2024-03-10", employmentStatus: "Active" },
    { employeeId: "EMP-1012", fullName: "Zayn Malik", jobTitle: "Line Cook", department: "Kitchen Staff", manager: "Rami Haddad", joiningDate: "2024-04-15", employmentStatus: "Active" }
  ];

  const rawStaffList = storedStaff.length > 0 ? storedStaff : fallbackStaff;
  const staffList = rawStaffList.filter(
    (s) => String(s.employmentStatus || "").toLowerCase() !== "inactive" && String(s.employmentStatus || "").toLowerCase() !== "former employee"
  );

  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [exitType, setExitType] = useState("Resignation");
  const [resignationDate, setResignationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("30 Days");
  const [exitReason, setExitReason] = useState("Career Growth");
  const [hrNotes, setHrNotes] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const selectedStaff = staffList.find((s) => s.employeeId === selectedEmpId);

  const handleSelectEmployee = (empId) => {
    setSelectedEmpId(empId);
    setError("");
    const emp = staffList.find((s) => s.employeeId === empId);
    if (emp) {
      // Automatically calculate default last working day +30 days from today
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setLastWorkingDay(d.toISOString().slice(0, 10));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStaff) {
      setError("Please select an employee from the staff database.");
      return;
    }

    if (!lastWorkingDay) {
      setError("Please specify the employee's last working day.");
      return;
    }

    // Safety validation: Last working day cannot be before resignation date
    if (new Date(lastWorkingDay) < new Date(resignationDate)) {
      setError("Last working day cannot be before the resignation/notice date.");
      return;
    }

    try {
      const newCase = createExitCase(
        {
          employeeId: selectedStaff.employeeId,
          employeeName: selectedStaff.fullName,
          employeePhoto: selectedStaff.profilePhoto || "",
          designation: selectedStaff.jobTitle || "Staff",
          department: selectedStaff.department || "General",
          manager: selectedStaff.manager || "Branch Manager",
          joiningDate: selectedStaff.joiningDate || "",
          exitType,
          resignationDate,
          lastWorkingDay,
          noticePeriod,
          exitReason,
          hrNotes
        },
        user
      );

      onCreated(newCase);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to start exit process.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <UserPlus size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Start Employee Exit Process</h2>
              <p className="text-xs text-slate-500">Initiate offboarding, knowledge handover, and exit clearances</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Select Active Employee *
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => handleSelectEmployee(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
              required
            >
              <option value="">-- Choose an employee from database --</option>
              {staffList.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.fullName} ({emp.employeeId}) • {emp.jobTitle || "Staff"} • {emp.department}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-populated Employee Details Card */}
          {selectedStaff && (
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-2">
                Employee Profile Details (Auto-populated)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Full Name:</span>
                  <span className="font-bold text-slate-800">{selectedStaff.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Employee ID:</span>
                  <span className="font-bold text-slate-800">{selectedStaff.employeeId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Department:</span>
                  <span className="font-bold text-slate-800">{selectedStaff.department || "General"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Designation:</span>
                  <span className="font-bold text-slate-800">{selectedStaff.jobTitle || "Staff"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Manager:</span>
                  <span className="font-bold text-slate-800">{selectedStaff.manager || "Branch Manager"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Joining Date:</span>
                  <span className="font-bold text-slate-800">{selectedStaff.joiningDate || "Not provided"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Exit Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Exit Type *
              </label>
              <select
                value={exitType}
                onChange={(e) => setExitType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
                required
              >
                {EXIT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Primary Reason for Exit *
              </label>
              <select
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
                required
              >
                {EXIT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Resignation / Notice Date *
              </label>
              <input
                type="date"
                value={resignationDate}
                onChange={(e) => setResignationDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Last Working Day *
              </label>
              <input
                type="date"
                value={lastWorkingDay}
                onChange={(e) => setLastWorkingDay(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Notice Period
              </label>
              <input
                type="text"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                placeholder="e.g. 30 Days"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
              />
            </div>
          </div>

          {/* HR Confidential Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              HR Notes & Preliminary Remarks
            </label>
            <textarea
              rows={3}
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              placeholder="Add preliminary handover considerations, confidential background, replacement plans..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium text-slate-800 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-700/20 hover:bg-violet-800 transition"
            >
              <UserPlus size={16} />
              Create Exit Process
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
