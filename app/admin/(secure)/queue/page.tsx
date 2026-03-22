import { AdminQueue } from "@/components/admin-queue";
import { fetchQueue, fetchServices } from "@/lib/bookings";

export default async function AdminQueuePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [bookings, services] = await Promise.all([
    fetchQueue(today),
    fetchServices(true),
  ]);

  return (
    <AdminQueue initialBookings={bookings} services={services} today={today} />
  );
}
