import { Download, Eye, Printer, RefreshCw, Trash2 } from "lucide-react";
import { formatVnd } from "../../utils/payroll";
import PayrollStatusBadge from "./PayrollStatusBadge";

export default function PayrollHistory({ slips, onStatus, onDelete, onExport, onPrint, onView }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-black text-slate-950">Payroll History</h2>
        <p className="mt-1 text-sm text-slate-500">Approved, paid, draft, and recalculated salary slips.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              {["Payroll Month", "Employee", "Employee ID", "Branch", "Position", "Morning Hours", "Evening Hours", "Gross Earnings", "Deductions", "Final Payable", "Status", "Payment Date", "Actions"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slips.map((slip) => (
              <tr key={slip.id}>
                <td className="px-4 py-3 font-bold">{slip.month}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{slip.employeeName}</td>
                <td className="px-4 py-3 text-slate-500">{slip.employeeId}</td>
                <td className="px-4 py-3">{slip.branch}</td>
                <td className="px-4 py-3">{slip.position}</td>
                <td className="px-4 py-3">{Number(slip.hoursM || 0).toFixed(2)}</td>
                <td className="px-4 py-3">{Number(slip.hoursE || 0).toFixed(2)}</td>
                <td className="px-4 py-3 font-bold">{formatVnd(slip.grossEarnings)}</td>
                <td className="px-4 py-3 font-bold text-rose-600">{formatVnd(slip.deductions)}</td>
                <td className="px-4 py-3 font-black text-emerald-700">{formatVnd(slip.finalPayable)}</td>
                <td className="px-4 py-3"><PayrollStatusBadge status={slip.status} /></td>
                <td className="px-4 py-3">{slip.paymentDate || ""}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button type="button" onClick={() => onView(slip)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="View"><Eye size={15} /></button>
                    <button type="button" onClick={() => onExport("salary-slip-print")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Export PDF"><Download size={15} /></button>
                    <button type="button" onClick={() => onPrint("salary-slip-print")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Print"><Printer size={15} /></button>
                    <button type="button" onClick={() => onStatus(slip, "Paid")} className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Mark Paid</button>
                    <button type="button" onClick={() => onStatus(slip, "Ready for Review")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Recalculate"><RefreshCw size={15} /></button>
                    <button type="button" onClick={() => onDelete(slip)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete payroll record"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!slips.length && (
              <tr><td colSpan="13" className="px-4 py-12 text-center font-bold text-slate-500">No payroll history found for the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
