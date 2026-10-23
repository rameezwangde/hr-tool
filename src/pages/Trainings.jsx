import { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Users,
  BookOpen,
  Calendar,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  Check,
  X
} from "lucide-react";
import { getTrainings, saveTrainings, recordTrainingCompletion, enrollEmployeeInTraining } from "../utils/trainings";
import { getStaffProfiles } from "../utils/storage";
import { exportToPDF, printDocument } from "../utils/pdfGenerator";

export default function Trainings() {
  const [trainings, setTrainings] = useState(() => getTrainings());
  const [profiles, setProfiles] = useState(() => getStaffProfiles());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // New Training Form State
  const [newModule, setNewModule] = useState({
    title: "",
    category: "Food Safety",
    department: "Kitchen Staff",
    duration: "2 Hours",
    validityMonths: 12,
    description: "",
  });

  const [selectedEmpToEnroll, setSelectedEmpToEnroll] = useState("");

  const refresh = () => {
    setTrainings(getTrainings());
    setProfiles(getStaffProfiles());
  };

  useEffect(() => {
    window.addEventListener("trainingsChanged", refresh);
    window.addEventListener("staffProfilesChanged", refresh);
    return () => {
      window.removeEventListener("trainingsChanged", refresh);
      window.removeEventListener("staffProfilesChanged", refresh);
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(trainings.map((t) => t.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [trainings]);

  const filteredTrainings = useMemo(() => {
    return trainings.filter((t) => {
      const matchSearch = (t.title + " " + t.description + " " + t.category).toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "All" || t.category === categoryFilter;
      const matchDept = deptFilter === "All" || t.department === deptFilter || t.department === "All Departments";
      return matchSearch && matchCategory && matchDept;
    });
  }, [trainings, search, categoryFilter, deptFilter]);

  // Overall Stats
  const stats = useMemo(() => {
    const totalModules = trainings.length;
    let totalCompletions = 0;
    let inProgress = 0;
    trainings.forEach((t) => {
      (t.completions || []).forEach((c) => {
        if (c.status === "Passed") totalCompletions += 1;
        else inProgress += 1;
      });
    });
    return {
      totalModules,
      totalCompletions,
      inProgress,
      complianceRate: totalModules ? Math.round((totalCompletions / (totalCompletions + inProgress || 1)) * 100) : 100,
    };
  }, [trainings]);

  const handleCreateModule = (e) => {
    e.preventDefault();
    if (!newModule.title.trim()) return;
    const item = {
      id: `TRN-${Date.now().toString().slice(-4)}`,
      ...newModule,
      enrolledEmployees: [],
      completions: [],
    };
    const updated = [item, ...trainings];
    saveTrainings(updated);
    setTrainings(updated);
    setIsNewModalOpen(false);
    setNewModule({
      title: "",
      category: "Food Safety",
      department: "Kitchen Staff",
      duration: "2 Hours",
      validityMonths: 12,
      description: "",
    });
  };

  const handleEnroll = () => {
    if (!selectedTraining || !selectedEmpToEnroll) return;
    enrollEmployeeInTraining(selectedTraining.id, selectedEmpToEnroll);
    const updated = getTrainings();
    setTrainings(updated);
    setSelectedTraining(updated.find((t) => t.id === selectedTraining.id));
    setIsEnrollModalOpen(false);
    setSelectedEmpToEnroll("");
  };

  const handleMarkPassed = (trainingId, employeeId) => {
    recordTrainingCompletion(trainingId, employeeId, 95);
    const updated = getTrainings();
    setTrainings(updated);
    if (selectedTraining && selectedTraining.id === trainingId) {
      setSelectedTraining(updated.find((t) => t.id === trainingId));
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-12">
      {/* Top Banner */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="relative isolate px-5 py-6 sm:px-7">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#f0fdf4_0%,#eff6ff_45%,#faf5ff_100%)]" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal-700">
                <GraduationCap size={14} /> Training & Development
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Staff Training & Compliance Hub
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Standard operating procedures, food safety certifications, operational onboarding, and compliance tracking across kitchen and management personnel.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => exportToPDF("trainings-content", "Staff_Trainings_Report.pdf")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <Download size={14} /> Export PDF
              </button>
              <button
                type="button"
                onClick={() => printDocument("trainings-content")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <Printer size={14} /> Print
              </button>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition"
              >
                <Plus size={16} strokeWidth={2.5} /> + New Training Module
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Modules</span>
            <BookOpen size={18} className="text-teal-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalModules}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">SOP & certified courses</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Certified Staff</span>
            <Award size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">{stats.totalCompletions}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Modules passed</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">In Progress</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{stats.inProgress}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Enrolled / awaiting test</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Compliance Rate</span>
            <ShieldCheck size={18} className="text-violet-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-violet-700">{stats.complianceRate}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pass rate on completion</p>
        </div>
      </section>

      {/* Main Content Area */}
      <div id="trainings-content" className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search trainings, certifications, topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-teal-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700">
              <span className="text-slate-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent font-bold outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700">
              <span className="text-slate-400">Dept:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent font-bold outline-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                <option value="Kitchen Staff">Kitchen Staff</option>
                <option value="Management Staff">Management Staff</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTrainings.map((module) => {
            const completions = module.completions || [];
            const passedCount = completions.filter((c) => c.status === "Passed").length;
            const enrolledCount = (module.enrolledEmployees || []).length;

            return (
              <div
                key={module.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-teal-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-800 border border-teal-100">
                      {module.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock size={13} /> {module.duration}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-black text-slate-900 leading-snug">{module.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">{module.description}</p>

                  <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" /> {enrolledCount} Enrolled
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 size={14} className="text-emerald-500" /> {passedCount} Certified
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTraining(module)}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    View Details & Roster
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTraining(module);
                      setIsEnrollModalOpen(true);
                    }}
                    className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 transition"
                  >
                    + Enroll
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Modal */}
      {selectedTraining && !isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-teal-700">{selectedTraining.category}</span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">{selectedTraining.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedTraining.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTraining(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="my-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Duration</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{selectedTraining.duration}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Validity</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{selectedTraining.validityMonths} Months</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Department</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{selectedTraining.department}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900">Enrolled Staff & Certifications</h4>
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="text-xs font-bold text-teal-600 hover:text-teal-800"
                >
                  + Enroll Staff
                </button>
              </div>

              {(selectedTraining.enrolledEmployees || []).length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                  {(selectedTraining.enrolledEmployees || []).map((empId) => {
                    const emp = profiles.find((p) => p.employeeId === empId) || { fullName: empId, jobTitle: "Staff" };
                    const comp = (selectedTraining.completions || []).find((c) => c.employeeId === empId);

                    return (
                      <div key={empId} className="flex items-center justify-between p-3.5 bg-white text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{emp.fullName}</p>
                          <p className="text-[11px] text-slate-500">{emp.jobTitle} • {emp.workLocation || "All Branches"}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          {comp?.status === "Passed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={13} /> Passed (Score: {comp.score}%)
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                                In Progress
                              </span>
                              <button
                                type="button"
                                onClick={() => handleMarkPassed(selectedTraining.id, empId)}
                                className="rounded bg-teal-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-teal-700"
                              >
                                Mark Passed
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                  No staff members currently enrolled in this course.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {isEnrollModalOpen && selectedTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900">Enroll Staff Member</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select an employee to enroll into <strong>{selectedTraining.title}</strong>
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Employee</label>
              <select
                value={selectedEmpToEnroll}
                onChange={(e) => setSelectedEmpToEnroll(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
              >
                <option value="">-- Choose employee --</option>
                {profiles
                  .filter((p) => !(selectedTraining.enrolledEmployees || []).includes(p.employeeId))
                  .map((p) => (
                    <option key={p.employeeId} value={p.employeeId}>
                      {p.fullName} ({p.jobTitle} - {p.workLocation || "Branch"})
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedEmpToEnroll}
                onClick={handleEnroll}
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Confirm Enrollment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Module Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Create Training Module</h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Module Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greek Souvlaki Recipe & Grill Guidelines"
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newModule.category}
                    onChange={(e) => setNewModule({ ...newModule, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-500"
                  >
                    <option value="Food Safety">Food Safety</option>
                    <option value="Operations">Operations</option>
                    <option value="Health & Safety">Health & Safety</option>
                    <option value="Guest Experience">Guest Experience</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Department</label>
                  <select
                    value={newModule.department}
                    onChange={(e) => setNewModule({ ...newModule, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-500"
                  >
                    <option value="Kitchen Staff">Kitchen Staff</option>
                    <option value="Management Staff">Management Staff</option>
                    <option value="All Departments">All Departments</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Hours"
                    value={newModule.duration}
                    onChange={(e) => setNewModule({ ...newModule, duration: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validity (Months)</label>
                  <input
                    type="number"
                    min="1"
                    value={newModule.validityMonths}
                    onChange={(e) => setNewModule({ ...newModule, validityMonths: Number(e.target.value) || 12 })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Key Topics</label>
                <textarea
                  rows="3"
                  placeholder="Outline what skills or safety standards this module covers..."
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-500"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-md shadow-teal-600/20"
                >
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
