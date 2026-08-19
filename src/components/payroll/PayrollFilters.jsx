import { BriefcaseBusiness, Building2, CalendarDays, CircleDot, Search, SunMedium, Users } from "lucide-react";
import { SHIFT_OPTIONS, SLIP_STATUSES } from "../../utils/payroll";

function Select({ icon: Icon, value, onChange, options, all }) {
  return (
    <label className="relative block">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100">
        <option value="">{all}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function PayrollFilters({ filters, setFilters, options }) {
  const update = (patch) => setFilters({ ...filters, ...patch });
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 xl:grid-cols-[170px_repeat(5,minmax(140px,1fr))_1.3fr]">
        <label className="relative block">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input type="month" value={filters.month} onChange={(event) => update({ month: event.target.value })} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
        </label>
        <Select icon={Building2} value={filters.branch} onChange={(value) => update({ branch: value })} options={options.branches} all="All branches" />
        <Select icon={Users} value={filters.department} onChange={(value) => update({ department: value })} options={options.departments} all="All departments" />
        <Select icon={BriefcaseBusiness} value={filters.position} onChange={(value) => update({ position: value })} options={options.positions} all="All positions" />
        <Select icon={SunMedium} value={filters.shift} onChange={(value) => update({ shift: value })} options={SHIFT_OPTIONS} all="All shifts" />
        <Select icon={CircleDot} value={filters.status} onChange={(value) => update({ status: value })} options={SLIP_STATUSES} all="All statuses" />
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input value={filters.search} onChange={(event) => update({ search: event.target.value })} placeholder="Search employee or ID" className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
        </label>
      </div>
    </section>
  );
}
