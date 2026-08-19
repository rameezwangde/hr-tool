import { entryStatusStyles, rosterStatusStyles } from "../../utils/roster";

export default function RosterStatusBadge({ status, type = "entry" }) {
  const styles = type === "roster" ? rosterStatusStyles : entryStatusStyles;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${styles[status] || styles.Working || styles.Draft}`}>
      {status}
    </span>
  );
}
