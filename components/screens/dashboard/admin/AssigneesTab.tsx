"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/authProvider/provider";
import { dbCreateInvitation, dbGetMembers, dbDeleteMember, dbUpdateMemberRole } from "@/services/member.service";
import type { OrgMember } from "@/services/member.service";
import { importGoogleContacts } from "@/services/google-contacts.service";
import { TEAM_ROLES } from "@/constants/roles";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Project } from "../admin";

const ASSIGNEE_PALETTE = [
  "#E8601C", "#C04E12", "#3D8A5F", "#D4500A", "#F4895A",
  "#B8450E", "#8B5E3C", "#4A7ABF", "#9B59B6", "#2C5FBE",
];

interface AssigneeProfile {
  color: string;
  phone: string;
  email: string;
  role: string;
  designation: string;
  visibility: string[];
  loginStatus?: "invited" | "active" | "pending";
}

const VISIBILITY_TABS = [
  { key: "tasks", label: "Task Sheets" },
  { key: "reminders", label: "Reminders" },
  { key: "drawings", label: "Drawings" },
  { key: "materials", label: "Materials" },
  { key: "comms", label: "Site Comms" },
  { key: "approvals", label: "Approvals" },
  { key: "snags", label: "Snag List" },
  { key: "notes", label: "Notes & Guidelines" },
  { key: "overview", label: "Overview" },
];

interface AssigneesTabProps {
  project: Project;
  onAssigneeAdded: (projectId: string, name: string, profile: AssigneeProfile) => void;
  onAssigneeRemoved: (projectId: string, name: string) => void;
  onAssigneeUpdated: (projectId: string, name: string, updates: Partial<AssigneeProfile>) => void;
}

