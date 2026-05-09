import { Approval } from "@/types/dashboard";
import { useDashboardUI } from "@/stores/dashboard-ui";

const APPR_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  "Approved":           { bg: "#E8F5EE", color: "#2A6045", icon: "✅" },
  "Pending":            { bg: "#FDE8DC", color: "#C04E12", icon: "⏳" },
  "Rejected":           { bg: "#FDECEA", color: "#C0392B", icon: "❌" },
  "Revision Required":  { bg: "#FFF8E0", color: "#8A6200", icon: "✏️" },
};

const APPR_TYPE_ICON: Record<string, string> = {
  "Client": "👤", "Architect": "📐", "MEP – Electrical": "⚡",
  "MEP – Plumbing": "🔧", "MEP – HVAC": "❄️", "MEP – Fire": "🔥",
  "Structural": "🏗",
};

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

interface ApprovalsProps {
  project: { approvals: Approval[]; units: Record<string, string[]> };
  filteredApprovals: Approval[];
  units: string[];
  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
}

export default function Approvals({
  project,
  filteredApprovals,
  units,
  onEdit,
  onDelete,
}: ApprovalsProps) {
  const {
    apprFilterType, setApprFilterType,
    apprFilterStatus, setApprFilterStatus,
    apprFilterUnit, setApprFilterUnit,
    setShowApprovalModal,
  } = useDashboardUI();

  const total=project.approvals.length, approved=project.approvals.filter(a=>a.status==="Approved").length,
    pending=project.approvals.filter(a=>a.status==="Pending").length,
    revision=project.approvals.filter(a=>a.status==="Revision Required"||a.status==="Rejected").length;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Approvals Log</div>
          <div className="text-[0.82rem] text-[#9C8E86]">Client sign-offs · MEP consultant approvals · Design decisions</div>
        </div>
        <button onClick={() => setShowApprovalModal(true)} className="bg-transparent text-[#E8601C] border-[1.5px] border-[#E8601C] rounded-lg px-4 py-2 text-[0.78rem] font-medium cursor-pointer transition-all hover:bg-[#E8601C] hover:text-white">
          + Log Approval
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { num: total, label: "Total", color: "#E8601C", fill: 100 },
          { num: approved, label: "Approved", color: "#3D8A5F", fill: total ? Math.round(approved/total*100) : 0 },
          { num: pending, label: "Pending", color: "#F4895A", fill: total ? Math.round(pending/total*100) : 0 },
          { num: revision, label: "Revision / Rejected", color: "#C0392B", fill: total ? Math.round(revision/total*100) : 0 },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E2DAD1] p-4 shadow-[0_2px_20px_rgba(44,36,32,0.07)]">
            <div className="font-serif text-[2.4rem] font-light leading-[1]" style={{ color: k.color }}>{k.num}</div>
            <div className="text-[0.72rem] text-[#9C8E86] tracking-[0.06em] uppercase mt-1">{k.label}</div>
            <div className="h-[3px] rounded-full bg-[#EEE9E3] overflow-hidden mt-3">
              <div className="h-full rounded-full transition-all" style={{ width: `${k.fill}%`, backgroundColor: k.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap mb-5 items-center">
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Type</label>
        <select value={apprFilterType} onChange={(e) => setApprFilterType(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
          <option value="">All</option>
          {["Client", "MEP – Electrical", "MEP – Plumbing", "MEP – HVAC", "MEP – Fire", "Structural", "Architect"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Status</label>
        <select value={apprFilterStatus} onChange={(e) => setApprFilterStatus(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
          <option value="">All</option>
          {["Approved", "Pending", "Rejected", "Revision Required"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Unit</label>
        <select value={apprFilterUnit} onChange={(e) => setApprFilterUnit(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
          <option value="">All</option>
          {units.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {/* Approval cards */}
      {filteredApprovals.length === 0 ? (
        <div className="text-center py-12 text-[#9C8E86] text-[0.85rem]">
          <div className="text-[2.5rem] mb-3 opacity-40">📋</div>
          No approvals match your filters.
        </div>
      ) : (
        filteredApprovals.map((a) => {
          const st = APPR_STYLE[a.status] || APPR_STYLE["Pending"];
          const icon = APPR_TYPE_ICON[a.type] || "📄";
          return (
            <div key={a.id} className="bg-white rounded-xl border border-[#E2DAD1] p-[1.1rem_1.25rem] mb-[0.85rem] shadow-[0_2px_20px_rgba(44,36,32,0.07)] flex gap-4 items-start">
              <div className="text-[1.5rem] flex-shrink-0 mt-[2px]">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-semibold text-[0.9rem] text-[#2C2420]">{a.desc}</div>
                    <div className="text-[0.75rem] text-[#9C8E86] mt-[0.2rem]">
                      {a.type} · {a.unit} · Logged by {a.by}
                    </div>
                  </div>
                  <div className="flex items-center gap-[0.6rem] flex-shrink-0">
                    <span
                      className="px-[0.7rem] py-[0.25rem] rounded-full text-[0.72rem] font-bold whitespace-nowrap"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.icon} {a.status}
                    </span>
                    {onEdit && (
                      <button onClick={() => onEdit(a.id)} className="text-[#E8601C] hover:text-[#C04E12] text-[0.85rem] cursor-pointer" title="Edit">✏️</button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(a.id)} className="text-[#9C8E86] hover:text-[#C0392B] text-[0.78rem] cursor-pointer" title="Remove">✕</button>
                    )}
                  </div>
                </div>
                <div className="flex gap-6 mt-[0.6rem] text-[0.75rem] text-[#9C8E86] flex-wrap">
                  <span>Submitted: {fmtDate(a.submitted)}</span>
                  <span>Responded: {a.responded ? fmtDate(a.responded) : "Awaiting"}</span>
                </div>
                {a.remarks && (
                  <div className="mt-[0.5rem] text-[0.78rem] text-[#5C4F48] bg-[#F7F5F2] px-3 py-[0.45rem] rounded-[6px] border-l-[3px] border-[#E8601C]">
                    {a.remarks}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
