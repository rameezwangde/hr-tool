import { statusStyles } from "../../utils/payroll";

export default function PayrollStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusStyles[status] || statusStyles.Draft}`}>
      {status || "Draft"}
    </span>
  );
}
