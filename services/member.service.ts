import { API } from "@/constants/api";
import type { Result } from "./project.service";

export type OrgMember = {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: "invited" | "active";
  joinedAt: string;
};

export async function dbCreateInvitation(
  orgId: string,
  email: string,
  role: string,
  firstName: string,
  lastName = "",
  phone = "",
): Promise<Result<void>> {
  const res = await fetch(API.INVITATIONS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orgId, email, role, firstName, lastName, phone }),
  });

  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to send invitation" };
  return { data: undefined };
}

export async function dbGetMembers(orgId: string): Promise<Result<OrgMember[]>> {
  const res = await fetch(`${API.MEMBERS}?orgId=${encodeURIComponent(orgId)}`);
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to load members" };
  return { data: json.data };
}

export async function dbUpdateMemberRole(
  orgId: string,
  userId: string,
  role: string,
): Promise<Result<void>> {
  const res = await fetch(`${API.MEMBERS}/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orgId, role }),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to update role" };
  return { data: undefined };
}

export async function dbDeleteMember(
  orgId: string,
  userId: string,
): Promise<Result<void>> {
  const res = await fetch(`${API.MEMBERS}/${userId}?orgId=${encodeURIComponent(orgId)}`, {
    method: "DELETE",
  });
  if (res.status === 204) return { data: undefined };
  const json = await res.json();
  return { error: json.error || "Failed to remove member" };
}
