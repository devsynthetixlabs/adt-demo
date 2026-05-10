"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/authProvider/provider";
import { useProjects } from "@/hooks/use-projects";
import { useUnits } from "@/hooks/use-units";
import { useContacts, useSaveContacts } from "@/hooks/use-contacts";
import { useDashboardUI } from "@/stores/dashboard-ui";
import PageLoader from "@/components/ui/PageLoader";
import Admin from "@/components/screens/dashboard/admin";
import Overview from "@/components/screens/dashboard/overview";
import Approvals from "@/components/screens/dashboard/approvals";
import Materials from "@/components/screens/dashboard/materials";
import Actions from "@/components/screens/dashboard/actions";
import Drawings from "@/components/screens/dashboard/drawings";
import Comms from "@/components/screens/dashboard/comms";
import TaskSheet from "@/components/screens/dashboard/taskSheet";
import { Approval, CommsMessage, Drawing, Material } from "@/types/dashboard";
import { isDbProject } from "@/services/project.service";
import { dbCreateMaterial, dbUpdateMaterial, dbDeleteMaterial } from "@/services/materials.service";
import { useMaterials } from "@/hooks/use-materials";
import { dbCreateApproval, dbUpdateApproval, dbDeleteApproval } from "@/services/approvals.service";
import { useApprovals } from "@/hooks/use-approvals";

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

interface Note {
  id: number;
  text: string;
  priority: string;
  unit: string;
  date: string;
}


interface AssigneeProfile {
  color: string;
  phone: string;
  email: string;
  role: string;
  designation: string;
  visibility: string[];
  loginStatus?: "invited" | "active" | "pending";
}

