"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatDuration } from "@/lib/format";
import type { Service } from "@/lib/types";

type Props = {
  services: Service[];
  defaultDate: string;
  initialQueue?: {
    waiting: number;
    averageWait: number;
  };
};

type BookingResult = {
  booking: {
    booking_reference: string;
    queue_number: number;
  };
  eta_minutes: number;
  people_ahead: number;
};

export function BookingForm({ services, defaultDate, initialQueue }: Props) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingDate, setBookingDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [preferredTimeRange, setPreferredTimeRange] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

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

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        customer_name: customerName,
        phone,
        booking_date: bookingDate,
        note,
        preferred_time_range: preferredTimeRange,
        services: selectedServices.map((id) => ({ id, quantity: 1 })),
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create booking");
      }
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form
        className="lg:col-span-2 space-y-4 rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Book appointment
          </p>
          <h2 className="text-2xl font-semibold text-slate-900">
            Join today&apos;s queue
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Name
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
              placeholder="Your name"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Phone
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
              placeholder="9876543210"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Date
            <input
              type="date"
              required
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Preferred time (optional)
            <input
              value={preferredTimeRange}
              onChange={(e) => setPreferredTimeRange(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
              placeholder="e.g. 4:00 - 5:00 PM"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Note (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
            placeholder="Any instructions?"
          />
        </label>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Services</p>
            <p className="text-xs text-slate-500">
              Pick one or more · tap to select
            </p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {services.map((service) => {
              const checked = selectedServices.includes(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={`flex w-full flex-col items-start rounded-xl border px-4 py-3 text-left shadow-sm transition ${
                    checked
                      ? "border-slate-900 bg-white"
                      : "border-slate-200 bg-white/80"
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
                  <div
                    className={`mt-2 h-2 w-full rounded-full bg-slate-100 ${
                      checked ? "ring-1 ring-slate-900/20" : ""
                    }`}
                  >
                    {checked ? (
                      <span className="block h-2 w-full rounded-full bg-slate-900" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || selectedServices.length === 0}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Booking..." : "Book now"}
        </button>
        <p className="text-center text-xs text-slate-500">
          No login needed. You&apos;ll get a queue number immediately.
        </p>
      </form>

      <aside className="space-y-4 rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Live preview</h3>
        {initialQueue ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              People waiting: {initialQueue.waiting}
            </p>
            <p>Average wait right now: {initialQueue.averageWait} minutes</p>
          </div>
        ) : null}
        <div className="space-y-2 rounded-2xl bg-slate-50/70 p-4">
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>Total price</span>
            <strong className="text-slate-900">
              {formatCurrency(totals.price)}
            </strong>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>Total duration</span>
            <strong className="text-slate-900">
              {formatDuration(totals.duration)}
            </strong>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span>Services selected</span>
            <strong className="text-slate-900">{selectedServices.length}</strong>
          </div>
        </div>

        {result ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">Booking confirmed</p>
            <p>
              Queue #{result.booking.queue_number} · Reference{" "}
              <span className="font-semibold">
                {result.booking.booking_reference}
              </span>
            </p>
            <p>
              ETA: about <strong>{result.eta_minutes} minutes</strong>. People
              ahead: {result.people_ahead}
            </p>
            <p className="text-xs text-emerald-800">
              Save the reference and phone to edit or cancel later.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
            After booking you will instantly see queue number, ETA, and who is
            ahead of you.
          </div>
        )}
      </aside>
    </div>
  );
}
