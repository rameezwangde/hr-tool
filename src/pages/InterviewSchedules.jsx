import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Search,
  Plus,
  Filter,
  FileText,
  Phone,
  Mail,
  Briefcase,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  Upload,
  Sparkles,
  MapPin,
  Building,
} from "lucide-react";
import {
  getCandidates,
  saveCandidate,
  deleteCandidate,
  getJobPositions,
  getDepartments,
  getWorkLocations,
} from "../utils/storage.js";
import ResumePreviewModal from "../components/ResumePreviewModal.jsx";

export default function InterviewSchedules() {
  const [candidates, setCandidates] = useState(() => getCandidates());
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Modals
  const [previewCandidate, setPreviewCandidate] = useState(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);

  // Form State for new/edited candidate
  const initialForm = {
    fullName: "",
    phone: "",
    email: "",
    roleApplied: "",
    department: "Kitchen Staff",
    experience: "",
    status: "New",
    interviewDate: "",
    interviewTime: "",
    interviewType: "In-Person",
    interviewLocation: "Greek Souvlaki - Branch 1",
    notes: "",
    resumeFileName: "Candidate_Resume.pdf",
    resumeUrl: "",
    resumeSummary: "",
    skillsStr: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const reloadCandidates = () => {
    setCandidates(getCandidates());
  };

  useEffect(() => {
    window.addEventListener("candidatesChanged", reloadCandidates);
    return () => {
      window.removeEventListener("candidatesChanged", reloadCandidates);
    };
  }, []);

  const jobPositions = useMemo(() => {
    return getJobPositions();
  }, []);

  const departments = useMemo(() => {
    return getDepartments();
  }, []);

  const workLocations = useMemo(() => {
    return getWorkLocations();
  }, []);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch =
        !searchTerm ||
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.roleApplied && c.roleApplied.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === "all" || c.roleApplied === roleFilter;
      const matchStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase();
      const matchDept = departmentFilter === "all" || c.department === departmentFilter;

      return matchSearch && matchRole && matchStatus && matchDept;
    });
  }, [candidates, searchTerm, roleFilter, statusFilter, departmentFilter]);

  // Unique applied roles
  const appliedRoles = useMemo(() => {
    return [...new Set(candidates.map((c) => c.roleApplied).filter(Boolean))];
  }, [candidates]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      total: candidates.length,
      new: candidates.filter((c) => c.status === "New").length,
      shortlisted: candidates.filter((c) => c.status === "Shortlisted").length,
      scheduled: candidates.filter((c) => c.status === "Interview Scheduled").length,
      offered: candidates.filter((c) => c.status === "Offered").length,
    };
  }, [candidates]);

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setFormData(initialForm);
    setIsCandidateModalOpen(true);
  };

  const handleOpenEdit = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      fullName: candidate.fullName || "",
      phone: candidate.phone || "",
      email: candidate.email || "",
      roleApplied: candidate.roleApplied || "",
      department: candidate.department || "Kitchen Staff",
      experience: candidate.experience || "",
      status: candidate.status || "New",
      interviewDate: candidate.interviewDate || "",
      interviewTime: candidate.interviewTime || "",
      interviewType: candidate.interviewType || "In-Person",
      interviewLocation: candidate.interviewLocation || "",
      notes: candidate.notes || "",
      resumeFileName: candidate.resumeFileName || "Candidate_Resume.pdf",
      resumeUrl: candidate.resumeUrl || "",
      resumeSummary: candidate.resumeSummary || "",
      skillsStr: (candidate.skills || []).join(", "),
    });
    setIsCandidateModalOpen(true);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete candidate ${name}?`)) {
      deleteCandidate(id);
    }
  };

  const handleResumeFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData((prev) => ({
        ...prev,
        resumeFileName: file.name,
        resumeUrl: uploadEvent.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitCandidate = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.roleApplied.trim()) {
      alert("Please provide at least candidate's name and role applied for.");
      return;
    }

    const skills = formData.skillsStr
      ? formData.skillsStr.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const candidateData = {
      ...formData,
      id: editingCandidate?.id,
      skills,
      createdAt: editingCandidate?.createdAt,
    };

    saveCandidate(candidateData);
    setIsCandidateModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20">
              <CalendarDays size={22} strokeWidth={2.3} />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Candidates & Interview Schedules
              </h1>
              <p className="text-xs text-slate-500">
                Screen applicants, review PDF resumes directly in the app, and schedule candidate interviews.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('candidates');
              reloadCandidates();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Sparkles size={14} className="text-amber-500" />
            Reset Sample Data
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:from-orange-700 hover:to-amber-700 transition"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Applicants</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{statusCounts.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all roles</p>
        </div>
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">New Applications</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{statusCounts.new}</p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Awaiting initial review</p>
        </div>
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Shortlisted</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{statusCounts.shortlisted}</p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Resume approved</p>
        </div>
        <div className="rounded-xl border border-purple-200/80 bg-purple-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">Interview Scheduled</p>
          <p className="text-2xl font-black text-purple-900 mt-1">{statusCounts.scheduled}</p>
          <p className="text-[11px] text-purple-600/80 mt-0.5">Dates & times booked</p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Offers Extended</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{statusCounts.offered}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Ready for contract</p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, phone, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">All Roles Applied ({appliedRoles.length})</option>
              {appliedRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">All Screening Statuses</option>
              <option value="new">New</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview scheduled">Interview Scheduled</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </section>

      {/* Candidates Master List Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Candidates Roster</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-xs">
            Click on Resume to view full PDF
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold">
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-3">Contact (Phone & Email)</th>
                <th className="py-3 px-3">Role Applied For</th>
                <th className="py-3 px-3">Resume Document</th>
                <th className="py-3 px-3">Interview Schedule</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <User size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-sm text-slate-600">No candidates found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Add Candidate" above to add applicants and upload resumes.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/80 transition">
                    {/* Candidate Name & Dept */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{candidate.fullName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600">
                          {candidate.department || "General"}
                        </span>
                        <span>•</span>
                        <span>{candidate.experience || "Experience noted"}</span>
                      </div>
                    </td>

                    {/* Contact Phone & Email */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Phone size={13} className="text-slate-400" />
                        <span>{candidate.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <Mail size={13} className="text-slate-400" />
                        <span>{candidate.email || "—"}</span>
                      </div>
                    </td>

                    {/* Role Applied For */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-bold text-orange-700 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md text-xs">
                        <Briefcase size={12} />
                        {candidate.roleApplied}
                      </span>
                    </td>

                    {/* Resume Document Link (Opens PDF Preview) */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => setPreviewCandidate(candidate)}
                        className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 shadow-xs hover:border-orange-500 hover:text-orange-600 transition"
                      >
                        <FileText size={14} className="text-orange-500 group-hover:scale-110 transition" />
                        <span className="truncate max-w-[140px] text-xs font-semibold">
                          {candidate.resumeFileName || "View Resume.pdf"}
                        </span>
                        <Eye size={13} className="text-slate-400 group-hover:text-orange-500" />
                      </button>
                    </td>

                    {/* Interview Schedule */}
                    <td className="py-3 px-3">
                      {candidate.interviewDate ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <Calendar size={13} className="text-purple-600" />
                            <span>
                              {candidate.interviewDate} at {candidate.interviewTime || "TBD"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {candidate.interviewType} • {candidate.interviewLocation || "Office"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not scheduled yet</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          candidate.status === "Interview Scheduled"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : candidate.status === "Shortlisted"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : candidate.status === "Offered"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : candidate.status === "Rejected"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {candidate.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="Preview Resume"
                          onClick={() => setPreviewCandidate(candidate)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          title="Edit / Schedule Interview"
                          onClick={() => handleOpenEdit(candidate)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          title="Delete Candidate"
                          onClick={() => handleDelete(candidate.id, candidate.fullName)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        >
                          <Trash2 size={15} />
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

      {/* Add / Edit Candidate Modal */}
      <AnimatePresence>
        {isCandidateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingCandidate ? "Edit Candidate & Schedule" : "Add New Candidate"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter candidate profile, contact details, applied role, and interview appointment
                  </p>
                </div>
                <button
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitCandidate} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                {/* Personal Information */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User size={14} className="text-orange-500" />
                    Candidate Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Candidate Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Nguyen Van An"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 0905 123 456"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. applicant@email.com"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Department
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Role & Experience */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-orange-500" />
                    Job Application Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Role Applied For *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.roleApplied}
                        onChange={(e) => setFormData({ ...formData, roleApplied: e.target.value })}
                        placeholder="e.g. Head Chef, Line Cook, Waiter"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Application Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      >
                        <option value="New">New</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Offered">Offered</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Key Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.skillsStr}
                        onChange={(e) => setFormData({ ...formData, skillsStr: e.target.value })}
                        placeholder="e.g. Mediterranean Cooking, HACCP, Shift Management"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Experience Summary
                      </label>
                      <textarea
                        rows={2}
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="Brief overview of background..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Resume Upload / PDF Setting */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-orange-500" />
                    Resume Document (PDF)
                  </h4>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">
                          Attached: {formData.resumeFileName || "Candidate_Resume.pdf"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Upload candidate's actual PDF resume file or auto-generate a structured PDF sheet
                        </p>
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs">
                        <Upload size={14} />
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleResumeFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Interview Schedule Details */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar size={14} className="text-purple-600" />
                    Interview Appointment (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Interview Date
                      </label>
                      <input
                        type="date"
                        value={formData.interviewDate}
                        onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={formData.interviewTime}
                        onChange={(e) => setFormData({ ...formData, interviewTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Interview Type
                      </label>
                      <select
                        value={formData.interviewType}
                        onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      >
                        <option value="In-Person">In-Person</option>
                        <option value="Video Call (Google Meet)">Video Call (Google Meet)</option>
                        <option value="Phone Screening">Phone Screening</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Interview Location / Link
                      </label>
                      <input
                        type="text"
                        value={formData.interviewLocation}
                        onChange={(e) => setFormData({ ...formData, interviewLocation: e.target.value })}
                        placeholder="e.g. Greek Souvlaki - Branch 1 or Google Meet URL"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Internal HR Notes
                      </label>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Interview impressions, salary expectation, availability..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCandidateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
                  >
                    {editingCandidate ? "Save Changes" : "Create Candidate"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Resume In-App Preview Modal */}
      {previewCandidate && (
        <ResumePreviewModal
          candidate={previewCandidate}
          onClose={() => setPreviewCandidate(null)}
        />
      )}
    </div>
  );
}
