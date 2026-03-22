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
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
          Book
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Join the queue</h1>
        <p className="text-slate-600">
          Pick services, see the price and waiting time instantly.
        </p>
        {settings ? (
          <p className="text-xs text-slate-500">
            {settings.is_open ? "Shop is open" : "Shop is currently closed"} ·{" "}
            {settings.opening_time} - {settings.closing_time}
          </p>
        ) : null}
      </div>
      <div className="mt-6">
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
