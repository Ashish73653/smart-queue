import { nanoid } from "nanoid";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { averageWaitMinutes, minutesUntilBooking } from "./eta";
import type { Booking, BookingStatus, Service } from "./types";
import { bookingSchema, trackSchema } from "./validation";
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "./firebase/admin";
import { DEFAULT_BARBER_SERVICES, getServiceMeta } from "./service-catalog";

const FIREBASE_ADMIN_ENV_HELP =
  "Firebase Admin is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_STORAGE_BUCKET to .env.local, then restart the server.";

function normalizeServiceDocument(
  id: string,
  raw: Record<string, unknown>,
): Service {
  const durationRaw = raw.duration_minutes ?? raw.duration;
  const activeRaw = raw.is_active ?? raw.active;

  return {
    id,
    name: String(raw.name ?? "Service"),
    price: Number(raw.price ?? 0),
    duration_minutes: Number(durationRaw ?? 0),
    is_active: typeof activeRaw === "boolean" ? activeRaw : true,
    category:
      raw.category === "hair" ||
      raw.category === "beard" ||
      raw.category === "grooming" ||
      raw.category === "combo"
        ? raw.category
        : getServiceMeta(String(raw.name ?? "")).group,
    created_at: typeof raw.created_at === "string" ? raw.created_at : undefined,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : undefined,
  };
}

function serviceSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function localSeedServices(): Service[] {
  return DEFAULT_BARBER_SERVICES.map((service, index) => ({
    id: `local_seed_${serviceSlug(service.name)}_${index}`,
    name: service.name,
    price: service.price,
    duration_minutes: service.duration_minutes,
    is_active: true,
    category: service.category,
  }));
}

function generateReference() {
  return nanoid(6).toUpperCase();
}

function normalizeBooking(raw: Partial<Booking>, id: string): Booking {
  const bookingServices = (raw.booking_services ?? []).map((item, index) => ({
    id: item.id ?? `${id}_${item.service_id ?? index}`,
    booking_id: item.booking_id ?? id,
    service_id: item.service_id ?? "",
    quantity: item.quantity ?? 1,
    service: item.service,
  }));

  return {
    id,
    booking_reference: raw.booking_reference ?? "",
    customer_name: raw.customer_name ?? "",
    phone: raw.phone ?? "",
    booking_date: raw.booking_date ?? new Date().toISOString().slice(0, 10),
    preferred_time_range: raw.preferred_time_range ?? null,
    note: raw.note ?? null,
    queue_number: raw.queue_number ?? 0,
    status: (raw.status ?? "waiting") as BookingStatus,
    total_price: Number(raw.total_price ?? 0),
    total_duration: Number(raw.total_duration ?? 0),
    extra_delay_minutes: Number(raw.extra_delay_minutes ?? 0),
    is_walk_in: Boolean(raw.is_walk_in),
    started_at: raw.started_at ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    booking_services: bookingServices,
  };
}

async function fetchServiceMap(serviceIds: string[]) {
  const db = getFirebaseAdminDb();
  const docs = await Promise.all(
    serviceIds.map(async (id) => {
      const snap = await db.collection("services").doc(id).get();
      if (!snap.exists) return null;
      return normalizeServiceDocument(
        snap.id,
        snap.data() as Record<string, unknown>,
      );
    }),
  );

  return docs.reduce((acc, service) => {
    if (service) acc.set(service.id, service);
    return acc;
  }, new Map<string, Service>());
}

async function seedDefaultServicesIfNeeded() {
  const db = getFirebaseAdminDb();
  const existing = await db.collection("services").limit(1).get();

  if (!existing.empty) {
    return;
  }

  const now = new Date().toISOString();
  const batch = db.batch();

  DEFAULT_BARBER_SERVICES.forEach((service) => {
    const slug = serviceSlug(service.name);
    const docRef = db.collection("services").doc(`seed_${slug}`);
    batch.set(docRef, {
      id: docRef.id,
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes,
      is_active: true,
      category: service.category,
      created_at: now,
      updated_at: now,
    } satisfies Service);
  });

  await batch.commit();
}

