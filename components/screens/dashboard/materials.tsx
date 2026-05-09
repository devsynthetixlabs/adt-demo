import { Material } from "@/types/dashboard";
import { useDashboardUI } from "@/stores/dashboard-ui";

interface MaterialsProps {
  project: { materials: Material[]; units: Record<string, string[]> };
  filteredMaterials: Material[];
  units: string[];
  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
}

export default function Materials({
  project,
  filteredMaterials,
  units,
  onEdit,
  onDelete,
}: MaterialsProps) {
  const {
    matFilterStatus, setMatFilterStatus,
    matFilterUnit, setMatFilterUnit,
    matFilterCat, setMatFilterCat,
    setShowMatModal,
  } = useDashboardUI();
  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Material Tracker</div>
          <div className="text-[0.82rem] text-[#9C8E86]">Log procurement status · Track deliveries · Link to rooms</div>
        </div>
        <button onClick={() => setShowMatModal(true)} className="bg-transparent text-[#E8601C] border-[1.5px] border-[#E8601C] rounded-lg px-4 py-2 text-[0.78rem] font-medium cursor-pointer transition-all hover:bg-[#E8601C] hover:text-white">
          + Add Material
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Items", num: project.materials.length, color: "#E8601C", fill: 100 },
          { label: "Delivered", num: project.materials.filter((m: Material) => m.status === "Delivered").length, color: "#3D8A5F", fill: project.materials.length > 0 ? Math.round((project.materials.filter((m: Material) => m.status === "Delivered").length / project.materials.length) * 100) : 0 },
          { label: "Ordered / In Transit", num: project.materials.filter((m: Material) => m.status === "Ordered").length, color: "#F4895A", fill: project.materials.length > 0 ? Math.round((project.materials.filter((m: Material) => m.status === "Ordered").length / project.materials.length) * 100) : 0 },
          { label: "Pending Order", num: project.materials.filter((m: Material) => m.status === "Pending Order" || m.status === "On Hold").length, color: "#C0392B", fill: project.materials.length > 0 ? Math.round((project.materials.filter((m: Material) => m.status === "Pending Order" || m.status === "On Hold").length / project.materials.length) * 100) : 0 },
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

      <div className="flex gap-3 flex-wrap mb-5 items-center">
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Status</label>
        <select value={matFilterStatus} onChange={(e) => setMatFilterStatus(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
          <option value="">All</option>
          {["Ordered", "Delivered", "Pending Order", "On Hold"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Unit</label>
        <select value={matFilterUnit} onChange={(e) => setMatFilterUnit(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
          <option value="">All</option>
          {units.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Category</label>
        <select value={matFilterCat} onChange={(e) => setMatFilterCat(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
          <option value="">All</option>
          {["Tiles & Flooring", "Sanitary & Plumbing", "Electrical", "Joinery & Furniture", "Paint & Finishes", "Hardware & Fittings", "Civil & Structure", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.82rem] border-collapse">
            <thead>
              <tr className="bg-[#E8601C] text-white">
                <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Item</th>
                <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Category</th>
                <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Unit / Room</th>
                <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Vendor</th>
                <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Qty</th>
                <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Order Date</th>
                <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">ETA</th>
                <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Status</th>
                {(onEdit || onDelete) && <th className="px-4 py-3 w-[60px]" />}
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((m) => (
                <tr key={m.id} className="border-b border-[#E2DAD1] hover:bg-[#FEF4EF]">
                  <td className="px-4 py-3 font-medium text-[#2C2420]">{m.name}</td>
                  <td className="px-4 py-3 text-[#5C4F48]">{m.cat}</td>
                  <td className="px-4 py-3 text-[#5C4F48]">{m.unit}{m.room ? ` — ${m.room}` : ""}</td>
                  <td className="px-4 py-3 text-[#5C4F48]">{m.vendor}</td>
                  <td className="px-4 py-3 text-[#5C4F48]">{m.qty}</td>
                  <td className="px-4 py-3 text-[#5C4F48]">{m.orderDate || "—"}</td>
                  <td className="px-4 py-3 text-[#5C4F48]">{m.eta || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${m.status === "Delivered" ? "bg-[#E4F4EC] text-[#3D8A5F]" : m.status === "Ordered" ? "bg-[#FDE8DC] text-[#C04E12]" : m.status === "On Hold" ? "bg-[#EEE9E3] text-[#9C8E86]" : "bg-[#FDECEA] text-[#C0392B]"}`}>{m.status}</span>
                  </td>
                  {(onEdit || onDelete) && (
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      {onEdit && <button onClick={() => onEdit(m.id)} className="text-[#E8601C] hover:text-[#C04E12] text-[0.85rem] cursor-pointer mr-2" title="Edit">✏️</button>}
                      {onDelete && <button onClick={() => onDelete(m.id)} className="text-[#9C8E86] hover:text-[#C0392B] text-[0.85rem] cursor-pointer" title="Remove">✕</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {filteredMaterials.length === 0 && <div className="text-center py-12 text-[#9C8E86] text-[0.85rem]">No materials logged yet.</div>}
    </div>
  );
}
