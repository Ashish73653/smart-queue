"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatDuration } from "@/lib/format";
import { getServiceMeta } from "@/lib/service-catalog";
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

type ServiceGroup = "all" | "hair" | "beard" | "grooming" | "combo";

function isValidPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

export function BookingForm({ services, defaultDate, initialQueue }: Props) {
  const draftStorageKey = "smart_queue_booking_draft";
  const lastBookingKey = "smart_queue_last_booking";

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingDate, setBookingDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [preferredTimeRange, setPreferredTimeRange] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceGroup, setServiceGroup] = useState<ServiceGroup>("all");
  const [website, setWebsite] = useState("");
  const [formStartedAt, setFormStartedAt] = useState<number>(() => Date.now());
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  useEffect(() => {
    setFormStartedAt(Date.now());

    const saved = window.localStorage.getItem(draftStorageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        selectedServices?: string[];
        customerName?: string;
        phone?: string;
        bookingDate?: string;
        note?: string;
        preferredTimeRange?: string;
      };
      setSelectedServices(parsed.selectedServices ?? []);
      setCustomerName(parsed.customerName ?? "");
      setPhone(parsed.phone ?? "");
      setBookingDate(parsed.bookingDate ?? defaultDate);
      setNote(parsed.note ?? "");
      setPreferredTimeRange(parsed.preferredTimeRange ?? "");
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, [defaultDate]);

  useEffect(() => {
    const draft = {
      selectedServices,
      customerName,
      phone,
      bookingDate,
      note,
      preferredTimeRange,
    };
    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [bookingDate, customerName, note, phone, preferredTimeRange, selectedServices]);

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

  const estimatedWait = useMemo(() => {
    const queueWait = initialQueue?.averageWait ?? 0;
    return queueWait + totals.duration;
  }, [initialQueue?.averageWait, totals.duration]);

  const toggleService = (id: string) => {
    setError(null);
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const filteredServices = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return services.filter((service) => {
      const meta = getServiceMeta(service.name, service.category);
      const matchesText =
        query.length === 0 ||
        service.name.toLowerCase().includes(query) ||
        meta.description.toLowerCase().includes(query);

      const matchesGroup = serviceGroup === "all" || meta.group === serviceGroup;

      return matchesText && matchesGroup;
    });
  }, [searchTerm, serviceGroup, services]);

  const etaClockTime = useMemo(() => {
    if (!result) return null;
    const now = new Date();
    const etaAt = new Date(now.getTime() + result.eta_minutes * 60_000);
    return etaAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [result]);

  const selectedServiceNames = useMemo(() => {
    return selectedServices
      .map((id) => services.find((service) => service.id === id)?.name)
      .filter((name): name is string => Boolean(name));
  }, [selectedServices, services]);

  const bookingSmsHref = useMemo(() => {
    if (!result) return null;

    const cleanPhone = phone.trim();
    if (!cleanPhone) return null;

    const message = [
      "TrimQ booking confirmed!",
      `Ref: ${result.booking.booking_reference}`,
      `Queue: #${result.booking.queue_number}`,
      `ETA: ~${result.eta_minutes} min`,
      "Track: trimq/track",
    ].join(" | ");

    return `sms:${encodeURIComponent(cleanPhone)}?body=${encodeURIComponent(message)}`;
  }, [phone, result]);

  function clearDraft() {
    setSelectedServices([]);
    setCustomerName("");
    setPhone("");
    setBookingDate(defaultDate);
    setNote("");
    setPreferredTimeRange("");
    setSearchTerm("");
    setServiceGroup("all");
    setWebsite("");
    setFormStartedAt(Date.now());
    setResult(null);
    setError(null);
    window.localStorage.removeItem(draftStorageKey);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!customerName.trim()) {
      setError("Please enter your name so the barber can call your turn.");
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (selectedServices.length === 0) {
      setError("Choose at least one service before booking.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customer_name: customerName.trim(),
        phone: phone.trim(),
        booking_date: bookingDate,
        note,
        preferred_time_range: preferredTimeRange,
        services: selectedServices.map((id) => ({ id, quantity: 1 })),
        website,
        form_started_at: formStartedAt,
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

      window.localStorage.setItem(
        lastBookingKey,
        JSON.stringify({
          booking_reference: data.booking.booking_reference,
          phone: phone.trim(),
        }),
      );
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
        className="lg:col-span-2 space-y-5 rounded-3xl p-5 sm:p-6 glass-panel"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Book your visit
          </p>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Choose your services
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter your details, pick what you need, and see your total instantly.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Name
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
              placeholder="Your name"
              autoComplete="name"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Phone
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
              placeholder="9876543210"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
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
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Preferred time (optional)
            <input
              value={preferredTimeRange}
              onChange={(e) => setPreferredTimeRange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
              placeholder="e.g. 4:00 - 5:00 PM"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Notes for barber (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px] rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 sm:min-h-[80px] sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
            placeholder="Any instructions?"
          />
        </label>

        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          aria-hidden="true"
          className="hidden"
          name="website"
        />

        <section className="rounded-2xl border border-white/70 bg-white/70 p-4 sm:p-5">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Service menu</p>
              <p className="text-xs text-slate-500">
                Select one or more services
              </p>
            </div>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 sm:max-w-56 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
              placeholder="Search services"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { id: "all", label: "All" },
              { id: "hair", label: "Hair" },
              { id: "beard", label: "Beard" },
              { id: "grooming", label: "Grooming" },
              { id: "combo", label: "Combo" },
            ].map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setServiceGroup(group.id as ServiceGroup)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition touch-manipulation active:scale-95 sm:py-1 ${
                  serviceGroup === group.id
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 active:bg-slate-100"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>

          {services.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">No services are available yet.</p>
              <p className="mt-1">
                Ask the barber to add services from the admin panel to start taking bookings.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {filteredServices.map((service) => {
                const checked = selectedServices.includes(service.id);
                const meta = getServiceMeta(service.name, service.category);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`relative flex w-full flex-col items-start rounded-2xl border px-4 py-4 text-left shadow-sm transition touch-manipulation active:scale-95 sm:py-3 ${
                      checked
                        ? "border-accent bg-teal-50/65 ring-1 ring-accent/20"
                        : "border-slate-200 bg-white hover:border-slate-300 active:bg-slate-50"
                    }`}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900">{service.name}</p>
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                        {formatCurrency(Number(service.price))}
                      </span>
                    </div>
                    <div className="mt-1 flex w-full items-center justify-between gap-2 text-xs text-slate-600">
                      <span>{formatDuration(service.duration_minutes)}</span>
                      <span
                        className={`font-semibold transition ${checked ? "text-accent" : "text-slate-500"}`}
                      >
                        {checked ? "✓ Selected" : "Tap to select"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">{meta.description}</p>
                  </button>
                );
              })}
              {filteredServices.length === 0 ? (
                <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200 sm:col-span-2">
                  No services matched your search.
                </p>
              ) : null}
            </div>
          )}
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || selectedServices.length === 0 || services.length === 0}
          className="w-full rounded-lg bg-accent px-4 py-4 text-base font-semibold text-white shadow-lg shadow-cyan-900/20 transition touch-manipulation active:scale-95 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400 sm:rounded-xl sm:py-3 sm:text-sm"
        >
          {isSubmitting ? "Booking..." : "Book now"}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <p>No sign-up needed. You will receive queue number immediately.</p>
          <button
            type="button"
            onClick={clearDraft}
            className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4"
          >
            Clear draft
          </button>
        </div>
      </form>

      <aside className="space-y-4 rounded-3xl p-5 sm:p-6 glass-panel lg:sticky lg:top-5 lg:h-fit">
        <h3 className="text-lg font-bold text-slate-900">Live preview</h3>

        <div className="space-y-2 rounded-2xl border border-white/70 bg-white/75 p-4 text-sm">
          <div className="flex items-center justify-between text-slate-700">
            <span>Services selected</span>
            <strong className="text-slate-900">{selectedServices.length}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Total price</span>
            <strong className="text-slate-900">{formatCurrency(totals.price)}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Total duration</span>
            <strong className="text-slate-900">{formatDuration(totals.duration)}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>People ahead now</span>
            <strong className="text-slate-900">{initialQueue?.waiting ?? 0}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Estimated waiting time</span>
            <strong className="text-slate-900">{formatDuration(estimatedWait)}</strong>
          </div>
          <p className="text-xs text-slate-600">
            You&apos;ll receive queue number immediately after booking.
          </p>
        </div>

        {selectedServiceNames.length > 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-700">
            {selectedServiceNames.slice(0, 4).join(" · ")}
            {selectedServiceNames.length > 4 ? " ..." : ""}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Booking tips</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>Choose combo services to save time.</li>
            <li>Arrive 5 minutes early during evening rush.</li>
            <li>Track your turn live after booking.</li>
          </ul>
        </div>

        {result ? (
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">Booking confirmed</p>
            <p>
              Queue #{result.booking.queue_number} · Reference{" "}
              <span className="font-semibold">{result.booking.booking_reference}</span>
            </p>
            <p>
              ETA: about <strong>{result.eta_minutes} minutes</strong>. People ahead:{" "}
              {result.people_ahead}
            </p>
            {etaClockTime ? <p>Estimated around: {etaClockTime}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/track?reference=${encodeURIComponent(result.booking.booking_reference)}&phone=${encodeURIComponent(phone)}`}
                className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              >
                Open tracking now
              </Link>
              {bookingSmsHref ? (
                <a
                  href={bookingSmsHref}
                  className="inline-flex rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  Save by SMS
                </a>
              ) : null}
            </div>
            <p className="text-xs text-emerald-800/90">
              Free mode: this opens your phone&apos;s SMS app with a prefilled confirmation.
            </p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
