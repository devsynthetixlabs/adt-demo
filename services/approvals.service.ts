import { API } from "@/constants/api";
import type { Result } from "./project.service";

export interface ApiApproval {
  id: string;
  project_id: string;
  description: string;
  type: string | null;
  unit: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  responded_at: string | null;
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalForm {
  description: string;
  type: string;
  unit: string;
  submitted_by: string;
  submitted_at: string;
  responded_at: string;
  status: string;
  remarks: string;
}

export async function dbGetApprovals(projectId: string): Promise<Result<ApiApproval[]>> {
  const res = await fetch(`${API.APPROVALS}?projectId=${encodeURIComponent(projectId)}`);
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to load approvals" };
  return { data: json.data };
}

export async function dbCreateApproval(
  projectId: string,
  form: ApprovalForm
): Promise<Result<ApiApproval>> {
  const res = await fetch(API.APPROVALS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, ...form }),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to create approval" };
  return { data: json.data };
}

export async function dbUpdateApproval(
  id: string,
  updates: Partial<ApprovalForm>
): Promise<Result<ApiApproval>> {
  const res = await fetch(`${API.APPROVALS}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to update approval" };
  return { data: json.data };
}

export async function dbDeleteApproval(id: string): Promise<Result<void>> {
  const res = await fetch(`${API.APPROVALS}/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to delete approval" };
  return { data: undefined };
}
