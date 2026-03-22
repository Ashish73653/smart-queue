import Link from "next/link";
import { fetchServices } from "@/lib/bookings";
import { formatCurrency, formatDuration } from "@/lib/format";
import { getShopSettings } from "@/lib/settings";

export default async function Home() {
  const [services, settings] = await Promise.all([
    fetchServices(true),
    getShopSettings(),
  ]);

  const featured = services.slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Smart Queue
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            {settings?.shop_name ?? "Neighborhood Barber"}
          </h1>
          <p className="mt-2 text-slate-600">
            Book in under a minute. Track your turn in real-time. No app
            downloads.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/book"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-slate-900/20"
          >
            Book now
          </Link>
          <Link
            href="/queue"
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            Live queue
          </Link>
        </div>
      </header>

      <section className="mt-10 grid gap-6 rounded-3xl bg-white/80 p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {settings?.is_open ? "Open now" : "Closed currently"}
            {settings?.opening_time && settings?.closing_time ? (
              <span className="text-slate-500">
                · {settings.opening_time} - {settings.closing_time}
              </span>
            ) : null}
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Fast, transparent, queue-first booking
          </h2>
          <p className="text-slate-600">
            Customers pick services, see price + ETA instantly, and get a queue
            number. Barbers control delays and walk-ins from the dashboard.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              No sign-up needed
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Mobile friendly
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Free-tier ready
            </span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: "Live ETA", desc: "Wait time auto-updates with delays." },
            { title: "Queue control", desc: "Start, done, cancel, no-show." },
            { title: "Walk-ins", desc: "Add customers without a form." },
            { title: "Service pricing", desc: "Editable price + duration." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-900">
                {item.title}
              </p>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Services</h3>
          <Link href="/book" className="text-sm font-medium text-slate-700">
            Quick book →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">
                  {service.name}
                </p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {formatCurrency(Number(service.price))}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {formatDuration(service.duration_minutes)}
              </p>
            </div>
          ))}
          {featured.length === 0 ? (
            <p className="text-sm text-slate-500">
              Add services from the admin panel to get started.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-xl shadow-slate-900/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
              For barbers
            </p>
            <h3 className="text-2xl font-semibold">Dashboard in your pocket</h3>
            <p className="max-w-xl text-slate-200">
              Start/finish bookings, add delay minutes, move walk-ins, and see
              expected earnings today—built for phone-friendly control.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/login"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-md shadow-black/10 transition hover:-translate-y-0.5"
            >
              Barber login
            </Link>
            <Link
              href="/admin/services"
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Manage services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
