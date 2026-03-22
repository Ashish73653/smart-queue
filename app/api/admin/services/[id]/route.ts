import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateService } from "@/lib/services";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { id } = await context.params;
    const service = await updateService(id, body);
    return NextResponse.json({ service });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update service";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
