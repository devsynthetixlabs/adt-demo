import { API } from "@/constants/api";

export interface ProjectFields {
  name: string;
  icon: string;
  client: string;
  address: string;
  startDate: string;
  endDate: string;
}

type Ok<T> = { data: T; error?: never };
type Err = { data?: never; error: string };
export type Result<T> = Ok<T> | Err;

export function isDbProject(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
}

export async function dbCreateProject(
  fields: ProjectFields,
  orgId: string,
  _userId: string
): Promise<Result<string>> {
  const res = await fetch(API.PROJECTS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: fields.name,
      icon: fields.icon || "🏛",
      client: fields.client,
      address: fields.address || undefined,
      startDate: fields.startDate || undefined,
      endDate: fields.endDate || undefined,
      organizationId: orgId,
    }),
  });

  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to create project" };
  return { data: json.id };
}

export async function dbFetchProjects(): Promise<
  Array<{
    id: string;
    name: string;
    icon: string;
    client: string;
    address: string | null;
    start_date: string | null;
    end_date: string | null;
  }>
> {
  const res = await fetch(API.PROJECTS);
  if (!res.ok) return [];
  return res.json();
}

export async function dbFetchUnitsWithRooms(
  projectId: string
): Promise<Record<string, string[]>> {
  const res = await fetch(`${API.UNITS}?projectId=${encodeURIComponent(projectId)}`);
  if (!res.ok) return {};

  const data: Array<{ name: string; rooms: { name: string }[] }> = await res.json();
  const result: Record<string, string[]> = {};
  for (const unit of data) {
    result[unit.name] = (unit.rooms || []).map((r) => r.name);
  }
  return result;
}

export async function dbCreateUnit(
  projectId: string,
  name: string
): Promise<Result<string>> {
  const res = await fetch(API.UNITS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, name }),
  });

  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to create unit" };
  return { data: json.id };
}

export async function dbDeleteProject(id: string): Promise<Result<void>> {
  const res = await fetch(`${API.PROJECTS}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (res.status === 204) return { data: undefined };
  const json = await res.json().catch(() => ({}));
  return { error: json.error || "Failed to delete project" };
}

export async function dbRenameUnit(projectId: string, oldName: string, newName: string): Promise<Result<void>> {
  const res = await fetch(API.UNITS, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, oldName, newName }),
  });
  if (res.ok) return { data: undefined };
  const json = await res.json().catch(() => ({}));
  return { error: json.error || "Failed to rename unit" };
}

export async function dbDeleteUnit(projectId: string, name: string): Promise<Result<void>> {
  const params = new URLSearchParams({ projectId, name });
  const res = await fetch(`${API.UNITS}?${params}`, { method: "DELETE" });
  if (res.status === 204) return { data: undefined };
  const json = await res.json().catch(() => ({}));
  return { error: json.error || "Failed to delete unit" };
}

export async function dbRenameRoom(projectId: string, unitName: string, oldName: string, newName: string): Promise<Result<void>> {
  const res = await fetch(API.ROOMS, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, unitName, oldName, newName }),
  });
  if (res.ok) return { data: undefined };
  const json = await res.json().catch(() => ({}));
  return { error: json.error || "Failed to rename room" };
}

export async function dbDeleteRoom(projectId: string, unitName: string, roomName: string): Promise<Result<void>> {
  const params = new URLSearchParams({ projectId, unitName, roomName });
  const res = await fetch(`${API.ROOMS}?${params}`, { method: "DELETE" });
  if (res.status === 204) return { data: undefined };
  const json = await res.json().catch(() => ({}));
  return { error: json.error || "Failed to delete room" };
}

export async function dbCreateRoom(
  projectId: string,
  unitName: string,
  roomName: string
): Promise<Result<string>> {
  const res = await fetch(API.ROOMS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, unitName, roomName }),
  });

  const json = await res.json();
  if (!res.ok) return { error: json.error || "Failed to create room" };
  return { data: json.id };
}
