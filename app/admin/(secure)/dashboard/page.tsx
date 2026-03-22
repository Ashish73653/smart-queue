import { computeQueueSummary, fetchQueue } from "@/lib/bookings";
import { formatCurrency } from "@/lib/format";
import { getShopSettings } from "@/lib/settings";

export default async function AdminDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [summary, bookings, settings] = await Promise.all([
    computeQueueSummary(today),
    fetchQueue(today),
    getShopSettings(),
  ]);

  const inProgress = bookings.find((b) => b.status === "in_progress");
  const waiting = bookings.filter((b) => b.status === "waiting");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Current customer">
          {inProgress ? (
            <p className="text-lg font-semibold text-slate-900">
              #{inProgress.queue_number} · {inProgress.customer_name}
            </p>
          ) : (
            <p className="text-slate-600">Not started yet.</p>
          )}
        </Card>
        <Card title="Waiting">
          <p className="text-3xl font-semibold text-slate-900">
            {summary.totalWaiting}
          </p>
        </Card>
        <Card title="Avg wait">
          <p className="text-3xl font-semibold text-slate-900">
            {summary.averageWaitMinutes} min
          </p>
        </Card>
        <Card title="Expected earnings">
          <p className="text-2xl font-semibold text-slate-900">
            {formatCurrency(summary.expectedEarnings)}
          </p>
        </Card>
        <Card title="Completed earnings">
          <p className="text-2xl font-semibold text-slate-900">
            {formatCurrency(summary.completedEarnings)}
          </p>
        </Card>
        <Card title="Shop status">
          <p className="text-lg font-semibold text-slate-900">
            {settings?.is_open ? "Open" : "Closed"}
          </p>
          <p className="text-sm text-slate-600">
            {settings?.opening_time} - {settings?.closing_time}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Waiting list">
          <div className="space-y-2">
            {waiting.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-sm text-slate-800"
              >
                <span>
                  #{booking.queue_number} · {booking.customer_name}
                </span>
                <span className="text-slate-600">
                  {booking.total_duration} min
                </span>
              </div>
            ))}
            {waiting.length === 0 ? (
              <p className="text-sm text-slate-600">No one waiting.</p>
            ) : null}
          </div>
        </Card>
        <Card title="Notes">
          <p className="text-sm text-slate-600">
            Use the queue screen to start/done/cancel. Use services to update
            pricing and durations anytime.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white/90 p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
