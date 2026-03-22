import { computeQueueSummary, etaForBooking, fetchQueue } from "@/lib/bookings";
import { formatDuration } from "@/lib/format";
import { getShopSettings } from "@/lib/settings";

export default async function QueuePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [summary, bookings, settings] = await Promise.all([
    computeQueueSummary(today),
    fetchQueue(today),
    getShopSettings(),
  ]);

  const inProgress = bookings.find((b) => b.status === "in_progress");
  const waiting = bookings.filter((b) => b.status === "waiting");
  const lastUpdatedTime = new Date(summary.lastUpdated).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="fade-up flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
          Live queue
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          See your turn in real time
        </h1>
        <p className="max-w-3xl text-slate-600">
          Share this page with customers so everyone can check queue number, people ahead, and ETA.
        </p>
        <p className="text-sm text-slate-500">
          {settings?.is_open ? "Open now" : "Closed now"}
          {settings?.opening_time && settings?.closing_time
            ? ` · ${settings.opening_time} - ${settings.closing_time}`
            : ""}
          {` · Last updated: ${lastUpdatedTime}`}
        </p>
      </div>

      <div className="fade-up mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-delay="1">
        <StatCard label="People waiting" value={summary.totalWaiting} />
        <StatCard label="Average wait" value={`${summary.averageWaitMinutes} min`} />
        <StatCard label="In chair" value={inProgress ? `#${inProgress.queue_number}` : "None"} />
        <StatCard label="Done today" value={`${summary.completedToday}`} />
      </div>

      <section className="fade-up mt-8 grid gap-6 lg:grid-cols-3" data-delay="2">
        <div className="lg:col-span-1 space-y-3 rounded-3xl p-5 sm:p-6 glass-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Now serving
          </p>
          {inProgress ? (
            <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="text-lg font-semibold">Queue #{inProgress.queue_number}</p>
              <p className="font-medium">{inProgress.customer_name}</p>
              <p className="text-xs text-emerald-800">
                Service time: {formatDuration(inProgress.total_duration ?? 0)}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">No one in chair right now</p>
              <p className="mt-1">New bookings will appear here as soon as service starts.</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Queue note</p>
            <p className="mt-1 text-xs">
              ETA may shift if service takes longer. Please keep this page open for live updates.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3 rounded-3xl p-5 sm:p-6 glass-panel">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Waiting customers</p>
            <p className="text-xs text-slate-500">Position and ETA update automatically</p>
          </div>
          <div className="space-y-2">
            {waiting.map((booking, index) => {
              const eta = etaForBooking(bookings, booking.id);
              const serviceLabels = booking.booking_services
                ?.map((s) => s.service?.name ?? "Service")
                .join(", ");

              return (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-slate-100 bg-white/75 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Queue #{booking.queue_number} · {booking.customer_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Position {index + 1} in waiting list
                      </p>
                      {serviceLabels ? (
                        <p className="mt-2 text-xs text-slate-600">{serviceLabels}</p>
                      ) : null}
                    </div>
                    <div className="text-right text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">ETA ~ {eta} min</p>
                      <p>{formatDuration(booking.total_duration ?? 0)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
            {waiting.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Queue is clear right now</p>
                <p className="mt-1">No customers are waiting. Book now and get served faster.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
