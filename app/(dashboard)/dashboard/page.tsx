"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentSession, signoutUser } from "@/lib/auth";

// ─── Types ───
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

interface Material {
  id: number;
  name: string;
  cat: string;
  unit: string;
  room: string;
  vendor: string;
  qty: string;
  orderDate: string;
  eta: string;
  status: string;
  notes: string;
}

interface Approval {
  id: number;
  desc: string;
  type: string;
  unit: string;
  by: string;
  submitted: string;
  responded: string;
  status: string;
  remarks: string;
}

interface Snag {
  id: number;
  desc: string;
  sev: string;
  unit: string;
  room: string;
  assignee: string;
  target: string;
  raisedBy: string;
  status: string;
  date: string;
}

interface Drawing {
  id: number;
  name: string;
  type: string;
  unit: string;
  size: string;
  date: string;
  icon: string;
}

interface Note {
  id: number;
  text: string;
  priority: string;
  unit: string;
  date: string;
}

interface CommsMessage {
  id: number;
  sender: string;
  text: string;
  time: string;
  outgoing: boolean;
  tag?: string;
}

interface AssigneeProfile {
  color: string;
  phone: string;
  email: string;
  role: string;
  visibility: string[];
}

interface Project {
  id: string;
  name: string;
  icon: string;
  client: string;
  address: string;
  startDate: string;
  endDate: string;
  units: Record<string, string[]>;
  assigneeProfiles: Record<string, AssigneeProfile>;
  tasks: Task[];
  materials: Material[];
  approvals: Approval[];
  snags: Snag[];
  drawings: Drawing[];
  notes: Note[];
  guidelines: string[];
  commsChannels: { id: string; name: string; sub: string; icon: string; unit: string | null }[];
  commsMessages: Record<string, CommsMessage[]>;
}

const TODAY = new Date().toISOString().split("T")[0];

