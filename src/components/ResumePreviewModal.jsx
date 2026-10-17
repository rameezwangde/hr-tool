import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  ExternalLink,
  X,
  Phone,
  Mail,
  Briefcase,
  CheckCircle,
  Calendar,
  User,
  Sparkles,
} from "lucide-react";
import { exportToPDF } from "../utils/pdfGenerator";

export default function ResumePreviewModal({ candidate, onClose }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const modalContentRef = useRef(null);

  if (!candidate) return null;

  const handleDownloadPdf = () => {
    exportToPDF("rendered-resume-document", `${candidate.fullName.replace(/\s+/g, "_")}_Resume.pdf`);
  };

  const handlePrint = () => {
    const printContent = document.getElementById("rendered-resume-document");
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${candidate.fullName} - Resume</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; }
            h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
            h2 { font-size: 16px; margin-top: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; color: #0f172a; }
            p { font-size: 13px; line-height: 1.5; margin: 4px 0; }
            .badge { display: inline-block; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 4px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 transition-all duration-200 ${
          isMaximized ? "w-full h-full max-w-none" : "w-full max-w-4xl h-[90vh]"
        }`}
      >
        {/* Top toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/20">
              <FileText size={18} strokeWidth={2.2} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{candidate.fullName} — Resume Preview</h3>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                  PDF Preview
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Applied for <span className="font-semibold text-slate-700">{candidate.roleApplied}</span> • {candidate.resumeFileName || "Candidate_Resume.pdf"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              title="Download PDF"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handlePrint}
              title="Print Resume"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Restore size" : "Maximize"}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              title="Close Preview"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Viewer Frame */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-8 flex justify-center">
          {/* If the candidate uploaded a raw blob/data URL or PDF file */}
          {candidate.resumeUrl && candidate.resumeUrl.startsWith("data:application/pdf") ? (
            <iframe
              src={candidate.resumeUrl}
              title="Uploaded PDF Resume"
              className="w-full h-full rounded-xl bg-white shadow-lg border border-slate-200"
            />
          ) : (
            /* High-fidelity stylized PDF A4 Sheet */
            <div
              id="rendered-resume-document"
              ref={modalContentRef}
              className="w-full max-w-2xl min-h-[850px] bg-white rounded-xl shadow-xl border border-slate-200 p-8 sm:p-12 text-slate-800 flex flex-col justify-between"
            >
              {/* Header Section */}
              <div>
                <div className="border-b-2 border-slate-900 pb-5 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
                        {candidate.fullName}
                      </h1>
                      <p className="text-base font-bold text-orange-600 mt-0.5">
                        {candidate.roleApplied}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Department: {candidate.department || "General"}
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-end gap-1.5 font-medium">
                        <span>{candidate.phone || "No phone provided"}</span>
                        <Phone size={13} className="text-slate-400" />
                      </div>
                      <div className="flex items-center justify-end gap-1.5 font-medium">
                        <span>{candidate.email || "No email provided"}</span>
                        <Mail size={13} className="text-slate-400" />
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-slate-500">
                        <span>Applied: {new Date(candidate.createdAt || Date.now()).toLocaleDateString()}</span>
                        <Calendar size={13} className="text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Profile / Summary */}
                <div className="mb-6">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-100 pb-1">
                    Professional Summary
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {candidate.resumeSummary ||
                      `Enthusiastic and results-driven professional applying for the position of ${candidate.roleApplied}. Dedicated to upholding culinary and operational excellence, ensuring high standards in hospitality, safety, and team collaboration.`}
                  </p>
                </div>

                {/* Experience & Background */}
                <div className="mb-6">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-100 pb-1">
                    Experience & Background
                  </h2>
                  <div className="space-y-3">
                    <div className="border-l-2 border-orange-500 pl-3">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold text-sm text-slate-900">{candidate.roleApplied}</h3>
                        <span className="text-xs text-slate-500 font-medium">Recent Experience</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {candidate.experience || "Extensive hands-on practical experience in fast-paced F&B hospitality environments."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Core Competencies & Skills */}
                <div className="mb-6">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-100 pb-1">
                    Key Competencies & Skills
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(candidate.skills && candidate.skills.length > 0
                      ? candidate.skills
                      : ["Punctuality", "Team Collaboration", "Customer Care", "Safety & Hygiene", "Multitasking"]
                    ).map((skill, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* HR Interview & Screening Notes */}
                {candidate.notes && (
                  <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
                    <h2 className="text-xs font-black uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      HR Preliminary Screening Notes
                    </h2>
                    <p className="text-xs text-amber-900 leading-relaxed italic">
                      "{candidate.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Document Footer */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400">
                <span>Greek Souvlaki — Candidate Screening Portal</span>
                <span>Verified Candidate Profile • Application ID: {candidate.id}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Current Status: <span className="font-bold text-slate-800">{candidate.status || "Under Review"}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
          >
            Close Preview
          </button>
        </div>
      </motion.div>
    </div>
  );
}
