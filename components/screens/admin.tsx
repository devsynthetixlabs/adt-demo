"use client";

import { useState } from "react";

interface Project {
  id: string;
  name: string;
  icon: string;
  client: string;
  address: string;
  startDate: string;
  endDate: string;
  units: Record<string, string[]>;
  assigneeProfiles: Record<string, { color: string; phone: string; email: string; role: string; visibility: string[] }>;
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

interface AdminProps {
  projects: Record<string, Project>;
  activeProjectId: string;
  sessionRole: string;
  adminSubtab: "units" | "assignees" | "projects" | "settings";
  setAdminSubtab: (tab: "units" | "assignees" | "projects" | "settings") => void;
  switchProject: (id: string) => void;
  project: Project;
}

export default function Admin({ projects, activeProjectId, sessionRole, adminSubtab, setAdminSubtab, switchProject, project }: AdminProps) {
  const [notifMaster, setNotifMaster] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["In-App", "WhatsApp", "SMS", "Email"]);
  const [expandedAssignee, setExpandedAssignee] = useState<string | null>(null);
  const [remAuto, setRemAuto] = useState(true);
  const [remFreq, setRemFreq] = useState<"once" | "twice">("twice");
  const [alertOverdue, setAlertOverdue] = useState(true);
  const [alert7day, setAlert7day] = useState(true);
  const [alertApproval, setAlertApproval] = useState(true);
  const [alertSnag, setAlertSnag] = useState(true);

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
              adminSubtab === tab ? "text-[#E8601C] border-b-[#E8601C]" : "text-[#9C8E86] border-b-transparent hover:text-[#E8601C]"
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

