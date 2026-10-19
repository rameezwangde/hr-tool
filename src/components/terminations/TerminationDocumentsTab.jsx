import { useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
  X,
  FileCheck2,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { logTerminationActivity, saveTerminationCase } from "../../utils/terminations";

const DOC_CATEGORIES = [
  "Warning Letters",
  "Performance Reviews",
  "PIP Documents",
  "Attendance Reports",
  "Manager Reports",
  "Incident Reports",
  "Employee Responses",
  "Termination Approval",
  "Termination Letter",
  "Settlement Documents",
  "Other HR Documents"
];

export default function TerminationDocumentsTab({ termCase, onUpdateCase, currentUser }) {
  const currentUserName = currentUser?.user_metadata?.full_name || "HR Staff";
  const documents = termCase.documents || [];

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("Warning Letters");
  const [visibility, setVisibility] = useState("Restricted HR");
  const [previewDoc, setPreviewDoc] = useState(null);

  // Upload document
  const handleUpload = (e) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newDoc = {
      id: `doc-term-${Date.now()}`,
      name: docName.endsWith(".pdf") ? docName : `${docName}.pdf`,
      category: docCategory,
      uploadedBy: currentUserName,
      uploadDate: new Date().toISOString().slice(0, 10),
      visibility: visibility,
      status: "Verified"
    };

    const updated = {
      ...termCase,
      documents: [...documents, newDoc]
    };

    saveTerminationCase(updated);
    logTerminationActivity(termCase.id, `Document uploaded: ${newDoc.name} (${newDoc.category})`, currentUserName);
    onUpdateCase(updated);
    setIsUploadOpen(false);
    setDocName("");
  };

  // Delete document
  const handleDelete = (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete ${docTitle}?`)) return;

    const updatedDocs = documents.filter((d) => d.id !== docId);
    const updated = { ...termCase, documents: updatedDocs };
    saveTerminationCase(updated);
    logTerminationActivity(termCase.id, `Document deleted: ${docTitle}`, currentUserName);
    onUpdateCase(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Documents & Evidence Dossier</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Progressive discipline notices, PIP evaluations, supervisor incident reports, and issued termination notices.
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
        >
          <Upload size={14} /> Upload Evidence / Letter
        </button>
      </div>

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h4 className="mt-3 text-sm font-bold text-slate-700">No documents or evidence uploaded yet.</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Attach written warnings, performance evaluations, attendance logs, or the signed termination letter.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
          >
            <Upload size={14} /> Upload First Document
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3">Upload Date</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileCheck2 size={16} className="text-violet-600 shrink-0" />
                      <span>{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">{doc.category}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.uploadedBy}</td>
                  <td className="px-4 py-3 text-slate-500">{doc.uploadDate || "Recent"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        doc.visibility === "Restricted HR"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {doc.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => alert(`Downloading ${doc.name}...`)}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.name)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h4 className="text-base font-bold text-slate-900">Upload Termination Evidence / Document</h4>
              <button onClick={() => setIsUploadOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Document Category *
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none"
                >
                  {DOC_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Document Filename *
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Disciplinary_Hearing_Minutes_Oct2026.pdf"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Access & Visibility Permission *
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none"
                >
                  <option value="Restricted HR">Restricted HR (Confidential to HR & Approvers)</option>
                  <option value="Visible to Employee">Visible to Employee (Notice & Formal Letters)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-700 px-5 py-2 font-bold text-white shadow-xs hover:bg-violet-800 transition"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="text-violet-700" size={20} />
                <h4 className="font-bold text-slate-900 text-sm">{previewDoc.name}</h4>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-5 text-center space-y-3">
              <FileText className="mx-auto h-16 w-16 text-violet-400" />
              <div>
                <p className="text-sm font-bold text-slate-800">{previewDoc.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Category: {previewDoc.category} • {previewDoc.visibility}</p>
                <p className="text-xs text-slate-400 mt-1">Uploaded by: {previewDoc.uploadedBy} on {previewDoc.uploadDate}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                Evidence item verified. Stored in institutional disciplinary archive.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
