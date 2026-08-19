import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export default function RosterFilters({ filters, setFilters, onPrev, onNext, onToday }) {
  const update = (patch) => setFilters({ ...filters, ...patch });
  const [year, month] = filters.month.split("-");
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[auto_1fr_1fr_1fr] items-center">
        <div className="flex gap-2 w-full md:w-auto">
          <button type="button" onClick={onPrev} className="flex h-11 flex-1 md:flex-none md:w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer" title="Previous month"><ChevronLeft size={18} /></button>
          <button type="button" onClick={onToday} className="h-11 px-6 text-sm font-black text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer">Today</button>
          <button type="button" onClick={onNext} className="flex h-11 flex-1 md:flex-none md:w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer" title="Next month"><ChevronRight size={18} /></button>
        </div>
        <label className="relative block w-full">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <select value={month} onChange={(event) => update({ month: `${year}-${event.target.value}` })} className="w-full h-11 appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 cursor-pointer">
            {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <div className="relative block w-full">
          <input value={year} onChange={(event) => update({ month: `${event.target.value}-${month}` })} className="w-full h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" placeholder="Year" />
        </div>
        <label className="relative block w-full">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <select value={filters.week || "all"} onChange={(event) => update({ week: event.target.value })} className="w-full h-11 appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100 cursor-pointer">
            <option value="all">All Weeks</option>
            <option value="1">Week 1 (Days 1 - 7)</option>
            <option value="2">Week 2 (Days 8 - 14)</option>
            <option value="3">Week 3 (Days 15 - 21)</option>
            <option value="4">Week 4 (Days 22 - 28)</option>
            <option value="5">Week 5 (Days 29+)</option>
          </select>
        </label>
      </div>
    </section>
  );
}