const DEFAULT_PROJECTS: Record<string, Project> = {
  "proj-jhaveri": {
    id: "proj-jhaveri",
    name: "Jhaveri House",
    icon: "🏛",
    client: "Jhaveri Family",
    address: "Ahmedabad",
    startDate: "2025-01-15",
    endDate: "2025-09-30",
    units: {
      "Unit 1": ["Grandparents Lounge", "Grandmother's Bedroom", "Grandmother's Bathroom", "Grandfather's Bedroom", "Grandfather's Bathroom", "Common Pantry", "Common Powder Toilet"],
      "Unit 2": ["Informal Living", "Temple", "Formal Dining", "Serving Area", "Manisha's Kitchen", "Staff Kitchen", "Powder Toilet", "Crockery Room", "Store Room", "Utility", "Covered Walkway", "Landscaping", "Entrance Steps and Ramp"],
      "Unit 3": ["Home Theatre", "Pantry", "Bathroom 1", "Bathroom 2", "Gym", "Covered Walkway", "Formal Living", "Deck", "Swimming Pool"],
      "Unit 4": ["Museum Room 1", "Museum Room 2", "Museum Room 3", "Museum Entry", "Staircase", "Bathroom"],
    },
    assigneeProfiles: {
      "Site Supervisor": { color: "#E8601C", phone: "+91 98200 10001", email: "supervisor@site.in", role: "Site Supervisor", visibility: ["tasks", "reminders", "drawings", "comms", "notes"] },
      "Electrician": { color: "#C04E12", phone: "+91 98200 10002", email: "electrician@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
      "Plumber": { color: "#3D8A5F", phone: "+91 98200 10003", email: "plumber@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
      "Carpenter": { color: "#D4500A", phone: "+91 98200 10004", email: "carpenter@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
      "Painter": { color: "#F4895A", phone: "+91 98200 10005", email: "painter@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
      "Tiler": { color: "#B8450E", phone: "+91 98200 10006", email: "tiler@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
      "A/C Contractor": { color: "#8B5E3C", phone: "+91 98200 10007", email: "ac@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
    },
    tasks: [
      { id: 1, unit: "Unit 1", room: "Grandmother's Bathroom", desc: "Install anti-skid floor tiles", assignee: "Tiler", start: "2025-04-25", end: TODAY, status: "In Progress", notes: "" },
      { id: 2, unit: "Unit 1", room: "Common Pantry", desc: "Fit modular kitchen units", assignee: "Carpenter", start: "2025-04-24", end: TODAY, status: "In Progress", notes: "Delayed — custom shutters not delivered" },
      { id: 3, unit: "Unit 1", room: "Grandparents Lounge", desc: "Lay engineered wood flooring", assignee: "Carpenter", start: "2025-04-26", end: "2025-05-02", status: "Pending", notes: "" },
      { id: 4, unit: "Unit 1", room: "Grandfather's Bedroom", desc: "False ceiling grid installation", assignee: "Electrician", start: "2025-04-24", end: "2025-04-28", status: "Delayed", notes: "Chandelier dimensions pending confirmation" },
      { id: 5, unit: "Unit 2", room: "Manisha's Kitchen", desc: "Modular kitchen installation", assignee: "Carpenter", start: "2025-04-25", end: TODAY, status: "In Progress", notes: "" },
      { id: 6, unit: "Unit 2", room: "Formal Dining", desc: "False ceiling & light coves", assignee: "Electrician", start: "2025-04-26", end: "2025-04-30", status: "Pending", notes: "" },
      { id: 7, unit: "Unit 3", room: "Home Theatre", desc: "AV panel & acoustic wall panels", assignee: "Carpenter", start: TODAY, end: TODAY, status: "In Progress", notes: "" },
      { id: 8, unit: "Unit 3", room: "Swimming Pool", desc: "Waterproofing membrane application", assignee: "Site Supervisor", start: TODAY, end: TODAY, status: "Pending", notes: "" },
      { id: 9, unit: "Unit 4", room: "Museum Entry", desc: "Feature wall cladding", assignee: "Tiler", start: "2025-04-25", end: "2025-04-30", status: "In Progress", notes: "" },
      { id: 10, unit: "Unit 4", room: "Staircase", desc: "MS railing fabrication & install", assignee: "Carpenter", start: TODAY, end: "2025-05-05", status: "Pending", notes: "" },
    ],
    materials: [
      { id: 1, name: "600×600 Vitrified Tile — Cream Matt", cat: "Tiles & Flooring", unit: "Unit 1", room: "Grandparents Lounge", vendor: "Kajaria Ceramics", qty: "320 sqft", orderDate: "2025-04-18", eta: "2025-04-28", status: "Ordered", notes: "" },
      { id: 2, name: "EWC with soft-close seat — Hindware", cat: "Sanitary & Plumbing", unit: "Unit 1", room: "Grandmother's Bathroom", vendor: "Hindware", qty: "1 set", orderDate: "2025-04-20", eta: "2025-04-27", status: "Delivered", notes: "" },
      { id: 3, name: "Modular kitchen shutters — Acrylic finish", cat: "Joinery & Furniture", unit: "Unit 2", room: "Manisha's Kitchen", vendor: "Sleek Modular", qty: "1 set", orderDate: "", eta: "2025-05-05", status: "Pending Order", notes: "Finalising colour with client" },
    ],
    approvals: [
      { id: 1, desc: "GFC Electrical drawings — Unit 1 & 2", type: "MEP – Electrical", unit: "Unit 1", by: "Mehta MEP Consultants", submitted: "2025-04-18", responded: "2025-04-22", status: "Approved", remarks: "Approved with note: conduit depth min 25mm in wet areas." },
      { id: 2, desc: "False ceiling layout — Unit 2 Formal Dining", type: "Client", unit: "Unit 2", by: "Tanya / Anantam", submitted: "2025-04-24", responded: "", status: "Pending", remarks: "Awaiting client response on chandelier position." },
    ],
    snags: [
      { id: 1, desc: "Tile lippage exceeds 2mm at junction near bathroom door", sev: "Major", unit: "Unit 1", room: "Grandmother's Bathroom", assignee: "Tiler", target: "2025-04-30", raisedBy: "Site Supervisor", status: "Open", date: "2025-04-24" },
      { id: 2, desc: "Electrical conduit exposed at slab soffit — plastering not done", sev: "Critical", unit: "Unit 1", room: "Grandfather's Bedroom", assignee: "Electrician", target: "2025-04-28", raisedBy: "Tanya / Anantam", status: "In Rectification", date: "2025-04-23" },
    ],
    drawings: [
      { id: 1, name: "GFC - Electrical Layout U1", type: "Electrical", unit: "Unit 1", size: "4.2 MB", date: "2025-04-20", icon: "⚡" },
      { id: 2, name: "False Ceiling Plan - All Units", type: "False Ceiling", unit: "All", size: "7.8 MB", date: "2025-04-18", icon: "📐" },
      { id: 3, name: "Plumbing Schematic U2", type: "Plumbing", unit: "Unit 2", size: "3.1 MB", date: "2025-04-15", icon: "🔧" },
      { id: 4, name: "Furniture Layout - Grandparents Suite", type: "Furniture Layout", unit: "Unit 1", size: "5.6 MB", date: "2025-04-22", icon: "🛋️" },
    ],
    notes: [
      { id: 1, text: "All tiles to be fixed with approved waterproof adhesive only. No shortcuts on wet areas.", priority: "high", unit: "", date: "Apr 24" },
      { id: 2, text: "False ceiling grid must be inspected by Site Supervisor before drywall is applied.", priority: "medium", unit: "", date: "Apr 23" },
    ],
    guidelines: [
      "No work to begin before 8:00 AM or continue past 7:00 PM on weekdays.",
      "All contractors must sign into the site register at the start and end of each day.",
      "Sample approval from client or Anantam Designs required before bulk material procurement.",
    ],
    commsChannels: [
      { id: "general", name: "📢 General", sub: "All site staff", icon: "📢", unit: null },
      { id: "urgent", name: "🚨 Urgent", sub: "Critical issues only", icon: "🚨", unit: null },
    ],
    commsMessages: {
      general: [
        { id: 1, sender: "Tanya / Anantam Designs", text: "Good morning everyone — site inspection at 4pm today. All supervisors please be present.", time: "08:15", outgoing: true, tag: "" },
        { id: 2, sender: "Site Supervisor", text: "Confirmed. Will brief the teams.", time: "08:22", outgoing: false, tag: "" },
        { id: 3, sender: "Carpenter", text: "Flooring material for Unit 1 Lounge arrived. Where should we stack?", time: "09:10", outgoing: false, tag: "Materials" },
        { id: 4, sender: "Tanya / Anantam Designs", text: "Stack in the covered walkway area. Keep it covered.", time: "09:14", outgoing: true, tag: "" },
        { id: 5, sender: "Electrician", text: "Conduit work for Unit 2 dining is 80% done. Should finish by tomorrow afternoon.", time: "10:05", outgoing: false, tag: "" },
        { id: 6, sender: "Site Supervisor", text: "Great progress. Let me know if you need anything from the store room.", time: "10:12", outgoing: true, tag: "" },
      ],
      urgent: [
        { id: 1, sender: "Site Supervisor", text: "Electrical conduit exposed at Unit 1 Grandfather bedroom slab soffit — logged in snag list. Needs immediate rectification.", time: "10:30", outgoing: false, tag: "Snag" },
        { id: 2, sender: "Tanya / Anantam Designs", text: "Please fix before plastering begins. This is critical for safety.", time: "10:45", outgoing: true, tag: "" },
      ],
    },
  },
  "proj-museum": {
    id: "proj-museum",
    name: "The Museum",
    icon: "🎨",
    client: "Private Collection",
    address: "Ahmedabad",
    startDate: "2025-03-01",
    endDate: "2026-02-28",
    units: {
      "Gallery Wing": ["Main Gallery", "Gallery 2", "Curator's Office", "Storage Vault"],
      "Public Areas": ["Reception", "Cafeteria", "Restrooms", "Gift Shop"],
      "External": ["Entrance Plaza", "Sculpture Garden", "Service Yard"],
    },
    assigneeProfiles: {
      "Site Supervisor": { color: "#E8601C", phone: "+91 98200 20001", email: "museum.super@site.in", role: "Site Supervisor", visibility: ["tasks", "reminders", "drawings", "comms", "notes"] },
      "Specialist Lighting": { color: "#C04E12", phone: "+91 98200 20002", email: "lighting@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
      "Stone Mason": { color: "#8B5E3C", phone: "+91 98200 20003", email: "mason@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
      "HVAC Specialist": { color: "#3D8A5F", phone: "+91 98200 20004", email: "hvac@site.in", role: "MEP Consultant", visibility: ["tasks", "reminders", "comms", "approvals"] },
    },
    tasks: [
      { id: 101, unit: "Gallery Wing", room: "Main Gallery", desc: "Climate control system installation", assignee: "HVAC Specialist", start: "2025-04-20", end: TODAY, status: "In Progress", notes: "" },
      { id: 102, unit: "Gallery Wing", room: "Storage Vault", desc: "Vault wall stone cladding", assignee: "Stone Mason", start: "2025-04-25", end: "", status: "Pending", notes: "" },
    ],
    materials: [],
    approvals: [],
    snags: [],
    drawings: [],
    notes: [{ id: 1, text: "All gallery surfaces must use museum-grade non-reflective finishes only.", priority: "high", unit: "", date: "Apr 22" }],
    guidelines: ["No work above 65 dB during gallery hours."],
    commsChannels: [
      { id: "general", name: "📢 General", sub: "All site staff", icon: "📢", unit: null },
      { id: "urgent", name: "🚨 Urgent", sub: "Critical issues only", icon: "🚨", unit: null },
    ],
    commsMessages: {
      general: [
        { id: 1, sender: "Project Manager", text: "Climate control specs finalized. HVAC team can proceed with installation.", time: "09:00", outgoing: true, tag: "" },
        { id: 2, sender: "HVAC Specialist", text: "Received. Will start the main ductwork tomorrow morning.", time: "09:30", outgoing: false, tag: "" },
      ],
      urgent: [],
    },
  },
  "proj-casa": {
    id: "proj-casa",
    name: "Casa Verde",
    icon: "🌿",
    client: "Patel Family",
    address: "Pune",
    startDate: "2025-02-10",
    endDate: "2025-12-15",
    units: {
      "Main House": ["Living Room", "Master Bedroom", "Master Bathroom", "Kitchen", "Dining", "Powder Room"],
      "Guest Wing": ["Guest Bedroom 1", "Guest Bedroom 2", "Shared Bathroom", "Library"],
      "Outdoor": ["Garden", "Pool Deck", "Pergola", "Driveway"],
    },
    assigneeProfiles: {
      "Site Supervisor": { color: "#E8601C", phone: "+91 98200 30001", email: "casa.super@site.in", role: "Site Supervisor", visibility: ["tasks", "reminders", "drawings", "comms", "notes"] },
      "Landscaper": { color: "#3D8A5F", phone: "+91 98200 30002", email: "landscape@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
      "Carpenter": { color: "#D4500A", phone: "+91 98200 30003", email: "carpenter.casa@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
      "Pool Specialist": { color: "#4A7ABF", phone: "+91 98200 30004", email: "pool@site.in", role: "Contractor", visibility: ["tasks", "reminders", "comms"] },
    },
    tasks: [
      { id: 201, unit: "Outdoor", room: "Pool Deck", desc: "Pool tiling and grouting", assignee: "Pool Specialist", start: "2025-04-22", end: TODAY, status: "In Progress", notes: "" },
      { id: 202, unit: "Main House", room: "Kitchen", desc: "Granite countertop installation", assignee: "Carpenter", start: "2025-04-26", end: "", status: "Pending", notes: "" },
    ],
    materials: [],
    approvals: [],
    snags: [],
    drawings: [],
    notes: [],
    guidelines: ["All outdoor materials must be weather-treated."],
    commsChannels: [
      { id: "general", name: "📢 General", sub: "All site staff", icon: "📢", unit: null },
      { id: "urgent", name: "🚨 Urgent", sub: "Critical issues only", icon: "🚨", unit: null },
    ],
    commsMessages: {
      general: [
        { id: 1, sender: "Site Supervisor", text: "Pool tiling is progressing well. Grouting scheduled for next week.", time: "14:00", outgoing: false, tag: "" },
      ],
      urgent: [],
    },
  },
};

type TabKey = "tasks" | "comms" | "drawings" | "actions" | "materials" | "approvals" | "overview" | "admin";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ fullName: string; email: string; role: string; firmName?: string } | null>(null);
  const [projects, setProjects] = useState<Record<string, Project>>(DEFAULT_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState("proj-jhaveri");
  const [activeTab, setActiveTab] = useState<TabKey>("tasks");
  const [activeUnit, setActiveUnit] = useState("All");
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [notesTab, setNotesTab] = useState<"notes" | "guidelines">("notes");
  const [actionSubtab, setActionSubtab] = useState<"reminders" | "snags">("reminders");
  const [drawFilterUnit, setDrawFilterUnit] = useState("");
  const [drawFilterType, setDrawFilterType] = useState("");
  const [matFilterStatus, setMatFilterStatus] = useState("");
  const [matFilterUnit, setMatFilterUnit] = useState("");
  const [matFilterCat, setMatFilterCat] = useState("");
  const [showMatModal, setShowMatModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showSnagModal, setShowSnagModal] = useState(false);
  const [snagFilterSev, setSnagFilterSev] = useState("");
  const [snagFilterStatus, setSnagFilterStatus] = useState("");
  const [snagFilterUnit, setSnagFilterUnit] = useState("");
  const [apprFilterType, setApprFilterType] = useState("");
  const [apprFilterStatus, setApprFilterStatus] = useState("");
  const [apprFilterUnit, setApprFilterUnit] = useState("");
  const [toast, setToast] = useState("");
  const [taskForm, setTaskForm] = useState({ desc: "", unit: "", room: "", assignee: "", start: "", end: "", status: "Pending", notes: "" });
  const [activeCommsChannel, setActiveCommsChannel] = useState("general");
  const [commsMsgInput, setCommsMsgInput] = useState("");
  const [taskViewMode, setTaskViewMode] = useState<"grouped" | "flat">("flat");
  const ddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkSession() {
      const session = await getCurrentSession();
      if (!session) { router.replace("/auth"); return; }
      setSession({ fullName: session.fullName, email: session.email, role: session.role, firmName: session.firmName });
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setShowProjectDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const project = projects[activeProjectId];
  if (!project || !session) return null;

  const units = Object.keys(project.units);
  const allUnits = units.length > 0 ? ["All", ...units] : [];
  if (!allUnits.includes(activeUnit)) setActiveUnit("All");

  const assignees = Object.keys(project.assigneeProfiles);

  function showToast(msg: string) { setToast(msg); }

  function switchProject(id: string) {
    setActiveProjectId(id);
    setActiveUnit("All");
    setExpandedRooms({});
    setShowProjectDropdown(false);
    setActiveCommsChannel("general");
    showToast(`📂 Switched to ${projects[id].name}`);
  }

  function toggleRoom(key: string) {
    setExpandedRooms((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function deleteTask(id: number) {
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.tasks = p.tasks.filter((t) => t.id !== id);
      return { ...prev, [activeProjectId]: p };
    });
    showToast("Task deleted");
  }

  function updateTaskStatus(id: number, status: string) {
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.tasks = p.tasks.map((t) => (t.id === id ? { ...t, status } : t));
      return { ...prev, [activeProjectId]: p };
    });
  }

  function addTask() {
    if (!taskForm.desc) return;
    const newId = Date.now();
    const newTask: Task = { ...taskForm, id: newId, unit: taskForm.unit || units[0], room: taskForm.room || project.units[taskForm.unit || units[0]][0], start: taskForm.start || TODAY, end: taskForm.end || TODAY };
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.tasks = [...p.tasks, newTask];
      return { ...prev, [activeProjectId]: p };
    });
    setShowTaskModal(false);
    setTaskForm({ desc: "", unit: "", room: "", assignee: "", start: "", end: "", status: "Pending", notes: "" });
    showToast("Task added");
  }

  function addMaterial() {
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.materials = [...p.materials, { id: Date.now(), name: "New Material", cat: "Other", unit: units[0], room: "", vendor: "", qty: "", orderDate: "", eta: "", status: "Pending Order", notes: "" }];
      return { ...prev, [activeProjectId]: p };
    });
    setShowMatModal(false);
    showToast("Material added");
  }

  function addApproval() {
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.approvals = [...p.approvals, { id: Date.now(), desc: "New Approval", type: "Client", unit: units[0], by: session?.fullName || "User", submitted: TODAY, responded: "", status: "Pending", remarks: "" }];
      return { ...prev, [activeProjectId]: p };
    });
    setShowApprovalModal(false);
    showToast("Approval logged");
  }

  function addSnag() {
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.snags = [...p.snags, { id: Date.now(), desc: "", sev: "Major", unit: units[0], room: "", assignee: "", target: "", raisedBy: session?.fullName || "User", status: "Open", date: TODAY }];
      return { ...prev, [activeProjectId]: p };
    });
    setShowSnagModal(false);
    showToast("Snag logged");
  }

  function addNote(text: string, priority: string) {
    if (!text.trim()) return;
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.notes = [...p.notes, { id: Date.now(), text, priority, unit: "", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }];
      return { ...prev, [activeProjectId]: p };
    });
  }

  function addGuideline(text: string) {
    if (!text.trim()) return;
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.guidelines = [...p.guidelines, text];
      return { ...prev, [activeProjectId]: p };
    });
  }

  function sendCommsMessage() {
    if (!commsMsgInput.trim()) return;
    const now = new Date();
    const time = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      const msgs = [...(p.commsMessages[activeCommsChannel] || [])];
      msgs.push({ id: Date.now(), sender: session?.fullName || "You", text: commsMsgInput.trim(), time, outgoing: true, tag: "" });
      p.commsMessages = { ...p.commsMessages, [activeCommsChannel]: msgs };
      return { ...prev, [activeProjectId]: p };
    });
    setCommsMsgInput("");
  }

  function deleteNote(id: number) {
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.notes = p.notes.filter((n) => n.id !== id);
      return { ...prev, [activeProjectId]: p };
    });
  }

  const filteredTasks = project.tasks.filter((t) => {
    if (activeUnit !== "All" && t.unit !== activeUnit) return false;
    if (filterAssignee && t.assignee !== filterAssignee) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterDate && t.start !== filterDate) return false;
    return true;
  });

  const filteredMaterials = project.materials.filter((m) => {
    if (matFilterStatus && m.status !== matFilterStatus) return false;
    if (matFilterUnit && m.unit !== matFilterUnit) return false;
    if (matFilterCat && m.cat !== matFilterCat) return false;
    return true;
  });

  const filteredDrawings = project.drawings.filter((d) => {
    if (drawFilterUnit && d.unit !== drawFilterUnit) return false;
    if (drawFilterType && d.type !== drawFilterType) return false;
    return true;
  });

  const filteredApprovals = project.approvals.filter((a) => {
    if (apprFilterType && a.type !== apprFilterType) return false;
    if (apprFilterStatus && a.status !== apprFilterStatus) return false;
    if (apprFilterUnit && a.unit !== apprFilterUnit) return false;
    return true;
  });

  const filteredSnags = project.snags.filter((s) => {
    if (snagFilterSev && s.sev !== snagFilterSev) return false;
    if (snagFilterStatus && s.status !== snagFilterStatus) return false;
    if (snagFilterUnit && s.unit !== snagFilterUnit) return false;
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
  const overdueTasks = project.tasks.filter((t) => t.end < TODAY && t.status !== "Done").length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const navTabs: { key: TabKey; label: string; admin?: boolean }[] = [
    { key: "tasks", label: "Task Sheets" },
    { key: "comms", label: "Site Comms" },
    { key: "drawings", label: "Drawings" },
    { key: "actions", label: "Action Items" },
    { key: "materials", label: "Materials" },
    { key: "approvals", label: "Approvals" },
    { key: "admin", label: "⚙ Admin", admin: true },
  ];

  const roleIcon = session.role === "owner" ? "👑" : session.role === "architect" ? "📐" : "🔧";
  const roleLabel = session.role === "owner" ? "Owner" : session.role === "architect" ? "Architect" : "Contractor";
  const isContractor = session.role === "contractor";

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  function statusClass(s: string) {
    switch (s) {
      case "Done": return "bg-[#E4F4EC] text-[#3D8A5F]";
      case "In Progress": return "bg-[#FDE8DC] text-[#C04E12]";
      case "Delayed": return "bg-[#FDECEA] text-[#C0392B]";
      default: return "bg-[#EEE9E3] text-[#9C8E86]";
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* HEADER */}
      <header className="sticky top-0 z-100 bg-white border-b-2 border-[#E8601C] shadow-[0_2px_16px_rgba(232,96,28,0.08)] h-16 px-6 sm:px-8 flex items-center justify-between">
        <div className="font-serif text-[1.5rem] font-semibold tracking-[0.1em] text-[#E8601C]">
          ANANTAM<span className="text-[#2C2420] font-light"> · SITE</span>
        </div>

        <div ref={ddRef} className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-2.5 bg-[#FEF4EF] border-[1.5px] border-[#F4895A] rounded-[10px] px-3.5 py-2 text-[0.85rem] font-semibold text-[#2C2420] transition-all hover:bg-[#FDE8DC] hover:border-[#E8601C] min-w-[200px]"
          >
            <span className="text-[0.9rem]">{project.icon}</span>
            <span className="flex-1 text-left truncate">{project.name}</span>
            <span className="text-[0.7rem] text-[#E8601C] transition-transform">{showProjectDropdown ? "▲" : "▼"}</span>
          </button>
          {showProjectDropdown && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-[10px] border border-[#E2DAD1] shadow-[0_8px_32px_rgba(44,36,32,0.15)] mt-1.5 p-1 z-200 max-h-[400px] overflow-y-auto">
              {Object.values(projects).map((p) => (
                <div
                  key={p.id}
                  onClick={() => switchProject(p.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[7px] cursor-pointer transition-all ${p.id === activeProjectId ? "bg-[#FDE8DC]" : "hover:bg-[#FEF4EF]"}`}
                >
                  <span className="text-[1.1rem]">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[0.84rem] text-[#2C2420]">{p.name}</div>
                    <div className="text-[0.7rem] text-[#9C8E86]">{p.client} · {p.address}</div>
                  </div>
                  {p.id === activeProjectId && <span className="text-[#E8601C] font-bold">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-5">
          <span className="text-[0.75rem] text-[#9C8E86] tracking-[0.04em]">{dateStr}</span>
          <div className="inline-flex items-center gap-1.5 bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-full px-3 py-[0.32rem] text-[0.74rem] font-semibold text-[#2C2420]">
            <span className="text-[0.9rem]">{roleIcon}</span>
            <span>{roleLabel}</span>
          </div>
          <button
            onClick={() => setActiveTab("actions")}
            className="bg-[#FDE8DC] border border-[#F4895A] text-[#E8601C] w-9 h-9 rounded-full flex items-center justify-center text-[0.9rem] relative transition-all hover:bg-[#E8601C] hover:text-white"
          >
            🔔
            {overdueTasks > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#C0392B] text-white text-[0.6rem] w-3.5 h-3.5 rounded-full flex items-center justify-center">{overdueTasks}</span>
            )}
          </button>
          <button
            onClick={async () => { await signoutUser(); router.push("/auth"); }}
            className="text-[0.78rem] text-[#9C8E86] font-medium hover:text-[#E8601C] transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* PROJECT BANNER */}
      <div className="bg-gradient-to-r from-[#2C2420] to-[#5C4F48] text-white px-6 sm:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4 border-b-2 border-[#E8601C]">
        <div className="flex items-center gap-3.5">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#E8601C] flex items-center justify-center text-[1.1rem] flex-shrink-0">{project.icon}</div>
          <div>
            <div className="font-serif text-[1.2rem] font-semibold leading-[1.2]">{project.name}</div>
            <div className="text-[0.72rem] text-white/70">{project.client} · {project.address}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3.5 text-[0.72rem] text-white/85">
            <span>📋 {totalTasks} tasks</span>
            <span>⚡ {totalTasks - doneTasks} open</span>
            {overdueTasks > 0 && <span className="text-[#ffb0b0]">🚨 {overdueTasks} overdue</span>}
          </div>
        </div>
      </div>

      {/* NAV TABS */}
      <nav className="bg-white flex px-6 sm:px-8 gap-0 overflow-x-auto border-b border-[#E2DAD1]">
        {navTabs.filter((t) => !t.admin || session.role === "owner").map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-[0.85rem] text-[0.78rem] tracking-[0.08em] uppercase font-medium transition-all whitespace-nowrap border-b-2 mb-[-1px] cursor-pointer ${activeTab === t.key ? "text-[#E8601C] border-b-[#E8601C]" : "text-[#9C8E86] border-b-transparent hover:text-[#E8601C]"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* TAB CONTENT */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-8">
        {/* ═══ TASKS ═══ */}
        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
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
                                      onClick={() => updateTaskStatus(t.id, s)}
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
                                {session.role !== "contractor" && (
                                  <button onClick={() => deleteTask(t.id)} className="text-[#9C8E86] text-[0.75rem] hover:text-[#C0392B] cursor-pointer transition-colors" title="Delete">✕</button>
                                )}
                                {isContractor && t.status !== "Done" && (
                                  <button onClick={() => updateTaskStatus(t.id, "Done")} className="text-[#3D8A5F] text-[0.75rem] hover:text-[#2A6045] cursor-pointer transition-colors" title="Mark Done">✓</button>
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
                                              onClick={() => updateTaskStatus(t.id, s)}
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
                                        {session.role !== "contractor" && (
                                          <button onClick={() => deleteTask(t.id)} className="text-[#9C8E86] text-[0.75rem] hover:text-[#C0392B] cursor-pointer transition-colors" title="Delete">✕</button>
                                        )}
                                        {isContractor && t.status !== "Done" && (
                                          <button onClick={() => updateTaskStatus(t.id, "Done")} className="text-[#3D8A5F] text-[0.75rem] hover:text-[#2A6045] cursor-pointer transition-colors" title="Mark Done">✓</button>
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

            {/* NOTES PANEL */}
            <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden sticky top-20">
              <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-[#E8601C] to-[#F4895A] text-white">
                <span className="font-serif text-[1rem] font-semibold tracking-[0.03em]">📌 Project Notes & Guidelines</span>
                <span className="text-[0.7rem] opacity-85">{notesTab === "notes" ? project.notes.length : project.guidelines.length} items</span>
              </div>
              <div className="flex border-b border-[#E2DAD1] bg-[#F7F5F2]">
                <button onClick={() => setNotesTab("notes")} className={`flex-1 text-center py-[0.55rem] text-[0.72rem] font-semibold tracking-[0.05em] uppercase cursor-pointer transition-all border-b-2 ${notesTab === "notes" ? "text-[#E8601C] border-b-[#E8601C] bg-white" : "text-[#9C8E86] border-b-transparent hover:text-[#E8601C]"}`}>Notes</button>
                <button onClick={() => setNotesTab("guidelines")} className={`flex-1 text-center py-[0.55rem] text-[0.72rem] font-semibold tracking-[0.05em] uppercase cursor-pointer transition-all border-b-2 ${notesTab === "guidelines" ? "text-[#E8601C] border-b-[#E8601C] bg-white" : "text-[#9C8E86] border-b-transparent hover:text-[#E8601C]"}`}>Guidelines</button>
              </div>

              {notesTab === "notes" && (
                <>
                  <div className="max-h-[420px] overflow-y-auto">
                    {project.notes.map((n) => (
                      <div key={n.id} className="px-4 py-3.5 border-b border-[#E2DAD1] relative transition-all hover:bg-[#FEF4EF] group">
                        <span className={`inline-flex items-center gap-1 text-[0.65rem] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full mb-1.5 ${n.priority === "high" ? "bg-[#FDECEA] text-[#C0392B]" : n.priority === "medium" ? "bg-[#FDE8DC] text-[#C04E12]" : "bg-[#E8F0FE] text-[#2C5FBE]"}`}>
                          {n.priority === "high" ? "🔴" : n.priority === "medium" ? "🟠" : "🔵"} {n.priority}
                        </span>
                        <div className="text-[0.82rem] text-[#2C2420] leading-[1.5]">{n.text}</div>
                        <div className="text-[0.68rem] text-[#9C8E86] mt-1">{n.date}</div>
                        <button onClick={() => deleteNote(n.id)} className="absolute top-3 right-3 text-[0.7rem] text-[#9C8E86] opacity-0 group-hover:opacity-100 transition-all hover:text-[#C0392B] hover:bg-[#FDECEA] rounded px-1 cursor-pointer">✕</button>
                      </div>
                    ))}
                  </div>
                  <AddNoteForm onAdd={addNote} />
                </>
              )}

              {notesTab === "guidelines" && (
                <>
                  <div className="max-h-[420px] overflow-y-auto">
                    {project.guidelines.map((g, i) => (
                      <div key={i} className="flex gap-3 items-start px-4 py-3 border-b border-[#E2DAD1]">
                        <span className="w-[22px] h-[22px] rounded-full bg-[#E8601C] text-white text-[0.65rem] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-[0.8rem] text-[#5C4F48] leading-[1.5]">{g}</span>
                      </div>
                    ))}
                  </div>
                  <AddGuidelineForm onAdd={addGuideline} />
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ ACTION ITEMS ═══ */}
        {activeTab === "actions" && (
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
                        <div className="w-[34px] h-[34px] rounded-full bg-[#FDE8DC] text-[#E8601C] flex items-center justify-center text-[0.7rem] font-bold flex-shrink-0 border-[1.5px] border-[#F4895A]">{t.assignee.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
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
                  <select value={snagFilterSev} onChange={(e) => setSnagFilterSev(e.target.value)} className="w-auto px-2.5 py-1.5 text-[0.78rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
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
                          <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${s.sev === "Critical" ? "bg-[#FDECEA] text-[#C0392B]" : s.sev === "Major" ? "bg-[#FDE8DC] text-[#C04E12]" : "bg-[#EEE9E3] text-[#9C8E86]"}`}>{s.sev}</span>
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
        )}

        {/* ═══ DRAWINGS ═══ */}
        {activeTab === "drawings" && (
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
        )}

        {/* ═══ MATERIALS ═══ */}
        {activeTab === "materials" && (
          <div>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
              <div>
                <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Material Tracker</div>
                <div className="text-[0.82rem] text-[#9C8E86]">Log procurement status · Track deliveries · Link to rooms</div>
              </div>
              <button onClick={() => setShowMatModal(true)} className="bg-transparent text-[#E8601C] border-[1.5px] border-[#E8601C] rounded-lg px-4 py-2 text-[0.78rem] font-medium cursor-pointer transition-all hover:bg-[#E8601C] hover:text-white">+ Add Material</button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Items", num: project.materials.length, color: "#E8601C", fill: 100 },
                { label: "Delivered", num: project.materials.filter((m) => m.status === "Delivered").length, color: "#3D8A5F", fill: project.materials.length > 0 ? Math.round((project.materials.filter((m) => m.status === "Delivered").length / project.materials.length) * 100) : 0 },
                { label: "Ordered / In Transit", num: project.materials.filter((m) => m.status === "Ordered").length, color: "#F4895A", fill: project.materials.length > 0 ? Math.round((project.materials.filter((m) => m.status === "Ordered").length / project.materials.length) * 100) : 0 },
                { label: "Pending Order", num: project.materials.filter((m) => m.status === "Pending Order" || m.status === "On Hold").length, color: "#C0392B", fill: project.materials.length > 0 ? Math.round((project.materials.filter((m) => m.status === "Pending Order" || m.status === "On Hold").length / project.materials.length) * 100) : 0 },
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
                      <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">ETA</th>
                      <th className="px-4 py-3 text-left text-[0.72rem] tracking-[0.06em] uppercase font-medium">Status</th>
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
                        <td className="px-4 py-3 text-[#5C4F48]">{m.eta || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[0.7rem] font-semibold ${m.status === "Delivered" ? "bg-[#E4F4EC] text-[#3D8A5F]" : m.status === "Ordered" ? "bg-[#FDE8DC] text-[#C04E12]" : m.status === "On Hold" ? "bg-[#EEE9E3] text-[#9C8E86]" : "bg-[#FDECEA] text-[#C0392B]"}`}>{m.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {filteredMaterials.length === 0 && <div className="text-center py-12 text-[#9C8E86] text-[0.85rem]">No materials logged yet.</div>}
          </div>
        )}

        {/* ═══ APPROVALS ═══ */}
        {activeTab === "approvals" && (
          <div>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
              <div>
                <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Approvals Log</div>
                <div className="text-[0.82rem] text-[#9C8E86]">Client sign-offs · MEP consultant approvals · Design decisions</div>
              </div>
              <button onClick={() => setShowApprovalModal(true)} className="bg-transparent text-[#E8601C] border-[1.5px] border-[#E8601C] rounded-lg px-4 py-2 text-[0.78rem] font-medium cursor-pointer transition-all hover:bg-[#E8601C] hover:text-white">+ Log Approval</button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total", num: project.approvals.length, color: "#E8601C", fill: 100 },
                { label: "Approved", num: project.approvals.filter((a) => a.status === "Approved").length, color: "#3D8A5F", fill: project.approvals.length > 0 ? Math.round((project.approvals.filter((a) => a.status === "Approved").length / project.approvals.length) * 100) : 0 },
                { label: "Pending", num: project.approvals.filter((a) => a.status === "Pending").length, color: "#F4895A", fill: project.approvals.length > 0 ? Math.round((project.approvals.filter((a) => a.status === "Pending").length / project.approvals.length) * 100) : 0 },
                { label: "Revision / Rejected", num: project.approvals.filter((a) => a.status === "Revision Required" || a.status === "Rejected").length, color: "#C0392B", fill: project.approvals.length > 0 ? Math.round((project.approvals.filter((a) => a.status === "Revision Required" || a.status === "Rejected").length / project.approvals.length) * 100) : 0 },
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

            {filteredApprovals.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-[#E2DAD1] mb-3 p-5 shadow-[0_2px_20px_rgba(44,36,32,0.07)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold ${a.status === "Approved" ? "bg-[#E4F4EC] text-[#3D8A5F]" : a.status === "Pending" ? "bg-[#FDE8DC] text-[#C04E12]" : a.status === "Rejected" ? "bg-[#FDECEA] text-[#C0392B]" : "bg-[#E8F0FE] text-[#2C5FBE]"}`}>{a.status}</span>
                      <span className="bg-[#F7F5F2] text-[#9C8E86] text-[0.65rem] px-2 py-0.5 rounded-full font-medium">{a.type}</span>
                    </div>
                    <div className="font-medium text-[0.9rem] text-[#2C2420]">{a.desc}</div>
                    <div className="text-[0.75rem] text-[#9C8E86] mt-1">{a.unit} · Submitted by {a.by} on {a.submitted}{a.responded ? ` · Responded ${a.responded}` : ""}</div>
                    {a.remarks && <div className="text-[0.78rem] text-[#5C4F48] mt-2 bg-[#F7F5F2] px-3 py-2 rounded-lg">{a.remarks}</div>}
                  </div>
                </div>
              </div>
            ))}
            {filteredApprovals.length === 0 && <div className="text-center py-12 text-[#9C8E86] text-[0.85rem]">No approvals logged yet.</div>}
          </div>
        )}

        {/* ═══ OVERVIEW ═══ */}
        {activeTab === "overview" && (
          <div>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
              <div>
                <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Weekly Overview</div>
                <div className="text-[0.82rem] text-[#9C8E86]">KPIs, flags, and progress at a glance</div>
              </div>
            </div>

            {/* KPI Cards */}
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

            {/* Overdue flags */}
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

            {/* Unit Progress */}
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

            {/* Assignee Workload */}
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
        )}

        {/* ═══ SITE COMMS ═══ */}
        {activeTab === "comms" && (
          <div>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Site Communications</div>
                <div className="text-[0.82rem] text-[#9C8E86]">Room channels · Photo sharing · Announcements</div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 rounded-xl overflow-hidden border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)]" style={{ height: "calc(100vh - 260px)" }}>
              {/* Sidebar */}
              <div className="bg-white border-r border-[#E2DAD1] overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2DAD1] bg-[#F7F5F2]">
                  <span className="font-serif text-[1rem] font-semibold">Channels</span>
                  <span className="text-[0.7rem] text-[#9C8E86]">● 4 online</span>
                </div>
                {project.commsChannels.map((ch) => {
                  const msgs = project.commsMessages[ch.id] || [];
                  const last = msgs.length ? msgs[msgs.length - 1] : null;
                  const unread = ch.id !== activeCommsChannel && msgs.length > 0 ? 0 : 0;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => setActiveCommsChannel(ch.id)}
                      className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer border-b border-[#E2DAD1] transition-all ${activeCommsChannel === ch.id ? "bg-[#FEF4EF] border-l-[3px] border-l-[#E8601C]" : "hover:bg-[#FEF4EF]"}`}
                    >
                      <span className="text-[1rem]">{ch.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[0.82rem] font-semibold text-[#2C2420] truncate">{ch.name}</div>
                        <div className="text-[0.7rem] text-[#9C8E86] truncate">{last ? last.text.slice(0, 30) + "…" : ch.sub}</div>
                      </div>
                      {unread > 0 && (
                        <span className="bg-[#E8601C] text-white text-[0.6rem] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 flex-shrink-0">{unread}</span>
                      )}
                    </div>
                  );
                })}
                {/* Room channels */}
                {units.map((u) =>
                  project.units[u].map((r) => {
                    const chId = "room-" + u.replace(/\s+/g, "-") + "-" + r.replace(/\s+/g, "-");
                    return (
                      <div
                        key={chId}
                        onClick={() => setActiveCommsChannel(chId)}
                        className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer border-b border-[#E2DAD1] transition-all ${activeCommsChannel === chId ? "bg-[#FEF4EF] border-l-[3px] border-l-[#E8601C]" : "hover:bg-[#FEF4EF]"}`}
                      >
                        <span className="text-[1rem]">🏠</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[0.82rem] font-semibold text-[#2C2420] truncate">{r}</div>
                          <div className="text-[0.7rem] text-[#9C8E86] truncate">{u}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Main chat area */}
              <div className="bg-[#F7F5F2] flex flex-col">
                <div className="px-5 py-3.5 bg-white border-b border-[#E2DAD1]">
                  {(() => {
                    const ch = project.commsChannels.find((c) => c.id === activeCommsChannel);
                    return (
                      <>
                        <div className="font-semibold text-[0.9rem] text-[#2C2420]">{ch ? ch.name : activeCommsChannel}</div>
                        <div className="text-[0.72rem] text-[#9C8E86]">{ch ? ch.sub : "Room channel"}</div>
                      </>
                    );
                  })()}
                </div>
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                  {(project.commsMessages[activeCommsChannel] || []).length === 0 ? (
                    <div className="text-center text-[#9C8E86] text-[0.85rem] mt-20">
                      <div className="text-[2.5rem] mb-3 opacity-40">💬</div>
                      No messages yet. Start the conversation.
                    </div>
                  ) : (
                    <>
                      <div className="text-center text-[0.68rem] text-[#9C8E86] flex items-center gap-2 my-1">
                        <span className="flex-1 h-px bg-[#E2DAD1]" />
                        Today
                        <span className="flex-1 h-px bg-[#E2DAD1]" />
                      </div>
                      {(project.commsMessages[activeCommsChannel] || []).map((m) => (
                        <div key={m.id} className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-[0.82rem] leading-[1.5] relative ${m.outgoing ? "bg-[#E8601C] text-white self-end rounded-br-[3px]" : "bg-white text-[#2C2420] self-start rounded-bl-[3px] shadow-[0_2px_20px_rgba(44,36,32,0.07)]"}`}>
                          <div className={`text-[0.68rem] font-bold mb-0.5 ${m.outgoing ? "text-white/75" : "text-[#E8601C]"}`}>{m.sender}</div>
                          {m.tag && (
                            <span className={`inline-flex items-center gap-0.5 rounded-full text-[0.65rem] px-1.5 py-0.5 mb-1 ${m.outgoing ? "bg-white/20 text-white" : "bg-[#FDE8DC] text-[#C04E12]"}`}>
                              🏷 {m.tag}
                            </span>
                          )}
                          <div>{m.text}</div>
                          <div className={`text-[0.62rem] mt-1 text-right ${m.outgoing ? "text-white/65" : "text-[#9C8E86]"}`}>{m.time}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className="px-5 py-3.5 bg-white border-t border-[#E2DAD1] flex gap-2.5 items-end">
                  <div className="bg-[#F7F5F2] text-[#9C8E86] border-[1.5px] border-[#E2DAD1] rounded-lg w-10 h-10 flex items-center justify-center cursor-pointer text-[1rem] flex-shrink-0 transition-all hover:border-[#E8601C] hover:text-[#E8601C]">📎</div>
                  <textarea
                    value={commsMsgInput}
                    onChange={(e) => setCommsMsgInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCommsMessage(); } }}
                    className="flex-1 font-sans text-[0.82rem] border-[1.5px] border-[#E2DAD1] rounded-lg px-3.5 py-2.5 text-[#2C2420] bg-[#F7F5F2] outline-none resize-none min-h-[42px] max-h-[100px] transition-all focus:border-[#E8601C] focus:bg-white"
                    placeholder="Type a message…"
                    rows={1}
                  />
                  <button
                    onClick={sendCommsMessage}
                    className="bg-[#E8601C] text-white border-none rounded-lg w-10 h-10 flex items-center justify-center cursor-pointer text-[1rem] flex-shrink-0 transition-all hover:bg-[#C04E12]"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ADMIN ═══ */}
        {activeTab === "admin" && session.role === "owner" && (
          <div>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
              <div>
                <div className="font-serif text-[1.8rem] font-semibold text-[#2C2420]">Admin Panel</div>
                <div className="text-[0.82rem] text-[#9C8E86]">Managing {project.name} · Owner access only</div>
              </div>
            </div>

            {/* Projects list */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[0.82rem] text-[#9C8E86]">All projects</span>
              </div>
              {Object.values(projects).map((p) => (
                <div
                  key={p.id}
                  onClick={() => switchProject(p.id)}
                  className={`flex items-center gap-4 px-5 py-4 mb-2 rounded-xl border-[1.5px] cursor-pointer transition-all shadow-[0_2px_20px_rgba(44,36,32,0.07)] ${p.id === activeProjectId ? "border-[#E8601C] bg-[#FEF4EF]" : "border-[#E2DAD1] bg-white hover:border-[#F4895A] hover:translate-x-0.5"}`}
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
                </div>
              ))}
            </div>

            {/* Assignees */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2DAD1] bg-[#F7F5F2]">
                  <div>
                    <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Assignees / Contractors</div>
                    <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">{assignees.length} team members on this project</div>
                  </div>
                </div>
                <div className="p-4">
                  {assignees.map((a) => {
                    const profile = project.assigneeProfiles[a];
                    const aTasks = project.tasks.filter((t) => t.assignee === a);
                    return (
                      <div key={a} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border-[1.5px] border-[#E2DAD1] bg-[#F7F5F2] mb-2 last:mb-0 transition-all hover:border-[#F4895A]">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.65rem] font-bold flex-shrink-0" style={{ backgroundColor: profile.color }}>{a.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.85rem] font-medium text-[#2C2420]">{a}</div>
                          <div className="flex gap-1.5 mt-0.5">
                            <span className="text-[0.68rem] bg-[#FDE8DC] text-[#C04E12] px-1.5 py-0.5 rounded-full font-medium">{profile.role}</span>
                            <span className="text-[0.68rem] text-[#9C8E86]">{aTasks.length} tasks</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Units & Rooms */}
              <div className="bg-white rounded-xl border border-[#E2DAD1] shadow-[0_2px_20px_rgba(44,36,32,0.07)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2DAD1] bg-[#F7F5F2]">
                  <div>
                    <div className="font-serif text-[1.1rem] font-semibold text-[#2C2420]">Units & Rooms</div>
                    <div className="text-[0.72rem] text-[#9C8E86] mt-0.5">{Object.keys(project.units).length} units · {Object.values(project.units).flat().length} rooms</div>
                  </div>
                </div>
                <div className="p-4">
                  {units.map((u) => (
                    <div key={u} className="border-[1.5px] border-[#E2DAD1] rounded-lg mb-2 last:mb-0 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F5F2] cursor-pointer hover:bg-[#FEF4EF]">
                        <span className="font-semibold text-[0.85rem] text-[#2C2420] flex items-center gap-2">{u} <span className="bg-[#FDE8DC] text-[#C04E12] text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full">{project.units[u].length}</span></span>
                      </div>
                      <div className="px-3 py-2">
                        {project.units[u].map((r) => (
                          <div key={r} className="flex items-center justify-between px-2 py-1 rounded text-[0.82rem] text-[#5C4F48] hover:bg-[#FEF4EF]">
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-[#2C2420]/50 z-500 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[min(520px,94vw)] shadow-[0_24px_80px_rgba(44,36,32,0.2)] border-t-4 border-[#E8601C]" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-[1.4rem] font-semibold text-[#2C2420] mb-5">New Task</div>
            <div className="mb-4">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Description *</label>
              <input value={taskForm.desc} onChange={(e) => setTaskForm({ ...taskForm, desc: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" placeholder="e.g. Install wall tiles in bathroom" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Unit</label>
                <select value={taskForm.unit} onChange={(e) => setTaskForm({ ...taskForm, unit: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Room</label>
                <select value={taskForm.room} onChange={(e) => setTaskForm({ ...taskForm, room: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
                  {(project.units[taskForm.unit] || []).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Assignee</label>
                <select value={taskForm.assignee} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
                  <option value="">Select...</option>
                  {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Status</label>
                <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
                  {["Pending", "In Progress", "Done", "Delayed"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Start Date</label>
                <input type="date" value={taskForm.start} onChange={(e) => setTaskForm({ ...taskForm, start: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]" />
              </div>
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">End Date</label>
                <input type="date" value={taskForm.end} onChange={(e) => setTaskForm({ ...taskForm, end: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]" />
              </div>
            </div>
            <div className="mb-5">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Delay Notes</label>
              <textarea value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white resize-none min-h-[48px]" placeholder="Reason for delay, remarks…" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowTaskModal(false)} className="bg-[#F7F5F2] text-[#5C4F48] border-[1.5px] border-[#E2DAD1] rounded-lg px-5 py-2.5 text-[0.82rem] cursor-pointer transition-all hover:bg-[#EEE9E3]">Cancel</button>
              <button onClick={addTask} className="bg-[#E8601C] text-white border-none rounded-lg px-6 py-2.5 text-[0.82rem] cursor-pointer font-medium transition-all hover:bg-[#C04E12]">Save Task</button>
            </div>
          </div>
        </div>
      )}

      {/* SNAG MODAL */}
      {showSnagModal && (
        <div className="fixed inset-0 bg-[#2C2420]/50 z-500 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowSnagModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[min(580px,95vw)] shadow-[0_24px_80px_rgba(44,36,32,0.2)] border-t-4 border-[#E8601C]" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-[1.4rem] font-semibold text-[#2C2420] mb-5">Log Defect / Snag</div>
            <div className="mb-4">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Description *</label>
              <textarea className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white resize-none min-h-[56px]" placeholder="Describe the defect clearly…" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Severity</label>
                <select className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
                  {["Critical", "Major", "Minor"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Status</label>
                <select className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C]">
                  {["Open", "In Rectification", "Rectified", "Signed Off"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSnagModal(false)} className="bg-[#F7F5F2] text-[#5C4F48] border-[1.5px] border-[#E2DAD1] rounded-lg px-5 py-2.5 text-[0.82rem] cursor-pointer transition-all hover:bg-[#EEE9E3]">Cancel</button>
              <button onClick={addSnag} className="bg-[#E8601C] text-white border-none rounded-lg px-6 py-2.5 text-[0.82rem] cursor-pointer font-medium transition-all hover:bg-[#C04E12]">Log Defect</button>
            </div>
          </div>
        </div>
      )}

      {/* MATERIAL MODAL placeholder */}
      {showMatModal && (
        <div className="fixed inset-0 bg-[#2C2420]/50 z-500 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowMatModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[min(520px,94vw)] shadow-[0_24px_80px_rgba(44,36,32,0.2)] border-t-4 border-[#E8601C]" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-[1.4rem] font-semibold text-[#2C2420] mb-5">Add Material</div>
            <div className="mb-4">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Item Name *</label>
              <input className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" placeholder="e.g. 600×600 Vitrified Tile" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowMatModal(false)} className="bg-[#F7F5F2] text-[#5C4F48] border-[1.5px] border-[#E2DAD1] rounded-lg px-5 py-2.5 text-[0.82rem] cursor-pointer transition-all hover:bg-[#EEE9E3]">Cancel</button>
              <button onClick={addMaterial} className="bg-[#E8601C] text-white border-none rounded-lg px-6 py-2.5 text-[0.82rem] cursor-pointer font-medium transition-all hover:bg-[#C04E12]">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL placeholder */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-[#2C2420]/50 z-500 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowApprovalModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[min(520px,94vw)] shadow-[0_24px_80px_rgba(44,36,32,0.2)] border-t-4 border-[#E8601C]" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-[1.4rem] font-semibold text-[#2C2420] mb-5">Log Approval</div>
            <div className="mb-4">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Subject *</label>
              <input className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" placeholder="e.g. False ceiling layout" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowApprovalModal(false)} className="bg-[#F7F5F2] text-[#5C4F48] border-[1.5px] border-[#E2DAD1] rounded-lg px-5 py-2.5 text-[0.82rem] cursor-pointer transition-all hover:bg-[#EEE9E3]">Cancel</button>
              <button onClick={addApproval} className="bg-[#E8601C] text-white border-none rounded-lg px-6 py-2.5 text-[0.82rem] cursor-pointer font-medium transition-all hover:bg-[#C04E12]">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-[#2C2420] text-white border-l-4 border-[#E8601C] px-6 py-3.5 rounded-lg text-[0.82rem] shadow-[0_8px_40px_rgba(0,0,0,0.18)] z-[9999] max-w-[320px] animate-[slideUp_0.3s_ease]">
          {toast}
        </div>
      )}
    </div>
  );
}

function AddNoteForm({ onAdd }: { onAdd: (text: string, priority: string) => void }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("high");
  return (
    <div className="px-4 py-3.5 border-t border-[#E2DAD1] bg-[#F7F5F2]">
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {[{ key: "high", label: "🔴 High" }, { key: "medium", label: "🟠 Medium" }, { key: "info", label: "🔵 Info" }].map((p) => (
          <button
            key={p.key}
            onClick={() => setPriority(p.key)}
            className={`text-[0.68rem] font-semibold px-2.5 py-1 rounded-full cursor-pointer border-[1.5px] transition-all ${p.key === "high" ? priority === p.key ? "bg-[#FDECEA] text-[#C0392B] border-[#EDB9B9] shadow-[0_0_0_2px_#E8601C]" : "bg-[#FDECEA] text-[#C0392B] border-[#EDB9B9]" : p.key === "medium" ? priority === p.key ? "bg-[#FDE8DC] text-[#C04E12] border-[#F4895A] shadow-[0_0_0_2px_#E8601C]" : "bg-[#FDE8DC] text-[#C04E12] border-[#F4895A]" : priority === p.key ? "bg-[#E8F0FE] text-[#2C5FBE] border-[#AAC0F0] shadow-[0_0_0_2px_#E8601C]" : "bg-[#E8F0FE] text-[#2C5FBE] border-[#AAC0F0]"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg px-3 py-2 text-[#2C2420] outline-none resize-none min-h-[60px] mb-2 focus:border-[#E8601C] focus:bg-white" placeholder="Type a note or instruction…" />
      <button onClick={() => { onAdd(text, priority); setText(""); }} className="w-full bg-[#E8601C] text-white border-none rounded-lg px-4 py-2 text-[0.78rem] font-medium cursor-pointer transition-all hover:bg-[#C04E12]">+ Add Note</button>
    </div>
  );
}

function AddGuidelineForm({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="px-4 py-3.5 border-t border-[#E2DAD1] bg-[#F7F5F2]">
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg px-3 py-2 text-[#2C2420] outline-none resize-none min-h-[52px] mb-2 focus:border-[#E8601C] focus:bg-white" placeholder="Add a site guideline or standard…" />
      <button onClick={() => { onAdd(text); setText(""); }} className="w-full bg-[#E8601C] text-white border-none rounded-lg px-4 py-2 text-[0.78rem] font-medium cursor-pointer transition-all hover:bg-[#C04E12]">+ Add Guideline</button>
    </div>
  );
}