export async function fetchServices(activeOnly = true) {
  if (!isFirebaseAdminConfigured()) return localSeedServices();

  const db = getFirebaseAdminDb();
  await seedDefaultServicesIfNeeded();
  const snapshot = await db.collection("services").get();

  const normalized = snapshot.docs.map((doc: QueryDocumentSnapshot) =>
    normalizeServiceDocument(doc.id, doc.data() as Record<string, unknown>),
  );

  return normalized
    .filter((service) => (activeOnly ? service.is_active : true))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function nextQueueNumber(bookingDate: string) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(FIREBASE_ADMIN_ENV_HELP);
  }

  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection("bookings")
    .where("booking_date", "==", bookingDate)
    .get();

  const maxQueue = snapshot.docs.reduce((max, doc) => {
    const value = Number((doc.data() as Partial<Booking>).queue_number ?? 0);
    return Math.max(max, Number.isFinite(value) ? value : 0);
  }, 0);
  return Number(maxQueue) + 1;
}

export async function createBooking(rawBody: unknown) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(FIREBASE_ADMIN_ENV_HELP);
  }

  const payload = bookingSchema.parse(rawBody);
  const db = getFirebaseAdminDb();

  const sameDaySnapshot = await db
    .collection("bookings")
    .where("booking_date", "==", payload.booking_date)
    .get();

  const activeBookingsForPhone = sameDaySnapshot.docs
    .map((doc: QueryDocumentSnapshot) => doc.data() as Booking)
    .filter(
      (booking) =>
        booking.phone === payload.phone &&
        ["waiting", "in_progress"].includes(booking.status),
    );

  if (activeBookingsForPhone.length >= 2) {
    throw new Error(
      "You already have active bookings for this date. Track or edit your existing booking.",
    );
  }

  const serviceIds = payload.services.map((service) => service.id);
  const serviceMap = await fetchServiceMap(serviceIds);
  const activeServices = Array.from(serviceMap.values()).filter((service) => service.is_active);

  if (!activeServices.length) {
    throw new Error("Selected services are not available");
  }

  const totals = payload.services.reduce(
    (acc, selection) => {
      const service = serviceMap.get(selection.id);
      if (!service) return acc;
      const qty = selection.quantity ?? 1;
      acc.totalDuration += service.duration_minutes * qty;
      acc.totalPrice += Number(service.price) * qty;
      return acc;
    },
    { totalDuration: 0, totalPrice: 0 },
  );

  const queueNumber = await nextQueueNumber(payload.booking_date);
  const bookingReference = generateReference();
  const bookingRef = db.collection("bookings").doc();

  const bookingServices = payload.services
    .map((selection) => {
      const service = serviceMap.get(selection.id);
      if (!service) return null;

      return {
        id: `${bookingRef.id}_${selection.id}`,
        booking_id: bookingRef.id,
        service_id: selection.id,
        quantity: selection.quantity ?? 1,
        service: {
          name: service.name,
          price: Number(service.price),
          duration_minutes: Number(service.duration_minutes),
        },
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const booking: Booking = {
    id: bookingRef.id,
    booking_reference: bookingReference,
    customer_name: payload.customer_name,
    phone: payload.phone,
    booking_date: payload.booking_date,
    preferred_time_range: payload.preferred_time_range || null,
    note: payload.note || null,
    queue_number: queueNumber,
    status: "waiting",
    total_price: totals.totalPrice,
    total_duration: totals.totalDuration,
    extra_delay_minutes: 0,
    is_walk_in: Boolean(payload.is_walk_in),
    started_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    booking_services: bookingServices,
  };

  await bookingRef.set(booking);
  return booking;
}

export async function trackBooking(phone: string, bookingReference: string) {
  if (!isFirebaseAdminConfigured()) return null;

  const db = getFirebaseAdminDb();
  const parsed = trackSchema.parse({ phone, booking_reference: bookingReference });

  const snapshot = await db
    .collection("bookings")
    .where("phone", "==", parsed.phone)
    .where("booking_reference", "==", parsed.booking_reference)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return normalizeBooking(doc.data() as Booking, doc.id);
}

export async function fetchQueue(date: string) {
  if (!isFirebaseAdminConfigured()) return [];

  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection("bookings")
    .where("booking_date", "==", date)
    .get();

  return snapshot.docs
    .map((doc: QueryDocumentSnapshot) => normalizeBooking(doc.data() as Booking, doc.id))
    .filter((booking) => ["waiting", "in_progress"].includes(booking.status))
    .sort((a, b) => a.queue_number - b.queue_number);
}

export async function computeQueueSummary(date: string) {
  if (!isFirebaseAdminConfigured()) {
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

  const db = getFirebaseAdminDb();
  const bookings = await fetchQueue(date);

  const inProgress = bookings.find((booking: Booking) => booking.status === "in_progress");
  const waiting = bookings.filter((booking: Booking) => booking.status === "waiting");

  const allTodaySnapshot = await db
    .collection("bookings")
    .where("booking_date", "==", date)
    .get();

  const completedToday = allTodaySnapshot.docs.map(
    (doc: QueryDocumentSnapshot) => doc.data() as Booking,
  );

  const earnings = completedToday.filter((booking: Booking) => booking.status === "done");
  const totalEarnings = earnings.reduce(
    (accumulator: number, item: Booking) =>
      accumulator + Number(item.total_price ?? 0),
    0,
  );

  return {
    inProgress,
    waiting,
    completedToday: earnings.length,
    expectedEarnings: bookings.reduce(
      (accumulator: number, booking: Booking) =>
        accumulator + Number(booking.total_price ?? 0),
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
  if (!isFirebaseAdminConfigured()) {
    throw new Error(FIREBASE_ADMIN_ENV_HELP);
  }

  const db = getFirebaseAdminDb();
  const bookingRef = db.collection("bookings").doc(bookingId);
  const existing = await bookingRef.get();
  if (!existing.exists) {
    throw new Error("Booking not found");
  }

  const updates: Record<string, unknown> = { status };

  if (status === "in_progress") {
    updates.started_at = new Date().toISOString();
  }
  if (typeof extraDelayMinutes === "number") {
    updates.extra_delay_minutes = extraDelayMinutes;
  }
  updates.updated_at = new Date().toISOString();

  await bookingRef.set(updates, { merge: true });
  const updated = await bookingRef.get();
  return normalizeBooking(updated.data() as Booking, bookingId);
}

export async function addDelayToBooking(bookingId: string, delayMinutes: number) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase is not configured");
  }

  const db = getFirebaseAdminDb();
  const snapshot = await db.collection("bookings").doc(bookingId).get();
  if (!snapshot.exists) throw new Error("Booking not found");

  const currentDelay = Number(snapshot.data()?.extra_delay_minutes ?? 0);
  return updateBookingStatus(bookingId, "in_progress", currentDelay + delayMinutes);
}

export async function updateBookingServices(
  bookingId: string,
  services: { id: string; quantity: number }[],
) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase is not configured");
  }

  const db = getFirebaseAdminDb();
  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingSnap = await bookingRef.get();
  if (!bookingSnap.exists) {
    throw new Error("Booking not found");
  }

  const serviceMap = await fetchServiceMap(services.map((service) => service.id));
  const serviceRows = Array.from(serviceMap.values());
  if (!serviceRows.length) {
    throw new Error("Services not found");
  }

  const totals = services.reduce(
    (accumulator, item) => {
      const service = serviceRows.find((row) => row.id === item.id);
      if (!service) return accumulator;
      accumulator.totalDuration += service.duration_minutes * (item.quantity ?? 1);
      accumulator.totalPrice += Number(service.price) * (item.quantity ?? 1);
      return accumulator;
    },
    { totalDuration: 0, totalPrice: 0 },
  );

  const bookingServices = services.map((serviceItem) => {
    const service = serviceMap.get(serviceItem.id);
    return {
      id: `${bookingId}_${serviceItem.id}`,
      booking_id: bookingId,
      service_id: serviceItem.id,
      quantity: serviceItem.quantity ?? 1,
      service: service
        ? {
            name: service.name,
            price: Number(service.price),
            duration_minutes: Number(service.duration_minutes),
          }
        : undefined,
    };
  });

  await bookingRef.set(
    {
      total_duration: totals.totalDuration,
      total_price: totals.totalPrice,
      booking_services: bookingServices,
      updated_at: new Date().toISOString(),
    },
    { merge: true },
  );

  const updatedBooking = await bookingRef.get();
  return normalizeBooking(updatedBooking.data() as Booking, bookingId);
}

export function etaForBooking(bookings: Booking[], bookingId: string) {
  return minutesUntilBooking(bookings, bookingId);
}
