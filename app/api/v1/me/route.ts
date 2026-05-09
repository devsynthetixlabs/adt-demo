import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, full_name, dob, phone, role, firm_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: orgMember } = await admin
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    userId: user.id,
    email: user.email || "",
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    fullName: profile?.full_name || "",
    dob: profile?.dob ? profile.dob.split("T")[0] : "",
    phone: profile?.phone || "",
    role: profile?.role || user.user_metadata?.role || orgMember?.role || "contractor",
    firmName: profile?.firm_name || user.user_metadata?.firm_name || null,
    activeOrgId: orgMember?.organization_id || null,
    orgRole: orgMember?.role || null,
    orgCreated: !!orgMember?.organization_id,
  });
}
