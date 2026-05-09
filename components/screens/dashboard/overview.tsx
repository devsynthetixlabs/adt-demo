"use client";

const TODAY = new Date().toISOString().split("T")[0];

interface Task {
  id: number;
  unit: string;
  room: string;
  desc: string;
  assignee: string;
  status: string;
  end: string;
}

interface OverviewProps {
  project: {
    tasks: Task[];
    units: Record<string, string[]>;
    assigneeProfiles: Record<string, { color: string }>;
  };
}

export default function Overview({ project }: OverviewProps) {
  const units = Object.keys(project.units);
  const assignees = Object.keys(project.assigneeProfiles);

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = project.tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = project.tasks.filter((t) => t.status === "Pending").length;
  const delayedTasks = project.tasks.filter((t) => t.status === "Delayed").length;
  const overdueTasks = project.tasks.filter((t) => t.end < TODAY && t.status !== "Done").length;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Weekly Overview</div>
          <div className="text-[0.82rem] text-[#9C8E86]">KPIs, flags, and progress at a glance</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Tasks", num: totalTasks, color: "#E8601C" },
          { label: "Done", num: doneTasks, color: "#3D8A5F" },
          { label: "In Progress", num: inProgressTasks, color: "#E8601C" },
          { label: "Pending", num: pendingTasks, color: "#9C8E86" },
          { label: "Delayed", num: delayedTasks, color: "#C0392B" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E2DAD1] p-4 shadow-[0_2px_20px_rgba(44,36,32,0.07)]">
            <div className="font-serif text-[2.4rem] font-light leading-[1]" style={{ color: k.color }}>{k.num}</div>
            <div className="text-[0.72rem] text-[#9C8E86] tracking-[0.06em] uppercase mt-1">{k.label}</div>
            <div className="h-[3px] rounded-full bg-[#EEE9E3] overflow-hidden mt-3">
              <div className="h-full rounded-full" style={{ width: `${totalTasks > 0 ? (k.num / totalTasks) * 100 : 0}%`, backgroundColor: k.color }} />
            </div>
          </div>
        ))}
      </div>

      {overdueTasks > 0 && (
        <div className="bg-[#FFF5F5] border-[1.5px] border-[#EDB9B9] rounded-xl overflow-hidden mb-8">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#C0392B] to-[#E05050] text-white">
            <span className="font-serif text-[1.05rem] font-semibold">🚩 Overdue Tasks</span>
            <span className="bg-white/25 text-white text-[0.72rem] font-bold px-2 py-0.5 rounded-full">{overdueTasks}</span>
          </div>
          {project.tasks.filter((t) => t.end < TODAY && t.status !== "Done").map((t) => {
            const daysLate = Math.ceil((new Date(TODAY).getTime() - new Date(t.end).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={t.id} className="flex items-start gap-4 px-5 py-3 border-b border-[#F0CECE] transition-all hover:bg-[#FEF0F0]">
                <span className="bg-[#C0392B] text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">{daysLate}d late</span>
                <div className="flex-1">
                  <div className="text-[0.84rem] font-medium text-[#2C2420]">{t.desc}</div>
                  <div className="text-[0.74rem] text-[#9C8E86] mt-0.5">{t.unit} — {t.room}</div>
                  <div className="text-[0.72rem] text-[#E8601C] mt-0.5 font-medium">{t.assignee}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E2DAD1] p-6 shadow-[0_2px_20px_rgba(44,36,32,0.07)] mb-6">
        <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420] mb-5">Unit Progress</div>
        {units.map((u) => {
          const unitTasks = project.tasks.filter((t) => t.unit === u);
          const unitDone = unitTasks.filter((t) => t.status === "Done").length;
          const unitPct = unitTasks.length > 0 ? Math.round((unitDone / unitTasks.length) * 100) : 0;
          return (
            <div key={u} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[0.85rem] font-medium text-[#2C2420]">{u}</span>
                <span className="text-[0.75rem] text-[#9C8E86]">{unitDone}/{unitTasks.length} tasks · {unitPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#EEE9E3] overflow-hidden">
                <div className="h-full rounded-full bg-[#E8601C] transition-all" style={{ width: `${unitPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-[#E2DAD1] p-6 shadow-[0_2px_20px_rgba(44,36,32,0.07)]">
        <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420] mb-5">Assignee Workload</div>
        {assignees.map((a) => {
          const aTasks = project.tasks.filter((t) => t.assignee === a && t.status !== "Done");
          const aDone = project.tasks.filter((t) => t.assignee === a && t.status === "Done").length;
          const total = project.tasks.filter((t) => t.assignee === a).length;
          const color = project.assigneeProfiles[a]?.color || "#E8601C";
          return (
            <div key={a} className="flex items-center gap-3.5 mb-3 last:mb-0">
              <span className="text-[0.82rem] font-medium w-[130px] flex-shrink-0 text-[#2C2420]">{a}</span>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-[#EEE9E3] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${total > 0 ? (aDone / total) * 100 : 0}%`, backgroundColor: color }} />
                </div>
              </div>
              <span className="text-[0.75rem] text-[#9C8E86] w-[60px] text-right">{aTasks.length} active</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
