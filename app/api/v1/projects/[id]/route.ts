import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const admin = createAdminClient();

  // Verify the user belongs to the org that owns this project
  const { data: project } = await admin
    .from("projects")
    .select("id, organization_id")
    .eq("id", id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", project.organization_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { error } = await admin.from("projects").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
