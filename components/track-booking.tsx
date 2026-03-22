"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDuration } from "@/lib/format";
import type { Service } from "@/lib/types";

type Props = {
  services: Service[];
};

type BookingLookup = {
  booking_reference: string;
  phone: string;
};

type BookingWithServices = {
  id: string;
  booking_reference: string;
  customer_name: string;
  phone: string;
  queue_number: number;
  status: string;
  total_price: number;
  total_duration: number;
  booking_date: string;
  note?: string | null;
  preferred_time_range?: string | null;
  booking_services?: {
    service_id: string;
    quantity: number;
    service?: {
      name: string;
      price: number;
      duration_minutes: number;
    };
  }[];
};

type BookingResult = {
  booking: BookingWithServices;
  eta_minutes: number;
  people_ahead: number;
};

type BookingApiResponse = {
  booking?: BookingWithServices;
  eta_minutes?: number;
  people_ahead?: number;
  error?: string;
};

const statusCopy: Record<string, string> = {
  waiting: "Waiting",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function TrackBooking({ services }: Props) {
  const lastBookingKey = "smart_queue_last_booking";

  const [lookup, setLookup] = useState<BookingLookup>({
    booking_reference: "",
    phone: "",
  });
  const [data, setData] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [copiedReference, setCopiedReference] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [hasNearTurnAlerted, setHasNearTurnAlerted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    setNotificationPermission(window.Notification.permission);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramReference =
      params.get("reference") ?? params.get("booking_reference") ?? "";
    const paramPhone = params.get("phone") ?? "";

    if (paramReference || paramPhone) {
      setLookup({
        booking_reference: paramReference,
        phone: paramPhone,
      });
      return;
    }

    const saved = window.localStorage.getItem(lastBookingKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as BookingLookup;
      if (parsed.booking_reference && parsed.phone) {
        setLookup(parsed);
      }
    } catch {
      window.localStorage.removeItem(lastBookingKey);
    }
  }, []);

  useEffect(() => {
    if (!data) {
      setHasNearTurnAlerted(false);
      return;
    }

    if (data.eta_minutes > 1) {
      setHasNearTurnAlerted(false);
    }
  }, [data]);

  const totals = useMemo(() => {
    return selectedServices.reduce(
      (acc, id) => {
        const service = services.find((s) => s.id === id);
        if (!service) return acc;
        acc.price += Number(service.price ?? 0);
        acc.duration += service.duration_minutes ?? 0;
        return acc;
      },
      { price: 0, duration: 0 },
    );
  }, [selectedServices, services]);

  const loadBooking = useCallback(
    async (options?: { silent?: boolean; keepEditing?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      if (!options?.keepEditing) {
        setEditing(false);
      }

      try {
        const params = new URLSearchParams({
          booking_reference: lookup.booking_reference,
          phone: lookup.phone,
        }).toString();
        const res = await fetch(`/api/bookings?${params}`);
        const json: BookingApiResponse = await res.json();
        if (!res.ok || !json.booking) {
          throw new Error(json.error || "Could not find booking");
        }
        setData({
          booking: json.booking,
          eta_minutes: json.eta_minutes ?? 0,
          people_ahead: json.people_ahead ?? 0,
        });
        setSelectedServices(
          json.booking.booking_services?.map((s) => s.service_id) ?? [],
        );
        setNote(json.booking.note ?? "");
        setPreferredTime(json.booking.preferred_time_range ?? "");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        if (!silent) {
          setError(message);
        }
        setData(null);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [lookup.booking_reference, lookup.phone],
  );

  async function fetchBooking() {
    await loadBooking();
  }

  async function requestNotificationAccess() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
  }

  useEffect(() => {
    if (!lookup.booking_reference || !lookup.phone) return;
    if (!data?.booking) return;
    if (!["waiting", "in_progress"].includes(data.booking.status)) return;

    const timer = window.setInterval(() => {
      void loadBooking({ silent: true, keepEditing: true });
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [data?.booking, loadBooking, lookup.booking_reference, lookup.phone]);

  useEffect(() => {
    if (!data?.booking) return;
    if (notificationPermission !== "granted") return;
    if (hasNearTurnAlerted) return;
    if (!["waiting", "in_progress"].includes(data.booking.status)) return;
    if (data.eta_minutes > 1) return;

    new Notification("TrimQ update", {
      body: `Your turn is close. Ref ${data.booking.booking_reference} is about to start.`,
    });
    setHasNearTurnAlerted(true);
  }, [data, hasNearTurnAlerted, notificationPermission]);

  async function submitEdit() {
    if (!data?.booking) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        phone: lookup.phone,
        services: selectedServices.map((id) => ({ id, quantity: 1 })),
        note,
        preferred_time_range: preferredTime,
      };
      const res = await fetch(`/api/bookings/${data.booking.booking_reference}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: BookingApiResponse = await res.json();
      if (!res.ok || !json.booking) {
        throw new Error(json.error || "Unable to update booking");
      }
      setData((prev) => {
        if (!prev) {
          return {
            booking: json.booking as BookingWithServices,
            eta_minutes: json.eta_minutes ?? 0,
            people_ahead: json.people_ahead ?? 0,
          };
        }
        return {
          booking: { ...prev.booking, ...json.booking },
          eta_minutes: json.eta_minutes ?? prev.eta_minutes,
          people_ahead: json.people_ahead ?? prev.people_ahead,
        };
      });
      setEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update booking";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking() {
    if (!data?.booking) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${data.booking.booking_reference}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: lookup.phone }),
      });
      const json: BookingApiResponse = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to cancel booking");
      setData((prev) =>
        prev
          ? { ...prev, booking: { ...prev.booking, status: "cancelled" } }
          : null,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to cancel booking";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function copyReference(reference: string) {
    try {
      await navigator.clipboard.writeText(reference);
      setCopiedReference(true);
      window.setTimeout(() => setCopiedReference(false), 1800);
    } catch {
      setCopiedReference(false);
    }
  }

  const booking = data?.booking;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4 rounded-3xl p-5 sm:p-6 glass-panel">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Track booking
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Check status or edit
            </h2>
          </div>
          {booking ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {statusCopy[booking.status] ?? booking.status}
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Phone
            <input
              required
              value={lookup.phone}
              onChange={(e) =>
                setLookup((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
              placeholder="9876543210"
            />
          </label>
          <div className="space-y-1">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Booking reference
              <input
                required
                value={lookup.booking_reference}
                onChange={(e) =>
                  setLookup((prev) => ({
                    ...prev,
                    booking_reference: e.target.value,
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
                placeholder="ABC123"
              />
            </label>
            <p className="text-xs text-slate-500">
              Example: reference is shown right after booking confirmation.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={fetchBooking}
            disabled={isLoading}
          >
            {isLoading ? "Checking..." : "Check booking"}
          </button>
          {booking && booking.status === "waiting" ? (
            <button
              type="button"
              onClick={() => setEditing((val) => !val)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5"
            >
              {isEditing ? "Close edit" : "Edit"}
            </button>
          ) : null}
          {booking && booking.status === "waiting" ? (
            <button
              type="button"
              onClick={cancelBooking}
              className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">Turn alerts</p>
          <p className="mt-1 text-slate-600">
            Free alert mode sends a browser notification when your ETA reaches about 1 minute.
          </p>
          {notificationPermission === "granted" ? (
            <p className="mt-2 font-medium text-emerald-700">Browser alerts enabled.</p>
          ) : notificationPermission === "unsupported" ? (
            <p className="mt-2 font-medium text-amber-700">
              Browser notifications are not supported on this device.
            </p>
          ) : (
            <button
              type="button"
              onClick={requestNotificationAccess}
              className="mt-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Enable browser alerts
            </button>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {booking ? (
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Queue #{booking.queue_number}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span>Reference {booking.booking_reference}</span>
                  <button
                    type="button"
                    onClick={() => copyReference(booking.booking_reference)}
                    className="rounded-full bg-white px-2 py-1 font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                  >
                    {copiedReference ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold text-white">
                ETA ~ {data?.eta_minutes ?? 0} minutes · Ahead:{" "}
                {data?.people_ahead ?? 0}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <p className="text-sm text-slate-700">
                Customer:{" "}
                <span className="font-semibold">{booking.customer_name}</span>
              </p>
              <p className="text-sm text-slate-700">
                Date:{" "}
                <span className="font-semibold">{booking.booking_date}</span>
              </p>
              <p className="text-sm text-slate-700">
                Total:{" "}
                <span className="font-semibold">
                  {formatCurrency(Number(booking.total_price ?? 0))}
                </span>
              </p>
              <p className="text-sm text-slate-700">
                Duration:{" "}
                <span className="font-semibold">
                  {formatDuration(booking.total_duration ?? 0)}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Services
              </p>
              <div className="flex flex-wrap gap-2">
                {booking.booking_services?.map((item) => (
                  <span
                    key={item.service_id}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-800 ring-1 ring-slate-200"
                  >
                    {item.service?.name ?? "Service"} ·{" "}
                    {formatDuration(item.service?.duration_minutes ?? 0)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">No booking loaded yet</p>
            <p className="mt-1">
              Enter your phone and booking reference to view status, ETA, and edit options.
            </p>
          </div>
        )}

        {isEditing && booking ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                Edit booking
              </p>
              <p className="text-xs text-slate-500">
                Update services or notes
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const checked = selectedServices.includes(service.id);
                return (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() =>
                      setSelectedServices((prev) =>
                        prev.includes(service.id)
                          ? prev.filter((s) => s !== service.id)
                          : [...prev, service.id],
                      )
                    }
                    className={`flex w-full flex-col items-start rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {service.name}
                      </p>
                      <span className="text-sm font-medium text-slate-800">
                        {formatCurrency(Number(service.price))}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {formatDuration(service.duration_minutes)}
                    </p>
                  </button>
                );
              })}
            </div>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Preferred time
              <input
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
                placeholder="e.g. 5-6 PM"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Note
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
              />
            </label>
            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 px-3 py-2 text-sm text-slate-700">
              <span>New total</span>
              <span className="font-semibold">
                {formatCurrency(totals.price)} · {formatDuration(totals.duration)}
              </span>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={submitEdit}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? "Saving..." : "Save changes"}
            </button>
          </div>
        ) : null}
      </div>
      <aside className="space-y-3 rounded-3xl p-5 sm:p-6 glass-panel">
        <h3 className="text-lg font-bold text-slate-900">Tracking helps you plan better</h3>
        <div className="space-y-2 text-sm text-slate-700">
          <p className="rounded-xl border border-slate-100 bg-white/70 px-3 py-2">
            See live ETA and people ahead before you leave home.
          </p>
          <p className="rounded-xl border border-slate-100 bg-white/70 px-3 py-2">
            Update services if your turn has not started yet.
          </p>
          <p className="rounded-xl border border-slate-100 bg-white/70 px-3 py-2">
            Cancel quickly so queue stays accurate for everyone.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
          Keep your booking reference handy. It appears after booking and can be shared by the barber if needed.
        </div>
        {(lookup.booking_reference || lookup.phone) && !booking ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            Prefilled from your latest booking. Tap Check booking to load live
            status.
          </div>
        ) : null}
      </aside>
    </div>
  );
}
