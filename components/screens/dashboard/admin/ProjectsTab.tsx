"use client";

import { useState } from "react";
import { useAuth } from "@/context/authProvider/provider";
import { dbCreateProject, dbDeleteProject, isDbProject } from "@/services/project.service";
import type { ProjectFields } from "@/services/project.service";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useDashboardUI } from "@/stores/dashboard-ui";
import type { Project } from "../admin";

const EMPTY_CREATE_FORM: ProjectFields = { name: "", icon: "🏛", client: "", address: "", startDate: "", endDate: "" };
const PROJECT_ICONS = ["🏛", "🏠", "🏢", "🌿", "🏖", "🎨", "📐", "🌅"];

function buildEmptyProject(id: string, fields: ProjectFields): Project {
  return {
    id,
    name: fields.name,
    icon: fields.icon || "🏛",
    client: fields.client,
    address: fields.address,
    startDate: fields.startDate,
    endDate: fields.endDate,
    units: {},
    assigneeProfiles: {},
    tasks: [],
    materials: [],
    approvals: [],
    snags: [],
    drawings: [],
    notes: [],
    guidelines: [],
    commsChannels: [{ id: "general", name: "📢 General", sub: "Project-wide updates", icon: "📢", unit: null }],
    commsMessages: { general: [] },
  };
}

interface ProjectsTabProps {
  projects: Record<string, Project>;
  activeProjectId: string;
  switchProject: (id: string) => void;
  onProjectCreated: (project: Project) => void;
  onProjectDeleted: (projectId: string) => void;
}

