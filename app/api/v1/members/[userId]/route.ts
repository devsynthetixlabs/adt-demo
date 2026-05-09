import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

const patchSchema = z.object({
  orgId: z.string().uuid(),
  role: z.string().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const { orgId, role } = parsed.data;
  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { error } = await admin
    .from("organization_members")
    .update({ role })
    .eq("organization_id", orgId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const orgId = new URL(request.url).searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const { error } = await admin
    .from("organization_members")
    .delete()
    .eq("organization_id", orgId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
