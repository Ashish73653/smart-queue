import { NextResponse } from "next/server";
import {
  createBooking,
  etaForBooking,
  fetchQueue,
  trackBooking,
} from "@/lib/bookings";
import type { Booking } from "@/lib/types";

function peopleAhead(bookings: Booking[], queueNumber: number) {
  return bookings.filter(
    (b) =>
      b.queue_number < queueNumber &&
      ["waiting", "in_progress"].includes(b.status),
  ).length;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const booking = await createBooking(body);
    const queue = await fetchQueue(body.booking_date);
    const eta_minutes = etaForBooking(queue, booking.id);

    return NextResponse.json({
      booking,
      eta_minutes,
      queue_number: booking.queue_number,
      people_ahead: peopleAhead(queue, booking.queue_number),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create booking";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const booking_reference = searchParams.get("booking_reference");

  if (!phone || !booking_reference) {
    return NextResponse.json(
      { error: "phone and booking_reference are required" },
      { status: 400 },
    );
  }

  try {
    const booking = await trackBooking(phone, booking_reference);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    const queue = await fetchQueue(booking.booking_date);
    const eta_minutes = etaForBooking(queue, booking.id);

    return NextResponse.json({
      booking,
      eta_minutes,
      people_ahead: peopleAhead(queue, booking.queue_number),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch booking";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
