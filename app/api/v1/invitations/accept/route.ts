import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const acceptSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = acceptSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { token } = parsed.data;
  const admin = createAdminClient();

  const { data: invitation, error: fetchError } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (fetchError || !invitation) {
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
  }

  const { error: memberError } = await admin
    .from("organization_members")
    .upsert(
      {
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
        status: "active",
        invited_by: invitation.created_by,
      },
      { onConflict: "organization_id,user_id" }
    );

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  await updateProjectContactsStatus(admin, invitation.organization_id, user.email!);

  return NextResponse.json({ success: true });
}
