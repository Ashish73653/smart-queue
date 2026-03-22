import { computeQueueSummary, fetchQueue } from "@/lib/bookings";
import { formatCurrency, formatDuration } from "@/lib/format";
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

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
          Live queue
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          See who&apos;s up next
        </h1>
        <p className="text-slate-600">
          Updated instantly with added delays and walk-ins. Share this page with
          customers.
        </p>
        <p className="text-xs text-slate-500">
          {settings?.is_open ? "Open" : "Closed"} · {settings?.opening_time} -{" "}
          {settings?.closing_time} · Last updated: {summary.lastUpdated}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Waiting" value={summary.totalWaiting} />
        <StatCard label="Avg wait" value={`${summary.averageWaitMinutes} min`} />
        <StatCard label="Expected earnings" value={formatCurrency(summary.expectedEarnings)} />
        <StatCard label="Completed today" value={`${summary.completedToday}`} />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3 rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100">
          <p className="text-sm font-semibold text-slate-900">
            Now serving
          </p>
          {inProgress ? (
            <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="text-lg font-semibold">
                Queue #{inProgress.queue_number}
              </p>
              <p>{inProgress.customer_name}</p>
              <p className="text-xs text-emerald-800">
                Started: {inProgress.started_at ?? "Just now"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Not started yet.</p>
          )}
        </div>

        <div className="lg:col-span-2 space-y-3 rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              Waiting customers
            </p>
            <p className="text-xs text-slate-500">
              Tap refresh in your browser for the latest
            </p>
          </div>
          <div className="space-y-2">
            {waiting.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Queue #{booking.queue_number} · {booking.customer_name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {booking.booking_services
                        ?.map((s) => s.service?.name ?? "Service")
                        .join(", ")}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-700">
                    <p>{formatDuration(booking.total_duration ?? 0)}</p>
                    <p className="text-slate-500">
                      {formatCurrency(Number(booking.total_price ?? 0))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {waiting.length === 0 ? (
              <p className="text-sm text-slate-600">No one is waiting.</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
