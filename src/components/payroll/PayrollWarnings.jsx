import { AlertTriangle } from "lucide-react";

export default function PayrollWarnings({ warnings }) {
  if (!warnings.length) return null;
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={20} />
        <div>
          <p className="font-black">Payroll needs attention</p>
          <div className="mt-2 grid gap-1 text-sm font-semibold">
            {warnings.slice(0, 8).map((warning) => <p key={warning}>{warning}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}
