import { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderGit2,
  ExternalLink,
  Users,
  Check,
  RotateCcw,
  UserCheck,
  FileText,
  ShieldCheck,
  X,
  Sparkles
} from "lucide-react";
import {
  HANDOVER_CATEGORIES,
  PRIORITIES,
  logExitActivity,
  saveExitCase
} from "../../utils/exitInterviews";
import { getStaffProfiles } from "../../utils/storage";

export default function KnowledgeHandoverTab({ exitCase, onUpdateCase, currentUser }) {
  const staffList = getStaffProfiles().filter(
    (s) => String(s.employmentStatus || "").toLowerCase() !== "inactive" && String(s.employmentStatus || "").toLowerCase() !== "former employee"
  );

  const [activeSubSection, setActiveSubSection] = useState("items"); // "items", "transfer", "managerReview"
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [managerComment, setManagerComment] = useState("");
  const [managerActionError, setManagerActionError] = useState("");

  // Handover Item Form state
  const initialItemForm = {
    title: "",
    category: "Active Project",
    description: "",
    priority: "High",
    deadline: exitCase.lastWorkingDay || "",
    handedOverToId: "",
    importantNotes: "",
    // Project specifics
    projectName: "",
    projectDescription: "",
    currentProgress: 50,
    remainingWork: "",
    clientStakeholder: "",
    importantDependencies: "",
    knownIssues: "",
    recommendedNextSteps: "",
    sharePointLink: "",
    googleDriveLink: ""
  };
  const [itemForm, setItemForm] = useState(initialItemForm);

  // Handover summary calculations
  const handoverItems = exitCase.handoverItems || [];
  const totalItems = handoverItems.length;
  const verifiedCount = handoverItems.filter((i) => i.verificationStatus === "Verified").length;
  const readyCount = handoverItems.filter((i) => i.verificationStatus === "Ready for Handover").length;
  const receivedCount = handoverItems.filter((i) => i.verificationStatus === "Handover Received").length;
  const pendingCount = totalItems - verifiedCount;

  // Responsibilities calculations
  const responsibilities = exitCase.responsibilities || [];
  const totalResp = responsibilities.length;
  const transferredResp = responsibilities.filter((r) => r.status === "Acknowledged" || r.status === "Completed").length;
  const awaitingResp = totalResp - transferredResp;

  const currentUserName = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || "HR Staff";

  // Add Item Handler
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!itemForm.title.trim()) return;

    const handedOverPerson = staffList.find((s) => s.employeeId === itemForm.handedOverToId);

    const newItem = {
      id: `HO-${Date.now()}`,
      title: itemForm.title,
      category: itemForm.category,
      description: itemForm.description,
      priority: itemForm.priority,
      deadline: itemForm.deadline,
      handedOverTo: handedOverPerson ? handedOverPerson.fullName : "Unassigned",
      handedOverToId: itemForm.handedOverToId,
      importantNotes: itemForm.importantNotes,
      verificationStatus: "Pending", // "Pending" -> "Ready for Handover" -> "Handover Received" -> "Verified"
      status: "Pending",
      // Extra details for Projects
      projectName: itemForm.projectName || itemForm.title,
      projectDescription: itemForm.projectDescription,
      currentProgress: Number(itemForm.currentProgress) || 0,
      remainingWork: itemForm.remainingWork,
      clientStakeholder: itemForm.clientStakeholder,
      importantDependencies: itemForm.importantDependencies,
      knownIssues: itemForm.knownIssues,
      recommendedNextSteps: itemForm.recommendedNextSteps,
      links: [
        itemForm.sharePointLink ? { label: "SharePoint Documentation", url: itemForm.sharePointLink } : null,
        itemForm.googleDriveLink ? { label: "Google Drive Folder", url: itemForm.googleDriveLink } : null
      ].filter(Boolean),
      attachments: []
    };

    const updatedCase = {
      ...exitCase,
      handoverItems: [...handoverItems, newItem],
      currentStage: "Knowledge Handover"
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `Handover item added: ${newItem.title}`, currentUserName);
    onUpdateCase(updatedCase);
    setIsAddItemModalOpen(false);
    setItemForm(initialItemForm);
  };

  // State Transition 1: Employee marks Ready for Handover
  const handleMarkReady = (itemId) => {
    const updatedItems = handoverItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          verificationStatus: "Ready for Handover",
          status: "Ready for Handover"
        };
      }
      return item;
    });

    const updatedCase = { ...exitCase, handoverItems: updatedItems };
    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, "Handover item marked Ready for Handover", currentUserName);
    onUpdateCase(updatedCase);
  };

  // State Transition 2: Receiving Employee confirms Handover Received
  const handleMarkReceived = (itemId) => {
    const updatedItems = handoverItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          verificationStatus: "Handover Received",
          status: "Handover Received"
        };
      }
      return item;
    });

    const updatedCase = { ...exitCase, handoverItems: updatedItems };
    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, "Handover item marked as Handover Received", currentUserName);
    onUpdateCase(updatedCase);
  };

  // State Transition 3: Manager verifies Handover
  const handleVerifyItem = (itemId) => {
    const updatedItems = handoverItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          verificationStatus: "Verified",
          status: "Verified"
        };
      }
      return item;
    });

    const updatedCase = { ...exitCase, handoverItems: updatedItems };
    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `Handover item verified by manager`, currentUserName);
    onUpdateCase(updatedCase);
  };

  // Assign Responsibility
  const handleAssignResponsibility = (respId, newOwnerId) => {
    const newOwner = staffList.find((s) => s.employeeId === newOwnerId);
    const updatedResp = responsibilities.map((r) => {
      if (r.id === respId) {
        return {
          ...r,
          newOwnerId,
          newOwner: newOwner ? newOwner.fullName : "",
          transferDate: new Date().toISOString().slice(0, 10),
          status: newOwnerId ? "Assigned" : "Unassigned"
        };
      }
      return r;
    });

    const updatedCase = { ...exitCase, responsibilities: updatedResp };
    saveExitCase(updatedCase);
    logExitActivity(
      exitCase.id,
      `Responsibility transferred to ${newOwner ? newOwner.fullName : "Unassigned"}`,
      currentUserName
    );
    onUpdateCase(updatedCase);
  };

  // Acknowledge Responsibility
  const handleAcknowledgeResponsibility = (respId) => {
    const updatedResp = responsibilities.map((r) => {
      if (r.id === respId) {
        return {
          ...r,
          status: "Acknowledged"
        };
      }
      return r;
    });

    const updatedCase = { ...exitCase, responsibilities: updatedResp };
    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, "Transferred responsibility acknowledged by recipient", currentUserName);
    onUpdateCase(updatedCase);
  };

  // Add new responsibility
  const handleAddResponsibility = () => {
    const title = window.prompt("Enter responsibility title / ongoing operational duty:");
    if (!title) return;

    const newResp = {
      id: `RESP-${Date.now()}`,
      title,
      category: "Operational",
      previousOwner: exitCase.employeeName,
      previousOwnerId: exitCase.employeeId,
      newOwner: "",
      newOwnerId: "",
      transferDate: "",
      status: "Unassigned",
      notes: "Newly identified duty."
    };

    const updatedCase = {
      ...exitCase,
      responsibilities: [...responsibilities, newResp]
    };
    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `Responsibility item added: ${title}`, currentUserName);
    onUpdateCase(updatedCase);
  };

  // Manager Handover Sign-off: Approve
  const handleManagerApprove = () => {
    setManagerActionError("");
    if (pendingCount > 0) {
      setManagerActionError(`Cannot approve handover yet: ${pendingCount} handover item(s) are not yet verified.`);
      return;
    }

    const updatedCase = {
      ...exitCase,
      managerApproval: {
        status: "Approved",
        managerName: exitCase.manager || currentUserName,
        managerId: "",
        decisionDate: new Date().toISOString(),
        managerComment: managerComment || "All handover items and responsibilities verified satisfactorily.",
        requestChangeHistory: exitCase.managerApproval?.requestChangeHistory || []
      },
      currentStage: "Department Clearances"
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, "Manager approved handover", currentUserName, managerComment);
    onUpdateCase(updatedCase);
  };

  // Manager Handover Sign-off: Return for Changes
  const handleManagerReturnChanges = () => {
    setManagerActionError("");
    if (!managerComment.trim()) {
      setManagerActionError("Manager comment is required when returning handover for changes.");
      return;
    }

    const historyEntry = {
      date: new Date().toISOString(),
      manager: currentUserName,
      comment: managerComment
    };

    const updatedCase = {
      ...exitCase,
      managerApproval: {
        status: "Changes Requested",
        managerName: exitCase.manager || currentUserName,
        managerId: "",
        decisionDate: new Date().toISOString(),
        managerComment: managerComment,
        requestChangeHistory: [...(exitCase.managerApproval?.requestChangeHistory || []), historyEntry]
      }
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, "Manager requested changes on handover", currentUserName, managerComment);
    onUpdateCase(updatedCase);
  };

  return (
    <div className="space-y-6">
      {/* Sub-nav Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubSection("items")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeSubSection === "items"
                ? "bg-violet-700 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Handover Items ({totalItems})
          </button>
          <button
            onClick={() => setActiveSubSection("transfer")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeSubSection === "transfer"
                ? "bg-violet-700 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Responsibility Transfer ({totalResp})
          </button>
          <button
            onClick={() => setActiveSubSection("managerReview")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeSubSection === "managerReview"
                ? "bg-violet-700 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Manager Handover Approval (
            <span
              className={
                exitCase.managerApproval?.status === "Approved"
                  ? "text-emerald-300 font-extrabold"
                  : exitCase.managerApproval?.status === "Changes Requested"
                  ? "text-rose-300 font-extrabold"
                  : "text-amber-300 font-extrabold"
              }
            >
              {exitCase.managerApproval?.status || "Pending"}
            </span>
            )
          </button>
        </div>

        {activeSubSection === "items" && (
          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
          >
            <Plus size={15} />
            + Add Handover Item
          </button>
        )}

        {activeSubSection === "transfer" && (
          <button
            onClick={handleAddResponsibility}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
          >
            <Plus size={15} />
            + Add Responsibility
          </button>
        )}
      </div>

      {/* Sub-Section 1: Handover Items */}
      {activeSubSection === "items" && (
        <div className="space-y-5">
          {/* Handover Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Items</span>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalItems}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending</span>
              <p className="mt-1 text-2xl font-black text-amber-900">{pendingCount}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Ready / Received</span>
              <p className="mt-1 text-2xl font-black text-blue-900">{readyCount + receivedCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Verified</span>
              <p className="mt-1 text-2xl font-black text-emerald-900">{verifiedCount}</p>
            </div>
          </div>

          {/* Handover Items Cards List */}
          {handoverItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <FolderGit2 className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-slate-700">No handover items have been added yet.</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                The departing employee or HR should document active projects, tasks, operational processes, and vendor relationships before leaving.
              </p>
              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
              >
                <Plus size={14} /> Add First Handover Item
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {handoverItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800 uppercase tracking-wider">
                          {item.category}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.priority === "High"
                              ? "bg-rose-100 text-rose-800"
                              : item.priority === "Medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.priority} Priority
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            item.verificationStatus === "Verified"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.verificationStatus === "Handover Received"
                              ? "bg-blue-100 text-blue-800"
                              : item.verificationStatus === "Ready for Handover"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.verificationStatus || "Pending"}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    </div>

                    {/* Progress Badge if Project */}
                    {item.currentProgress !== undefined && (
                      <div className="sm:text-right shrink-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Progress</span>
                        <div className="text-lg font-black text-violet-700">{item.currentProgress}%</div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className="bg-violet-600 h-full rounded-full"
                            style={{ width: `${item.currentProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Project Specific Fields */}
                  {item.category === "Active Project" && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      {item.remainingWork && (
                        <div>
                          <span className="text-slate-400 block font-semibold">Remaining Work:</span>
                          <span className="text-slate-800 font-medium">{item.remainingWork}</span>
                        </div>
                      )}
                      {item.clientStakeholder && (
                        <div>
                          <span className="text-slate-400 block font-semibold">Client / Stakeholder:</span>
                          <span className="text-slate-800 font-medium">{item.clientStakeholder}</span>
                        </div>
                      )}
                      {item.importantDependencies && (
                        <div>
                          <span className="text-slate-400 block font-semibold">Important Dependencies:</span>
                          <span className="text-slate-800 font-medium">{item.importantDependencies}</span>
                        </div>
                      )}
                      {item.knownIssues && (
                        <div>
                          <span className="text-slate-400 block font-semibold">Known Issues:</span>
                          <span className="text-slate-800 font-medium">{item.knownIssues}</span>
                        </div>
                      )}
                      {item.recommendedNextSteps && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 block font-semibold">Recommended Next Steps:</span>
                          <span className="text-slate-800 font-medium">{item.recommendedNextSteps}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta Details: Handed Over To, Deadline, Links, Attachments */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-400">Handed Over To: </span>
                        <span className="font-bold text-slate-800">{item.handedOverTo || "Unassigned"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400">Deadline: </span>
                        <span className="font-bold text-slate-800">{item.deadline || "None"}</span>
                      </div>
                      {item.links && item.links.length > 0 && (
                        <div className="flex items-center gap-2">
                          {item.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:underline"
                            >
                              <ExternalLink size={12} />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Verification Actions Workflow */}
                    <div className="flex items-center gap-2">
                      {item.verificationStatus === "Pending" && (
                        <button
                          onClick={() => handleMarkReady(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
                        >
                          <Check size={13} />
                          Ready for Handover
                        </button>
                      )}

                      {item.verificationStatus === "Ready for Handover" && (
                        <button
                          onClick={() => handleMarkReceived(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                        >
                          <Check size={13} />
                          Handover Received
                        </button>
                      )}

                      {item.verificationStatus !== "Verified" && (
                        <button
                          onClick={() => handleVerifyItem(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          <CheckCircle2 size={13} />
                          Verify Handover
                        </button>
                      )}

                      {item.verificationStatus === "Verified" && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 size={15} /> Handover Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Section 2: Responsibility Transfer */}
      {activeSubSection === "transfer" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Responsibility Transfer Matrix</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign day-to-day duties to active employees and obtain formal acknowledgement.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                {totalResp} Responsibilities
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-100">
                {transferredResp} Transferred
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 border border-amber-100">
                {awaitingResp} Awaiting Assignment
              </span>
            </div>
          </div>

          {/* Responsibility List */}
          {responsibilities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <h4 className="mt-2 text-sm font-bold text-slate-700">No responsibilities documented yet.</h4>
              <p className="text-xs text-slate-500 mt-1">
                Click "+ Add Responsibility" to map recurring tasks to ongoing staff members.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Responsibility</th>
                    <th className="px-4 py-3">Previous Owner</th>
                    <th className="px-4 py-3">New Owner</th>
                    <th className="px-4 py-3">Transfer Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {responsibilities.map((resp) => (
                    <tr key={resp.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div>{resp.title}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{resp.category}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{resp.previousOwner}</td>
                      <td className="px-4 py-3">
                        <select
                          value={resp.newOwnerId || ""}
                          onChange={(e) => handleAssignResponsibility(resp.id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                        >
                          <option value="">-- Assign Employee --</option>
                          {staffList.map((emp) => (
                            <option key={emp.employeeId} value={emp.employeeId}>
                              {emp.fullName} ({emp.jobTitle || "Staff"})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{resp.transferDate || "Pending"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            resp.status === "Acknowledged" || resp.status === "Completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : resp.status === "Assigned"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {resp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {resp.status === "Assigned" && (
                          <button
                            onClick={() => handleAcknowledgeResponsibility(resp.id)}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        {resp.status === "Acknowledged" && (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 size={13} /> Acknowledged
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-Section 3: Manager Handover Approval */}
      {activeSubSection === "managerReview" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manager Handover Approval Sign-Off</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct Manager review of departing employee's knowledge transfer before department clearance.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                  exitCase.managerApproval?.status === "Approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : exitCase.managerApproval?.status === "Changes Requested"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                Approval Status: {exitCase.managerApproval?.status || "Pending"}
              </span>
            </div>

            {/* Checklist of prerequisites */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400 block font-medium">Departing Employee</span>
                <span className="font-bold text-slate-800 text-sm">{exitCase.employeeName}</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400 block font-medium">Last Working Day</span>
                <span className="font-bold text-slate-800 text-sm">{exitCase.lastWorkingDay || "Not set"}</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400 block font-medium">Handover Completion</span>
                <span className="font-bold text-slate-800 text-sm">
                  {verifiedCount} / {totalItems} Verified
                </span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-slate-400 block font-medium">Transferred Responsibilities</span>
                <span className="font-bold text-slate-800 text-sm">
                  {transferredResp} / {totalResp} Assigned
                </span>
              </div>
            </div>

            {/* Error banner if trying to approve with unverified items */}
            {managerActionError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{managerActionError}</span>
              </div>
            )}

            {/* Manager Comment Form */}
            <div className="mt-5 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Manager Comments & Handover Review Notes
              </label>
              <textarea
                rows={3}
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
                placeholder="Enter feedback, verification confirmation, or specific required changes..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleManagerApprove}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 size={16} />
                  Approve Handover
                </button>
                <button
                  type="button"
                  onClick={handleManagerReturnChanges}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
                >
                  <RotateCcw size={15} />
                  Return for Changes
                </button>
              </div>
            </div>

            {/* Change Request History */}
            {exitCase.managerApproval?.requestChangeHistory?.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Manager Change Request History
                </h4>
                <div className="space-y-2">
                  {exitCase.managerApproval.requestChangeHistory.map((hist, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs text-rose-900"
                    >
                      <div className="flex items-center justify-between font-bold text-[11px] text-rose-700">
                        <span>{hist.manager}</span>
                        <span>{new Date(hist.date).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 font-medium">{hist.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Handover Item Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <FolderGit2 className="text-violet-700" size={20} />
                <h3 className="text-base font-bold text-slate-900">Add Knowledge Handover Item</h3>
              </div>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  value={itemForm.title}
                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  placeholder="e.g. Greek Souvlaki Website & Online Ordering Specifications"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category *
                  </label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                  >
                    {HANDOVER_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={itemForm.priority}
                    onChange={(e) => setItemForm({ ...itemForm, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={itemForm.deadline}
                    onChange={(e) => setItemForm({ ...itemForm, deadline: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Handed Over To (Staff Member)
                </label>
                <select
                  value={itemForm.handedOverToId}
                  onChange={(e) => setItemForm({ ...itemForm, handedOverToId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                >
                  <option value="">-- Choose active recipient --</option>
                  {staffList.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.fullName} ({emp.jobTitle || "Staff"}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Description / Handover Summary *
                </label>
                <textarea
                  rows={2}
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Detail what needs to be handed over, locations of records, ongoing status..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                  required
                />
              </div>

              {/* Conditional Project fields */}
              {itemForm.category === "Active Project" && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
                  <div className="font-bold text-violet-900 text-xs uppercase tracking-wider">
                    Project Handover Extended Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Current Progress (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={itemForm.currentProgress}
                        onChange={(e) => setItemForm({ ...itemForm, currentProgress: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white focus:border-violet-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Client / Stakeholder</label>
                      <input
                        type="text"
                        value={itemForm.clientStakeholder}
                        onChange={(e) => setItemForm({ ...itemForm, clientStakeholder: e.target.value })}
                        placeholder="e.g. Operations Director"
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white focus:border-violet-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Remaining Work</label>
                    <input
                      type="text"
                      value={itemForm.remainingWork}
                      onChange={(e) => setItemForm({ ...itemForm, remainingWork: e.target.value })}
                      placeholder="e.g. Payment integration and final QA"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white focus:border-violet-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Known Issues</label>
                      <input
                        type="text"
                        value={itemForm.knownIssues}
                        onChange={(e) => setItemForm({ ...itemForm, knownIssues: e.target.value })}
                        placeholder="e.g. Delivery lead times on weekends"
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white focus:border-violet-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Recommended Next Steps</label>
                      <input
                        type="text"
                        value={itemForm.recommendedNextSteps}
                        onChange={(e) => setItemForm({ ...itemForm, recommendedNextSteps: e.target.value })}
                        placeholder="e.g. Conduct pilot test run with Ahmed"
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white focus:border-violet-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Safe Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Safe Link (SharePoint / OneDrive)
                  </label>
                  <input
                    type="url"
                    value={itemForm.sharePointLink}
                    onChange={(e) => setItemForm({ ...itemForm, sharePointLink: e.target.value })}
                    placeholder="https://company.sharepoint.com/..."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium focus:border-violet-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Safe Link (Google Drive / Doc URL)
                  </label>
                  <input
                    type="url"
                    value={itemForm.googleDriveLink}
                    onChange={(e) => setItemForm({ ...itemForm, googleDriveLink: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium focus:border-violet-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200">
                Notice: Do NOT store employee passwords or secret keys in handover items. Store references to safe folders only.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-700 px-5 py-2 font-bold text-white shadow-xs hover:bg-violet-800 transition"
                >
                  Save Handover Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
