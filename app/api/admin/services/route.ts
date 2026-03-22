import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { fetchServices } from "@/lib/bookings";
import { createService } from "@/lib/services";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  const services = await fetchServices(false);
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const service = await createService(body);
    return NextResponse.json({ service });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create service";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
