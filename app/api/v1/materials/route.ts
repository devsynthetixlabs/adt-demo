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
    .from("materials")
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
  const { project_id, name, category, unit, room, vendor, qty, order_date, eta, status, notes } = body;

  if (!project_id || !name) {
    return NextResponse.json({ error: "project_id and name are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("materials")
    .insert({
      project_id,
      name,
      category: category ?? null,
      unit: unit ?? null,
      room: room ?? null,
      vendor: vendor ?? null,
      qty: qty ?? null,
      order_date: order_date ?? null,
      eta: eta ?? null,
      status: status ?? "Pending Order",
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
