import { Drawing } from "@/types/dashboard";
import { useDashboardUI } from "@/stores/dashboard-ui";


interface DrawingsProps {
  project: { drawings: Drawing[]; units: Record<string, string[]> };
  filteredDrawings: Drawing[];
  units: string[];
}

export default function Drawings({
  project,
  filteredDrawings,
  units,
}: DrawingsProps) {
  const { drawFilterUnit, setDrawFilterUnit, drawFilterType, setDrawFilterType } = useDashboardUI();
  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Drawings & Documents</div>
          <div className="text-[0.82rem] text-[#9C8E86]">Upload GFC drawings · Assign to rooms · Download anytime</div>
        </div>
      </div>

      <div className="border-2 border-dashed border-[#F4895A] rounded-xl p-10 text-center bg-[#FEF4EF] cursor-pointer transition-all hover:bg-[#FDE8DC] hover:border-[#E8601C] mb-6">
        <div className="text-[2.5rem] text-[#E8601C] mb-3">📄</div>
        <div className="font-serif text-[1.1rem] text-[#2C2420] font-semibold">Drop PDFs or click to upload</div>
        <div className="text-[0.78rem] text-[#9C8E86] mt-1">Supports PDF, DWG references, images · Max 50MB per file</div>
      </div>

      <div className="flex gap-3 flex-wrap mb-4 items-center">
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Unit</label>
        <select value={drawFilterUnit} onChange={(e) => setDrawFilterUnit(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
          <option value="">All</option>
          {units.map((u) => <option key={u} value={u}>{u}</option>)}
          <option value="All">All</option>
        </select>
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Type</label>
        <select value={drawFilterType} onChange={(e) => setDrawFilterType(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
          <option value="">All</option>
          {["Electrical", "Plumbing", "Furniture Layout", "False Ceiling", "Flooring", "Elevation"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDrawings.map((d) => (
          <div key={d.id} className="bg-white rounded-xl border border-[#E2DAD1] overflow-hidden shadow-[0_2px_20px_rgba(44,36,32,0.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_32px_rgba(44,36,32,0.1)]">
            <div className="h-[120px] bg-gradient-to-br from-[#FDE8DC] to-[#EEE9E3] flex items-center justify-center text-[2.5rem] text-[#E8601C] border-b border-[#E2DAD1]">{d.icon}</div>
            <div className="px-4 py-3">
              <div className="font-medium text-[0.82rem] text-[#2C2420]">{d.name}</div>
              <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">{d.type} · {d.unit}</div>
              <div className="flex gap-1.5 flex-wrap mt-2">
                <span className="bg-[#FDE8DC] text-[#C04E12] text-[0.65rem] px-1.5 py-0.5 rounded-full font-medium">{d.type}</span>
                <span className="bg-[#F7F5F2] text-[#9C8E86] text-[0.65rem] px-1.5 py-0.5 rounded-full font-medium">{d.size}</span>
              </div>
            </div>
            <div className="flex border-t border-[#E2DAD1] bg-[#F7F5F2]">
              <span className="flex-1 text-center text-[0.72rem] text-[#9C8E86] cursor-pointer py-1 transition-all hover:bg-[#FDE8DC] hover:text-[#E8601C]">View</span>
              <span className="flex-1 text-center text-[0.72rem] text-[#9C8E86] cursor-pointer py-1 transition-all hover:bg-[#FDE8DC] hover:text-[#E8601C]">Download</span>
            </div>
          </div>
        ))}
      </div>
      {filteredDrawings.length === 0 && <div className="text-center py-12 text-[#9C8E86] text-[0.85rem]">No drawings uploaded yet.</div>}
    </div>
  );
}