export default function AssigneesTab({ project, onAssigneeAdded, onAssigneeRemoved, onAssigneeUpdated }: AssigneesTabProps) {
  const { session } = useAuth();

  const [expandedAssignee, setExpandedAssignee] = useState<string | null>(null);

  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [memberEditValues, setMemberEditValues] = useState<{ role: string; designation: string; phone: string; email: string; visibility: string[] }>({ role: "", designation: "", phone: "", email: "", visibility: [] });
  const [savingMemberEdit, setSavingMemberEdit] = useState(false);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<{ name: string; userId: string } | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState<{ firstName: string; lastName: string; email: string; role: string; trade: string; phone: string; color: string }>({ firstName: "", lastName: "", email: "", role: TEAM_ROLES[0].value, trade: "", phone: "", color: ASSIGNEE_PALETTE[0] });
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [importingFromGoogle, setImportingFromGoogle] = useState(false);
  const [importError, setImportError] = useState("");

  const loadOrgMembers = useCallback(async () => {
    const orgId = session?.activeOrgId;
    if (!orgId) return;
    const result = await dbGetMembers(orgId);
    if (result.data) setOrgMembers(result.data);
  }, [session?.activeOrgId]);

  useEffect(() => { loadOrgMembers(); }, [loadOrgMembers]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") loadOrgMembers(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadOrgMembers]);

  const [refreshingMembers, setRefreshingMembers] = useState(false);
  async function handleRefreshMembers() {
    setRefreshingMembers(true);
    await loadOrgMembers();
    setRefreshingMembers(false);
  }

  function parseVisibility(v: unknown): string[] {
    if (Array.isArray(v)) return v as string[];
    if (typeof v === "string") {
      try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch { }
    }
    if (v && typeof v === "object") return Object.keys(v);
    return [];
  }

  function openMemberEdit(name: string, profile: AssigneeProfile) {
    setMemberEditValues({
      role: profile.role || "",
      designation: profile.designation || "",
      phone: profile.phone || "",
      email: profile.email || "",
      visibility: parseVisibility(profile.visibility),
    });
    setExpandedAssignee(expandedAssignee === name ? null : name);
  }

  async function handleSaveMemberEdit(name: string) {
    setSavingMemberEdit(true);
    try {
      const orgId = session?.activeOrgId;
      const orgMember = orgMembers.find((m) => m.email === memberEditValues.email);
      if (orgId && orgMember) {
        await dbUpdateMemberRole(orgId, orgMember.userId, memberEditValues.role);
        setOrgMembers((prev) => prev.map((m) => m.userId === orgMember.userId ? { ...m, role: memberEditValues.role } : m));
      }
      onAssigneeUpdated(project.id, name, {
        role: memberEditValues.role,
        designation: memberEditValues.designation,
        phone: memberEditValues.phone,
        email: memberEditValues.email,
        visibility: memberEditValues.visibility,
      });
      setExpandedAssignee(null);
    } finally {
      setSavingMemberEdit(false);
    }
  }

  async function handleDeleteMember() {
    if (!deleteMemberTarget) return;
    setIsDeletingMember(true);
    try {
      const orgId = session?.activeOrgId;
      if (orgId && deleteMemberTarget.userId) {
        await dbDeleteMember(orgId, deleteMemberTarget.userId);
      }
      onAssigneeRemoved(project.id, deleteMemberTarget.name);
      setOrgMembers((prev) => prev.filter((m) => m.userId !== deleteMemberTarget.userId));
    } finally {
      setIsDeletingMember(false);
      setDeleteMemberTarget(null);
    }
  }

  async function handleResendInvite(email: string, name: string, role: string) {
    const orgId = session?.activeOrgId;
    if (!orgId) return;
    await dbCreateInvitation(orgId, email, role, name);
  }

  async function handleInvite() {
    const firstName = inviteForm.firstName.trim();
    const lastName = inviteForm.lastName.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    if (!firstName || !inviteForm.email.trim()) return;
    const orgId = session?.activeOrgId;
    if (!orgId) { setInviteError("No organisation found on your account."); return; }
    setIsInviting(true);
    setInviteError("");
    try {
      const result = await dbCreateInvitation(orgId, inviteForm.email.trim(), inviteForm.role, firstName, lastName, inviteForm.phone.trim());
      if (result.error) { setInviteError(result.error); return; }

      setInviteLink("sent");

      const roleEntry = TEAM_ROLES.find((r) => r.value === inviteForm.role)!;
      onAssigneeAdded(project.id, fullName, {
        color: inviteForm.color,
        phone: inviteForm.phone.trim(),
        email: inviteForm.email.trim(),
        role: roleEntry.label,
        designation: inviteForm.trade.trim(),
        visibility: ["tasks", "comms"],
        loginStatus: "invited",
      });

      loadOrgMembers();
    } catch (err: any) {
      setInviteError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsInviting(false);
    }
  }

  function resetInviteModal() {
    setShowInvite(false);
    setInviteForm({ firstName: "", lastName: "", email: "", role: TEAM_ROLES[0].value, trade: "", phone: "", color: ASSIGNEE_PALETTE[0] });
    setInviteError("");
    setInviteLink("");
    setInviteLinkCopied(false);
  }

  async function handleGoogleImport() {
    setImportingFromGoogle(true);
    setImportError("");
    try {
      const contacts = await importGoogleContacts();
      if (contacts.length === 0) {
        setImportError("No contacts found in your Google account.");
        return;
      }
      let offset = Object.keys(project.assigneeProfiles).length;
      let added = 0;
      for (const contact of contacts) {
        if (project.assigneeProfiles[contact.name]) continue;
        const color = ASSIGNEE_PALETTE[offset % ASSIGNEE_PALETTE.length];
        offset++;
        onAssigneeAdded(project.id, contact.name, {
          color,
          phone: contact.phone,
          email: contact.email,
          role: "Contractor",
          designation: "",
          visibility: ["tasks", "comms"],
          loginStatus: contact.email ? "invited" : "pending",
        });
        added++;
      }
      if (added === 0) setImportError("All contacts from your Google account are already in this project.");
    } catch (err: any) {
      setImportError(err?.message || "Failed to import contacts.");
    } finally {
      setImportingFromGoogle(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div>
        <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
            <div>
              <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Assignees / Contractors</div>
              <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">Contacts & colours for this project only</div>
            </div>
            <button type="button" onClick={handleRefreshMembers} disabled={refreshingMembers} className="flex items-center gap-1 text-[0.72rem] text-[#9C8E86] bg-white border border-[#E2DAD1] rounded-lg px-2.5 py-1.5 hover:border-[#E8601C] hover:text-[#E8601C] transition-all disabled:opacity-50">
              <span className={`inline-block ${refreshingMembers ? "animate-spin" : ""}`}>⟳</span>
              {refreshingMembers ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4 p-3 bg-[#F7F5F2] rounded-lg">
              <div className="text-[1.4rem] font-serif font-light text-[#E8601C]">{Object.keys(project.assigneeProfiles).length}</div>
              <div className="text-[0.75rem] text-[#5C4F48]">
                <div className="font-semibold">Active seats on this project</div>
                <div className="text-[#9C8E86] text-[0.7rem]">Each assignee with an email = 1 subscription seat</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {Object.entries(project.assigneeProfiles).map(([name, profile]) => {
                const isExpanded = expandedAssignee === name;
                const orgMember = orgMembers.find((m) => m.email === profile.email);
                const liveStatus = orgMember?.status;
                const displayRole = orgMember?.role
                  ? (TEAM_ROLES.find((r) => r.value === orgMember.role)?.label ?? orgMember.role)
                  : profile.role;
                const displayDesignation = profile.designation;
                const loginStatus: "active" | "invited" | "pending" =
                  liveStatus ?? ((profile as any).loginStatus || (profile.email ? "active" : "pending"));
                const statusConfig = {
                  active: { cls: "bg-[#E8F5E9] text-[#2E7D32]", dot: "bg-[#2E7D32]", label: "Active" },
                  invited: { cls: "bg-[#FFF3E0] text-[#E65100]", dot: "bg-[#E65100]", label: "Invite Sent" },
                  pending: { cls: "bg-[#F5F5F5] text-[#9C8E86]", dot: "bg-[#9C8E86]", label: "No Login" },
                };
                const sc = statusConfig[loginStatus];
                const visCount = isExpanded ? memberEditValues.visibility.length : parseVisibility(profile.visibility).length;

                return (
                  <div key={name} className="border-[1.5px] border-[#E2DAD1] rounded-[10px] bg-white transition-all overflow-hidden hover:border-[#F4895A]">
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[0.7rem] font-bold border-2 border-white shadow-[0_0_0_1.5px_rgba(44,36,32,0.12)] mt-0.5" style={{ backgroundColor: profile.color }}>
                        {name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.88rem] font-semibold text-[#2C2420] leading-tight">{displayDesignation}</div>
                        <div className="text-[0.7rem] text-[#9C8E86] mt-0.5 leading-tight">
                          {displayRole}
                          {" · "}{visCount} tab{visCount !== 1 ? "s" : ""} visible
                          {profile.email && <span> · {profile.email}</span>}
                          {!profile.email && <span className="text-[#C0392B]"> · No login email</span>}
                        </div>
                        {loginStatus === "invited" && profile.email && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <button type="button" onClick={() => handleResendInvite(profile.email, name, profile.role)} className="text-[0.68rem] text-[#E8601C] font-semibold hover:underline">↺ Resend invite</button>
                            <span className="text-[#D1C7BE] text-[0.68rem]">·</span>
                            <button type="button" onClick={() => setDeleteMemberTarget({ name, userId: orgMember?.userId || "" })} className="text-[0.68rem] text-[#C0392B] font-semibold hover:underline">✕ Revoke</button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 self-start mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
                          <span className={`w-[5px] h-[5px] rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <button type="button" onClick={() => openMemberEdit(name, profile)} title="Edit member" className="w-7 h-7 rounded-[6px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center transition-all hover:border-[#E8601C] hover:text-[#E8601C]">
                          {isExpanded ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          )}
                        </button>
                        <button type="button" onClick={() => setDeleteMemberTarget({ name, userId: orgMember?.userId || "" })} title="Remove member" className="w-7 h-7 rounded-[6px] border border-[#EDB9B9] bg-white text-[#9C8E86] flex items-center justify-center transition-all hover:border-[#C0392B] hover:text-[#C0392B]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#E2DAD1] px-4 py-4 bg-[#F7F5F2]">
                        <div className="text-[0.65rem] font-bold text-[#E8601C] uppercase tracking-[0.1em] mb-3">Contact Details &amp; Login</div>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div>
                            <div className="text-[0.6rem] text-[#9C8E86] uppercase tracking-[0.06em] mb-1">Role</div>
                            <select value={memberEditValues.role} onChange={(e) => setMemberEditValues((p) => ({ ...p, role: e.target.value }))} className="w-full text-[0.78rem] px-2.5 py-[0.45rem] border-[1.5px] border-[#E2DAD1] rounded-[8px] bg-white outline-none focus:border-[#E8601C] transition-colors">
                              {TEAM_ROLES.map((r) => <option key={r.value} value={r.label}>{r.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="text-[0.6rem] text-[#9C8E86] uppercase tracking-[0.06em] mb-1">Designation</div>
                            <input value={memberEditValues.designation} onChange={(e) => setMemberEditValues((p) => ({ ...p, designation: e.target.value }))} placeholder="e.g. Electrician" className="w-full text-[0.78rem] px-2.5 py-[0.45rem] border-[1.5px] border-[#E2DAD1] rounded-[8px] bg-white outline-none focus:border-[#E8601C] transition-colors" />
                          </div>
                          <div>
                            <div className="text-[0.6rem] text-[#9C8E86] uppercase tracking-[0.06em] mb-1">Phone</div>
                            <input type="tel" value={memberEditValues.phone} onChange={(e) => setMemberEditValues((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 98200 10001" className="w-full text-[0.78rem] px-2.5 py-[0.45rem] border-[1.5px] border-[#E2DAD1] rounded-[8px] bg-white outline-none focus:border-[#E8601C] transition-colors" />
                          </div>
                          <div>
                            <div className="text-[0.6rem] text-[#9C8E86] uppercase tracking-[0.06em] mb-1">Login Email <span className="text-[#E8601C]">*</span></div>
                            <input type="email" value={memberEditValues.email} readOnly className="w-full text-[0.78rem] px-2.5 py-[0.45rem] border-[1.5px] border-[#E2DAD1] rounded-[8px] bg-[#EDEAE6] text-[#9C8E86] cursor-default outline-none" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="text-[0.65rem] font-bold text-[#E8601C] uppercase tracking-[0.1em]">App Visibility</div>
                          <div className="text-[0.6rem] text-[#9C8E86] uppercase tracking-[0.05em]">Which tabs this person sees when they log in</div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-5">
                          {VISIBILITY_TABS.map((tab) => {
                            const checked = memberEditValues.visibility.includes(tab.key);
                            return (
                              <button key={tab.key} type="button" onClick={() => setMemberEditValues((p) => ({ ...p, visibility: checked ? p.visibility.filter((v) => v !== tab.key) : [...p.visibility, tab.key] }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] text-[0.72rem] font-medium transition-all ${checked ? "border-[#E8601C] bg-[#FDE8DC] text-[#C04E12]" : "border-[#E2DAD1] bg-white text-[#9C8E86] hover:border-[#F4895A]"}`}
                              >
                                <span className={`w-[14px] h-[14px] rounded-[3px] border flex items-center justify-center text-[0.55rem] flex-shrink-0 ${checked ? "bg-[#E8601C] border-[#E8601C] text-white" : "border-[#C8BFB9]"}`}>
                                  {checked && "✓"}
                                </span>
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setExpandedAssignee(null)} className="px-4 py-1.5 text-[0.78rem] text-[#5C4F48] bg-white border border-[#E2DAD1] rounded-lg hover:border-[#9C8E86] transition-all">Cancel</button>
                          <button type="button" onClick={() => handleSaveMemberEdit(name)} disabled={savingMemberEdit} className="px-4 py-1.5 text-[0.78rem] text-white bg-[#E8601C] rounded-lg hover:bg-[#C04E12] disabled:opacity-50 transition-all">{savingMemberEdit ? "Saving…" : "Save changes"}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => { setInviteForm({ firstName: "", lastName: "", email: "", role: TEAM_ROLES[0].value, trade: "", phone: "", color: ASSIGNEE_PALETTE[0] }); setInviteError(""); setInviteLink(""); setInviteLinkCopied(false); setShowInvite(true); }} className="w-full bg-[#E8601C] text-white border-none rounded-lg px-4 py-2 text-[0.78rem] font-semibold cursor-pointer transition-all hover:bg-[#C04E12] mt-4">📧 Invite New Team Member</button>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div>
        <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
          <div className="px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Team Directory</div>
                <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">Contact details — visible to all team members</div>
              </div>
              <button onClick={handleGoogleImport} disabled={importingFromGoogle} className="flex items-center gap-1.5 bg-white text-[#E8601C] border border-[#E8601C] rounded-lg px-3 py-1.5 text-[0.72rem] font-semibold cursor-pointer transition-all hover:bg-[#FFF5EF] disabled:opacity-50 disabled:cursor-not-allowed">
                {importingFromGoogle ? "⏳ Importing..." : "📥 Import from Google"}
              </button>
            </div>
            {importError && <div className="mt-2 text-[0.7rem] text-[#C0392B] bg-[#FFF5F5] border border-[#EDB9B9] rounded-lg px-2 py-1.5">{importError}</div>}
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(project.assigneeProfiles).map(([name, profile]) => {
              const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const hasPhone = profile.phone && profile.phone.trim();
              const hasEmail = profile.email && profile.email.trim();
              return (
                <div key={name} className="relative border-[1.5px] border-[#E2DAD1] rounded-[10px] bg-[#F7F5F2] group">
                  <button onClick={() => onAssigneeRemoved(project.id, name)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-[4px] border border-[#EDB9B9] bg-white text-[#C0392B] flex items-center justify-center cursor-pointer text-[0.6rem] transition-all hover:bg-[#FFF5F5] z-10" title="Remove from directory">✕</button>
                  <div className="flex items-center gap-3 px-3 py-2.5 pr-10">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[0.72rem] font-bold flex-shrink-0" style={{ backgroundColor: profile.color }}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.86rem] font-semibold text-[#2C2420]">{name}</div>
                      <div className="text-[0.68rem] text-[#9C8E86]">{profile.role}</div>
                    </div>
                  </div>
                  {(hasPhone || hasEmail) ? (
                    <div className="px-3 pb-3 flex gap-2 flex-wrap">
                      {hasEmail && <a href={`mailto:${profile.email}`} className="bg-[#FDE8DC] text-[#C04E12] px-2 py-0.5 rounded-full text-[0.68rem] font-medium hover:opacity-80">✉ {profile.email}</a>}
                      {hasPhone && <a href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full text-[0.68rem] font-medium hover:opacity-80">💬 WhatsApp</a>}
                      {hasPhone && <a href={`tel:${profile.phone}`} className="bg-[#F7F5F2] text-[#5C4F48] px-2 py-0.5 rounded-full text-[0.68rem] font-medium hover:text-[#E8601C]">📞 {profile.phone}</a>}
                    </div>
                  ) : (
                    <div className="px-3 pb-3 text-[0.72rem] text-[#9C8E86]">No contact details added yet.</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden mt-6">
          <div className="px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
            <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Change Log</div>
          </div>
          <div className="p-4 max-h-[220px] overflow-y-auto text-[0.75rem] text-[#9C8E86]">No changes yet.</div>
        </div>
      </div>

      {/* ── INVITE TEAM MEMBER MODAL ── */}
      {showInvite && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={resetInviteModal}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
          <div className="relative bg-white rounded-2xl shadow-[0_32px_80px_rgba(44,36,32,0.28)] w-full max-w-[520px] overflow-hidden border border-[#E2DAD1]" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-[#E8601C] to-[#F4895A]" />
            {!inviteLink ? (
              <>
                <div className="px-7 pt-6 pb-2 flex items-start justify-between">
                  <h2 className="font-serif text-[1.6rem] font-semibold text-[#2C2420] leading-tight">Invite Team Member</h2>
                  <button onClick={resetInviteModal} className="w-8 h-8 rounded-full text-[#9C8E86] flex items-center justify-center hover:bg-[#F7F5F2] transition-all text-[1rem] cursor-pointer mt-1">✕</button>
                </div>
                <div className="px-7 py-5 space-y-5">
                  <div className="flex gap-3 bg-[#FEF4EF] border-l-[3px] border-[#E8601C] rounded-r-xl px-4 py-3">
                    <span className="text-[1rem] flex-shrink-0 mt-0.5">📧</span>
                    <p className="text-[0.78rem] text-[#6B5A52] leading-relaxed">An invitation email will be sent to this address. They click the link, set their own password, and log in. Their access is controlled by the role and visibility settings you configure here.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">First Name <span className="text-[#E8601C]">*</span></label>
                      <input autoFocus value={inviteForm.firstName} onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })} placeholder="Rajesh" className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Last Name</label>
                      <input value={inviteForm.lastName} onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })} placeholder="Patel" className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Email Address <span className="text-[#E8601C]">*</span><span className="text-[#E8601C] normal-case ml-2 font-semibold">(This becomes their login)</span></label>
                    <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="contractor@email.com" className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Role</label>
                      <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all appearance-none cursor-pointer">
                        {TEAM_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Trade / Designation</label>
                      <input value={inviteForm.trade} onChange={(e) => setInviteForm({ ...inviteForm, trade: e.target.value })} placeholder="e.g. Electrician" className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-1.5">Phone</label>
                    <input type="tel" value={inviteForm.phone} onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })} placeholder="+91 98xxx xxxxx" className="w-full px-4 py-3 text-[0.88rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-xl text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white transition-all" />
                  </div>
                  <div>
                    <label className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold block mb-2.5">Colour</label>
                    <div className="flex gap-2.5 flex-wrap">
                      {ASSIGNEE_PALETTE.map((c) => (
                        <button key={c} type="button" onClick={() => setInviteForm({ ...inviteForm, color: c })} className="w-9 h-9 rounded-full transition-all cursor-pointer flex-shrink-0"
                          style={{ backgroundColor: c, outline: inviteForm.color === c ? `3px solid ${c}` : "none", outlineOffset: inviteForm.color === c ? "2px" : "0", transform: inviteForm.color === c ? "scale(1.15)" : "scale(1)" }}
                        />
                      ))}
                    </div>
                  </div>
                  {inviteError && <div className="text-[0.75rem] text-[#C0392B] bg-[#FFF5F5] border border-[#EDB9B9] rounded-lg px-3 py-2">{inviteError}</div>}
                </div>
                <div className="px-7 pb-6 flex gap-3 justify-end">
                  <button onClick={resetInviteModal} className="px-5 py-2.5 text-[0.84rem] font-semibold text-[#6B5A52] bg-white border-[1.5px] border-[#E2DAD1] rounded-xl hover:border-[#9C8E86] transition-all cursor-pointer">Cancel</button>
                  <button onClick={handleInvite} disabled={isInviting || !inviteForm.firstName.trim() || !inviteForm.email.trim()} className="px-7 py-2.5 text-[0.84rem] font-semibold text-white bg-[#E8601C] rounded-xl hover:bg-[#C04E12] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(232,96,28,0.3)] flex items-center gap-2">
                    <span>📧</span>{isInviting ? "Sending…" : "Send Invite"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-7 pt-6 pb-2 flex items-start justify-between">
                  <h2 className="font-serif text-[1.6rem] font-semibold text-[#2C2420] leading-tight">Invite Sent!</h2>
                  <button onClick={resetInviteModal} className="w-8 h-8 rounded-full text-[#9C8E86] flex items-center justify-center hover:bg-[#F7F5F2] transition-all text-[1rem] cursor-pointer mt-1">✕</button>
                </div>
                <div className="px-7 py-5 space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-[#F0FBF4] border-[1.5px] border-[#A5D6A7] rounded-xl">
                    <div className="w-11 h-11 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[1.4rem] flex-shrink-0">✓</div>
                    <div>
                      <div className="font-semibold text-[0.92rem] text-[#2C2420]">{[inviteForm.firstName, inviteForm.lastName].filter(Boolean).join(" ")} has been invited</div>
                      <div className="text-[0.76rem] text-[#6B5A52] mt-0.5">An email is on its way to <span className="font-medium">{inviteForm.email}</span></div>
                    </div>
                  </div>
                  <div className="bg-[#F7F5F2] border border-[#E2DAD1] rounded-xl p-4 space-y-3">
                    <div className="text-[0.68rem] text-[#9C8E86] uppercase tracking-[0.07em] font-semibold">What happens next</div>
                    {[
                      { step: "1", text: "They receive an email with a secure sign-in link" },
                      { step: "2", text: "They click the link, set a password, and sign in" },
                      { step: "3", text: `They automatically join this workspace as ${TEAM_ROLES.find((r) => r.value === inviteForm.role)?.label}` },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#E8601C] text-white text-[0.65rem] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{step}</span>
                        <p className="text-[0.78rem] text-[#5C4F48] leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-7 pb-6 flex justify-end">
                  <button onClick={resetInviteModal} className="px-7 py-2.5 text-[0.84rem] font-semibold text-white bg-[#E8601C] rounded-xl hover:bg-[#C04E12] transition-all cursor-pointer shadow-[0_4px_16px_rgba(232,96,28,0.3)]">Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── REMOVE MEMBER CONFIRMATION ── */}
      <ConfirmDialog
        open={deleteMemberTarget !== null}
        variant="danger"
        title="Remove Member"
        message={deleteMemberTarget ? `Remove ${deleteMemberTarget.name} from this organisation? They will lose access immediately.` : "Remove this member?"}
        confirmLabel="Remove Member"
        loading={isDeletingMember}
        onConfirm={handleDeleteMember}
        onCancel={() => setDeleteMemberTarget(null)}
      />
    </div>
  );
}