      {/* PROJECTS TAB */}
      {adminSubtab === "projects" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[0.82rem] text-[#9C8E86]">All projects · tap to switch active · manage here</div>
            <button className="bg-[#E8601C] text-white border-none rounded-lg px-4 py-2 text-[0.78rem] font-semibold cursor-pointer transition-all hover:bg-[#C04E12]">+ New Project</button>
          </div>
          {Object.values(projects).map((p) => (
            <div
              key={p.id}
              onClick={() => switchProject(p.id)}
              className={`flex items-center gap-4 px-5 py-4 mb-3 rounded-xl border-[1.5px] cursor-pointer transition-all shadow-[0_2px_20px_rgba(44,36,32,0.07)] ${
                p.id === activeProjectId ? "border-[#E8601C] bg-[#FEF4EF]" : "border-[#E2DAD1] bg-white hover:border-[#F4895A] hover:translate-x-0.5"
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
                <button onClick={(e) => { e.stopPropagation(); }} className="w-8 h-8 rounded-[6px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.75rem] transition-all hover:border-[#E8601C] hover:text-[#E8601C]">✎</button>
                <button onClick={(e) => { e.stopPropagation(); }} className="w-8 h-8 rounded-[6px] border border-[#EDB9B9] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.75rem] transition-all hover:border-[#C0392B] hover:text-[#C0392B]">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UNITS & ROOMS TAB */}
      {adminSubtab === "units" && (
        <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
            <div>
              <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Units & Rooms</div>
              <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">Add, rename or remove units and rooms for this project only</div>
            </div>
            <button className="bg-[#E8601C] text-white border-none rounded-lg px-4 py-2 text-[0.78rem] font-semibold cursor-pointer transition-all hover:bg-[#C04E12]">+ Add Unit</button>
          </div>
          {Object.entries(project.units).map(([unit, rooms]) => (
            <div key={unit} className="border-[1.5px] border-[#E2DAD1] rounded-lg mx-4 my-3 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#F7F5F2]">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[0.9rem] text-[#2C2420]">{unit}</span>
                  <span className="bg-[#FDE8DC] text-[#C04E12] text-[0.65rem] font-bold px-2 py-0.5 rounded-full">{rooms.length} rooms</span>
                </div>
                <div className="flex gap-2">
                  <button className="w-7 h-7 rounded-[6px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.75rem] transition-all hover:border-[#E8601C] hover:text-[#E8601C]">✎</button>
                  <button className="w-7 h-7 rounded-[6px] border border-[#EDB9B9] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.75rem] transition-all hover:border-[#C0392B] hover:text-[#C0392B]">✕</button>
                </div>
              </div>
              <div className="px-4 py-2">
                {rooms.map((room) => (
                  <div key={room} className="flex items-center justify-between py-2 px-2 rounded-[6px] text-[0.82rem] text-[#5C4F48] transition-all hover:bg-[#FEF4EF]">
                    <span className="flex items-center gap-2"><span className="text-[0.75rem] cursor-grab text-[#9C8E86]">⠿</span>{room}</span>
                    <button className="w-6 h-6 rounded-[4px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.65rem] transition-all hover:border-[#E8601C] hover:text-[#E8601C]">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 px-4 py-3 border-t border-[#E2DAD1] bg-[#F7F5F2]">
                <input placeholder="Add new room..." className="flex-1 px-3 py-1.5 text-[0.8rem] bg-white border-[1.5px] border-[#E2DAD1] rounded-[6px] outline-none focus:border-[#E8601C] focus:bg-white text-[#2C2420]" />
                <button className="bg-[#E8601C] text-white border-none rounded-[7px] px-3 py-1.5 text-[0.78rem] font-medium cursor-pointer transition-all hover:bg-[#C04E12]">+ Add</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGNEES TAB */}
      {adminSubtab === "assignees" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div>
            {/* Assignees / Contractors Card */}
            <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
                <div>
                  <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Assignees / Contractors</div>
                  <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">Contacts & colours for this project only</div>
                </div>
              </div>
              <div className="p-4">
                {/* Live User Count */}
                <div className="flex items-center gap-4 mb-4 p-3 bg-[#F7F5F2] rounded-lg">
                  <div className="text-[1.4rem] font-serif font-light text-[#E8601C]">{Object.keys(project.assigneeProfiles).length}</div>
                  <div className="text-[0.75rem] text-[#5C4F48]">
                    <div className="font-semibold">Active seats on this project</div>
                    <div className="text-[#9C8E86] text-[0.7rem]">Each assignee with an email = 1 subscription seat</div>
                  </div>
                </div>
                {/* Assignee List */}
                <div className="flex flex-col gap-2">
                  {Object.entries(project.assigneeProfiles).map(([name, profile]) => {
                    const isExpanded = expandedAssignee === name;
                    const hasEmail = !!profile.email;
                    const loginStatus = (profile as any).loginStatus || (hasEmail ? "active" : "pending");
                    const statusConfig: any = {
                      active: { cls: "bg-[#E8F5E9] text-[#2E7D32]", label: "● Logged in" },
                      pending: { cls: "bg-[#FFF3E0] text-[#E65100]", label: "○ No Login" },
                      invited: { cls: "bg-[#E3F2FD] text-[#1565C0]", label: "◉ Invited" },
                    };
                    const sc = statusConfig[loginStatus];
                    return (
                      <div key={name} className="border-[1.5px] border-[#E2DAD1] rounded-[8px] bg-[#F7F5F2] transition-all hover:border-[#F4895A] overflow-hidden">
                        <div className="flex items-center gap-3 px-[0.75rem] py-[0.55rem]">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.65rem] font-bold flex-shrink-0 cursor-pointer border-2 border-white shadow-[0_0_0_1.5px_rgba(44,36,32,0.15)] transition-all hover:shadow-[0_0_0_2px_#E8601C]"
                            style={{ backgroundColor: profile.color }}
                          >
                            {name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                defaultValue={name}
                                className="bg-transparent border-none outline-none text-[0.85rem] font-semibold text-[#2C2420] cursor-pointer hover:text-[#E8601C] p-0 flex-1 min-w-[80px]"
                              />
                              <span className={`text-[0.65rem] px-1.5 py-0.5 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                            </div>
                            <div className="flex gap-1.5 mt-0.5 items-center flex-wrap text-[0.68rem] text-[#9C8E86]">
                              <span className="bg-[#FDE8DC] text-[#C04E12] px-1.5 py-0.5 rounded-full text-[0.68rem] font-medium">{profile.role}</span>
                              <span>{Object.keys(profile.visibility || {}).length} tabs visible</span>
                              {hasEmail && <span className="text-[#5C4F48]">· {profile.email}</span>}
                              {!hasEmail && <span className="text-[#C0392B]">· No login email</span>}
                            </div>
                            {(loginStatus === "invited" || loginStatus === "active") && hasEmail && (
                              <div className="flex gap-2 mt-1">
                                {loginStatus === "invited" && (
                                  <span className="text-[0.65rem] text-[#E8601C] cursor-pointer font-semibold">↺ Resend invite</span>
                                )}
                                <span className="text-[#9C8E86] text-[0.65rem]">·</span>
                                <span className="text-[0.65rem] text-[#C0392B] cursor-pointer font-semibold">✕ Revoke {loginStatus === "active" ? "access" : ""}</span>
                              </div>
                            )}
                            {loginStatus === "pending" && (
                              <div className="mt-1">
                                <span className="text-[0.65rem] text-[#E8601C] cursor-pointer font-semibold">+ Add email to enable login</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div onClick={() => setExpandedAssignee(isExpanded ? null : name)} className="w-6 h-6 rounded-[4px] border border-[#E2DAD1] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.65rem] transition-all hover:border-[#E8601C] hover:text-[#E8601C]">{isExpanded ? "▲" : "✎"}</div>
                            <div className="w-6 h-6 rounded-[4px] border border-[#EDB9B9] bg-white text-[#9C8E86] flex items-center justify-center cursor-pointer text-[0.65rem] transition-all hover:border-[#C0392B] hover:text-[#C0392B]">✕</div>
                          </div>
                        </div>
                        {/* Expandable Panel */}
                        {isExpanded && (
                          <div className="border-t border-[#E2DAD1] px-3 py-3 bg-white">
                            <div className="text-[0.68rem] font-semibold text-[#E8601C] uppercase tracking-[0.05em] mb-2">Contact Details & Login</div>
                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <div className="text-[0.65rem] text-[#9C8E86] mb-0.5">Role / Trade</div>
                                <select defaultValue={profile.role} className="w-full text-[0.78rem] px-2 py-1 border-[1.5px] border-[#E2DAD1] rounded-[6px] bg-[#F7F5F2] outline-none focus:border-[#E8601C]">
                                  {['Client','Architect','Site Supervisor','Contractor','MEP Consultant','Vendor'].map((r) => <option key={r}>{r}</option>)}
                                </select>
                              </div>
                              <div>
                                <div className="text-[0.65rem] text-[#9C8E86] mb-0.5">Phone</div>
                                <input defaultValue={profile.phone} placeholder="+91 98xxx xxxxx" className="w-full text-[0.78rem] px-2 py-1 border-[1.5px] border-[#E2DAD1] rounded-[6px] bg-[#F7F5F2] outline-none focus:border-[#E8601C]" />
                              </div>
                              <div>
                                <div className="text-[0.65rem] text-[#9C8E86] mb-0.5">Login Email <span className="text-[#E8601C]">*</span></div>
                                <input defaultValue={profile.email} placeholder="email@domain.com" className="w-full text-[0.78rem] px-2 py-1 border-[1.5px] border-[#E2DAD1] rounded-[6px] bg-[#F7F5F2] outline-none focus:border-[#E8601C]" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button className="w-full bg-[#E8601C] text-white border-none rounded-lg px-4 py-2 text-[0.78rem] font-semibold cursor-pointer transition-all hover:bg-[#C04E12] mt-4">📧 Invite New Team Member</button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Team Directory */}
            <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
              <div className="px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
                <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Team Directory</div>
                <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">Contact details — visible to all team members</div>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(project.assigneeProfiles).map(([name, profile]) => {
                  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  const hasPhone = profile.phone && profile.phone.trim();
                  const hasEmail = profile.email && profile.email.trim();
                  return (
                    <div key={name} className="border-[1.5px] border-[#E2DAD1] rounded-[10px] bg-[#F7F5F2] overflow-hidden">
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[0.72rem] font-bold flex-shrink-0"
                          style={{ backgroundColor: profile.color }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.86rem] font-semibold text-[#2C2420]">{name}</div>
                          <span className="text-[0.68rem] text-[#9C8E86]">{profile.role}</span>
                        </div>
                      </div>
                      {(hasPhone || hasEmail) ? (
                        <div className="px-3 pb-3 flex gap-2 flex-wrap">
                          {hasEmail && <span className="bg-[#FDE8DC] text-[#C04E12] px-2 py-0.5 rounded-full text-[0.68rem] font-medium">✉ {profile.email}</span>}
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

            {/* Change Log */}
            <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden mt-6">
              <div className="px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
                <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Change Log</div>
              </div>
              <div className="p-4 max-h-[220px] overflow-y-auto text-[0.75rem] text-[#9C8E86]">
                No changes yet.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {adminSubtab === "settings" && (
        <div className="space-y-6">
          {/* Project Settings Card */}
          <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
            <div className="px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
              <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Project Settings</div>
              <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">Notifications, reminders & preferences</div>
            </div>

            {/* Project Info Fields */}
            <div className="divide-y divide-[#E2DAD1]">
              {[
                { label: "Project Name", value: project.name, type: "text" },
                { label: "Client Name", value: project.client, type: "text" },
                { label: "Address", value: project.address, type: "text" },
                { label: "Start Date", value: project.startDate, type: "date" },
                { label: "End Date", value: project.endDate, type: "date" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-[0.85rem] font-semibold text-[#2C2420]">{row.label}</div>
                  </div>
                  <input
                    type={row.type}
                    defaultValue={row.value}
                    className="w-auto px-3 py-1.5 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                  />
                </div>
              ))}
            </div>

            {/* NOTIFICATIONS SECTION */}
            <div className="px-5 py-4 border-t border-[#E2DAD1]">
              <div className="text-[0.78rem] font-semibold text-[#E8601C] tracking-[0.06em] uppercase mb-4">Notifications</div>

              {/* Master Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-[#E2DAD1]">
                <div>
                  <div className="text-[0.85rem] font-semibold text-[#2C2420]">Enable notifications for this project</div>
                  <div className="text-[0.72rem] text-[#9C8E86]">Master toggle — turns all alerts on/off for this project</div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full cursor-pointer relative transition-all ${notifMaster ? "bg-[#E8601C]" : "bg-[#E2DAD1]"}`}
                  onClick={() => setNotifMaster(!notifMaster)}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifMaster ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </div>

              {/* Channel Grid */}
              <div className="py-3 border-b border-[#E2DAD1]">
                <div>
                  <div className="text-[0.85rem] font-semibold text-[#2C2420]">Channels to notify on</div>
                  <div className="text-[0.72rem] text-[#9C8E86]">Pick where alerts are delivered</div>
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  {["In-App", "WhatsApp", "SMS", "Email"].map((ch) => {
                    const isSelected = selectedChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedChannels(selectedChannels.filter((c) => c !== ch));
                          } else {
                            setSelectedChannels([...selectedChannels, ch]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-[0.68rem] font-medium cursor-pointer border transition-all ${
                          isSelected
                            ? "bg-[#FDE8DC] text-[#C04E12] border-[#F4895A]"
                            : "bg-[#F7F5F2] text-[#9C8E86] border-[#E2DAD1] hover:text-[#E8601C]"
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DAILY REMINDERS SECTION */}
            <div className="px-5 py-4 border-t border-[#E2DAD1]">
              <div className="text-[0.78rem] font-semibold text-[#E8601C] tracking-[0.06em] uppercase mt-6 mb-4">Daily Reminders</div>

              {/* Auto-send Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-[#E2DAD1]">
                <div>
                  <div className="text-[0.85rem] font-semibold text-[#2C2420]">Auto-send reminders</div>
                  <div className="text-[0.72rem] text-[#9C8E86]">Send today's task list to each contractor automatically</div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full cursor-pointer relative transition-all ${remAuto ? "bg-[#E8601C]" : "bg-[#E2DAD1]"}`}
                  onClick={() => setRemAuto(!remAuto)}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${remAuto ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </div>

              {/* Reminder Frequency */}
              <div className="flex items-center justify-between py-3 border-b border-[#E2DAD1]">
                <div>
                  <div className="text-[0.85rem] font-semibold text-[#2C2420]">Reminder frequency</div>
                  <div className="text-[0.72rem] text-[#9C8E86]">How often reminders go out each day</div>
                </div>
                <div className="flex bg-[#F7F5F2] rounded-lg p-0.5 border border-[#E2DAD1]">
                  <button
                    className={`px-3 py-1 rounded-md text-[0.72rem] font-semibold transition-all ${remFreq === "once" ? "bg-[#E8601C] text-white" : "text-[#9C8E86] hover:text-[#E8601C]"}`}
                    onClick={() => setRemFreq("once")}
                  >
                    Once daily
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-[0.72rem] font-semibold transition-all ${remFreq === "twice" ? "bg-[#E8601C] text-white" : "text-[#9C8E86] hover:text-[#E8601C]"}`}
                    onClick={() => setRemFreq("twice")}
                  >
                    Twice daily
                  </button>
                </div>
              </div>

              {/* Reminder Times */}
              <div className="flex items-center justify-between py-3 border-b border-[#E2DAD1]">
                <div>
                  <div className="text-[0.85rem] font-semibold text-[#2C2420]">Reminder times</div>
                  <div className="text-[0.72rem] text-[#9C8E86]">When notifications are sent (24-hr format)</div>
                </div>
                <div className="flex gap-2">
                  <input type="time" defaultValue="08:00" className="w-auto px-3 py-1.5 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" />
                  <input type="time" defaultValue="16:00" className="w-auto px-3 py-1.5 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" />
                </div>
              </div>
            </div>

            {/* CRITICAL ALERTS SECTION */}
            <div className="px-5 py-4 border-t border-[#E2DAD1]">
              <div className="text-[0.78rem] font-semibold text-[#E8601C] tracking-[0.06em] uppercase mt-6 mb-4">Critical Alerts</div>

              {[
                { label: "Overdue task alert", desc: "Notify client when a task crosses its due date", state: alertOverdue, setState: setAlertOverdue },
                { label: "7+ day delay alert", desc: "Critical flag when a task is delayed by more than a week", state: alert7day, setState: setAlert7day },
                { label: "New approval needed", desc: "Alert when a client/MEP approval is logged", state: alertApproval, setState: setAlertApproval },
                { label: "New snag logged", desc: "Alert site supervisor when a defect is reported", state: alertSnag, setState: setAlertSnag },
              ].map((alert, i) => (
                <div key={i} className={`flex items-center justify-between py-3 ${i < 3 ? "border-b border-[#E2DAD1]" : ""}`}>
                  <div>
                    <div className="text-[0.85rem] font-semibold text-[#2C2420]">{alert.label}</div>
                    <div className="text-[0.72rem] text-[#9C8E86]">{alert.desc}</div>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full cursor-pointer relative transition-all ${alert.state ? "bg-[#E8601C]" : "bg-[#E2DAD1]"}`}
                    onClick={() => alert.setState(!alert.state)}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${alert.state ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DANGER ZONE - At the bottom, full width */}
          <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
            <div className="px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
              <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Danger Zone</div>
            </div>
            <div className="p-5">
              <div className="px-4 py-3.5 bg-[#FFF5F5] border-[1.5px] border-[#EDB9B9] rounded-lg mb-4">
                <div className="font-semibold text-[0.9rem] text-[#2C2420] mb-1">Delete Project</div>
                <div className="text-[0.75rem] text-[#9C8E86] leading-[1.5] mb-3">This action cannot be undone. This will permanently delete the project and all associated data.</div>
                <button className="bg-[#C0392B] text-white border-none rounded-[8px] px-4 py-2 text-[0.82rem] font-semibold cursor-pointer transition-all hover:bg-[#a33020]">Delete Project</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
