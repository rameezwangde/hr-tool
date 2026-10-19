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
  AlertCircle
} from "lucide-react";
import { logExitActivity, saveExitCase } from "../../utils/exitInterviews";

const DOCUMENT_TYPES = [
  "Resignation Letter",
  "Handover Document",
  "Clearance Form",
  "Exit Interview Report",
  "Experience / Service Certificate",
  "Final Settlement Document",
  "Other Exit Documents"
];

export default function DocumentsTab({ exitCase, onUpdateCase, currentUser }) {
  const currentUserName = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || "HR Staff";
  const documents = exitCase.documents || [];

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Handover Document");
  const [docSize, setDocSize] = useState("450 KB");
  const [previewDoc, setPreviewDoc] = useState(null);

  // Upload document handler
  const handleUpload = (e) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: docName.endsWith(".pdf") ? docName : `${docName}.pdf`,
      type: docType,
      uploadedBy: currentUserName,
      uploadedAt: new Date().toISOString(),
      size: docSize || "350 KB",
      status: "Verified"
    };

    const updatedCase = {
      ...exitCase,
      documents: [...documents, newDoc]
    };

    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `Document uploaded: ${newDoc.name} (${newDoc.type})`, currentUserName);
    onUpdateCase(updatedCase);
    setIsUploadModalOpen(false);
    setDocName("");
  };

  // Delete document
  const handleDeleteDoc = (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${docTitle}"?`)) return;

    const updatedDocs = documents.filter((d) => d.id !== docId);
    const updatedCase = { ...exitCase, documents: updatedDocs };
    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `Document deleted: ${docTitle}`, currentUserName);
    onUpdateCase(updatedCase);
  };

  // Replace document
  const handleReplaceDoc = (docId) => {
    const newFileName = window.prompt("Enter new document filename or version:");
    if (!newFileName) return;

    const updatedDocs = documents.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          name: newFileName.endsWith(".pdf") ? newFileName : `${newFileName}.pdf`,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUserName
        };
      }
      return d;
    });

    const updatedCase = { ...exitCase, documents: updatedDocs };
    saveExitCase(updatedCase);
    logExitActivity(exitCase.id, `Document replaced: ${newFileName}`, currentUserName);
    onUpdateCase(updatedCase);
  };

  // Download dummy action
  const handleDownloadDoc = (doc) => {
    alert(`Downloading ${doc.name}... In a production backend, this retrieves the binary file from secure cloud storage.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Exit & Offboarding Documents</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Store signed resignation letters, handover dossiers, service experience certificates, and final settlement records.
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition"
        >
          <Upload size={14} />
          Upload Document
        </button>
      </div>

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h4 className="mt-3 text-sm font-bold text-slate-700">No exit documents uploaded yet.</h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Upload resignation notices, handover summaries, experience letters, or settlement forms.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
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
                <th className="px-4 py-3">Document Name</th>
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3">Upload Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileCheck2 size={16} className="text-violet-600 shrink-0" />
                      <div>
                        <span>{doc.name}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{doc.size || "PDF File"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">{doc.type}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.uploadedBy}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        doc.status === "Verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : doc.status === "Draft"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {doc.status || "Uploaded"}
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
                        onClick={() => handleDownloadDoc(doc)}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleReplaceDoc(doc.id)}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition"
                        title="Replace"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.name)}
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

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h4 className="text-base font-bold text-slate-900">Upload Exit Document</h4>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Document Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-violet-600 focus:outline-none"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
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
                  placeholder="e.g. Experience_Certificate_Signed.pdf"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Estimated File Size
                </label>
                <input
                  type="text"
                  value={docSize}
                  onChange={(e) => setDocSize(e.target.value)}
                  placeholder="e.g. 520 KB"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-800 focus:border-violet-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
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

      {/* Document Preview Modal */}
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
                <p className="text-xs text-slate-500 mt-0.5">Type: {previewDoc.type} • {previewDoc.size}</p>
                <p className="text-xs text-slate-400 mt-1">Uploaded by: {previewDoc.uploadedBy}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                Document integrity verified. Stored in institutional offboarding archive.
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
