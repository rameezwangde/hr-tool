import { useState } from "react";
import {
  Monitor,
  Laptop,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Info
} from "lucide-react";
import { logExitActivity, saveExitCase } from "../../utils/exitInterviews";

export default function ClearanceTab({ exitCase, onUpdateCase, currentUser }) {
  const [activeDept, setActiveDept] = useState("it"); // "it", "asset", "finance", "hr"

  const currentUserName = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || "HR Staff";

  const clearance = exitCase.clearance || {
    it: [],
    asset: [],
    finance: [],
    hr: []
  };

  // Update IT clearance item
  const handleUpdateIT = (id, newStatus, remarks) => {
    const updatedIT = clearance.it.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          remarks: remarks !== undefined ? remarks : item.remarks,
          clearedBy: newStatus === "Completed" ? currentUserName : item.clearedBy,
          clearedAt: newStatus === "Completed" ? new Date().toISOString() : item.clearedAt
        };
      }
      return item;
    });

    const updatedCase = {
      ...exitCase,
      clearance: { ...clearance, it: updatedIT }
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `IT clearance updated for item (${newStatus})`, currentUserName);
    onUpdateCase(updatedCase);
  };

  // Update Asset item
  const handleUpdateAsset = (id, returnStatus, condition, notes, assetId) => {
    const updatedAsset = clearance.asset.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          returnStatus: returnStatus !== undefined ? returnStatus : item.returnStatus,
          condition: condition !== undefined ? condition : item.condition,
          notes: notes !== undefined ? notes : item.notes,
          assetId: assetId !== undefined ? assetId : item.assetId,
          verifiedBy: returnStatus === "Returned" ? currentUserName : item.verifiedBy,
          returnDate: returnStatus === "Returned" ? new Date().toISOString().slice(0, 10) : item.returnDate
        };
      }
      return item;
    });

    const updatedCase = {
      ...exitCase,
      clearance: { ...clearance, asset: updatedAsset }
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `Asset status updated (${returnStatus || "updated"})`, currentUserName);
    onUpdateCase(updatedCase);
  };

  // Update Finance item
  const handleUpdateFinance = (id, newStatus, remarks) => {
    const updatedFinance = clearance.finance.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          remarks: remarks !== undefined ? remarks : item.remarks,
          clearedBy: newStatus === "Cleared" ? currentUserName : item.clearedBy,
          clearedAt: newStatus === "Cleared" ? new Date().toISOString() : item.clearedAt
        };
      }
      return item;
    });

    const updatedCase = {
      ...exitCase,
      clearance: { ...clearance, finance: updatedFinance }
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `Finance settlement clearance item updated: ${newStatus}`, currentUserName);
    onUpdateCase(updatedCase);
  };

  // Update HR item
  const handleUpdateHR = (id, newStatus, remarks) => {
    const updatedHR = clearance.hr.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          remarks: remarks !== undefined ? remarks : item.remarks,
          clearedBy: newStatus === "Cleared" ? currentUserName : item.clearedBy,
          clearedAt: newStatus === "Cleared" ? new Date().toISOString() : item.clearedAt
        };
      }
      return item;
    });

    const updatedCase = {
      ...exitCase,
      clearance: { ...clearance, hr: updatedHR }
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `HR exit checklist item updated: ${newStatus}`, currentUserName);
    onUpdateCase(updatedCase);
  };

  // Department counts
  const itPending = clearance.it.filter((c) => c.status !== "Completed" && c.status !== "Not Applicable").length;
  const assetPending = clearance.asset.filter((c) => c.returnStatus !== "Returned" && c.returnStatus !== "Not Applicable").length;
  const finPending = clearance.finance.filter((c) => c.status !== "Cleared" && c.status !== "Not Applicable").length;
  const hrPending = clearance.hr.filter((c) => c.status !== "Cleared" && c.status !== "Not Applicable").length;

  return (
    <div className="space-y-6">
      {/* Department Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveDept("it")}
          className={`flex items-center justify-between rounded-2xl p-4 text-left transition border ${
            activeDept === "it"
              ? "border-violet-600 bg-violet-50/60 shadow-xs"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl ${activeDept === "it" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <Monitor size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">IT Clearance</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Email, accounts & systems</p>
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              itPending === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {itPending === 0 ? "Cleared" : `${itPending} Pending`}
          </span>
        </button>

        <button
          onClick={() => setActiveDept("asset")}
          className={`flex items-center justify-between rounded-2xl p-4 text-left transition border ${
            activeDept === "asset"
              ? "border-violet-600 bg-violet-50/60 shadow-xs"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl ${activeDept === "asset" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <Laptop size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">Asset Clearance</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Hardware, keys & badges</p>
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              assetPending === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {assetPending === 0 ? "Returned" : `${assetPending} Pending`}
          </span>
        </button>

        <button
          onClick={() => setActiveDept("finance")}
          className={`flex items-center justify-between rounded-2xl p-4 text-left transition border ${
            activeDept === "finance"
              ? "border-violet-600 bg-violet-50/60 shadow-xs"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl ${activeDept === "finance" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <CreditCard size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">Finance Clearance</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Salary, claims & gratuity</p>
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              finPending === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {finPending === 0 ? "Cleared" : `${finPending} Pending`}
          </span>
        </button>

        <button
          onClick={() => setActiveDept("hr")}
          className={`flex items-center justify-between rounded-2xl p-4 text-left transition border ${
            activeDept === "hr"
              ? "border-violet-600 bg-violet-50/60 shadow-xs"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl ${activeDept === "hr" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              <UserCheck size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">HR Clearance</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Notice, docs & interview</p>
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              hrPending === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {hrPending === 0 ? "Cleared" : `${hrPending} Pending`}
          </span>
        </button>
      </div>

      {/* DEPARTMENT 1: IT CLEARANCE */}
      {activeDept === "it" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">IT & System Access Clearance Checklist</h3>
              <p className="text-xs text-slate-500">Revoke permissions, close system seats, and archive files.</p>
            </div>
            <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] text-blue-800 border border-blue-200 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} />
              Policy Notice: Passwords are never requested or stored.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Access / System</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks / Scheduling</th>
                  <th className="px-4 py-3">Verified By</th>
                  <th className="px-4 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clearance.it.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.item}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "Scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "Not Applicable"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={item.remarks}
                        onBlur={(e) => handleUpdateIT(item.id, item.status, e.target.value)}
                        placeholder="Add revocation notes..."
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 focus:border-violet-600 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.clearedBy ? (
                        <span>
                          {item.clearedBy}
                          <span className="block text-[10px] text-slate-400">
                            {item.clearedAt ? new Date(item.clearedAt).toLocaleDateString() : ""}
                          </span>
                        </span>
                      ) : (
                        "Pending"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateIT(item.id, e.target.value, item.remarks)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENT 2: ASSET CLEARANCE */}
      {activeDept === "asset" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Company Physical Asset Return Register</h3>
              <p className="text-xs text-slate-500">Track equipment condition, asset barcodes, and return verifications.</p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {clearance.asset.filter((a) => a.returnStatus === "Returned").length} of {clearance.asset.length} Returned
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Asset Tag / ID</th>
                  <th className="px-4 py-3">Return Status</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Return Date</th>
                  <th className="px-4 py-3">Verified By</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clearance.asset.map((ast) => (
                  <tr key={ast.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div>{ast.asset}</div>
                      {ast.notes && <div className="text-[10px] text-slate-400 font-normal">{ast.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={ast.assetId || ""}
                        onBlur={(e) => handleUpdateAsset(ast.id, ast.returnStatus, ast.condition, ast.notes, e.target.value)}
                        placeholder="AST-XXX-00"
                        className="w-24 rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-slate-700 font-mono focus:border-violet-600 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          ast.returnStatus === "Returned"
                            ? "bg-emerald-100 text-emerald-800"
                            : ast.returnStatus === "Damaged" || ast.returnStatus === "Lost"
                            ? "bg-rose-100 text-rose-800"
                            : ast.returnStatus === "Not Applicable"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ast.returnStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={ast.condition || "Good"}
                        onChange={(e) => handleUpdateAsset(ast.id, ast.returnStatus, e.target.value, ast.notes, ast.assetId)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 focus:border-violet-600 focus:outline-none"
                      >
                        <option value="Good">Good</option>
                        <option value="Minor Wear">Minor Wear</option>
                        <option value="Damaged">Damaged</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{ast.returnDate || "Pending"}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{ast.verifiedBy || "Pending"}</td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={ast.returnStatus}
                        onChange={(e) => handleUpdateAsset(ast.id, e.target.value, ast.condition, ast.notes, ast.assetId)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none"
                      >
                        <option value="Pending Return">Pending Return</option>
                        <option value="Returned">Returned</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Lost">Lost</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENT 3: FINANCE CLEARANCE */}
      {activeDept === "finance" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Finance & Final Settlement Checklist</h3>
              <p className="text-xs text-slate-500">Prorated salary, expense reimbursements, advances, and gratuity approval.</p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {clearance.finance.filter((f) => f.status === "Cleared").length} of {clearance.finance.length} Cleared
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Finance Item</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Settlement Remarks</th>
                  <th className="px-4 py-3">Cleared By</th>
                  <th className="px-4 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clearance.finance.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.item}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "Cleared"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "Processing"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "Not Applicable"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={item.remarks}
                        onBlur={(e) => handleUpdateFinance(item.id, item.status, e.target.value)}
                        placeholder="Add calculation notes..."
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 focus:border-violet-600 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {item.clearedBy || "Pending"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateFinance(item.id, e.target.value, item.remarks)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Cleared">Cleared</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENT 4: HR CLEARANCE */}
      {activeDept === "hr" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">HR Operations Checklist</h3>
              <p className="text-xs text-slate-500">Notice completion, certificates, exit interview, and employment records.</p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {clearance.hr.filter((h) => h.status === "Cleared").length} of {clearance.hr.length} Cleared
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">HR Requirement</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Documentation Remarks</th>
                  <th className="px-4 py-3">Verified By</th>
                  <th className="px-4 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clearance.hr.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{item.item}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "Cleared"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "Processing"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "Not Applicable"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={item.remarks}
                        onBlur={(e) => handleUpdateHR(item.id, item.status, e.target.value)}
                        placeholder="Add HR verification remarks..."
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 focus:border-violet-600 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {item.clearedBy || "Pending"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateHR(item.id, e.target.value, item.remarks)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Cleared">Cleared</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
