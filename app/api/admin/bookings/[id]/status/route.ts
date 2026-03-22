import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { addDelayToBooking, updateBookingStatus } from "@/lib/bookings";
import type { BookingStatus } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.message }, { status: admin.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const status = body.status as BookingStatus | undefined;
  const delayMinutes = body.delayMinutes as number | undefined;
  const addDelay = body.addDelay as number | undefined;

  try {
    if (typeof addDelay === "number") {
      const booking = await addDelayToBooking(id, addDelay);
      return NextResponse.json({ booking });
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const booking = await updateBookingStatus(id, status, delayMinutes);
    return NextResponse.json({ booking });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update booking";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
