import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getApiUser } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const updateFields: Record<string, unknown> = {};
  const allowedFields = [
    "name", "category", "unit", "room", "vendor", "qty",
    "order_date", "eta", "status", "notes",
    "received_by", "received_date", "images",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  updateFields.updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from("materials")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

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
  const { error } = await admin
    .from("materials")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
