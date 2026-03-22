import { NextResponse } from "next/server";
import {
  createBooking,
  etaForBooking,
  fetchQueue,
  trackBooking,
} from "@/lib/bookings";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Booking } from "@/lib/types";

const BOOKING_WINDOW_MS = 15 * 60 * 1000;
const BOOKING_MAX_PER_WINDOW = 6;
const MIN_FORM_FILL_MS = 3_000;

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function peopleAhead(bookings: Booking[], queueNumber: number) {
  return bookings.filter(
    (b) =>
      b.queue_number < queueNumber &&
      ["waiting", "in_progress"].includes(b.status),
  ).length;
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const limit = checkRateLimit(
      `bookings:${clientIp}`,
      BOOKING_MAX_PER_WINDOW,
      BOOKING_WINDOW_MS,
    );

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many booking attempts. Please try again in a few minutes." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as {
      website?: string;
      form_started_at?: number;
      booking_date?: string;
    };

    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return NextResponse.json(
        { error: "Unable to create booking. Please try again." },
        { status: 400 },
      );
    }

    const formStartedAt = Number(body.form_started_at ?? 0);
    if (!Number.isFinite(formStartedAt) || Date.now() - formStartedAt < MIN_FORM_FILL_MS) {
      return NextResponse.json(
        { error: "Please review your details and submit again." },
        { status: 400 },
      );
    }

    const booking = await createBooking(body);
    const queue = await fetchQueue(booking.booking_date);
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