export default function ProjectsTab({
  projects, activeProjectId, switchProject,
  onProjectCreated, onProjectDeleted,
}: ProjectsTabProps) {
  const { session } = useAuth();
  const { showCreateProject, setShowCreateProject } = useDashboardUI();

  const [createForm, setCreateForm] = useState<ProjectFields>(EMPTY_CREATE_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCreate() {
    if (!createForm.name.trim() || !createForm.client.trim()) return;
    const orgId = session?.activeOrgId;
    if (!orgId) {
      setCreateError("No organisation found on your account. Please contact support.");
      return;
    }
    setIsCreating(true);
    setCreateError("");
    try {
      const result = await dbCreateProject(createForm, orgId, session!.userId);
      if (result.error) { setCreateError(result.error); return; }
      onProjectCreated(buildEmptyProject(result.data!, createForm));
      setShowCreateProject(false);
      setCreateForm(EMPTY_CREATE_FORM);
    } catch (err: any) {
      setCreateError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      if (isDbProject(deleteTargetId)) {
        const result = await dbDeleteProject(deleteTargetId);
        if (result.error) return;
      }
      onProjectDeleted(deleteTargetId);
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[0.82rem] text-[#9C8E86]">All projects · tap to switch active · manage here</div>
        <button
          onClick={() => { setCreateForm(EMPTY_CREATE_FORM); setCreateError(""); setShowCreateProject(true); }}
          className="bg-[#E8601C] text-white border-none rounded-lg px-4 py-2 text-[0.78rem] font-semibold cursor-pointer transition-all hover:bg-[#C04E12]"
        >
          + New Project
        </button>
      </div>
      {Object.values(projects).map((p) => (
        <div
          key={p.id}
          className={`flex items-center gap-4 px-5 py-4 mb-3 rounded-xl border-[1.5px] transition-all shadow-[0_2px_20px_rgba(44,36,32,0.07)] ${p.id === activeProjectId ? "border-[#E8601C] bg-[#FEF4EF]" : "border-[#E2DAD1] bg-white"
            }`}
        >
          <span className="text-[1.75rem]">{p.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[0.95rem] text-[#2C2420]">{p.name}</div>
            <div className="text-[0.75rem] text-[#9C8E86] mt-0.5">{p.client} · {p.address}</div>
            <div className="flex gap-2 flex-wrap mt-1.5">
              <span className="bg-[#F7F5F2] border border-[#E2DAD1] rounded-full px-2 py-0.5 text-[0.68rem] text-[#5C4F48]">{p.tasks.length} tasks</span>
              <span className="bg-[#F7F5F2] border border-[#E2DAD1] rounded-full px-2 py-0.5 text-[0.68rem] text-[#5C4F48]">{Object.keys(p.assigneeProfiles).length} assignees</span>
              <span className="bg-[#F7F5F2] border border-[#E2DAD1] rounded-full px-2 py-0.5 text-[0.68rem] text-[#5C4F48]">{Object.keys(p.units).length} units</span>
            </div>
          </div>
          {p.id === activeProjectId && <span className="bg-[#E8601C] text-white text-[0.65rem] font-bold px-2.5 py-0.5 rounded-full tracking-[0.05em]">ACTIVE</span>}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => switchProject(p.id)}
              title="Set as active project"
              className={`w-9 h-9 rounded-[8px] border flex items-center justify-center cursor-pointer text-[0.8rem] transition-all ${p.id === activeProjectId
                  ? "border-[#E8601C] bg-[#E8601C] text-white"
                  : "border-[#E2DAD1] bg-white text-[#9C8E86] hover:border-[#E8601C] hover:bg-[#FEF4EF] hover:text-[#E8601C]"
                }`}
            >
              ▶
            </button>
            <button
              onClick={() => setDeleteTargetId(p.id)}
              title="Delete project"
              className="w-9 h-9 rounded-[8px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.88rem] transition-all hover:border-[#C0392B] hover:bg-[#FFF5F5] hover:text-[#C0392B]"
            >
              🗑
            </button>
          </div>
        </div>
      ))}

      {/* ── CREATE PROJECT MODAL ── */}
      {showCreateProject && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={() => setShowCreateProject(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
          <div className="relative bg-white rounded-2xl shadow-[0_32px_80px_rgba(44,36,32,0.28)] w-full max-w-[500px] overflow-hidden border border-[#E2DAD1]" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-[#E8601C] to-[#F4895A]" />
            <div className="px-7 pt-6 pb-2 flex items-start justify-between">
              <h2 className="font-serif text-[1.6rem] font-semibold text-[#2C2420] leading-tight">Add New Project</h2>
              <button onClick={() => setShowCreateProject(false)} className="w-8 h-8 rounded-full text-[#9C8E86] flex items-center justify-center hover:bg-[#F7F5F2] transition-all text-[1rem] cursor-pointer mt-1">✕</button>
            </div>
            <div className="px-7 py-5 space-y-5">
              <div>
                <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Project Name <span className="text-[#E8601C]">*</span></label>
                <input autoFocus value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Project Casa" className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
              </div>
              <div>
                <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Client / Owner</label>
                <input value={createForm.client} onChange={(e) => setCreateForm({ ...createForm, client: e.target.value })} placeholder="Client name or company" className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
              </div>
              <div>
                <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-2">Choose Icon</label>
                <div className="flex gap-2.5">
                  {PROJECT_ICONS.map((ic) => (
                    <button key={ic} type="button" onClick={() => setCreateForm({ ...createForm, icon: ic })}
                      className={`w-[52px] h-[52px] rounded-xl text-[1.4rem] flex items-center justify-center transition-all cursor-pointer border-[1.5px] ${createForm.icon === ic ? "border-[#E8601C] bg-[#FEF4EF] shadow-[0_0_0_3px_rgba(232,96,28,0.15)]" : "border-[#E2DAD1] bg-[#F7F5F2] hover:border-[#F4895A] hover:bg-[#FEF4EF]"}`}
                    >{ic}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Start Date</label>
                  <input type="date" value={createForm.startDate} onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })} className="w-full px-4 py-3 text-[0.84rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Target End</label>
                  <input type="date" value={createForm.endDate} onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })} className="w-full px-4 py-3 text-[0.84rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Address / Location</label>
                <input value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} placeholder="Site location" className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
              </div>
              <div className="flex gap-3 bg-[#FEF4EF] border-l-[3px] border-[#E8601C] rounded-r-xl px-4 py-3">
                <span className="text-[1rem] flex-shrink-0 mt-0.5">💡</span>
                <p className="text-[0.78rem] text-[#6B5A52] leading-relaxed">The new project starts blank — you'll add units, rooms, assignees, and tasks fresh. Existing project data is not affected.</p>
              </div>
              {createError && <div className="text-[0.75rem] text-[#C0392B] bg-[#FFF5F5] border border-[#EDB9B9] rounded-lg px-3 py-2">{createError}</div>}
            </div>
            <div className="px-7 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowCreateProject(false)} className="px-5 py-2.5 text-[0.84rem] font-semibold text-[#6B5A52] bg-white border-[1.5px] border-[#E2DAD1] rounded-xl hover:border-[#9C8E86] transition-all cursor-pointer">Cancel</button>
              <button onClick={handleCreate} disabled={isCreating || !createForm.name.trim()} className="px-7 py-2.5 text-[0.84rem] font-semibold text-white bg-[#E8601C] rounded-xl hover:bg-[#C04E12] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(232,96,28,0.3)]">
                {isCreating ? "Creating…" : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE PROJECT CONFIRMATION ── */}
      <ConfirmDialog
        open={deleteTargetId !== null}
        variant="danger"
        title="Delete Project"
        message={
          deleteTargetId && projects[deleteTargetId]
            ? `Are you sure you want to delete "${projects[deleteTargetId].name}"? This will permanently remove all units, rooms, tasks, and data associated with this project.`
            : "Are you sure you want to delete this project?"
        }
        confirmLabel="Delete Project"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
