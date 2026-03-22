import Link from "next/link";
import { computeQueueSummary, fetchServices } from "@/lib/bookings";
import { formatCurrency, formatDuration } from "@/lib/format";
import { getServiceMeta } from "@/lib/service-catalog";
import { getShopSettings } from "@/lib/settings";

export default async function Home() {
  const today = new Date().toISOString().slice(0, 10);
  const [services, settings, queueSummary] = await Promise.all([
    fetchServices(true),
    getShopSettings(),
    computeQueueSummary(today),
  ]);

  const featured = services.slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-14">
      <header className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="fade-up text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent sm:text-left">
            TrimQ
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            Modern barber booking for everyday customers
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
            Book in seconds, see your live queue position, and know your estimated wait before you visit.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Book your cut. Track your turn.
          </p>

          <p className="mt-3 text-sm text-ink-muted">
            {settings?.is_open ? "Open now" : "Closed now"}
            {settings?.opening_time && settings?.closing_time
              ? ` · ${settings.opening_time} - ${settings.closing_time}`
              : ""}
            {settings?.contact_number ? ` · ${settings.contact_number}` : ""}
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <Link
              href="/book"
              className="inline-flex justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Book now
            </Link>
            <Link
              href="/queue"
              className="inline-flex justify-center rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white"
            >
              Live queue
            </Link>
          </div>

          <div className="mt-6 grid gap-2 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm text-slate-700">
              1. Pick your services
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm text-slate-700">
              2. Get queue number instantly
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm text-slate-700">
              3. Track live ETA before you visit
            </div>
          </div>
        </div>

        <aside className="fade-up rounded-3xl border border-white/70 bg-white/85 p-5 text-center shadow-lg shadow-slate-900/10 sm:text-left" data-delay="1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Queue now
          </p>
          <div className="mt-3 space-y-2">
            <InfoRow
              label="Now serving"
              value={
                queueSummary.inProgress
                  ? `#${queueSummary.inProgress.queue_number}`
                  : "Starting soon"
              }
            />
            <InfoRow label="People waiting" value={`${queueSummary.totalWaiting}`} />
            <InfoRow
              label="Average wait"
              value={`${queueSummary.averageWaitMinutes} min`}
            />
          </div>
        </aside>
      </header>

      <section className="fade-up mt-10" data-delay="1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="section-title text-xl">Popular services</h2>
          <Link href="/book" className="text-sm font-semibold text-accent">
            View all services
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((service) => {
            const meta = getServiceMeta(service.name);
            return (
              <article
                key={service.id}
                className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm"
              >
                <p className="text-base font-bold text-slate-900">{service.name}</p>
                <p className="mt-1 text-sm text-slate-600">{meta.description}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(Number(service.price))}
                  </span>
                  <span className="text-slate-600">
                    {formatDuration(service.duration_minutes)}
                  </span>
                </div>
              </article>
            );
          })}

          {featured.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:col-span-2 lg:col-span-4">
              <p className="font-semibold">Services are not set up yet.</p>
              <p className="mt-1">
                Please add services from admin to enable customer bookings.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="fade-up mt-12 rounded-3xl border border-slate-900/10 bg-slate-900 px-6 py-6 text-white shadow-xl shadow-slate-900/20" data-delay="2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
              For shop owners
            </p>
            <h3 className="text-xl font-semibold">Manage queue updates in one place</h3>
          </div>
          <Link
            href="/admin/login"
            className="inline-flex justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-black/10 transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Open admin panel
          </Link>
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
