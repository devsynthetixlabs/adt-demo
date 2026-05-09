import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { data: members } = await admin
    .from("organization_members")
    .select("user_id, role, status, created_at, invited_by")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (!members?.length) return NextResponse.json({ data: [] });

  const memberDetails = await Promise.all(
    members.map(async (m) => {
      const { data: { user: authUser } } = await admin.auth.admin.getUserById(m.user_id);

      // Fallback name from invitations if auth user is not fully set up yet
      const { data: invitation } = await admin
        .from("invitations")
        .select("name")
        .eq("organization_id", orgId)
        .eq("email", authUser?.email ?? "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        userId: m.user_id,
        name: authUser?.user_metadata?.full_name ?? invitation?.name ?? authUser?.email ?? "",
        email: authUser?.email ?? "",
        role: m.role,
        status: m.status,
        joinedAt: m.created_at,
      };
    })
  );

  return NextResponse.json({ data: memberDetails });
}
