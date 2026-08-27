import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Printer, Network } from "lucide-react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import StaffProfileModal from "../components/StaffProfileModal";
import { getContracts, getStaffProfiles, getWorkLocations, updateStaffProfile } from "../utils/storage";
import { loadRequirements, loadRosterData } from "../utils/roster";
import { nodeTypes } from "../components/orgchart/OrgNodes";
import { buildOrgChart } from "../components/orgchart/OrgChartBuilder";

const isTerminated = (profile) =>
  ["terminated", "resigned"].includes(String(profile.employmentStatus).toLowerCase())
  || ["terminated"].includes(String(profile.contractStatus).toLowerCase());

const mergeEmployeeSources = (profiles, contracts) => {
  const map = new Map();
  const put = (person) => {
    const key = person.employeeId || person.contractNumber || person.fullName;
    if (!key || !person.fullName) return;
    map.set(key, { ...(map.get(key) || {}), ...person });
  };
  contracts.forEach((c) => put({
    ...c,
    employeeId: c.employeeId || c.contractNumber,
    contractStatus: c.status || c.contractStatus || "Signed",
    employmentStatus: c.employmentStatus || "Active",
  }));
  profiles.forEach(put);
  return [...map.values()].filter((profile) => !isTerminated(profile) && profile.contractStatus === "Signed");
};

export default function OrganizationChart() {
  const [profiles, setProfiles] = useState(() => getStaffProfiles());
  const [contracts, setContracts] = useState(() => getContracts());
  const [branches, setBranches] = useState(() => getWorkLocations());
  const [requirements, setRequirements] = useState(() => loadRequirements());
  const [rosterData, setRosterData] = useState(() => loadRosterData());
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const refresh = useCallback(() => {
    setProfiles(getStaffProfiles());
    setContracts(getContracts());
    setBranches(getWorkLocations());
    setRequirements(loadRequirements());
    setRosterData(loadRosterData());
  }, []);

  useEffect(() => {
    window.addEventListener("staffProfilesChanged", refresh);
    window.addEventListener("workLocationsChanged", refresh);
    window.addEventListener("staffRosterChanged", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("staffProfilesChanged", refresh);
      window.removeEventListener("workLocationsChanged", refresh);
      window.removeEventListener("staffRosterChanged", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const employees = useMemo(() => mergeEmployeeSources(profiles, contracts), [profiles, contracts]);

  useEffect(() => {
    const handleEmployeeClick = (profile) => {
      setSelectedProfile(profile);
    };
    
    const { nodes: initialNodes, edges: initialEdges } = buildOrgChart(
      employees,
      branches,
      requirements,
      rosterData,
      handleEmployeeClick
    );
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [employees, branches, requirements, rosterData, setNodes, setEdges]);

  const handleProfileUpdate = (updatedProfile) => {
    const saved = updateStaffProfile(updatedProfile.employeeId, updatedProfile);
    if (!saved) return;
    refresh();
    setSelectedProfile(saved);
  };

  const exportImage = async (format) => {
    const rfElement = document.querySelector(".react-flow");
    if (!rfElement) return;
    const canvas = await html2canvas(rfElement, { backgroundColor: "#f8fafc", scale: 2, useCORS: true });
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
    <div className="mx-auto max-w-[1600px] h-[calc(100vh-6rem)] flex flex-col space-y-5">
      <section className="shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="relative isolate px-5 py-4 sm:px-7">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#eff6ff_0%,#ecfdf5_48%,#fff7ed_100%)]" />
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                <Network size={14} /> Organization Chart
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Live Staff Hierarchy</h1>
            </div>
            <div className="flex flex-wrap gap-2 no-print">
              <button type="button" onClick={() => exportImage("pdf")} className="btn-secondary inline-flex h-10 items-center gap-2"><Download size={16} /> PDF</button>
              <button type="button" onClick={() => exportImage("png")} className="btn-secondary inline-flex h-10 items-center gap-2"><Download size={16} /> PNG</button>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls />
          <MiniMap zoomable pannable nodeClassName={(node) => {
            switch (node.type) {
              case 'executive': return '!bg-blue-900';
              case 'department': return '!bg-cyan-500';
              case 'branch': return '!bg-slate-800';
              case 'position': return '!bg-emerald-500';
              default: return '!bg-slate-300';
            }
          }} />
        </ReactFlow>
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

