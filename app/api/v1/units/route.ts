import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

const createSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Unit name is required"),
});

const renameSchema = z.object({
  projectId: z.string().uuid(),
  oldName: z.string().min(1),
  newName: z.string().min(1, "New name is required"),
});

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId query param is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: units } = await admin
    .from("units")
    .select("name, rooms(name)")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  return NextResponse.json(units ?? []);
}

export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { projectId, name } = parsed.data;
  const admin = createAdminClient();

  const { data: unit, error } = await admin
    .from("units")
    .insert({ project_id: projectId, name })
    .select("id, name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(unit, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = renameSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const { projectId, oldName, newName } = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin
    .from("units")
    .update({ name: newName })
    .eq("project_id", projectId)
    .eq("name", oldName);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const name = searchParams.get("name");

  if (!projectId || !name) {
    return NextResponse.json({ error: "projectId and name are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("units")
    .delete()
    .eq("project_id", projectId)
    .eq("name", name);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
