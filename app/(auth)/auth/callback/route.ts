import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/admin";

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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type"); // "invite" when coming from inviteUserByEmail

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth?error=No code provided", request.url)
    );
  }

  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) { cookiesToSet.push(...toSet); },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth?error=No user found", request.url));
  }

  // ─── INVITE FLOW ────────────────────────────────────────────────────────────
  // When an admin called inviteUserByEmail, Supabase stored org_id / org_role
  // in user_metadata. We read those here to auto-provision the membership so
  // the invited user lands straight on the dashboard, no extra steps needed.
  if (type === "invite") {
    const admin = createAdminClient();
    let orgId: string | undefined = user.user_metadata?.org_id;
    let orgRole: string | undefined = user.user_metadata?.org_role;
    let invitedBy: string | undefined = user.user_metadata?.invited_by;
    // inviteUserByEmail sets org_id in metadata only for new users; existing
    // users receive a magic link and their metadata is unchanged.
    const isNewInviteUser = !!orgId;

    // Fallback for existing Supabase users: their metadata won't have been
    // updated by inviteUserByEmail, so look up the pending invitation by email.
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

    if (orgId && orgRole) {
      // Create the org membership — update status to active if row exists
      // (pre-provisioned at invite time for new users), or insert fresh.
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

      // Mark the invitation as accepted
      await admin
        .from("invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("email", user.email!)
        .eq("organization_id", orgId)
        .is("accepted_at", null);

      // Sync project_contacts.login_status → "active" so the contact-level
      // status matches the org membership status immediately.
      await updateProjectContactsStatus(admin, orgId, user.email!);

      // New users (created by inviteUserByEmail) have no password yet — send
      // them to the auth page to set one before landing on the dashboard.
      // Existing users (magic-link fallback) already have an account, so go
      // straight to the dashboard.
      const redirectPath = isNewInviteUser
        ? `/auth?type=invite&email=${encodeURIComponent(user.email!)}`
        : "/dashboard";

      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      );
      return response;
    }

    // If we still couldn't resolve the org, fall through to the normal
    // role-select flow so the user isn't left stranded.
  }
  // ─── END INVITE FLOW ────────────────────────────────────────────────────────

  // ─── PENDING INVITATION CHECK ──────────────────────────────────────────────
  // If the invite-specific flow above didn't run because the type=invite query
  // parameter was dropped during Supabase's PKCE redirect, or if it ran but
  // couldn't resolve the org from user_metadata, check for any pending
  // invitation for this email so the org membership is still created.
  {
    const admin = createAdminClient();
    const { data: pendingInvitation } = await admin
      .from("invitations")
      .select("organization_id, role, created_by")
      .eq("email", user.email!)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingInvitation) {
      await admin.from("organization_members").upsert(
        {
          organization_id: pendingInvitation.organization_id,
          user_id: user.id,
          role: pendingInvitation.role,
          status: "active",
          invited_by: pendingInvitation.created_by ?? null,
        },
        { onConflict: "organization_id,user_id" }
      );

      await admin
        .from("invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("email", user.email!)
        .eq("organization_id", pendingInvitation.organization_id)
        .is("accepted_at", null);

      await updateProjectContactsStatus(admin, pendingInvitation.organization_id, user.email!);
    }
  }
  // ─── END PENDING INVITATION CHECK ──────────────────────────────────────────

  // ─── RESET PASSWORD FLOW ────────────────────────────────────────────────────
  // resetPasswordForEmail sets redirectTo to this callback with type=reset.
  // After exchangeCodeForSession establishes the recovery session, send the
  // user to the auth page to set their new password.
  if (type === "reset") {
    const response = NextResponse.redirect(new URL("/auth?type=reset", request.url));
    cookiesToSet.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    return response;
  }
  // ─── END RESET PASSWORD FLOW ────────────────────────────────────────────────

  // Normal sign-in / OAuth flow
  let userRole = user.user_metadata?.role;

  if (!userRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    userRole = profile?.role;
  }

  const redirectPath = !userRole
    ? "/auth/role-select"
    : requestUrl.searchParams.get("redirect") || "/dashboard";

  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}