export interface Snag {
  id: number;
  unit: string;
  room: string;
  desc: string;
  photo?: string;
  status: string;
  date: string;
  priority?: string;
  target?: string;
  raisedBy?: string;
  assignee?: string;
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



type TabKey = "tasks" | "comms" | "drawings" | "actions" | "materials" | "approvals" | "overview" | "admin";

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading, signOutUser, updateUserProfile } = useAuth();
  const tn = useTranslations("nav");
  const th = useTranslations("header");
  const ts = useTranslations("status");
  const tr = useTranslations("role");
  const {
    activeProjectId, setActiveProjectId,
    activeTab, setActiveTab,
    activeUnit, setActiveUnit,
    showTaskModal, setShowTaskModal,
    showProfileModal, setShowProfileModal,
    notesTab, setNotesTab,
    actionSubtab, setActionSubtab,
    drawFilterUnit, setDrawFilterUnit,
    drawFilterType, setDrawFilterType,
    matFilterStatus, setMatFilterStatus,
    matFilterUnit, setMatFilterUnit,
    matFilterCat, setMatFilterCat,
    showMatModal, setShowMatModal,
    showApprovalModal, setShowApprovalModal,
    showSnagModal, setShowSnagModal,
    snagFilterPriority, setSnagFilterPriority,
    snagFilterStatus, setSnagFilterStatus,
    snagFilterUnit, setSnagFilterUnit,
    apprFilterType, setApprFilterType,
    apprFilterStatus, setApprFilterStatus,
    apprFilterUnit, setApprFilterUnit,
    activeCommsChannel, setActiveCommsChannel,
    filterAssignee, setFilterAssignee,
    filterStatus, setFilterStatus,
    filterDate, setFilterDate,
    showProjectDropdown, setShowProjectDropdown,
    showUserMenu, setShowUserMenu,
    showCreateProject, setShowCreateProject,
    toast, showToast,
  } = useDashboardUI();

  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [taskForm, setTaskForm] = useState({ desc: "", unit: "", room: "", assignee: "", start: "", end: "", status: "Pending", notes: "" });
  const [commsMsgInput, setCommsMsgInput] = useState("");
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "", dob: "" });
  const [materialForm, setMaterialForm] = useState({ name: "", category: "Other", unit: "", room: "", vendor: "", qty: "", orderDate: "", eta: "", status: "Pending Order", notes: "", receivedBy: "", receivedDate: "" });
  const [materialImages, setMaterialImages] = useState<string[]>([]);
  const [editingMatId, setEditingMatId] = useState<string | number | null>(null);
  useEffect(() => {
    if (showMatModal && editingMatId === null) {
      setMaterialForm({ name: "", category: "Other", unit: units[0] || "", room: "", vendor: "", qty: "", orderDate: TODAY, eta: "", status: "Pending Order", notes: "", receivedBy: "", receivedDate: "" });
      setMaterialImages([]);
    }
  }, [showMatModal]);
  const ddRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setShowProjectDropdown(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data: dbProjects = [] } = useProjects(session?.activeOrgId);
  const { data: unitsData } = useUnits(activeProjectId);
  const { data: contactsData } = useContacts(activeProjectId);
  const { data: materialsData } = useMaterials(activeProjectId);
  const { data: approvalsData } = useApprovals(activeProjectId);

  const project = projects[activeProjectId];

  const { mutate: persistContacts } = useSaveContacts();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth");
    }
  }, [isLoading, session, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!session) {
        router.replace("/auth");
      }
    }, 25_000);
    return () => clearTimeout(timer);
  }, [session, router]);

  useEffect(() => {
    if (!dbProjects.length) return;
    const merged: Record<string, Project> = {};
    for (const row of dbProjects) {
      merged[row.id] = {
        id: row.id,
        name: row.name,
        icon: row.icon || "🏛",
        client: row.client,
        address: row.address || "",
        startDate: row.start_date || "",
        endDate: row.end_date || "",
        units: {},
        assigneeProfiles: {},
        tasks: [],
        materials: [],
        approvals: [],
        snags: [],
        drawings: [],
        notes: [],
        guidelines: [],
        commsChannels: [{ id: "general", name: "📢 General", sub: "Project-wide updates", icon: "📢", unit: null }],
        commsMessages: { general: [] },
      };
    }
    setProjects((prev) => ({ ...prev, ...merged }));
    if (!activeProjectId || !merged[activeProjectId]) {
      setActiveProjectId(dbProjects[0].id);
    }
  }, [dbProjects]);

  useEffect(() => {
    if (!unitsData) return;
    setProjects((prev) => {
      const p = prev[activeProjectId];
      if (!p) return prev;
      return { ...prev, [activeProjectId]: { ...p, units: unitsData } };
    });
  }, [unitsData, activeProjectId]);

  useEffect(() => {
    if (!contactsData) return;
    setProjects((prev) => {
      const p = prev[activeProjectId];
      if (!p) return prev;
      return { ...prev, [activeProjectId]: { ...p, assigneeProfiles: { ...p.assigneeProfiles, ...contactsData } } };
    });
  }, [contactsData, activeProjectId]);

  useEffect(() => {
    if (!materialsData || !Array.isArray(materialsData)) return;
    setProjects((prev) => {
      const p = prev[activeProjectId];
      if (!p) return prev;
      const materials = materialsData.map((m) => ({
        id: m.id,
        name: m.name,
        cat: m.category || "",
        unit: m.unit || "",
        room: m.room || "",
        vendor: m.vendor || "",
        qty: m.qty || "",
        orderDate: m.order_date || "",
        eta: m.eta || "",
        status: m.status,
        notes: m.notes || "",
        receivedBy: m.received_by || undefined,
        receivedDate: m.received_date || undefined,
        images: m.images || undefined,
      }));
      return { ...prev, [activeProjectId]: { ...p, materials } };
    });
  }, [materialsData, activeProjectId]);

  useEffect(() => {
    if (!approvalsData || !Array.isArray(approvalsData)) return;
    setProjects((prev) => {
      const p = prev[activeProjectId];
      if (!p) return prev;
      const approvals = approvalsData.map((a) => ({
        id: a.id,
        desc: a.description,
        type: a.type || "",
        unit: a.unit || "",
        by: a.submitted_by || "",
        submitted: a.submitted_at || "",
        responded: a.responded_at || "",
        status: a.status,
        remarks: a.remarks || "",
      }));
      return { ...prev, [activeProjectId]: { ...p, approvals } };
    });
  }, [approvalsData, activeProjectId]);

  const units = project ? Object.keys(project.units) : [];
  const [approvalForm, setApprovalForm] = useState({ desc: "", type: "Client", unit: "", submittedBy: "", submittedDate: "", respondedDate: "", status: "Pending", remarks: "" });
  const [editingApprId, setEditingApprId] = useState<string | number | null>(null);

  useEffect(() => {
    if (showApprovalModal && editingApprId === null) {
      setApprovalForm({ desc: "", type: "Client", unit: units[0] || "", submittedBy: session?.fullName || "", submittedDate: TODAY, respondedDate: "", status: "Pending", remarks: "" });
    }
  }, [showApprovalModal]);

  const currentUserProfile = project
    ? Object.values(project.assigneeProfiles).find((p) => p.email === session?.email)
    : undefined;

  const VISIBILITY_TAB_MAP: Record<string, TabKey> = {
    tasks: "tasks", reminders: "actions",
    drawings: "drawings", materials: "materials",
    comms: "comms", approvals: "approvals",
    snags: "actions", notes: "tasks",
  };

  const allowedTabs: TabKey[] | null =
    session?.role === "owner" || !currentUserProfile?.visibility?.length
      ? null
      : [...new Set(currentUserProfile.visibility.map((k) => VISIBILITY_TAB_MAP[k]).filter(Boolean))] as TabKey[];

  useEffect(() => {
    if (allowedTabs && activeTab && !allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0]);
    }
  }, [allowedTabs, activeTab]);

  if (isLoading || !session) return <PageLoader />;
  if (!project) return <PageLoader />;

  const assignees = Object.keys(project.assigneeProfiles);

  function switchProject(id: string) {
    setActiveProjectId(id);
    setActiveUnit("All");
    setActiveCommsChannel("general");
    showToast(`📂 Switched to ${projects[id].name}`);
  }

  function handleProjectCreated(newProject: Project) {
    setProjects((prev) => ({ ...prev, [newProject.id]: newProject }));
    setActiveProjectId(newProject.id);
    setActiveUnit("All");
    setActiveCommsChannel("general");
    showToast(`📂 Project "${newProject.name}" created`);
  }

  function handleUnitAdded(projectId: string, unitName: string) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      p.units = { ...p.units, [unitName]: [] };
      return { ...prev, [projectId]: p };
    });
    showToast(`🏠 Unit "${unitName}" added`);
  }

  function handleRoomAdded(projectId: string, unitName: string, roomName: string) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      p.units = { ...p.units, [unitName]: [...(p.units[unitName] || []), roomName] };
      return { ...prev, [projectId]: p };
    });
  }

  function handleAssigneeAdded(projectId: string, name: string, profile: AssigneeProfile) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      p.assigneeProfiles = { ...p.assigneeProfiles, [name]: profile };
      return { ...prev, [projectId]: p };
    });
    persistContacts({ projectId, profiles: { ...project.assigneeProfiles, [name]: profile } });
    showToast(`📧 Invite sent to ${profile.email}`);
  }

  function handleAssigneeRemoved(projectId: string, name: string) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      const { [name]: _, ...rest } = p.assigneeProfiles;
      return { ...prev, [projectId]: { ...p, assigneeProfiles: rest } };
    });
    const { [name]: _, ...rest } = project.assigneeProfiles;
    persistContacts({ projectId, profiles: rest });
  }

  function handleProjectDeleted(projectId: string) {
    setProjects((prev) => {
      const { [projectId]: _, ...rest } = prev;
      return rest;
    });
    // If the deleted project was active, fall back to the first remaining project
    if (activeProjectId === projectId) {
      const remaining = Object.keys(projects).filter((id) => id !== projectId);
      if (remaining.length > 0) setActiveProjectId(remaining[0]);
    }
    showToast(`🗑 Project deleted`);
  }

  function handleUnitRenamed(projectId: string, oldName: string, newName: string) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      const { [oldName]: rooms, ...rest } = p.units;
      p.units = { ...rest, [newName]: rooms ?? [] };
      return { ...prev, [projectId]: p };
    });
  }

  function handleUnitDeleted(projectId: string, unitName: string) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      const { [unitName]: _, ...rest } = p.units;
      p.units = rest;
      return { ...prev, [projectId]: p };
    });
    showToast(`🗑 Unit "${unitName}" deleted`);
  }

  function handleRoomRenamed(projectId: string, unitName: string, oldName: string, newName: string) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      p.units = {
        ...p.units,
        [unitName]: p.units[unitName].map((r) => (r === oldName ? newName : r)),
      };
      return { ...prev, [projectId]: p };
    });
  }

  function handleRoomDeleted(projectId: string, unitName: string, roomName: string) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      p.units = {
        ...p.units,
        [unitName]: p.units[unitName].filter((r) => r !== roomName),
      };
      return { ...prev, [projectId]: p };
    });
    showToast(`🗑 Room "${roomName}" deleted`);
  }

  function handleAssigneeRoleChanged(projectId: string, name: string, newRole: string) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      const profile = p.assigneeProfiles[name];
      if (!profile) return prev;
      p.assigneeProfiles = { ...p.assigneeProfiles, [name]: { ...profile, role: newRole } };
      return { ...prev, [projectId]: p };
    });
    const profile = project.assigneeProfiles[name];
    if (profile) {
      persistContacts({ projectId, profiles: { ...project.assigneeProfiles, [name]: { ...profile, role: newRole } } });
    }
  }

  function handleAssigneeUpdated(projectId: string, name: string, updates: Partial<AssigneeProfile>) {
    setProjects((prev) => {
      const p = { ...prev[projectId] };
      const profile = p.assigneeProfiles[name];
      if (!profile) return prev;
      const updated = { ...profile, ...updates };
      p.assigneeProfiles = { ...p.assigneeProfiles, [name]: updated };
      return { ...prev, [projectId]: p };
    });
    const profile = project.assigneeProfiles[name];
    if (profile) {
      const updated = { ...profile, ...updates };
      persistContacts({ projectId, profiles: { ...project.assigneeProfiles, [name]: updated } });
    }
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

  function resetMatForm() {
    setMaterialForm({ name: "", category: "Other", unit: units[0] || "", room: "", vendor: "", qty: "", orderDate: "", eta: "", status: "Pending Order", notes: "", receivedBy: "", receivedDate: "" });
    setMaterialImages([]);
    setEditingMatId(null);
  }

  function openEditMaterial(id: string | number) {
    const m = project.materials.find((x) => x.id === id);
    if (!m) return;
    setMaterialForm({
      name: m.name,
      category: m.cat,
      unit: m.unit,
      room: m.room,
      vendor: m.vendor,
      qty: m.qty,
      orderDate: m.orderDate,
      eta: m.eta,
      status: m.status,
      notes: m.notes,
      receivedBy: m.receivedBy || "",
      receivedDate: m.receivedDate || "",
    });
    setMaterialImages(m.images || []);
    setEditingMatId(id);
    setShowMatModal(true);
  }

  function handleMatImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setMaterialImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeMatImage(idx: number) {
    setMaterialImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function addMaterial() {
    const f = materialForm;
    if (!f.name.trim()) return;

    const addLocally = (mat: Material) => {
      setProjects((prev) => {
        const p = { ...prev[activeProjectId] };
        p.materials = [...p.materials, mat];
        return { ...prev, [activeProjectId]: p };
      });
    };

    if (isDbProject(activeProjectId)) {
      dbCreateMaterial(activeProjectId, {
        name: f.name.trim(),
        category: f.category,
        unit: f.unit,
        room: f.room,
        vendor: f.vendor.trim(),
        qty: f.qty.trim(),
        order_date: f.orderDate,
        eta: f.eta,
        status: f.status,
        notes: f.notes.trim(),
      }).then((res) => {
        if (res.data) {
          addLocally({
            id: res.data.id,
            name: res.data.name,
            cat: res.data.category || "",
            unit: res.data.unit || "",
            room: res.data.room || "",
            vendor: res.data.vendor || "",
            qty: res.data.qty || "",
            orderDate: res.data.order_date || "",
            eta: res.data.eta || "",
            status: res.data.status,
            notes: res.data.notes || "",
          });
        } else {
          showToast(res.error || "Failed to save material");
        }
      });
    } else {
      addLocally({ id: Date.now(), name: f.name.trim(), cat: f.category, unit: f.unit, room: f.room, vendor: f.vendor.trim(), qty: f.qty.trim(), orderDate: f.orderDate, eta: f.eta, status: f.status, notes: f.notes.trim() });
    }

    setShowMatModal(false);
    resetMatForm();
    showToast("Material added");
  }

  function updateMaterial() {
    if (editingMatId === null) return;
    const f = materialForm;
    if (!f.name.trim()) return;

    const updateLocally = () => {
      setProjects((prev) => {
        const p = { ...prev[activeProjectId] };
        p.materials = p.materials.map((m) =>
          m.id === editingMatId
            ? { ...m, name: f.name.trim(), cat: f.category, unit: f.unit, room: f.room, vendor: f.vendor.trim(), qty: f.qty.trim(), orderDate: f.orderDate, eta: f.eta, status: f.status, notes: f.notes.trim(), receivedBy: f.receivedBy.trim() || undefined, receivedDate: f.receivedDate || undefined, images: materialImages.length > 0 ? materialImages : undefined }
            : m
        );
        return { ...prev, [activeProjectId]: p };
      });
    };

    if (typeof editingMatId === "string") {
      dbUpdateMaterial(editingMatId, {
        name: f.name.trim(),
        category: f.category,
        unit: f.unit,
        room: f.room,
        vendor: f.vendor.trim(),
        qty: f.qty.trim(),
        order_date: f.orderDate,
        eta: f.eta,
        status: f.status,
        notes: f.notes.trim(),
        received_by: f.receivedBy.trim(),
        received_date: f.receivedDate,
        images: materialImages,
      }).then((res) => {
        if (res.error) {
          showToast(res.error || "Failed to update material");
        }
      });
    }

    updateLocally();
    setShowMatModal(false);
    resetMatForm();
    showToast("Material updated");
  }

  function deleteMaterial(id: string | number) {
    if (typeof id === "string") {
      dbDeleteMaterial(id).then((res) => {
        if (res.error) showToast(res.error || "Failed to delete material");
      });
    }

    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.materials = p.materials.filter((m) => m.id !== id);
      return { ...prev, [activeProjectId]: p };
    });
    showToast("Material removed");
  }

  function resetApprForm() {
    setApprovalForm({ desc: "", type: "Client", unit: units[0] || "", submittedBy: "", submittedDate: TODAY, respondedDate: "", status: "Pending", remarks: "" });
    setEditingApprId(null);
  }

  function openEditApproval(id: string | number) {
    const a = project.approvals.find((x) => x.id === id);
    if (!a) return;
    setApprovalForm({ desc: a.desc, type: a.type, unit: a.unit, submittedBy: a.by, submittedDate: a.submitted, respondedDate: a.responded, status: a.status, remarks: a.remarks });
    setEditingApprId(id);
    setShowApprovalModal(true);
  }

  function addApproval() {
    const f = approvalForm;
    if (!f.desc.trim()) return;

    const addLocally = (appr: Approval) => {
      setProjects((prev) => {
        const p = { ...prev[activeProjectId] };
        p.approvals = [...p.approvals, appr];
        return { ...prev, [activeProjectId]: p };
      });
    };

    if (isDbProject(activeProjectId)) {
      dbCreateApproval(activeProjectId, {
        description: f.desc.trim(),
        type: f.type,
        unit: f.unit,
        submitted_by: f.submittedBy,
        submitted_at: f.submittedDate,
        responded_at: f.respondedDate,
        status: f.status,
        remarks: f.remarks.trim(),
      }).then((res) => {
        if (res.data) {
          addLocally({ id: res.data.id, desc: res.data.description, type: res.data.type || "", unit: res.data.unit || "", by: res.data.submitted_by || "", submitted: res.data.submitted_at || "", responded: res.data.responded_at || "", status: res.data.status, remarks: res.data.remarks || "" });
        } else {
          showToast(res.error || "Failed to save approval");
        }
      });
    } else {
      addLocally({ id: Date.now(), desc: f.desc.trim(), type: f.type, unit: f.unit, by: f.submittedBy, submitted: f.submittedDate, responded: f.respondedDate, status: f.status, remarks: f.remarks.trim() });
    }

    setShowApprovalModal(false);
    resetApprForm();
    showToast("Approval logged");
  }

  function updateApproval() {
    if (editingApprId === null) return;
    const f = approvalForm;
    if (!f.desc.trim()) return;

    const updateLocally = () => {
      setProjects((prev) => {
        const p = { ...prev[activeProjectId] };
        p.approvals = p.approvals.map((a) =>
          a.id === editingApprId
            ? { ...a, desc: f.desc.trim(), type: f.type, unit: f.unit, by: f.submittedBy, submitted: f.submittedDate, responded: f.respondedDate, status: f.status, remarks: f.remarks.trim() }
            : a
        );
        return { ...prev, [activeProjectId]: p };
      });
    };

    if (typeof editingApprId === "string") {
      dbUpdateApproval(editingApprId, {
        description: f.desc.trim(),
        type: f.type,
        unit: f.unit,
        submitted_by: f.submittedBy,
        submitted_at: f.submittedDate,
        responded_at: f.respondedDate,
        status: f.status,
        remarks: f.remarks.trim(),
      }).then((res) => {
        if (res.error) showToast(res.error || "Failed to update approval");
      });
    }

    updateLocally();
    setShowApprovalModal(false);
    resetApprForm();
    showToast("Approval updated");
  }

  function deleteApproval(id: string | number) {
    if (typeof id === "string") {
      dbDeleteApproval(id).then((res) => {
        if (res.error) showToast(res.error || "Failed to delete approval");
      });
    }

    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.approvals = p.approvals.filter((a) => a.id !== id);
      return { ...prev, [activeProjectId]: p };
    });
    showToast("Approval removed");
  }

  function addSnag() {
    setProjects((prev) => {
      const p = { ...prev[activeProjectId] };
      p.snags = [...p.snags, { id: Date.now(), desc: "", priority: "Major", unit: units[0], room: "", assignee: "", target: "", raisedBy: session?.fullName || "User", status: "Open", date: TODAY }];
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
    if (snagFilterPriority && s.priority !== snagFilterPriority) return false;
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
    { key: "tasks", label: tn("tasks") },
    { key: "comms", label: tn("comms") },
    { key: "drawings", label: tn("drawings") },
    { key: "actions", label: tn("actions") },
    { key: "materials", label: tn("materials") },
    { key: "approvals", label: tn("approvals") },
    { key: "admin", label: tn("admin"), admin: true },
  ];

  const roleIcon = session.role === "owner" ? "👑" : session.role === "architect" ? "📐" : "🔧";
  const roleLabel = tr(session.role);
  const initials =
    session.firstName && session.lastName
      ? `${session.firstName[0]}${session.lastName[0]}`.toUpperCase()
      : session.fullName
        ? session.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
        : "U";

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
            <div className="absolute top-full left-0 right-0 bg-white rounded-[10px] border border-[#E2DAD1] shadow-[0_8px_32px_rgba(44,36,32,0.15)] mt-1.5 p-1 z-200 max-h-[400px] overflow-y-auto min-w-[220px]">
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
              <div className="border-t border-[#E2DAD1] mt-1 pt-1">
                <button
                  onClick={() => { setShowProjectDropdown(false); setShowCreateProject(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[7px] cursor-pointer transition-all hover:bg-[#FEF4EF] text-left"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#FEF4EF] border-[1.5px] border-[#F4895A] flex items-center justify-center text-[#E8601C] text-[1rem] flex-shrink-0">+</span>
                  <span className="text-[0.84rem] font-semibold text-[#E8601C]">{th("newProject")}</span>
                </button>
              </div>
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
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full bg-[#E8601C] flex items-center justify-center text-white text-[0.78rem] font-bold cursor-pointer hover:bg-[#C04E12] transition-colors shadow-[0_2px_8px_rgba(232,96,28,0.3)]"
            >
              {initials}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-[#E2DAD1] shadow-[0_8px_32px_rgba(44,36,32,0.15)] z-200 w-[230px] overflow-hidden">
                <div className="px-4 py-3.5 border-b border-[#E2DAD1] bg-[#F7F5F2]">
                  <div className="font-semibold text-[0.88rem] text-[#2C2420] truncate">{session.fullName}</div>
                  <div className="text-[0.72rem] text-[#9C8E86] truncate mt-0.5">{session.email}</div>
                  <div className="inline-flex items-center gap-1 mt-2 bg-[#FDE8DC] text-[#E8601C] text-[0.65rem] font-bold px-2 py-0.5 rounded-full">
                    <span>{roleIcon}</span>
                    <span className="tracking-[0.04em] uppercase">{roleLabel}</span>
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setShowUserMenu(false); router.push("/settings"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[0.82rem] text-[#2C2420] hover:bg-[#FEF4EF] hover:text-[#E8601C] transition-all text-left cursor-pointer"
                  >
                    <span className="text-[0.88rem]">⚙</span> {th("profileSettings")}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setProfileForm({ firstName: session.firstName || "", lastName: session.lastName || "", phone: session.phone || "", dob: session.dob || "" });
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[0.82rem] text-[#2C2420] hover:bg-[#FEF4EF] hover:text-[#E8601C] transition-all text-left cursor-pointer"
                  >
                    <span className="text-[0.88rem]">✏️</span> {th("quickEdit")}
                  </button>
                  <div className="border-t border-[#E2DAD1] my-1" />
                  <button
                    onClick={async () => { setShowUserMenu(false); await signOutUser(); router.push("/auth"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[0.82rem] text-[#C0392B] hover:bg-[#FDECEA] transition-all text-left cursor-pointer font-medium"
                  >
                    <span className="text-[0.88rem]">→</span> {th("signOut")}
                  </button>
                </div>
              </div>
            )}
          </div>
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
            {overdueTasks > 0 && <span className="text-[#ffb0b0]">🚨 {overdueTasks} {th("overdue")}</span>}
          </div>
        </div>
      </div>

      {/* NAV TABS */}
      <nav className="bg-white flex px-6 sm:px-8 gap-0 overflow-x-auto border-b border-[#E2DAD1] items-end">
        <div className="flex gap-0">
          {navTabs.filter((t) => {
            if (t.admin) return false;
            return !allowedTabs || allowedTabs.includes(t.key);
          }).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-[0.85rem] text-[0.78rem] tracking-[0.08em] uppercase font-medium transition-all whitespace-nowrap border-b-2 mb-[-1px] cursor-pointer ${activeTab === t.key ? "text-[#E8601C] border-b-[#E8601C]" : "text-[#9C8E86] border-b-transparent hover:text-[#E8601C]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {session.role === "owner" && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-5 py-[0.85rem] text-[0.78rem] tracking-[0.08em] uppercase font-medium transition-all whitespace-nowrap border-b-2 mb-[-1px] cursor-pointer ${activeTab === "admin" ? "text-[#E8601C] border-b-[#E8601C]" : "text-[#9C8E86] border-b-transparent hover:text-[#E8601C]"}`}
          >
            ⚙ Admin
          </button>
        )}
      </nav>

      {/* TAB CONTENT */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-8">
        {/* ═══ TASKS ═══ */}
        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <TaskSheet
              project={project}
              onDeleteTask={deleteTask}
              onUpdateTaskStatus={updateTaskStatus}
              onAddTask={addTask}
            />
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
          <Actions
            project={project}
            filteredSnags={filteredSnags}
            units={units}
            updateTaskStatus={updateTaskStatus}
            dateStr={dateStr}
            TODAY={TODAY}
          />
        )}

        {/* ═══ DRAWINGS ═══ */}
        {activeTab === "drawings" && (
          <Drawings
            project={project}
            filteredDrawings={filteredDrawings}
            units={units}
          />
        )}

        {/* ═══ MATERIALS ═══ */}
        {activeTab === "materials" && (
          <Materials
            project={project}
            filteredMaterials={filteredMaterials}
            units={units}
            onEdit={openEditMaterial}
            onDelete={deleteMaterial}
          />
        )}

        {/* ═══ APPROVALS ═══ */}
        {activeTab === "approvals" && (
          <Approvals
            project={project}
            filteredApprovals={filteredApprovals}
            units={units}
            onEdit={openEditApproval}
            onDelete={deleteApproval}
          />
        )}

        {/* ═══ OVERVIEW ═══ */}
        {activeTab === "overview" && <Overview project={project} />}

        {/* ═══ SITE COMMS ═══ */}
        {activeTab === "comms" && (
          <Comms
            project={project}
            commsMsgInput={commsMsgInput}
            setCommsMsgInput={setCommsMsgInput}
            units={units}
            sendCommsMessage={sendCommsMessage}
            session={session}
          />
        )}

        {/* ═══ ADMIN ═══ */}
        {activeTab === "admin" && (
          <Admin
            projects={projects}
            activeProjectId={activeProjectId}
            switchProject={switchProject}
            project={project}
            onProjectCreated={handleProjectCreated}
            onUnitAdded={handleUnitAdded}
            onRoomAdded={handleRoomAdded}
            onAssigneeAdded={handleAssigneeAdded}
            onAssigneeRemoved={handleAssigneeRemoved}
            onAssigneeRoleChanged={handleAssigneeRoleChanged}
            onAssigneeUpdated={handleAssigneeUpdated}
            onProjectDeleted={handleProjectDeleted}
            onUnitRenamed={handleUnitRenamed}
            onUnitDeleted={handleUnitDeleted}
            onRoomRenamed={handleRoomRenamed}
            onRoomDeleted={handleRoomDeleted}
          />
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

      {/* MATERIAL MODAL */}
      {showMatModal && (
        <div className="fixed inset-0 bg-[#2C2420]/50 z-500 flex items-center justify-center backdrop-blur-sm" onClick={() => { setShowMatModal(false); resetMatForm(); }}>
          <div className="bg-white rounded-2xl p-8 w-[min(780px,94vw)] shadow-[0_24px_80px_rgba(44,36,32,0.2)] border-t-4 border-[#E8601C] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-[1.4rem] font-semibold text-[#2C2420] mb-5">{editingMatId ? "Edit Material" : "Add Material / Item"}</div>

            {/* Row 1: Item Name */}
            <div className="mb-4">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Item Name *</label>
              <input
                value={materialForm.name}
                onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                placeholder="e.g. 600×600 Vitrified Tile — Cream Matt"
              />
            </div>

            {/* Row 2: Category · Status · Qty */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Category</label>
                <select
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                >
                  <option>Tiles & Flooring</option><option>Sanitary & Plumbing</option><option>Electrical</option>
                  <option>Joinery & Furniture</option><option>Paint & Finishes</option><option>Hardware & Fittings</option>
                  <option>Civil & Structure</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Status</label>
                <select
                  value={materialForm.status}
                  onChange={(e) => setMaterialForm({ ...materialForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                >
                  <option>Pending Order</option><option>Ordered</option><option>Delivered</option><option>On Hold</option>
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Qty / Unit</label>
                <input
                  value={materialForm.qty}
                  onChange={(e) => setMaterialForm({ ...materialForm, qty: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                  placeholder="e.g. 280 sqft"
                />
              </div>
            </div>

            {/* Row 3: Unit · Room · Vendor */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Unit</label>
                <select
                  value={materialForm.unit}
                  onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value, room: "" })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                >
                  <option value="">Select unit</option>
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Room</label>
                <select
                  value={materialForm.room}
                  onChange={(e) => setMaterialForm({ ...materialForm, room: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                >
                  <option value="">Select room</option>
                  {(project.units[materialForm.unit] || []).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Vendor / Supplier</label>
                <input
                  value={materialForm.vendor}
                  onChange={(e) => setMaterialForm({ ...materialForm, vendor: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                  placeholder="Vendor name"
                />
              </div>
            </div>

            {/* Row 4: Order Date · ETA · Notes */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Order Date</label>
                <input
                  type="date"
                  value={materialForm.orderDate}
                  onChange={(e) => setMaterialForm({ ...materialForm, orderDate: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">ETA / Delivery</label>
                <input
                  type="date"
                  value={materialForm.eta}
                  onChange={(e) => setMaterialForm({ ...materialForm, eta: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Notes</label>
                <input
                  value={materialForm.notes}
                  onChange={(e) => setMaterialForm({ ...materialForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                  placeholder="Remarks, specs, contact…"
                />
              </div>
            </div>

            {editingMatId ? (
              <>
                {/* RECEIVED BY */}
                <div className="mb-4">
                  <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">📦 Received By</label>
                  <div className="flex items-center gap-3">
                    <input
                      value={materialForm.receivedBy}
                      onChange={(e) => setMaterialForm({ ...materialForm, receivedBy: e.target.value })}
                      className="flex-1 px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                      placeholder="Name of person who received the delivery…"
                    />
                    <input
                      type="date"
                      value={materialForm.receivedDate}
                      onChange={(e) => setMaterialForm({ ...materialForm, receivedDate: e.target.value })}
                      className="w-[160px] px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                    />
                  </div>
                </div>

                {/* MATERIAL IMAGES */}
                <div className="mb-4">
                  <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">
                    Material Images <span className="font-normal text-[#9C8E86]/70 text-[0.65rem]">(photos, swatches, delivery proof)</span>
                  </label>
                  {materialImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {materialImages.map((src, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E2DAD1] group">
                          <img src={src} alt={`Material ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeMatImage(i)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] text-[#E8601C] bg-[#FEF4EF] border border-[#E8601C]/30 rounded-lg cursor-pointer hover:bg-[#FDE8DC] transition-colors">
                    + Add Images
                    <input type="file" accept="image/*" multiple onChange={handleMatImageUpload} className="hidden" />
                  </label>
                </div>
              </>
            ) : (
              <div className="bg-[#FEF4EF] border-l-[3px] border-[#E8601C] rounded-lg px-4 py-3 text-[0.75rem] text-[#5C4F48] mb-5">
                💡 You can add <b>Received By</b> details and <b>photos</b> later by clicking ✏️ on the material row.
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowMatModal(false); resetMatForm(); }} className="bg-[#F7F5F2] text-[#5C4F48] border-[1.5px] border-[#E2DAD1] rounded-lg px-5 py-2.5 text-[0.82rem] cursor-pointer transition-all hover:bg-[#EEE9E3]">Cancel</button>
              <button onClick={editingMatId ? updateMaterial : addMaterial} className="bg-[#E8601C] text-white border-none rounded-lg px-6 py-2.5 text-[0.82rem] cursor-pointer font-medium transition-all hover:bg-[#C04E12]">{editingMatId ? "Save Changes" : "Save Item"}</button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-[#2C2420]/50 z-500 flex items-center justify-center backdrop-blur-sm" onClick={() => { setShowApprovalModal(false); resetApprForm(); }}>
          <div className="bg-white rounded-2xl p-8 w-[min(580px,94vw)] shadow-[0_24px_80px_rgba(44,36,32,0.2)] border-t-4 border-[#E8601C]" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-[1.4rem] font-semibold text-[#2C2420] mb-5">{editingApprId ? "Edit Approval" : "Log Approval"}</div>

            {/* Subject / Description */}
            <div className="mb-4">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Subject / Description *</label>
              <input
                value={approvalForm.desc}
                onChange={(e) => setApprovalForm({ ...approvalForm, desc: e.target.value })}
                className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                placeholder="e.g. False ceiling layout — Unit 2 Formal Dining"
              />
            </div>

            {/* Row: Type · Status */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Approval Type</label>
                <select
                  value={approvalForm.type}
                  onChange={(e) => setApprovalForm({ ...approvalForm, type: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                >
                  <option>Client</option><option>Architect</option><option>MEP – Electrical</option><option>MEP – Plumbing</option>
                  <option>MEP – HVAC</option><option>MEP – Fire</option><option>Structural</option>
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Status</label>
                <select
                  value={approvalForm.status}
                  onChange={(e) => setApprovalForm({ ...approvalForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                >
                  <option>Pending</option><option>Approved</option><option>Rejected</option><option>Revision Required</option>
                </select>
              </div>
            </div>

            {/* Row: Unit · Submitted By */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Unit</label>
                <select
                  value={approvalForm.unit}
                  onChange={(e) => setApprovalForm({ ...approvalForm, unit: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                >
                  <option value="">All units</option>
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Submitted By</label>
                <input
                  value={approvalForm.submittedBy}
                  onChange={(e) => setApprovalForm({ ...approvalForm, submittedBy: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                  placeholder="Name / firm"
                />
              </div>
            </div>

            {/* Row: Submission Date · Response Date */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Submission Date</label>
                <input
                  type="date"
                  value={approvalForm.submittedDate}
                  onChange={(e) => setApprovalForm({ ...approvalForm, submittedDate: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[0.7rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Response Date</label>
                <input
                  type="date"
                  value={approvalForm.respondedDate}
                  onChange={(e) => setApprovalForm({ ...approvalForm, respondedDate: e.target.value })}
                  className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="mb-5">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Remarks / Conditions</label>
              <textarea
                value={approvalForm.remarks}
                onChange={(e) => setApprovalForm({ ...approvalForm, remarks: e.target.value })}
                className="w-full px-3 py-2 text-[0.82rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white resize-none min-h-[56px]"
                placeholder="Any conditions, revision notes, or references…"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowApprovalModal(false); resetApprForm(); }} className="bg-[#F7F5F2] text-[#5C4F48] border-[1.5px] border-[#E2DAD1] rounded-lg px-5 py-2.5 text-[0.82rem] cursor-pointer transition-all hover:bg-[#EEE9E3]">Cancel</button>
              <button onClick={editingApprId ? updateApproval : addApproval} className="bg-[#E8601C] text-white border-none rounded-lg px-6 py-2.5 text-[0.82rem] cursor-pointer font-medium transition-all hover:bg-[#C04E12]">{editingApprId ? "Save Changes" : "Save"}</button>
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

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-[#2C2420]/50 z-500 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-[min(520px,94vw)] shadow-[0_24px_80px_rgba(44,36,32,0.2)] border-t-4 border-[#E8601C]" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-[1.4rem] font-semibold text-[#2C2420] mb-5">Edit Profile</div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">First Name</label>
                <input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" />
              </div>
              <div>
                <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Last Name</label>
                <input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Phone</label>
              <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" />
            </div>
            <div className="mb-6">
              <label className="text-[0.75rem] text-[#9C8E86] tracking-[0.05em] uppercase font-medium block mb-1.5">Date of Birth</label>
              <input type="date" value={profileForm.dob} onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })} className="w-full px-3 py-2 text-[0.8rem] bg-[#F7F5F2] border-[1.5px] border-[#E2DAD1] rounded-lg text-[#2C2420] outline-none focus:border-[#E8601C] focus:bg-white" />
            </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowProfileModal(false)} className="bg-[#F7F5F2] text-[#5C4F48] border-[1.5px] border-[#E2DAD1] rounded-lg px-5 py-2.5 text-[0.82rem] cursor-pointer transition-all hover:bg-[#EEE9E3]">Cancel</button>
            <button onClick={async () => {
              const result = await updateUserProfile(profileForm.firstName, profileForm.lastName, profileForm.phone, profileForm.dob);
              if (result.success) {
                setShowProfileModal(false);
                showToast("Profile updated");
              } else {
                alert(result.error || "Failed to update profile");
              }
            }} className="bg-[#E8601C] text-white border-none rounded-lg px-6 py-2.5 text-[0.82rem] cursor-pointer font-medium transition-all hover:bg-[#C04E12]">Save</button>
          </div>
          </div>
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