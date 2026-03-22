import { NextRequest, NextResponse } from "next/server";
import { fetchQueue, updateBookingServices } from "@/lib/bookings";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { etaForBooking } from "@/lib/bookings";
import type { Booking } from "@/lib/types";

async function findBookingByReference(reference: string) {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection("bookings")
    .where("booking_reference", "==", reference)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<Booking, "id">) } as Booking;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  const { reference } = await context.params;

  try {
    const body = await request.json();
    const db = getFirebaseAdminDb();
    const existing = await findBookingByReference(reference);
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existing.phone !== body.phone) {
      return NextResponse.json({ error: "Phone does not match" }, { status: 403 });
    }

    if (["done", "cancelled", "no_show"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Completed bookings cannot be edited" },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {
      preferred_time_range:
        body.preferred_time_range ?? existing.preferred_time_range,
      note: body.note ?? existing.note,
      updated_at: new Date().toISOString(),
    };

    let updatedBooking = existing;

    const incomingServices = Array.isArray(body.services)
      ? (body.services as { id: string; quantity?: number }[])
      : [];

    if (incomingServices.length) {
      updatedBooking = await updateBookingServices(
        existing.id,
        incomingServices.map((s) => ({
          id: s.id,
          quantity: s.quantity ?? 1,
        })),
      );
    }

    await db.collection("bookings").doc(String(updatedBooking.id)).set(updates, {
      merge: true,
    });
    const finalBookingSnapshot = await db
      .collection("bookings")
      .doc(String(updatedBooking.id))
      .get();
    const finalBooking = {
      id: finalBookingSnapshot.id,
      ...(finalBookingSnapshot.data() as Omit<Booking, "id">),
    } as Booking;

    const queue = await fetchQueue(finalBooking.booking_date);
    const eta_minutes = etaForBooking(queue, finalBooking.id);

    return NextResponse.json({
      booking: finalBooking,
      eta_minutes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update booking";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  const { reference } = await context.params;
  const body = await request.json().catch(() => ({}));
  const phone = body.phone as string | undefined;

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number is required to cancel" },
      { status: 400 },
    );
  }

  try {
    const db = getFirebaseAdminDb();
    const existing = await findBookingByReference(reference);
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existing.phone !== phone) {
      return NextResponse.json({ error: "Phone does not match" }, { status: 403 });
    }

    await db.collection("bookings").doc(String(existing.id)).set(
      {
        status: "cancelled",
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );

    const cancelledSnap = await db
      .collection("bookings")
      .doc(String(existing.id))
      .get();
    const cancelled = {
      id: cancelledSnap.id,
      ...(cancelledSnap.data() as Omit<Booking, "id">),
    } as Booking;

    return NextResponse.json({ booking: cancelled });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to cancel booking";
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
