import { BookingForm } from "@/components/booking-form";
import { computeQueueSummary, fetchServices } from "@/lib/bookings";
import { getShopSettings } from "@/lib/settings";

export default async function BookPage() {
  const [services, settings, queueSummary] = await Promise.all([
    fetchServices(true),
    getShopSettings(),
    computeQueueSummary(new Date().toISOString().slice(0, 10)),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="fade-up flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
          Book
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Book your barber slot
        </h1>
        <p className="max-w-2xl text-slate-600">
          Choose services, see your total before you visit, and get queue
          number plus ETA instantly.
        </p>
        {settings ? (
          <p className="text-sm text-slate-500">
            {settings.is_open ? "Shop is open" : "Shop is currently closed"} ·{" "}
            {settings.opening_time} - {settings.closing_time}
          </p>
        ) : null}
      </div>
      <div className="fade-up mt-6" data-delay="1">
        <BookingForm
          services={services}
          defaultDate={today}
          initialQueue={{
            waiting: queueSummary.totalWaiting,
            averageWait: queueSummary.averageWaitMinutes,
          }}
        />
      </div>
    </main>
  );
}
