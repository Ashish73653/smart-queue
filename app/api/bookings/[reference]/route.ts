import { NextRequest, NextResponse } from "next/server";
import { fetchQueue, updateBookingServices } from "@/lib/bookings";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { etaForBooking } from "@/lib/bookings";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  const { reference } = await context.params;

  try {
    const body = await request.json();
    const supabase = createServiceRoleClient();
    const { data: existing, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_reference", reference)
      .maybeSingle();

    if (error) throw error;
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
      preferred_time_range: body.preferred_time_range ?? existing.preferred_time_range,
      note: body.note ?? existing.note,
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

    const { data: finalBooking, error: updateError } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", updatedBooking.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

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
    const supabase = createServiceRoleClient();
    const { data: existing, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_reference", reference)
      .maybeSingle();
    if (error) throw error;
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existing.phone !== phone) {
      return NextResponse.json({ error: "Phone does not match" }, { status: 403 });
    }

    const { data: cancelled, error: cancelError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (cancelError) throw cancelError;

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
