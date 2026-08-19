import { motion } from "framer-motion";
import { AlertCircle, BadgeCheck, Banknote, CheckCircle2, Clock3, ReceiptText, ShieldMinus, Users } from "lucide-react";
import { formatVnd } from "../../utils/payroll";

function Metric({ icon: Icon, label, value, tone, important = false }) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border bg-white p-4 shadow-sm ${important ? "border-emerald-200 ring-4 ring-emerald-50" : "border-slate-200"}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </motion.article>
  );
}

export default function PayrollDashboard({ summary }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric icon={Users} label="Total Employees in Payroll" value={summary.totalEmployees} tone="bg-slate-100 text-slate-700" />
      <Metric icon={CheckCircle2} label="Payroll Ready" value={summary.ready} tone="bg-emerald-50 text-emerald-700" />
      <Metric icon={Clock3} label="Pending Attendance" value={summary.pendingAttendance} tone="bg-orange-50 text-orange-700" />
      <Metric icon={AlertCircle} label="Pending Approval" value={summary.pendingApproval} tone="bg-blue-50 text-blue-700" />
      <Metric icon={Banknote} label="Total Payroll Amount" value={formatVnd(summary.totalPayroll)} tone="bg-emerald-50 text-emerald-700" important />
      <Metric icon={ShieldMinus} label="Total Deductions" value={formatVnd(summary.totalDeductions)} tone="bg-rose-50 text-rose-700" />
      <Metric icon={BadgeCheck} label="Paid Employees" value={summary.paid} tone="bg-violet-50 text-violet-700" />
      <Metric icon={ReceiptText} label="Unpaid Employees" value={summary.unpaid} tone="bg-yellow-50 text-yellow-800" />
    </section>
  );
}
