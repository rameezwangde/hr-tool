import { useCallback, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X, XCircle } from "lucide-react";
import { ATTENDANCE_STATUSES, EXCEL_TEMPLATE_HEADERS, parseExcelRows } from "../../utils/payroll";

function downloadTemplate() {
  const sampleRows = [
    EXCEL_TEMPLATE_HEADERS,
    ["EMP-0001", "Jane Doe", "2026-08-01", "Morning", "Present", "09:30", "17:00", "30", ""],
    ["EMP-0002", "John Smith", "2026-08-01", "Evening", "Present", "16:40", "24:00", "30", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(sampleRows);
  ws["!cols"] = EXCEL_TEMPLATE_HEADERS.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, "Attendance_Template.xlsx");
}

export default function ExcelImport({ employees, records, onImport, onClose }) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [importMode, setImportMode] = useState("merge");
  const fileRef = useRef();

  const processFile = useCallback((file) => {
    if (!file) return;
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const result = parseExcelRows(rawRows, employees);
        setParsed({ ...result, fileName: file.name });
      } catch (err) {
        alert("Failed to read file: " + err.message);
      }
      setParsing(false);
    };
    reader.readAsArrayBuffer(file);
  }, [employees]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleConfirm = () => {
    if (!parsed?.matched?.length) return;
    const keys = new Set(parsed.matched.map((r) => r.employeeId + "::" + r.date + "::" + r.shift));
    const base = importMode === "replace" ? [] : records.filter((r) => !keys.has(r.employeeId + "::" + r.date + "::" + r.shift));
    onImport([...base, ...parsed.matched]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-violet-600">Payroll</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Import Attendance from Excel</h2>
            <p className="mt-1 text-sm text-slate-500">Upload a .xlsx or .csv file to auto-populate attendance records.</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!parsed ? (
            <div className="p-5 space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={"flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-14 transition-colors " + (dragging ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/40")}
              >
                {parsing ? (
                  <Loader2 className="animate-spin text-violet-500" size={36} />
                ) : (
                  <>
                    <FileSpreadsheet className="text-violet-400" size={40} />
                    <p className="font-black text-slate-700">Drop your Excel file here</p>
                    <p className="text-sm text-slate-400">or click to browse · .xlsx, .xls, .csv</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => processFile(e.target.files?.[0])}
              />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Expected columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXCEL_TEMPLATE_HEADERS.map((h) => (
                    <span key={h} className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{h}</span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Employee matched by Employee ID or Employee Name. Worked Hours auto-calculated from Check In/Out if blank.
                  Valid statuses: {ATTENDANCE_STATUSES.join(", ")}.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">
                  <CheckCircle2 size={15} /> {parsed.matched.length} rows ready
                </span>
                {parsed.skipped.length > 0 && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-black text-rose-700">
                    <XCircle size={15} /> {parsed.skipped.length} skipped
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-400 truncate">{parsed.fileName}</span>
                <button onClick={() => setParsed(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Change file</button>
              </div>

              {parsed.skipped.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-black text-amber-800">
                    <AlertTriangle size={13} /> Skipped rows
                  </p>
                  {parsed.skipped.slice(0, 8).map((s) => (
                    <p key={s.rowIndex} className="text-xs text-amber-700">Row {s.rowIndex}: {s.reason}</p>
                  ))}
                  {parsed.skipped.length > 8 && (
                    <p className="text-xs text-amber-600">...and {parsed.skipped.length - 8} more</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-600 shrink-0">On conflict:</p>
                {[
                  { v: "merge", label: "Replace same day/shift rows" },
                  { v: "replace", label: "Clear ALL existing and reimport" },
                ].map(({ v, label }) => (
                  <label key={v} className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-slate-700">
                    <input type="radio" name="importMode" value={v} checked={importMode === v} onChange={() => setImportMode(v)} className="accent-violet-600" />
                    {label}
                  </label>
                ))}
              </div>

              <div className="overflow-auto rounded-xl border border-slate-200 max-h-60">
                <table className="min-w-max table-auto text-xs">
                  <thead className="sticky top-0 bg-slate-100">
                    <tr>
                      {["#", "Employee", "Date", "Shift", "Status", "Check In", "Check Out", "Hours"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wide text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.matched.map((r, i) => (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-800">{r.employeeName}</td>
                        <td className="px-3 py-1.5">{r.date}</td>
                        <td className="px-3 py-1.5">
                          <span className={"rounded-full px-2 py-0.5 text-[10px] font-black " + (r.shift === "Morning" ? "bg-sky-50 text-sky-700" : "bg-indigo-50 text-indigo-700")}>
                            {r.shift}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">{r.status}</td>
                        <td className="px-3 py-1.5">{r.checkIn || "-"}</td>
                        <td className="px-3 py-1.5">{r.checkOut || "-"}</td>
                        <td className="px-3 py-1.5 font-bold">{r.workedHours ? Number(r.workedHours).toFixed(1) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!parsed.matched.length && (
                  <p className="py-8 text-center text-sm font-semibold text-slate-400">No matchable rows found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            <Download size={15} /> Download Template
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
            {parsed && (
              <button
                onClick={handleConfirm}
                disabled={!parsed.matched.length}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-black text-white shadow hover:bg-violet-500 disabled:opacity-40"
              >
                <Upload size={15} /> Import {parsed.matched.length} rows
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
