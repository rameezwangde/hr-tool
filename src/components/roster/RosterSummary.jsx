import { motion } from "framer-motion";
import { AlertTriangle, CalendarOff, CheckCircle2, Send, SunMedium, Sunset, Users, UserX } from "lucide-react";
import RosterStatusBadge from "./RosterStatusBadge";

function Card({ icon: Icon, label, value, tone }) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
    </motion.article>
  );
}

export default function RosterSummary({ summary, status }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card icon={Users} label="Total Active Staff" value={summary.totalActive} tone="bg-slate-100 text-slate-700" />
      <Card icon={CheckCircle2} label="Scheduled Employees" value={summary.scheduled} tone="bg-emerald-50 text-emerald-700" />
      <Card icon={UserX} label="Unscheduled Employees" value={summary.unscheduled} tone="bg-orange-50 text-orange-700" />
      <Card icon={SunMedium} label="Morning Coverage" value={`${summary.morningCoverage}%`} tone="bg-sky-50 text-sky-700" />
      <Card icon={Sunset} label="Evening Coverage" value={`${summary.eveningCoverage}%`} tone="bg-indigo-50 text-indigo-700" />
      <Card icon={AlertTriangle} label="Understaffed Positions" value={summary.understaffed} tone="bg-rose-50 text-rose-700" />
      <Card icon={CalendarOff} label="Employees on Leave / OFF" value={`${summary.leaveCount} / ${summary.offDays}`} tone="bg-purple-50 text-purple-700" />
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><Send size={20} /></div>
        <p className="text-lg font-black text-slate-950"><RosterStatusBadge status={status} type="roster" /></p>
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">Published Status</p>
      </div>
    </section>
  );
}
