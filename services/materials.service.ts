import { API } from "@/constants/api";
import type { Result } from "./project.service";

export interface ApiMaterial {
  id: string;
  project_id: string;
  name: string;
  category: string | null;
  unit: string | null;
  room: string | null;
  vendor: string | null;
  qty: string | null;
  order_date: string | null;
  eta: string | null;
  status: string;
  notes: string | null;
  received_by: string | null;
  received_date: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialForm {
  name: string;
  category: string;
  unit: string;
  room: string;
  vendor: string;
  qty: string;
  order_date: string;
  eta: string;
  status: string;
  notes: string;
}

export async function dbGetMaterials(projectId: string): Promise<Result<ApiMaterial[]>> {
  const res = await fetch(`${API.MATERIALS}?projectId=${encodeURIComponent(projectId)}`);
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to load materials" };
  return { data: json.data };
}

export async function dbCreateMaterial(
  projectId: string,
  form: MaterialForm
): Promise<Result<ApiMaterial>> {
  const res = await fetch(API.MATERIALS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, ...form }),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to create material" };
  return { data: json.data };
}

export async function dbUpdateMaterial(
  id: string,
  updates: Partial<MaterialForm> & { received_by?: string; received_date?: string; images?: string[] }
): Promise<Result<ApiMaterial>> {
  const res = await fetch(`${API.MATERIALS}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to update material" };
  return { data: json.data };
}

export async function dbDeleteMaterial(id: string): Promise<Result<void>> {
  const res = await fetch(`${API.MATERIALS}/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to delete material" };
  return { data: undefined };
}
