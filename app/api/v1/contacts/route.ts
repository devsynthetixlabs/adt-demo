import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

const profileSchema = z.object({
  color: z.string(),
  phone: z.string(),
  email: z.string(),
  role: z.string(),
  designation: z.string(),
  visibility: z.array(z.string()),
  loginStatus: z.enum(["invited", "active", "pending"]).optional(),
});

const replaceSchema = z.record(z.string(), profileSchema);

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId query param is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("project_contacts")
    .select("name, email, phone, role, designation, color, visibility, login_status")
    .eq("project_id", projectId);

  if (!rows) {
    return NextResponse.json({});
  }

  const profiles: Record<string, {
    color: string;
    phone: string;
    email: string;
    role: string;
    designation: string;
    visibility: string[];
    loginStatus?: string;
  }> = {};

  for (const row of rows) {
    // visibility is stored as a JSON string in the DB — parse it back to an array
    let visibility: string[] = [];
    try {
      visibility = typeof row.visibility === "string"
        ? JSON.parse(row.visibility)
        : Array.isArray(row.visibility) ? row.visibility : [];
    } catch {
      visibility = [];
    }

    profiles[row.name] = {
      color: row.color,
      phone: row.phone,
      email: row.email,
      role: row.role,
      designation: row.designation,
      visibility,
      loginStatus: row.login_status,
    };
  }

  return NextResponse.json(profiles);
}

export async function PUT(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId query param is required" }, { status: 400 });
  }

  const parsed = replaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { error: delError } = await admin
    .from("project_contacts")
    .delete()
    .eq("project_id", projectId);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  const entries = Object.entries(parsed.data);
  if (entries.length === 0) {
    return NextResponse.json({ success: true });
  }

  const rows = entries.map(([name, p]) => ({
    project_id: projectId,
    name,
    email: p.email,
    phone: p.phone,
    role: p.role,
    designation: p.designation,
    color: p.color,
    visibility: JSON.stringify(p.visibility),
    login_status: p.loginStatus || (p.email ? "invited" : "pending"),
  }));

  const { error: insError } = await admin.from("project_contacts").insert(rows);

  if (insError) {
    return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
