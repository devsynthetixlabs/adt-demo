import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

const createSchema = z.object({
  orgId: z.string().uuid(),
  email: z.string().email(),
  role: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().optional().default(""),
  phone: z.string().optional().default(""),
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

  const { orgId, email, role, firstName, lastName, phone } = parsed.data;
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const admin = createAdminClient();

  // Verify the requester belongs to this org
  const { data: membership } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Derive the callback URL from the incoming request so it works in every
  // environment (local, preview, production) without extra env vars.
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectTo = `${origin}/auth/callback?type=invite`;

  // Supabase sends the invite email automatically. The user_metadata we pass
  // here is stored on the auth.users record and read back in the callback to
  // provision the org membership without any additional user action.
  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        org_id: orgId,
        org_role: role,
        invited_by: user.id,
      },
      redirectTo,
    });

  if (inviteError) {
    // "User already registered" means they already have an account; Supabase
    // will send them a magic link instead, which is fine.
    if (!inviteError.message.toLowerCase().includes("already registered")) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
  }

  // Pre-populate the profile row so it's ready before the user ever logs in.
  // The DB trigger already created the row with full_name; we update the rest.
  if (inviteData?.user?.id) {
    try {
      await admin.from("profiles").upsert({
        id: inviteData.user.id,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        phone: phone || null,
        role,
      });
    } catch {
      // Non-fatal — invite email already sent
    }
  }

  // Generate a token + expiry for the invitations row so token-based accept
  // works and the auth callback can find pending invites by email.
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Create the tracking record; now required (not soft), since acceptance paths
  // depend on this row to resolve org_id for existing users.
  const { error: insertError } = await admin.from("invitations").insert({
    organization_id: orgId,
    email,
    role,
    name: fullName,
    token,
    expires_at: expiresAt,
    invited_user_id: inviteData?.user?.id ?? null,
    created_by: user.id,
  });

  if (insertError) {
    console.error("Failed to insert invitation record:", insertError);
    return NextResponse.json({ error: "Failed to create invitation tracking record" }, { status: 500 });
  }

  // For new auth users (inviteUserByEmail created them), pre-provision the org
  // membership immediately so the member shows up in the directory with
  // status "invited" before they've accepted.
  if (inviteData?.user?.id) {
    const { error: memberError } = await admin.from("organization_members").upsert(
      {
        organization_id: orgId,
        user_id: inviteData.user.id,
        role,
        invited_by: user.id,
        status: "invited",
      },
      { onConflict: "organization_id,user_id", ignoreDuplicates: true },
    );
    if (memberError) {
      console.error("Failed to pre-provision org member:", memberError);
    }
  }

  return NextResponse.json({ success: true, token }, { status: 201 });
}
