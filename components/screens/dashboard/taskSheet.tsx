"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/authProvider/provider";
import { useDashboardUI } from "@/stores/dashboard-ui";

interface Task {
  id: number;
  unit: string;
  room: string;
  desc: string;
  assignee: string;
  start: string;
  end: string;
  status: string;
  notes: string;
}

interface AssigneeProfile {
  color: string;
  phone: string;
  email: string;
  role: string;
  designation: string;
  visibility: string[];
}

interface TaskSheetProps {
  project: {
    tasks: Task[];
    units: Record<string, string[]>;
    assigneeProfiles: Record<string, AssigneeProfile>;
  };
  onDeleteTask: (id: number) => void;
  onUpdateTaskStatus: (id: number, status: string) => void;
  onAddTask: (task: Task) => void;
}

export default function TaskSheet({
  project,
  onDeleteTask,
  onUpdateTaskStatus,
  onAddTask,
}: TaskSheetProps) {
  const { session } = useAuth();
  const { showToast } = useDashboardUI();
  const units = Object.keys(project.units);
  const allUnits = ["All", ...units];
  const assignees = Object.keys(project.assigneeProfiles);
  const isContractor = session?.role === "contractor";
  const [activeUnit, setActiveUnit] = useState("All");
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ desc: "", unit: "", room: "", assignee: "", start: "", end: "", status: "Pending", notes: "" });
  const [taskViewMode, setTaskViewMode] = useState<"grouped" | "flat">("flat");

  useEffect(() => {
    setActiveUnit("All");
    setExpandedRooms({});
  }, [project]);

  const toggleRoom = (key: string) => {
    setExpandedRooms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addTask = () => {
    if (!taskForm.desc) return;
    const newId = Date.now();
    const newTask: Task = {
      ...taskForm,
      id: newId,
      unit: taskForm.unit || units[0],
      room: taskForm.room || project.units[taskForm.unit || units[0]][0],
      start: taskForm.start || new Date().toISOString().split("T")[0],
      end: taskForm.end || new Date().toISOString().split("T")[0],
    };
    onAddTask(newTask);
    setShowTaskModal(false);
    setTaskForm({ desc: "", unit: "", room: "", assignee: "", start: "", end: "", status: "Pending", notes: "" });
    showToast("Task added");
  };

  const filteredTasks = project.tasks.filter((t) => {
    if (activeUnit !== "All" && t.unit !== activeUnit) return false;
    if (filterAssignee && t.assignee !== filterAssignee) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterDate && t.start !== filterDate) return false;
    return true;
  });

  const tasksByUnitRoom: Record<string, Task[]> = {};
  filteredTasks.forEach((t) => {
    const key = `${t.unit} — ${t.room}`;
    if (!tasksByUnitRoom[key]) tasksByUnitRoom[key] = [];
    tasksByUnitRoom[key].push(t);
  });

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === "Done").length;
  const pendingTasks = project.tasks.filter((t) => t.status === "Pending").length;
  const inProgressTasks = project.tasks.filter((t) => t.status === "In Progress").length;
  const delayedTasks = project.tasks.filter((t) => t.status === "Delayed").length;

  function statusClass(s: string) {
    switch (s) {
      case "Done": return "bg-[#E4F4EC] text-[#3D8A5F]";
      case "In Progress": return "bg-[#FDE8DC] text-[#C04E12]";
      case "Delayed": return "bg-[#FDECEA] text-[#C0392B]";
      default: return "bg-[#EEE9E3] text-[#9C8E86]";
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Daily Task Sheets</div>
          <div className="text-[0.82rem] text-[#9C8E86] tracking-[0.03em]">Filter by unit · Add & track tasks</div>
        </div>
        <button onClick={() => setShowTaskModal(true)} className="bg-transparent text-[#E8601C] border-[1.5px] border-[#E8601C] rounded-lg px-4 py-2 text-[0.78rem] font-medium cursor-pointer transition-all hover:bg-[#E8601C] hover:text-white">
          + Add Task
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Tasks", num: totalTasks, color: "#E8601C", fill: 100 },
          { label: "Done", num: doneTasks, color: "#3D8A5F", fill: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 },
          { label: "In Progress", num: inProgressTasks, color: "#F4895A", fill: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0 },
          { label: "Pending / Delayed", num: pendingTasks + delayedTasks, color: "#C0392B", fill: totalTasks > 0 ? Math.round(((pendingTasks + delayedTasks) / totalTasks) * 100) : 0 },
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

      {/* View mode toggle */}
      <div className="flex gap-1 mb-5 bg-white rounded-lg p-1 border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)]">
        <button onClick={() => setTaskViewMode("flat")} className={`flex-1 py-2 rounded-md cursor-pointer transition-all text-[0.78rem] font-semibold ${taskViewMode === "flat" ? "bg-[#E8601C] text-white" : "text-[#9C8E86] hover:text-[#E8601C]"}`}>
          📋 All Tasks
        </button>
        <button onClick={() => setTaskViewMode("grouped")} className={`flex-1 py-2 rounded-md cursor-pointer transition-all text-[0.78rem] font-semibold ${taskViewMode === "grouped" ? "bg-[#E8601C] text-white" : "text-[#9C8E86] hover:text-[#E8601C]"}`}>
          🏠 By Room
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap mb-5 items-center">
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Unit</label>
        <select value={activeUnit} onChange={(e) => setActiveUnit(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white">
          {allUnits.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Assignee</label>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white">
          <option value="">All</option>
          {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Status</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white">
          <option value="">All</option>
          {["Pending", "In Progress", "Done", "Delayed"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="text-[0.78rem] text-[#9C8E86] font-medium">Date</label>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" />
      </div>

      {/* FLAT TABLE VIEW */}
      {taskViewMode === "flat" && (
        <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[0.82rem] border-collapse">
              <thead>
                <tr className="bg-[#E8601C] text-white">
                  <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Task</th>
                  <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Unit</th>
                  <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Room</th>
                  <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Assignee</th>
                  <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Start</th>
                  <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">End</th>
                  <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="border-b border-[#E2DAD1] transition-all hover:bg-[#FEF4EF]">
                    <td className="px-4 py-3 font-medium text-[#2C2420] max-w-[200px]">{t.desc}</td>
                    <td className="px-4 py-3 text-[#5C4F48]">{t.unit}</td>
                    <td className="px-4 py-3 text-[#5C4F48]">{t.room}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 bg-[#F7F5F2] rounded-full px-2.5 py-0.5 text-[0.72rem] text-[#5C4F48] border border-[#E2DAD1]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.assigneeProfiles[t.assignee]?.color || "#E8601C" }} />
                        {t.assignee}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5C4F48] whitespace-nowrap">{t.start}</td>
                    <td className="px-4 py-3 text-[#5C4F48] whitespace-nowrap">{t.end || "—"}</td>
                    <td className="px-4 py-3">
                      {isContractor ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {["Pending", "In Progress", "Done"].map((s) => (
                            <button
                              key={s}
                              onClick={() => onUpdateTaskStatus(t.id, s)}
                              className={`px-2.5 py-1 rounded-full text-[0.7rem] font-semibold cursor-pointer border-[1.5px] transition-all ${t.status === s ? s === "Done" ? "bg-[#E8F5EE] text-[#2A6045] border-[#A0CEB5]" : s === "In Progress" ? "bg-[#FDE8DC] text-[#C04E12] border-[#F4895A]" : "bg-[#EEE9E3] text-[#9C8E86] border-[#ccc]" : "bg-[#F7F5F2] text-[#9C8E86] border-[#E2DAD1]"}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-semibold tracking-[0.04em] ${statusClass(t.status)}`}>{t.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!isContractor && (
                          <button onClick={() => onDeleteTask(t.id)} className="text-[#9C8E86] text-[0.75rem] hover:text-[#C0392B] cursor-pointer transition-colors" title="Delete">✕</button>
                        )}
                        {isContractor && t.status !== "Done" && (
                          <button onClick={() => onUpdateTaskStatus(t.id, "Done")} className="text-[#3D8A5F] text-[0.75rem] hover:text-[#2A6045] cursor-pointer transition-colors" title="Mark Done">✓</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GROUPED BY ROOM VIEW */}
      {taskViewMode === "grouped" && (
        <>
          {Object.entries(tasksByUnitRoom).map(([key, tasks]) => {
            const expanded = expandedRooms[key];
            const done = tasks.filter((t) => t.status === "Done").length;
            const prog = tasks.filter((t) => t.status === "In Progress").length;
            const late = tasks.filter((t) => t.status === "Delayed").length;
            return (
              <div key={key} className="bg-white rounded-[10px] border border-[#E2DAD1] mb-4 overflow-hidden shadow-[0_2px_20px_rgba(44,36,32,0.07)]">
                <div onClick={() => toggleRoom(key)} className="flex items-center justify-between px-5 py-4 bg-[#F7F5F2] cursor-pointer border-b border-[#E2DAD1] transition-all hover:bg-[#FEF4EF]">
                  <span className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">{key}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-3 text-[0.75rem] text-[#9C8E86]">
                      {done > 0 && <span className="flex items-center gap-1"><span className="w-[6px] h-[6px] rounded-full bg-[#3D8A5F]" />{done} done</span>}
                      {prog > 0 && <span className="flex items-center gap-1"><span className="w-[6px] h-[6px] rounded-full bg-[#E8601C]" />{prog} in progress</span>}
                      {late > 0 && <span className="flex items-center gap-1"><span className="w-[6px] h-[6px] rounded-full bg-[#C0392B]" />{late} delayed</span>}
                    </div>
                    <span className={`text-[0.7rem] text-[#9C8E86] transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
                  </div>
                </div>
                {expanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[0.82rem] border-collapse">
                      <thead>
                        <tr className="bg-[#E8601C] text-white">
                          <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Task</th>
                          <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Assignee</th>
                          <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Start</th>
                          <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">End</th>
                          <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Status</th>
                          <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((t) => (
                          <tr key={t.id} className="border-b border-[#E2DAD1] transition-all hover:bg-[#FEF4EF]">
                            <td className="px-4 py-3 font-medium text-[#2C2420] max-w-[220px]">{t.desc}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 bg-[#F7F5F2] rounded-full px-2.5 py-0.5 text-[0.72rem] text-[#5C4F48] border border-[#E2DAD1]">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.assigneeProfiles[t.assignee]?.color || "#E8601C" }} />
                                {t.assignee}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#5C4F48] whitespace-nowrap">{t.start}</td>
                            <td className="px-4 py-3 text-[#5C4F48] whitespace-nowrap">{t.end || "—"}</td>
                            <td className="px-4 py-3">
                              {isContractor ? (
                                <div className="flex gap-1.5 flex-wrap">
                                  {["Pending", "In Progress", "Done"].map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => onUpdateTaskStatus(t.id, s)}
                                      className={`px-2.5 py-1 rounded-full text-[0.7rem] font-semibold cursor-pointer border-[1.5px] transition-all ${t.status === s ? s === "Done" ? "bg-[#E8F5EE] text-[#2A6045] border-[#A0CEB5]" : s === "In Progress" ? "bg-[#FDE8DC] text-[#C04E12] border-[#F4895A]" : "bg-[#EEE9E3] text-[#9C8E86] border-[#ccc]" : "bg-[#F7F5F2] text-[#9C8E86] border-[#E2DAD1]"}`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-semibold tracking-[0.04em] ${statusClass(t.status)}`}>{t.status}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                {!isContractor && (
                                  <button onClick={() => onDeleteTask(t.id)} className="text-[#9C8E86] text-[0.75rem] hover:text-[#C0392B] cursor-pointer transition-colors" title="Delete">✕</button>
                                )}
                                {isContractor && t.status !== "Done" && (
                                  <button onClick={() => onUpdateTaskStatus(t.id, "Done")} className="text-[#3D8A5F] text-[0.75rem] hover:text-[#2A6045] cursor-pointer transition-colors" title="Mark Done">✓</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          {Object.keys(tasksByUnitRoom).length === 0 && (
            <div className="text-center py-12 text-[#9C8E86] text-[0.85rem]">
              <div className="text-[2.5rem] mb-3 opacity-40">📋</div>
              No tasks found. Add one to get started.
            </div>
          )}
        </>
      )}
    </div>
  );
}
