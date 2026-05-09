import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  client: z.string().min(1, "Client is required"),
  icon: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  organizationId: z.string().uuid("Invalid organization ID"),
});

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: orgMembers } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id);

  if (!orgMembers?.length) {
    return NextResponse.json([]);
  }

  const orgIds = orgMembers.map((m) => m.organization_id);

  const { data: projects } = await admin
    .from("projects")
    .select("id, name, icon, client, address, start_date, end_date")
    .in("organization_id", orgIds)
    .order("created_at", { ascending: true });

  return NextResponse.json(projects ?? []);
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
  const body = parsed.data;

  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", body.organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("projects")
    .insert({
      organization_id: body.organizationId,
      name: body.name,
      icon: body.icon || "🏛",
      client: body.client,
      address: body.address || null,
      start_date: body.startDate || null,
      end_date: body.endDate || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
