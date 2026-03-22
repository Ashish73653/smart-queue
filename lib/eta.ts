import { differenceInMinutes } from "date-fns";
import type { Booking } from "./types";

export function minutesUntilBooking(
  bookings: Booking[],
  targetBookingId: string,
): number {
  const now = new Date();
  let accumulator = 0;

  const sorted = [...bookings].sort(
    (a, b) => (a.queue_number ?? 0) - (b.queue_number ?? 0),
  );

  for (const booking of sorted) {
    if (["done", "cancelled", "no_show"].includes(booking.status)) {
      continue;
    }

    const effectiveDuration =
      (booking.total_duration ?? 0) + (booking.extra_delay_minutes ?? 0);

    if (booking.status === "in_progress") {
      const startedAt = booking.started_at ? new Date(booking.started_at) : null;
      const elapsed = startedAt ? differenceInMinutes(now, startedAt) : 0;
      const remaining = Math.max(effectiveDuration - elapsed, 0);
      if (booking.id === targetBookingId) {
        return accumulator + remaining;
      }
      accumulator += remaining;
      continue;
    }

    if (booking.id === targetBookingId) {
      return accumulator + effectiveDuration;
    }
    accumulator += effectiveDuration;
  }

  return accumulator;
}

export function averageWaitMinutes(bookings: Booking[]): number {
  const active = bookings.filter((b) =>
    ["waiting", "in_progress"].includes(b.status),
  );
  if (active.length === 0) return 0;

  const total = active.reduce(
    (acc, booking) =>
      acc + (booking.total_duration ?? 0) + (booking.extra_delay_minutes ?? 0),
    0,
  );

  return Math.round(total / active.length);
}
