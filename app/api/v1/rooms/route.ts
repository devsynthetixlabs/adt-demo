import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

const createSchema = z.object({
  unitName: z.string().min(1, "Unit name is required"),
  roomName: z.string().min(1, "Room name is required"),
  projectId: z.string().uuid(),
});

const renameSchema = z.object({
  projectId: z.string().uuid(),
  unitName: z.string().min(1),
  oldName: z.string().min(1),
  newName: z.string().min(1, "New name is required"),
});

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

  const { unitName, roomName, projectId } = parsed.data;
  const admin = createAdminClient();

  const { data: unit } = await admin
    .from("units")
    .select("id")
    .eq("project_id", projectId)
    .eq("name", unitName)
    .maybeSingle();

  if (!unit) {
    return NextResponse.json(
      { error: `Unit "${unitName}" not found in this project` },
      { status: 404 }
    );
  }

  const { data: room, error } = await admin
    .from("rooms")
    .insert({ unit_id: unit.id, name: roomName })
    .select("id, name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(room, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = renameSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const { projectId, unitName, oldName, newName } = parsed.data;
  const admin = createAdminClient();

  const { data: unit } = await admin
    .from("units")
    .select("id")
    .eq("project_id", projectId)
    .eq("name", unitName)
    .maybeSingle();

  if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

  const { error } = await admin
    .from("rooms")
    .update({ name: newName })
    .eq("unit_id", unit.id)
    .eq("name", oldName);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const unitName = searchParams.get("unitName");
  const roomName = searchParams.get("roomName");

  if (!projectId || !unitName || !roomName) {
    return NextResponse.json({ error: "projectId, unitName and roomName are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: unit } = await admin
    .from("units")
    .select("id")
    .eq("project_id", projectId)
    .eq("name", unitName)
    .maybeSingle();

  if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

  const { error } = await admin
    .from("rooms")
    .delete()
    .eq("unit_id", unit.id)
    .eq("name", roomName);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
