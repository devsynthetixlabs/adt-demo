"use client";

import { useAuth } from "@/context/authProvider/provider";
import { useDashboardUI } from "@/stores/dashboard-ui";
import ProjectsTab from "./admin/ProjectsTab";
import UnitsTab from "./admin/UnitsTab";
import AssigneesTab from "./admin/AssigneesTab";
import SettingsTab from "./admin/SettingsTab";

export interface Project {
  id: string;
  name: string;
  icon: string;
  client: string;
  address: string;
  startDate: string;
  endDate: string;
  units: Record<string, string[]>;
  assigneeProfiles: Record<string, {
    color: string; phone: string; email: string; role: string;
    designation: string; visibility: string[];
  }>;
  tasks: { id: number; unit: string; room: string; desc: string; assignee: string; start: string; end: string; status: string; notes: string }[];
  materials: any[];
  approvals: any[];
  snags: any[];
  drawings: any[];
  notes: any[];
  guidelines: string[];
  commsChannels: { id: string; name: string; sub: string; icon: string; unit: string | null }[];
  commsMessages: Record<string, any[]>;
}

export interface AssigneeProfile {
  color: string;
  phone: string;
  email: string;
  role: string;
  designation: string;
  visibility: string[];
  loginStatus?: "invited" | "active" | "pending";
}

interface AdminProps {
  projects: Record<string, Project>;
  activeProjectId: string;
  switchProject: (id: string) => void;
  project: Project;
  onProjectCreated: (project: Project) => void;
  onUnitAdded: (projectId: string, unitName: string) => void;
  onRoomAdded: (projectId: string, unitName: string, roomName: string) => void;
  onAssigneeAdded: (projectId: string, name: string, profile: AssigneeProfile) => void;
  onAssigneeRemoved: (projectId: string, name: string) => void;
  onAssigneeRoleChanged: (projectId: string, name: string, newRole: string) => void;
  onAssigneeUpdated: (projectId: string, name: string, updates: Partial<AssigneeProfile>) => void;
  onProjectDeleted: (projectId: string) => void;
  onUnitRenamed: (projectId: string, oldName: string, newName: string) => void;
  onUnitDeleted: (projectId: string, unitName: string) => void;
  onRoomRenamed: (projectId: string, unitName: string, oldName: string, newName: string) => void;
  onRoomDeleted: (projectId: string, unitName: string, roomName: string) => void;
}

export default function Admin({
  projects, activeProjectId, switchProject, project,
  onProjectCreated, onUnitAdded, onRoomAdded,
  onAssigneeAdded, onAssigneeRemoved, onAssigneeRoleChanged, onAssigneeUpdated,
  onProjectDeleted, onUnitRenamed, onUnitDeleted, onRoomRenamed, onRoomDeleted,
}: AdminProps) {
  const { session } = useAuth();
  const sessionRole = session?.role || "";
  const { adminSubtab, setAdminSubtab } = useDashboardUI();

  if (sessionRole !== "owner") return null;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Admin Panel</div>
          <div className="text-[0.82rem] text-[#9C8E86]">Managing <span className="font-medium">{project.name}</span> · Client access only</div>
        </div>
      </div>

      {/* Admin Inner Tabs */}
      <div className="flex gap-0 flex-wrap whitespace-nowrap border-b-2 border-[#E2DAD1] mb-6">
        {(["projects", "units", "assignees", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAdminSubtab(tab)}
            className={`px-5 py-[0.75rem] text-[0.8rem] font-semibold tracking-[0.03em] uppercase cursor-pointer transition-all border-b-2 mb-[-2px] ${
              adminSubtab === tab
                ? "text-[#E8601C] border-b-[#E8601C]"
                : "text-[#9C8E86] border-b-transparent hover:text-[#E8601C]"
            }`}
          >
            {tab === "units" ? "🏠 Units & Rooms" : tab === "assignees" ? "👥 Assignees" : tab === "projects" ? "📂 Projects" : "⚙ Settings"}
          </button>
        ))}
      </div>

      {/* PROJECT CONTEXT BANNER */}
      <div className="bg-gradient-to-r from-[#2C2420] to-[#5C4F48] text-white px-5 py-3.5 flex items-center justify-between flex-wrap gap-4 rounded-[10px] mb-6 border-b-2 border-[#E8601C]">
        <div className="flex items-center gap-3.5">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#E8601C] flex items-center justify-center text-[1.1rem] flex-shrink-0">{project.icon}</div>
          <div>
            <div className="font-serif text-[1.2rem] font-semibold leading-[1.2]">{project.name}</div>
            <div className="text-[0.72rem] text-white/70">{project.client} · {project.address}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[0.72rem] text-white/85">
          <span>📋 {Object.keys(project.units).length} units</span>
          <span>👥 {Object.keys(project.assigneeProfiles).length} assignees</span>
          <span>📋 {project.tasks.length} tasks</span>
        </div>
      </div>

      {adminSubtab === "projects" && (
        <ProjectsTab
          projects={projects}
          activeProjectId={activeProjectId}
          switchProject={switchProject}
          onProjectCreated={onProjectCreated}
          onProjectDeleted={onProjectDeleted}
        />
      )}

      {adminSubtab === "units" && (
        <UnitsTab
          project={project}
          onUnitAdded={onUnitAdded}
          onUnitRenamed={onUnitRenamed}
          onUnitDeleted={onUnitDeleted}
          onRoomAdded={onRoomAdded}
          onRoomRenamed={onRoomRenamed}
          onRoomDeleted={onRoomDeleted}
        />
      )}

      {adminSubtab === "assignees" && (
        <AssigneesTab
          project={project}
          onAssigneeAdded={onAssigneeAdded}
          onAssigneeRemoved={onAssigneeRemoved}
          onAssigneeUpdated={onAssigneeUpdated}
        />
      )}

      {adminSubtab === "settings" && (
        <SettingsTab project={project} />
      )}
    </div>
  );
}
