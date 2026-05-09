import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("approvals")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { project_id, description, type, unit, submitted_by, submitted_at, responded_at, status, remarks } = body;

  if (!project_id || !description) {
    return NextResponse.json({ error: "project_id and description are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("approvals")
    .insert({
      project_id,
      description,
      type: type ?? null,
      unit: unit ?? null,
      submitted_by: submitted_by ?? null,
      submitted_at: submitted_at ?? null,
      responded_at: responded_at ?? null,
      status: status ?? "Pending",
      remarks: remarks ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
