import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Network,
  Printer,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import StaffProfileModal from "../components/StaffProfileModal";
import {
  getContracts,
  getStaffProfiles,
  getWorkLocations,
  updateStaffProfile,
} from "../utils/storage";

const DEFAULT_FILTERS = {
  branch: "",
  department: "",
  position: "",
  group: "",
  shift: "",
  status: "active",
};

const managementKeywords = [
  "ceo",
  "coo",
  "manager",
  "human resource",
  "hr",
  "account",
  "finance",
  "admin",
  "purchase",
  "inventory",
  "operation",
  "marketing",
  "it",
  "director",
  "controller",
];

const MANAGEMENT_ROLES = [
  { title: "Human Resource", aliases: ["human resource", "hr"] },
  { title: "Accountant", aliases: ["accountant", "account", "finance"] },
  { title: "Purchase", aliases: ["purchase", "inventory"] },
  { title: "Admin", aliases: ["admin", "document controller", "office admin"] },
];

const KITCHEN_ROLES = [
  { code: "CK", title: "Cooking", aliases: ["cooking", "cook"] },
  { code: "WR", title: "Wrapping", aliases: ["wrapping", "wrap"] },
  { code: "Du", title: "Dough", aliases: ["dough"] },
  { code: "HP", title: "Helping", aliases: ["helping", "helper", "help"] },
  { code: "CA", title: "Cashier", aliases: ["cashier"] },
];

const normalize = (value) => String(value || "").trim();
const lower = (value) => normalize(value).toLowerCase();

const splitList = (value) =>
  Array.isArray(value)
    ? value.map(normalize).filter(Boolean)
    : String(value || "").split(";").map(normalize).filter(Boolean);

const getProfileBranches = (profile) => {
  const values = [
    profile.statusReportBranch,
    profile.workLocation1,
    profile.workLocation2,
    profile.workLocation3,
    profile.workLocation,
    profile.branch,
  ].flatMap(splitList).filter(Boolean);
  return values.length ? [...new Set(values)] : ["Unassigned Branch"];
};

const getProfileBranch = (profile) => getProfileBranches(profile)[0] || "Unassigned Branch";
const getProfileShifts = (profile) => splitList(profile.assignedShifts || profile.assignedShift);
const isInactive = (profile) => lower(profile.employmentStatus) === "inactive";
const isTerminated = (profile) =>
  ["terminated", "resigned"].includes(lower(profile.employmentStatus))
  || ["terminated"].includes(lower(profile.contractStatus));

const isBranchManagerTitle = (title = "") => {
  const text = lower(title);
  return text.includes("branch manager") || text.includes("store manager");
};

const isBranchManager = (profile) => isBranchManagerTitle(profile.jobTitle);

const isManagementPosition = (title = "", department = "") =>
  managementKeywords.some((keyword) => `${lower(title)} ${lower(department)}`.includes(keyword));

const isKitchenPosition = (title = "", department = "") => {
  const text = `${lower(title)} ${lower(department)}`;
  return text.includes("kitchen")
    || ["cook", "cooking", "wrap", "wrapping", "cashier", "dough", "helping", "helper", "trainee"].some((keyword) => text.includes(keyword));
};

