import { TrackBooking } from "@/components/track-booking";
import { fetchServices } from "@/lib/bookings";

export default async function TrackPage() {
  const services = await fetchServices(true);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="fade-up flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
          Track
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Track or edit your booking
        </h1>
        <p className="max-w-2xl text-slate-600">
          Use your phone number and booking reference to check queue status,
          ETA, and update your services if your turn has not started.
        </p>
      </div>
      <div className="fade-up mt-6" data-delay="1">
        <TrackBooking services={services} />
      </div>
    </main>
  );
}
