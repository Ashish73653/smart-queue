import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createBooking, fetchQueue } from "@/lib/bookings";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  const today = new Date().toISOString().slice(0, 10);
  const bookings = await fetchQueue(today);
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const payload = {
      ...body,
      booking_date: body.booking_date ?? new Date().toISOString().slice(0, 10),
      is_walk_in: true,
    };
    const booking = await createBooking(payload);
    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add walk-in";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
