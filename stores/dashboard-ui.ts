import { create } from "zustand";

export type TabKey = "tasks" | "comms" | "drawings" | "actions" | "materials" | "approvals" | "overview" | "admin";

interface DashboardUI {
  activeTab: TabKey;
  activeProjectId: string;
  activeUnit: string;
  showTaskModal: boolean;
  showMatModal: boolean;
  showApprovalModal: boolean;
  showSnagModal: boolean;
  showProfileModal: boolean;
  showProjectDropdown: boolean;
  showUserMenu: boolean;
  showCreateProject: boolean;
  notesTab: "notes" | "guidelines";
  actionSubtab: "reminders" | "snags";
  adminSubtab: "units" | "assignees" | "projects" | "settings";
  activeCommsChannel: string;
  filterAssignee: string;
  filterStatus: string;
  filterDate: string;
  snagFilterPriority: string;
  snagFilterStatus: string;
  snagFilterUnit: string;
  drawFilterUnit: string;
  drawFilterType: string;
  matFilterStatus: string;
  matFilterUnit: string;
  matFilterCat: string;
  apprFilterType: string;
  apprFilterStatus: string;
  apprFilterUnit: string;
  toast: string;

  setActiveTab: (tab: TabKey) => void;
  setActiveProjectId: (id: string) => void;
  setActiveUnit: (unit: string) => void;
  setShowTaskModal: (v: boolean) => void;
  setShowMatModal: (v: boolean) => void;
  setShowApprovalModal: (v: boolean) => void;
  setShowSnagModal: (v: boolean) => void;
  setShowProfileModal: (v: boolean) => void;
  setShowProjectDropdown: (v: boolean) => void;
  setShowUserMenu: (v: boolean) => void;
  setShowCreateProject: (v: boolean) => void;
  setNotesTab: (tab: "notes" | "guidelines") => void;
  setActionSubtab: (tab: "reminders" | "snags") => void;
  setAdminSubtab: (tab: "units" | "assignees" | "projects" | "settings") => void;
  setActiveCommsChannel: (ch: string) => void;
  setFilterAssignee: (v: string) => void;
  setFilterStatus: (v: string) => void;
  setFilterDate: (v: string) => void;
  setSnagFilterPriority: (v: string) => void;
  setSnagFilterStatus: (v: string) => void;
  setSnagFilterUnit: (v: string) => void;
  setDrawFilterUnit: (v: string) => void;
  setDrawFilterType: (v: string) => void;
  setMatFilterStatus: (v: string) => void;
  setMatFilterUnit: (v: string) => void;
  setMatFilterCat: (v: string) => void;
  setApprFilterType: (v: string) => void;
  setApprFilterStatus: (v: string) => void;
  setApprFilterUnit: (v: string) => void;
  showToast: (msg: string) => void;
}

export const useDashboardUI = create<DashboardUI>((set) => ({
  activeTab: "tasks",
  activeProjectId: "",
  activeUnit: "All",
  showTaskModal: false,
  showMatModal: false,
  showApprovalModal: false,
  showSnagModal: false,
  showProfileModal: false,
  showProjectDropdown: false,
  showUserMenu: false,
  showCreateProject: false,
  notesTab: "notes",
  actionSubtab: "reminders",
  adminSubtab: "projects",
  activeCommsChannel: "general",
  filterAssignee: "",
  filterStatus: "",
  filterDate: "",
  snagFilterPriority: "",
  snagFilterStatus: "",
  snagFilterUnit: "",
  drawFilterUnit: "",
  drawFilterType: "",
  matFilterStatus: "",
  matFilterUnit: "",
  matFilterCat: "",
  apprFilterType: "",
  apprFilterStatus: "",
  apprFilterUnit: "",
  toast: "",

  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveProjectId: (activeProjectId) => set({ activeProjectId }),
  setActiveUnit: (activeUnit) => set({ activeUnit }),
  setShowTaskModal: (showTaskModal) => set({ showTaskModal }),
  setShowMatModal: (showMatModal) => set({ showMatModal }),
  setShowApprovalModal: (showApprovalModal) => set({ showApprovalModal }),
  setShowSnagModal: (showSnagModal) => set({ showSnagModal }),
  setShowProfileModal: (showProfileModal) => set({ showProfileModal }),
  setShowProjectDropdown: (showProjectDropdown) => set({ showProjectDropdown }),
  setShowUserMenu: (showUserMenu) => set({ showUserMenu }),
  setShowCreateProject: (showCreateProject) => set({ showCreateProject }),
  setNotesTab: (notesTab) => set({ notesTab }),
  setActionSubtab: (actionSubtab) => set({ actionSubtab }),
  setAdminSubtab: (adminSubtab) => set({ adminSubtab }),
  setActiveCommsChannel: (activeCommsChannel) => set({ activeCommsChannel }),
  setFilterAssignee: (filterAssignee) => set({ filterAssignee }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterDate: (filterDate) => set({ filterDate }),
  setSnagFilterPriority: (snagFilterPriority) => set({ snagFilterPriority }),
  setSnagFilterStatus: (snagFilterStatus) => set({ snagFilterStatus }),
  setSnagFilterUnit: (snagFilterUnit) => set({ snagFilterUnit }),
  setDrawFilterUnit: (drawFilterUnit) => set({ drawFilterUnit }),
  setDrawFilterType: (drawFilterType) => set({ drawFilterType }),
  setMatFilterStatus: (matFilterStatus) => set({ matFilterStatus }),
  setMatFilterUnit: (matFilterUnit) => set({ matFilterUnit }),
  setMatFilterCat: (matFilterCat) => set({ matFilterCat }),
  setApprFilterType: (apprFilterType) => set({ apprFilterType }),
  setApprFilterStatus: (apprFilterStatus) => set({ apprFilterStatus }),
  setApprFilterUnit: (apprFilterUnit) => set({ apprFilterUnit }),
  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: "" }), 3000);
  },
}));
