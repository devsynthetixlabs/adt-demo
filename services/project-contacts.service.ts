import { API } from "@/constants/api";

interface AssigneeProfile {
  color: string;
  phone: string;
  email: string;
  role: string;
  designation: string;
  visibility: string[];
  loginStatus?: "invited" | "active" | "pending";
}

export async function loadProjectContacts(
  projectId: string
): Promise<Record<string, AssigneeProfile> | null> {
  const res = await fetch(`${API.CONTACTS}?projectId=${encodeURIComponent(projectId)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveProjectContacts(
  projectId: string,
  profiles: Record<string, AssigneeProfile>
): Promise<boolean> {
  const res = await fetch(`${API.CONTACTS}?projectId=${encodeURIComponent(projectId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profiles),
  });

  if (!res.ok) {
    console.error("Failed to save project contacts:", await res.json());
    return false;
  }
  return true;
}
