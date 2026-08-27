import { Handle, Position } from '@xyflow/react';
import { User, Calendar, Network, TrendingUp, TrendingDown, Users } from 'lucide-react';

const BaseNode = ({ children, className = "" }) => (
  <div className={`relative rounded-xl border-2 px-5 py-4 shadow-md ${className}`}>
    <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-slate-300" />
    {children}
    <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-slate-300" />
  </div>
);

export const ExecutiveNode = ({ data }) => (
  <BaseNode className="w-64 border-blue-900 bg-slate-900 text-center text-white">
    <h3 className="text-sm font-bold uppercase tracking-widest text-blue-300">{data.title}</h3>
    <p className="mt-1 text-lg font-black">{data.name}</p>
    {data.employeesCount !== undefined && (
      <div className="mt-4 border-t border-slate-800 pt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
        <Users size={14} /> Total Active: {data.employeesCount}
      </div>
    )}
  </BaseNode>
);

export const DepartmentNode = ({ data }) => (
  <BaseNode className="w-56 border-cyan-600 bg-cyan-50 text-center">
    <h3 className="text-sm font-black text-cyan-900">{data.title}</h3>
    <p className="mt-1 text-xs font-bold text-cyan-600">{data.count || 0} Staff</p>
  </BaseNode>
);

export const BranchNode = ({ data }) => (
  <BaseNode className="w-72 border-slate-300 bg-white shadow-lg">
    <div className="border-b border-slate-100 pb-3 text-center">
      <h3 className="text-base font-black text-slate-800">{data.title}</h3>
      <p className="mt-1 text-sm font-bold text-slate-500">
        Manager: <span className="text-slate-900">{data.managerName || "Unassigned"}</span>
      </p>
    </div>
    <div className="grid grid-cols-2 gap-3 pt-3 text-center">
      <div className="rounded-lg bg-slate-50 p-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Morning</p>
        <p className={`mt-0.5 font-black ${data.morningCoverage < 100 ? "text-rose-600" : "text-emerald-600"}`}>
          {data.morningCoverage}%
        </p>
      </div>
      <div className="rounded-lg bg-slate-50 p-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Evening</p>
        <p className={`mt-0.5 font-black ${data.eveningCoverage < 100 ? "text-rose-600" : "text-emerald-600"}`}>
          {data.eveningCoverage}%
        </p>
      </div>
    </div>
    {data.openRequirements > 0 && (
      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 py-1.5 text-xs font-bold text-rose-700">
        <TrendingDown size={14} /> {data.openRequirements} Open
      </div>
    )}
  </BaseNode>
);

export const PositionNode = ({ data }) => {
  const isFull = data.status === "FULL";
  const isNeed = data.status === "NEED_STAFF";
  const isOver = data.status === "OVERSTAFFED";
  
  let borderColor = "border-slate-300";
  let bgColor = "bg-slate-50";
  let textColor = "text-slate-600";
  let statusText = "No Requirement";
  let titleColor = "text-slate-800";

  if (isNeed) {
    borderColor = "border-rose-300";
    bgColor = "bg-rose-50";
    textColor = "text-rose-700";
    statusText = `NEED ${data.missingCount}`;
    titleColor = "text-rose-900";
  } else if (isOver) {
    borderColor = "border-amber-300";
    bgColor = "bg-amber-50";
    textColor = "text-amber-700";
    statusText = `OVER +${data.overCount}`;
    titleColor = "text-amber-900";
  } else if (isFull) {
    borderColor = "border-emerald-300";
    bgColor = "bg-emerald-50";
    textColor = "text-emerald-700";
    statusText = "FULL";
    titleColor = "text-emerald-900";
  }

  return (
    <BaseNode className={`w-56 ${borderColor} ${bgColor}`}>
      <div className="flex flex-col items-center border-b border-black/5 pb-2 text-center">
        <h3 className={`text-[13px] font-black uppercase tracking-wider ${titleColor}`}>{data.title}</h3>
        {data.status !== "NONE" && (
          <span className={`mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-black shadow-sm ${textColor}`}>
            {statusText}
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
        <div>
          <p className="font-bold text-slate-500 opacity-80">M</p>
          <p className="font-bold text-slate-900">{data.morningAssigned} / {data.morningRequired}</p>
        </div>
        <div>
          <p className="font-bold text-slate-500 opacity-80">E</p>
          <p className="font-bold text-slate-900">{data.eveningAssigned} / {data.eveningRequired}</p>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] font-bold text-slate-500">
        Assigned: {data.totalAssigned}
      </p>
    </BaseNode>
  );
};

export const EmployeeNode = ({ data }) => {
  const isInactive = data.status === "Inactive";
  
  return (
    <button 
      type="button"
      onClick={() => data.onClick?.(data.profile)}
      className={`relative rounded-xl border-2 px-3 py-3 shadow-md flex w-64 items-center gap-3 text-left transition ${isInactive ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-lg"}`}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !bg-slate-300" />
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-bold ${isInactive ? 'bg-slate-400' : 'bg-violet-600'}`}>
        {data.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-black text-slate-900 leading-tight">{data.name}</p>
        <p className="text-[10px] font-semibold text-slate-500">{data.employeeId} • {data.position}</p>
        
        {data.rosterStatus && !isInactive && (
          <div className="mt-1 flex items-center gap-1">
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold ${data.rosterBadgeClass}`}>
              {data.rosterStatus}
            </span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !bg-slate-300" />
    </button>
  );
};

export const nodeTypes = {
  executive: ExecutiveNode,
  department: DepartmentNode,
  branch: BranchNode,
  position: PositionNode,
  employee: EmployeeNode,
};
