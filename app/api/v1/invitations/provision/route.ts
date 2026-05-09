import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

async function updateProjectContactsStatus(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  email: string
) {
  const { data: projects } = await admin
    .from("projects")
    .select("id")
    .eq("organization_id", orgId);

  if (projects && projects.length > 0) {
    const projectIds = projects.map((p) => p.id);
    await admin
      .from("project_contacts")
      .update({ login_status: "active" })
      .in("project_id", projectIds)
      .eq("email", email);
  }
}

// Called client-side after setSession() when Supabase uses implicit flow for invites.
// Mirrors the invite provisioning logic in /auth/callback but runs as an API route
// so that it can use the admin client to bypass RLS.
export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  let orgId: string | undefined = user.user_metadata?.org_id;
  let orgRole: string | undefined = user.user_metadata?.org_role;
  let invitedBy: string | undefined = user.user_metadata?.invited_by;

  // Fallback for existing users whose metadata wasn't updated by inviteUserByEmail
  if (!orgId || !orgRole) {
    const { data: invitation } = await admin
      .from("invitations")
      .select("organization_id, role, created_by")
      .eq("email", user.email!)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invitation) {
      orgId = invitation.organization_id;
      orgRole = invitation.role;
      invitedBy = invitation.created_by ?? undefined;
    }
  }

  if (!orgId || !orgRole) {
    return NextResponse.json({ error: "No pending invitation found" }, { status: 404 });
  }

  await admin.from("organization_members").upsert(
    {
      organization_id: orgId,
      user_id: user.id,
      role: orgRole,
      status: "active",
      invited_by: invitedBy ?? null,
    },
    { onConflict: "organization_id,user_id" }
  );

  await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("email", user.email!)
    .eq("organization_id", orgId)
    .is("accepted_at", null);

  await updateProjectContactsStatus(admin, orgId, user.email!);

  return NextResponse.json({ success: true });
}
