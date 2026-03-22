import { nanoid } from "nanoid";
import { averageWaitMinutes, minutesUntilBooking } from "./eta";
import type { Booking, BookingStatus, Service } from "./types";
import { bookingSchema, trackSchema } from "./validation";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "./supabase/server";

function generateReference() {
  return nanoid(6).toUpperCase();
}

export async function fetchServices(activeOnly = true) {
  if (!isServiceRoleConfigured()) return [];
  const supabase = createServiceRoleClient();
  let query = supabase.from("services").select("*");
  if (activeOnly) {
    query = query.eq("is_active", true);
  }
  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw error;
  return data as Service[];
}

async function nextQueueNumber(booking_date: string) {
  const supabase = createServiceRoleClient();
  if (!isServiceRoleConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const { data } = await supabase
    .from("bookings")
    .select("queue_number")
    .eq("booking_date", booking_date)
    .order("queue_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.queue_number ?? 0) + 1;
}

export async function createBooking(rawBody: unknown) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const payload = bookingSchema.parse(rawBody);
  const supabase = createServiceRoleClient();

  const serviceIds = payload.services.map((s) => s.id);
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("*")
    .in("id", serviceIds)
    .eq("is_active", true);
  if (servicesError) throw servicesError;
  if (!services?.length) {
    throw new Error("Selected services are not available");
  }

  const totals = payload.services.reduce(
    (acc, selection) => {
      const service = services.find((s) => s.id === selection.id);
      if (!service) return acc;
      const qty = selection.quantity ?? 1;
      acc.totalDuration += service.duration_minutes * qty;
      acc.totalPrice += Number(service.price) * qty;
      return acc;
    },
    { totalDuration: 0, totalPrice: 0 },
  );

  const queue_number = await nextQueueNumber(payload.booking_date);
  const booking_reference = generateReference();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      booking_reference,
      customer_name: payload.customer_name,
      phone: payload.phone,
      booking_date: payload.booking_date,
      preferred_time_range: payload.preferred_time_range || null,
      note: payload.note || null,
      queue_number,
      status: "waiting",
      total_price: totals.totalPrice,
      total_duration: totals.totalDuration,
      extra_delay_minutes: 0,
      is_walk_in: Boolean(payload.is_walk_in),
    })
    .select("*")
    .single();

  if (bookingError) throw bookingError;

  const bookingServices = payload.services.map((s) => ({
    booking_id: booking.id,
    service_id: s.id,
    quantity: s.quantity ?? 1,
  }));

  const { error: bookingServicesError } = await supabase
    .from("booking_services")
    .insert(bookingServices);
  if (bookingServicesError) throw bookingServicesError;

  return booking as Booking;
}

export async function trackBooking(phone: string, booking_reference: string) {
  if (!isServiceRoleConfigured()) return null;
  const supabase = createServiceRoleClient();
  const parsed = trackSchema.parse({ phone, booking_reference });

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, booking_services (id, service_id, quantity, service:services(name, price, duration_minutes))",
    )
    .eq("phone", parsed.phone)
    .eq("booking_reference", parsed.booking_reference)
    .maybeSingle();

  if (error) throw error;
  return data as Booking | null;
}

export async function fetchQueue(date: string) {
  if (!isServiceRoleConfigured()) return [];
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, booking_services (id, service_id, quantity, service:services(name, price, duration_minutes))",
    )
    .eq("booking_date", date)
    .in("status", ["waiting", "in_progress"])
    .order("queue_number", { ascending: true });

  if (error) throw error;
  return data as Booking[];
}

export async function computeQueueSummary(date: string) {
  if (!isServiceRoleConfigured()) {
    return {
      inProgress: null,
      waiting: [],
      completedToday: 0,
      expectedEarnings: 0,
      completedEarnings: 0,
      averageWaitMinutes: 0,
      totalWaiting: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
  const supabase = createServiceRoleClient();
  const bookings = await fetchQueue(date);

  const inProgress = bookings.find((b) => b.status === "in_progress");
  const waiting = bookings.filter((b) => b.status === "waiting");

  const { data: completedToday, error: completedError } = await supabase
    .from("bookings")
    .select("total_price, status")
    .eq("booking_date", date);
  if (completedError) throw completedError;

  const earnings = completedToday?.filter((b) => b.status === "done") ?? [];
  const totalEarnings = earnings.reduce(
    (acc, item) => acc + Number(item.total_price ?? 0),
    0,
  );

  return {
    inProgress,
    waiting,
    completedToday: earnings.length,
    expectedEarnings: bookings.reduce(
      (acc, b) => acc + Number(b.total_price ?? 0),
      0,
    ),
    completedEarnings: totalEarnings,
    averageWaitMinutes: averageWaitMinutes(bookings),
    totalWaiting: waiting.length,
    lastUpdated: new Date().toISOString(),
  };
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  extraDelayMinutes?: number,
) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const supabase = createServiceRoleClient();
  const updates: Record<string, unknown> = { status };

  if (status === "in_progress") {
    updates.started_at = new Date().toISOString();
  }
  if (typeof extraDelayMinutes === "number") {
    updates.extra_delay_minutes = extraDelayMinutes;
  }

  const { error, data } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", bookingId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function addDelayToBooking(
  bookingId: string,
  delayMinutes: number,
) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("extra_delay_minutes")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw error;

  const currentDelay = data?.extra_delay_minutes ?? 0;
  return updateBookingStatus(
    bookingId,
    "in_progress",
    currentDelay + delayMinutes,
  );
}

export async function updateBookingServices(
  bookingId: string,
  services: { id: string; quantity: number }[],
) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const supabase = createServiceRoleClient();
  await supabase.from("booking_services").delete().eq("booking_id", bookingId);

  const { data: serviceRows } = await supabase
    .from("services")
    .select("*")
    .in("id", services.map((s) => s.id));
  if (!serviceRows?.length) {
    throw new Error("Services not found");
  }

  const totals = services.reduce(
    (acc, item) => {
      const service = serviceRows.find((s) => s.id === item.id);
      if (!service) return acc;
      acc.totalDuration += service.duration_minutes * (item.quantity ?? 1);
      acc.totalPrice += Number(service.price) * (item.quantity ?? 1);
      return acc;
    },
    { totalDuration: 0, totalPrice: 0 },
  );

  const { error } = await supabase.from("booking_services").insert(
    services.map((s) => ({
      booking_id: bookingId,
      service_id: s.id,
      quantity: s.quantity ?? 1,
    })),
  );
  if (error) throw error;

  const { data: updatedBooking, error: bookingError } = await supabase
    .from("bookings")
    .update({
      total_duration: totals.totalDuration,
      total_price: totals.totalPrice,
    })
    .eq("id", bookingId)
    .select("*")
    .single();

  if (bookingError) throw bookingError;
  return updatedBooking as Booking;
}

export function etaForBooking(bookings: Booking[], bookingId: string) {
  return minutesUntilBooking(bookings, bookingId);
}
