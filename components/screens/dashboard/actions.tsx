import { Snag } from "@/app/(screens)/dashboard/page";
import { useDashboardUI } from "@/stores/dashboard-ui";

interface ActionsProps {
  project: {
    tasks: { id: number; assignee: string; desc: string; unit: string; room: string; start: string; status: string }[];
    snags: Snag[];
  };
  filteredSnags: Snag[];
  units: string[];
  updateTaskStatus: (id: number, status: string) => void;
  dateStr: string;
  TODAY: string;
}

export default function Actions({
  project,
  filteredSnags,
  units,
  updateTaskStatus,
  dateStr,
  TODAY,
}: ActionsProps) {
  const {
    actionSubtab, setActionSubtab,
    snagFilterPriority, setSnagFilterPriority,
    snagFilterStatus, setSnagFilterStatus,
    snagFilterUnit, setSnagFilterUnit,
    setShowSnagModal,
    showToast,
  } = useDashboardUI();
  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Action Items</div>
          <div className="text-[0.82rem] text-[#9C8E86]">Daily reminders · Site snags · Everything that needs attention</div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)]">
        <button onClick={() => setActionSubtab("reminders")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg cursor-pointer transition-all text-[0.85rem] font-semibold ${actionSubtab === "reminders" ? "bg-[#E8601C] text-white" : "text-[#9C8E86] hover:text-[#E8601C] hover:bg-[#FEF4EF]"}`}>
          🔔 Reminders <span className={`text-[0.68rem] font-bold px-1 py-0.5 rounded-full ${actionSubtab === "reminders" ? "bg-white/25 text-white" : "bg-[#EEE9E3] text-[#5C4F48]"}`}>{project.tasks.filter((t) => t.start === TODAY && t.status !== "Done").length}</span>
        </button>
        <button onClick={() => setActionSubtab("snags")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg cursor-pointer transition-all text-[0.85rem] font-semibold ${actionSubtab === "snags" ? "bg-[#E8601C] text-white" : "text-[#9C8E86] hover:text-[#E8601C] hover:bg-[#FEF4EF]"}`}>
          🚧 Snags <span className={`text-[0.68rem] font-bold px-1 py-0.5 rounded-full ${actionSubtab === "snags" ? "bg-white/25 text-white" : "bg-[#EEE9E3] text-[#5C4F48]"}`}>{project.snags.length}</span>
        </button>
      </div>

      {actionSubtab === "reminders" && (
        <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_4px_32px_rgba(44,36,32,0.1)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#E8601C] to-[#F4895A] text-white">
            <span className="font-serif text-[1.15rem] font-normal">📋 Today's Task Reminders</span>
            <span className="text-[0.75rem] text-white/80">{dateStr}</span>
          </div>
          <div className="py-2">
            {project.tasks.filter((t) => t.start === TODAY && t.status !== "Done").length === 0 ? (
              <div className="text-center py-8 text-[#9C8E86] text-[0.85rem]">No reminders for today 🎉</div>
            ) : (
              project.tasks.filter((t) => t.start === TODAY && t.status !== "Done").map((t) => (
                <div key={t.id} className="flex items-start gap-4 px-6 py-3.5 border-b border-[#E2DAD1] transition-all hover:bg-[#FEF4EF]">
                  <div className="w-[34px] h-[34px] rounded-full bg-[#FDE8DC] text-[#E8601C] flex items-center justify-center text-[0.7rem] font-bold flex-shrink-0 border-[1.5px] border-[#F4895A]">{t.assignee.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div>
                  <div className="flex-1">
                    <div className="font-medium text-[0.85rem] text-[#2C2420]">{t.assignee}</div>
                    <div className="text-[0.78rem] text-[#9C8E86] mt-0.5">{t.desc}</div>
                    <div className="text-[0.7rem] text-[#E8601C] mt-0.5 font-medium tracking-[0.03em]">{t.unit} — {t.room}</div>
                  </div>
                  <button onClick={() => { updateTaskStatus(t.id, "In Progress"); showToast(`Reminder sent to ${t.assignee}`); }} className="bg-[#E8601C] text-white border-none rounded-md px-3 py-1.5 text-[0.72rem] font-bold cursor-pointer flex-shrink-0 transition-all hover:bg-[#C04E12]">Send</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {actionSubtab === "snags" && (
        <div>
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Snags", num: project.snags.length, color: "#E8601C" },
              { label: "Open", num: project.snags.filter((s) => s.status === "Open").length, color: "#C0392B" },
              { label: "In Rectification", num: project.snags.filter((s) => s.status === "In Rectification").length, color: "#D9802A" },
              { label: "Signed Off", num: project.snags.filter((s) => s.status === "Signed Off").length, color: "#3D8A5F" },
            ].map((k) => (
              <div key={k.label} className="bg-white rounded-xl border border-[#E2DAD1] p-4 shadow-[0_2px_20px_rgba(44,36,32,0.07)]">
                <div className="font-serif text-[2.4rem] font-light leading-[1]" style={{ color: k.color }}>{k.num}</div>
                <div className="text-[0.72rem] text-[#9C8E86] tracking-[0.06em] uppercase mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap mb-5 items-center">
            <label className="text-[0.78rem] text-[#9C8E86] font-medium">Severity</label>
            <select value={snagFilterPriority} onChange={(e) => setSnagFilterPriority(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
              <option value="">All</option>
              {["Critical", "Major", "Minor"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="text-[0.78rem] text-[#9C8E86] font-medium">Status</label>
            <select value={snagFilterStatus} onChange={(e) => setSnagFilterStatus(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
              <option value="">All</option>
              {["Open", "In Rectification", "Rectified", "Signed Off"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="text-[0.78rem] text-[#9C8E86] font-medium">Unit</label>
            <select value={snagFilterUnit} onChange={(e) => setSnagFilterUnit(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
              <option value="">All</option>
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <button onClick={() => setShowSnagModal(true)} className="bg-transparent text-[#E8601C] border-[1.5px] border-[#E8601C] rounded-lg px-4 py-1.5 text-[0.78rem] font-medium cursor-pointer transition-all hover:bg-[#E8601C] hover:text-white ml-auto">+ Log Defect</button>
          </div>

          {filteredSnags.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-[#E2DAD1] mb-3 p-5 shadow-[0_2px_20px_rgba(44,36,32,0.07)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${s.priority === "Critical" ? "bg-[#FDECEA] text-[#C0392B]" : s.priority === "Major" ? "bg-[#FDE8DC] text-[#C04E12]" : "bg-[#EEE9E3] text-[#9C8E86]"}`}>{s.priority}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${s.status === "Open" ? "bg-[#EEE9E3] text-[#9C8E86]" : s.status === "In Rectification" ? "bg-[#FDE8DC] text-[#C04E12]" : s.status === "Rectified" ? "bg-[#E8F0FE] text-[#2C5FBE]" : "bg-[#E4F4EC] text-[#3D8A5F]"}`}>{s.status}</span>
                  </div>
                  <div className="font-medium text-[0.9rem] text-[#2C2420]">{s.desc}</div>
                  <div className="text-[0.75rem] text-[#9C8E86] mt-1">{s.unit} — {s.room} · Assigned to {s.assignee} · Target: {s.target || "—"}</div>
                  <div className="text-[0.72rem] text-[#E8601C] mt-0.5">Raised by {s.raisedBy} on {s.date}</div>
                </div>
              </div>
            </div>
          ))}
          {filteredSnags.length === 0 && <div className="text-center py-12 text-[#9C8E86] text-[0.85rem]">No snags logged. All clear! ✅</div>}
        </div>
      )}
    </div>
  );
}
