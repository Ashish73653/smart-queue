"use client";

import { useState } from "react";
import { formatCurrency, formatDuration } from "@/lib/format";
import type { Booking, Service } from "@/lib/types";

type Props = {
  initialBookings: Booking[];
  services: Service[];
  today: string;
};

export function AdminQueue({ initialBookings, services, today }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [error, setError] = useState<string | null>(null);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInService, setWalkInService] = useState(
    services.length ? services[0].id : "",
  );
  const [loading, setLoading] = useState(false);

  async function mutateBooking(
    id: string,
    body: Record<string, unknown>,
    actionDescription: string,
  ) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Unable to ${actionDescription}`);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...json.booking } : b)),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Unable to ${actionDescription}`;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function addWalkIn() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        customer_name: walkInName || "Walk-in",
        phone: walkInPhone || "N/A",
        booking_date: today,
        services: [{ id: walkInService, quantity: 1 }],
        is_walk_in: true,
      };
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to add walk-in");
      setBookings((prev) => [...prev, json.booking]);
      setWalkInName("");
      setWalkInPhone("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to add walk-in";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white/90 p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:p-5">
        <p className="text-sm font-semibold text-slate-900">Add walk-in</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <input
            value={walkInName}
            onChange={(e) => setWalkInName(e.target.value)}
            placeholder="Name"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
          <input
            value={walkInPhone}
            onChange={(e) => setWalkInPhone(e.target.value)}
            placeholder="Phone"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          />
          <select
            value={walkInService}
            onChange={(e) => setWalkInService(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({formatCurrency(Number(service.price))})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading}
            onClick={addWalkIn}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Add walk-in
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-2 rounded-3xl bg-white/90 p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">Queue</p>
          <p className="text-xs text-slate-500 sm:text-right">
            Tap a card to control status, delays, or cancellations.
          </p>
        </div>
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    #{booking.queue_number} · {booking.customer_name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {booking.booking_services
                      ?.map((s) => s.service?.name ?? "Service")
                      .join(", ")}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-700">
                  <p>{booking.status.replace("_", " ")}</p>
                  <p>{formatDuration(booking.total_duration ?? 0)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {booking.status !== "in_progress" && booking.status !== "done" ? (
                  <ActionButton
                    label="Start"
                    onClick={() => mutateBooking(booking.id, { status: "in_progress" }, "start booking")}
                  />
                ) : null}
                {booking.status === "in_progress" ? (
                  <>
                    <ActionButton
                      label="Done"
                      onClick={() => mutateBooking(booking.id, { status: "done" }, "mark done")}
                    />
                    <ActionButton
                      label="+5 min"
                      onClick={() => mutateBooking(booking.id, { addDelay: 5 }, "add delay")}
                    />
                    <ActionButton
                      label="+10 min"
                      onClick={() => mutateBooking(booking.id, { addDelay: 10 }, "add delay")}
                    />
                  </>
                ) : null}
                {booking.status === "waiting" ? (
                  <>
                    <ActionButton
                      label="Cancel"
                      variant="danger"
                      onClick={() => mutateBooking(booking.id, { status: "cancelled" }, "cancel")}
                    />
                    <ActionButton
                      label="No-show"
                      variant="danger"
                      onClick={() => mutateBooking(booking.id, { status: "no_show" }, "mark no-show")}
                    />
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-600">No bookings yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger";
}) {
  const styles =
    variant === "danger"
      ? "border-rose-200 text-rose-700 hover:bg-rose-50"
      : "border-slate-200 text-slate-800 hover:bg-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${styles}`}
    >
      {label}
    </button>
  );
}