const employeeStatus = (profile) => {
  const text = `${lower(profile.currentStatus)} ${lower(profile.status)} ${lower(profile.attendanceStatus)}`;
  if (text.includes("leave")) return { label: "On Leave", dot: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-700" };
  if (text.includes("absent")) return { label: "Absent", dot: "bg-red-500", badge: "bg-red-50 text-red-700" };
  if (text.includes("training")) return { label: "Training", dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700" };
  if (isInactive(profile)) return { label: "Inactive", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" };
  return { label: "Available", dot: "bg-green-500", badge: "bg-green-50 text-green-700" };
};

const mergeEmployeeSources = (profiles, contracts) => {
  const map = new Map();

  const put = (person) => {
    const key = person.employeeId || person.contractNumber || person.fullName;
    if (!key || !person.fullName) return;
    map.set(key, { ...(map.get(key) || {}), ...person });
  };

  contracts.forEach((contract) => {
    put({
      ...contract,
      employeeId: contract.employeeId || contract.contractNumber,
      contractStatus: contract.status || contract.contractStatus || "Signed",
      employmentStatus: contract.employmentStatus || "Active",
      workLocation: contract.workLocation || [contract.workLocation1, contract.workLocation2, contract.workLocation3].filter(Boolean).join("; "),
    });
  });

  profiles.forEach(put);
  return [...map.values()].filter((profile) => !isTerminated(profile));
};

const profileMatchesSearch = (profile, query) => {
  if (!query) return true;
  return [
    profile.fullName,
    profile.employeeId,
    profile.contractNumber,
    profile.jobTitle,
    profile.department,
    getProfileBranch(profile),
  ].filter(Boolean).join(" ").toLowerCase().includes(query);
};

const passesFilters = (profile, filters, query) => {
  if (filters.status === "active" && isInactive(profile)) return false;
  if (filters.status === "inactive" && !isInactive(profile)) return false;
  if (filters.branch && !getProfileBranches(profile).includes(filters.branch)) return false;
  if (filters.department && profile.department !== filters.department) return false;
  if (filters.position && profile.jobTitle !== filters.position) return false;
  if (filters.group === "management" && !isManagementPosition(profile.jobTitle, profile.department)) return false;
  if (filters.group === "kitchen" && !isKitchenPosition(profile.jobTitle, profile.department)) return false;
  if (filters.shift === "Morning" && !getProfileShifts(profile).includes("Morning")) return false;
  if (filters.shift === "Evening" && !getProfileShifts(profile).includes("Evening")) return false;
  return profileMatchesSearch(profile, query);
};

const formatCount = (count, singular = "staff") => `${count} ${singular}`;

const roleTitleMatches = (title, aliases, query) => {
  if (!query) return true;
  return [title, ...aliases].some((value) => lower(value).includes(query));
};

const profileHasRole = (profile, role) => {
  const text = `${lower(profile.jobTitle)} ${lower(profile.department)}`;
  return [role.title, ...role.aliases].some((value) => text.includes(lower(value)));
};


function ChartBox({ title, subtitle, tone = "blue", children, compact = false }) {
  const tones = {
    slate: "border-slate-300 bg-white text-slate-950",
    blue: "border-cyan-500 bg-white text-slate-950",
    amber: "border-amber-400 bg-amber-50 text-slate-950",
    emerald: "border-emerald-400 bg-emerald-50 text-slate-950",
  };

  return (
    <div className={`rounded-sm border-2 px-4 py-3 text-center shadow-sm ${tones[tone] || tones.blue} ${compact ? "min-w-16" : "min-w-48"}`}>
      <h3 className={`${compact ? "text-sm" : "text-lg"} font-black leading-tight`}>{title}</h3>
      {subtitle && <p className="mt-1 text-xs font-bold text-slate-500">{subtitle}</p>}
      {children}
    </div>
  );
}

function PersonPill({ profile, onClick }) {
  const status = employeeStatus(profile);
  return (
    <button
      type="button"
      onClick={() => onClick(profile)}
      className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left text-xs font-bold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
    >
      <span className="flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} />
        <span className="truncate">{profile.fullName}</span>
      </span>
    </button>
  );
}

function LeadershipBox({ title, profile, onEmployeeClick }) {
  return (
    <ChartBox title={title} subtitle={profile?.fullName || ""} tone="slate">
      {profile && <PersonPill profile={profile} onClick={onEmployeeClick} />}
    </ChartBox>
  );
}

function ManagementRoleBox({ role, people }) {
  return (
    <div className="relative pt-6">
      <span className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-cyan-600" />
      <span className="absolute left-1/2 top-5 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-cyan-600" />
      <ChartBox title={role.title} subtitle={people.length ? formatCount(people.length) : ""} compact={false} />
    </div>
  );
}

function KitchenRoleBox({ role, people }) {
  return (
    <div className="w-14 rounded-sm border-2 border-cyan-500 bg-white px-2 py-2 text-center shadow-sm" title={role.title}>
      <p className="text-sm font-black text-slate-950">{role.code}</p>
      <p className="mt-1 truncate text-[10px] font-bold text-slate-500">{role.title}</p>
      {people.length > 0 && <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-emerald-500" />}
    </div>
  );
}

function BranchSection({ branch, roles, people, isFirst = false }) {
  const branchManagers = people.filter(isBranchManager);

  return (
    <div className={`relative pl-6 ${isFirst ? "pt-0" : ""}`}>
      <span className="absolute left-0 top-9 h-px w-6 bg-cyan-600" />
      <span className="absolute left-4 top-[30px] h-0 w-0 border-y-[5px] border-l-[6px] border-y-transparent border-l-cyan-600" />
      <div className="max-w-[330px]">
        <ChartBox title="Branch Manager" subtitle={branchManagers.length ? formatCount(branchManagers.length) : ""} tone="blue" />
        <div className="mt-3 flex flex-wrap gap-2">
          {roles.map((role) => (
            <KitchenRoleBox
              key={`${branch}-${role.code}`}
              role={role}
              people={people.filter((profile) => !isBranchManager(profile) && profileHasRole(profile, role))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrganizationChart() {
  const chartRef = useRef(null);
  const [profiles, setProfiles] = useState(() => getStaffProfiles());
  const [contracts, setContracts] = useState(() => getContracts());
  const [branches, setBranches] = useState(() => getWorkLocations());
  const [filters] = useState(DEFAULT_FILTERS);
  const [searchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

  const refresh = useCallback(() => {
    setProfiles(getStaffProfiles());
    setContracts(getContracts());
    setBranches(getWorkLocations());
  }, []);

  useEffect(() => {
    window.addEventListener("staffProfilesChanged", refresh);
    window.addEventListener("jobPositionsChanged", refresh);
    window.addEventListener("workLocationsChanged", refresh);
    window.addEventListener("departmentsChanged", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("staffProfilesChanged", refresh);
      window.removeEventListener("jobPositionsChanged", refresh);
      window.removeEventListener("workLocationsChanged", refresh);
      window.removeEventListener("departmentsChanged", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const employees = useMemo(() => mergeEmployeeSources(profiles, contracts), [profiles, contracts]);
  const query = lower(searchTerm);
  const filteredEmployees = useMemo(
    () => employees.filter((profile) => passesFilters(profile, filters, query)),
    [employees, filters, query],
  );

  const ceoProfile = useMemo(
    () => employees.find((profile) => /\bceo\b|chief executive|general manager|director/i.test(`${profile.jobTitle || ""} ${profile.department || ""}`)),
    [employees],
  );
  const cooProfile = useMemo(
    () => employees.find((profile) => /\bcoo\b|chief operating|operations manager|operation manager/i.test(`${profile.jobTitle || ""} ${profile.department || ""}`)),
    [employees],
  );

  const branchNames = useMemo(() => {
    const names = [...branches.map((branch) => branch.name), ...employees.flatMap(getProfileBranches)].filter(Boolean);
    return [...new Set(names)].sort();
  }, [branches, employees]);

  const visibleBranches = useMemo(
    () => (filters.branch ? branchNames.filter((branch) => branch === filters.branch) : branchNames),
    [branchNames, filters.branch],
  );

  const managementRoles = useMemo(() => {
    if (filters.group === "kitchen") return [];
    if (filters.department && !["Management Staff", "Human Resources", "Finance & Accounts", "Administration", "Purchase"].includes(filters.department)) return [];
    return MANAGEMENT_ROLES.filter((role) => {
      if (filters.position && !profileHasRole({ jobTitle: filters.position, department: "" }, role)) return false;
      return roleTitleMatches(role.title, role.aliases, query);
    });
  }, [filters.department, filters.group, filters.position, query]);

  const branchRoles = useMemo(() => {
    if (filters.group === "management") return [];
    if (filters.department && !["Kitchen Staff", "Kitchen Operations"].includes(filters.department)) return [];
    return KITCHEN_ROLES.filter((role) => {
      if (filters.position && !profileHasRole({ jobTitle: filters.position, department: "" }, role)) return false;
      return roleTitleMatches(role.title, role.aliases, query) || roleTitleMatches(role.code, [], query);
    });
  }, [filters.department, filters.group, filters.position, query]);



  const handleProfileUpdate = (updatedProfile) => {
    const saved = updateStaffProfile(updatedProfile.employeeId, updatedProfile);
    if (!saved) return;
    refresh();
    setSelectedProfile(saved);
  };

  const exportImage = async (format) => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { backgroundColor: "#f8fafc", scale: 2, useCORS: true });
    if (format === "png") {
      const link = document.createElement("a");
      link.download = "Organization_Chart.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      return;
    }
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("Organization_Chart.pdf");
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="relative isolate px-5 py-6 sm:px-7">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#eff6ff_0%,#ecfdf5_48%,#fff7ed_100%)]" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                <Network size={14} />
                Staff Hierarchy
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Organization Chart</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Simple hierarchy with only the roles shown in the staff hierarchy reference.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 no-print">
              <button type="button" onClick={() => exportImage("pdf")} className="btn-secondary inline-flex h-10 items-center gap-2"><Download size={16} /> PDF</button>
              <button type="button" onClick={() => exportImage("png")} className="btn-secondary inline-flex h-10 items-center gap-2"><Download size={16} /> PNG</button>
              <button type="button" onClick={() => window.print()} className="btn-secondary inline-flex h-10 items-center gap-2"><Printer size={16} /> Print</button>
            </div>
          </div>
        </div>
      </section>

      <section ref={chartRef} className="overflow-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center">
          <h2 className="mb-5 self-start text-xl font-black text-slate-950">Staff Hierarchy</h2>
          <img src="/staff.png" alt="Staff Hierarchy" className="max-w-full max-h-[80vh] object-contain rounded-lg border border-slate-100" />
        </div>
      </section>

      {selectedProfile && (
        <StaffProfileModal
          key={selectedProfile.employeeId || selectedProfile.contractNumber}
          profile={selectedProfile}
          profiles={employees}
          initialTab="overview"
          onProfileUpdate={handleProfileUpdate}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}

export default OrganizationChart;
