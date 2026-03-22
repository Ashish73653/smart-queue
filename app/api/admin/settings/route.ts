import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getShopSettings, upsertShopSettings } from "@/lib/settings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  const settings = await getShopSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const settings = await upsertShopSettings(body);
    return NextResponse.json({ settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update settings";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
