"use client";

import { useState } from "react";
import type { Project } from "../admin";

interface SettingsTabProps {
  project: Project;
}

export default function SettingsTab({ project }: SettingsTabProps) {
  const [notifMaster, setNotifMaster] = useState(true);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["In-App", "WhatsApp", "SMS", "Email"]);
  const [remAuto, setRemAuto] = useState(true);
  const [remFreq, setRemFreq] = useState<"once" | "twice">("twice");
  const [alertOverdue, setAlertOverdue] = useState(true);
  const [alert7day, setAlert7day] = useState(true);
  const [alertApproval, setAlertApproval] = useState(true);
  const [alertSnag, setAlertSnag] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
        <div className="px-5 py-4 bg-[#F7F5F2] border-b border-[#E2DAD1]">
          <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Project Settings</div>
          <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">Notifications, reminders & preferences</div>
        </div>
        <div className="divide-y divide-[#E2DAD1]">
          {[
            { label: "Project Name", value: project.name, type: "text" },
            { label: "Client Name", value: project.client, type: "text" },
            { label: "Address", value: project.address, type: "text" },
            { label: "Start Date", value: project.startDate, type: "date" },
            { label: "End Date", value: project.endDate, type: "date" },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="text-[0.85rem] font-semibold text-[#2C2420]">{row.label}</div>
              <input type={row.type} defaultValue={row.value} className="w-auto px-3 py-1.5 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" />
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-[#E2DAD1]">
          <div className="text-[0.78rem] font-semibold text-[#E8601C] tracking-[0.06em] uppercase mb-4">Notifications</div>
          <div className="flex items-center justify-between py-3 border-b border-[#E2DAD1]">
            <div>
              <div className="text-[0.85rem] font-semibold text-[#2C2420]">Enable notifications for this project</div>
              <div className="text-[0.72rem] text-[#9C8E86]">Master toggle — turns all alerts on/off for this project</div>
            </div>
            <div className={`w-11 h-6 rounded-full cursor-pointer relative transition-all ${notifMaster ? "bg-[#E8601C]" : "bg-[#E2DAD1]"}`} onClick={() => setNotifMaster(!notifMaster)}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifMaster ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </div>
          <div className="py-3 border-b border-[#E2DAD1]">
            <div className="text-[0.85rem] font-semibold text-[#2C2420]">Channels to notify on</div>
            <div className="text-[0.72rem] text-[#9C8E86]">Pick where alerts are delivered</div>
            <div className="flex gap-2 flex-wrap mt-3">
              {["In-App", "WhatsApp", "SMS", "Email"].map((ch) => {
                const isSelected = selectedChannels.includes(ch);
                return (
                  <button key={ch} onClick={() => setSelectedChannels(isSelected ? selectedChannels.filter((c) => c !== ch) : [...selectedChannels, ch])}
                    className={`px-2.5 py-1 rounded-full text-[0.68rem] font-medium cursor-pointer border transition-all ${isSelected ? "bg-[#FDE8DC] text-[#C04E12] border-[#F4895A]" : "bg-[#F7F5F2] text-[#9C8E86] border-[#E2DAD1] hover:text-[#E8601C]"}`}>
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[#E2DAD1]">
          <div className="text-[0.78rem] font-semibold text-[#E8601C] tracking-[0.06em] uppercase mt-6 mb-4">Daily Reminders</div>
          <div className="flex items-center justify-between py-3 border-b border-[#E2DAD1]">
            <div>
              <div className="text-[0.85rem] font-semibold text-[#2C2420]">Auto-send reminders</div>
              <div className="text-[0.72rem] text-[#9C8E86]">Send today's task list to each contractor automatically</div>
            </div>
            <div className={`w-11 h-6 rounded-full cursor-pointer relative transition-all ${remAuto ? "bg-[#E8601C]" : "bg-[#E2DAD1]"}`} onClick={() => setRemAuto(!remAuto)}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${remAuto ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#E2DAD1]">
            <div>
              <div className="text-[0.85rem] font-semibold text-[#2C2420]">Reminder frequency</div>
              <div className="text-[0.72rem] text-[#9C8E86]">How often reminders go out each day</div>
            </div>
            <div className="flex bg-[#F7F5F2] rounded-lg p-0.5 border border-[#E2DAD1]">
              <button className={`px-3 py-1 rounded-md text-[0.72rem] font-semibold transition-all ${remFreq === "once" ? "bg-[#E8601C] text-white" : "text-[#9C8E86] hover:text-[#E8601C]"}`} onClick={() => setRemFreq("once")}>Once daily</button>
              <button className={`px-3 py-1 rounded-md text-[0.72rem] font-semibold transition-all ${remFreq === "twice" ? "bg-[#E8601C] text-white" : "text-[#9C8E86] hover:text-[#E8601C]"}`} onClick={() => setRemFreq("twice")}>Twice daily</button>
            </div>
          </div>
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
              <div className={`w-11 h-6 rounded-full cursor-pointer relative transition-all ${alert.state ? "bg-[#E8601C]" : "bg-[#E2DAD1]"}`} onClick={() => alert.setState(!alert.state)}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${alert.state ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
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
  );
}
