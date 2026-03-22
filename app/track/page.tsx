import { TrackBooking } from "@/components/track-booking";
import { fetchServices } from "@/lib/bookings";

export default async function TrackPage() {
  const services = await fetchServices(true);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
          Track
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Track or edit your booking
        </h1>
        <p className="text-slate-600">
          Use your phone number and booking reference to view status, ETA, and
          make quick changes.
        </p>
      </div>
      <div className="mt-6">
        <TrackBooking services={services} />
      </div>
    </main>
  );
}
