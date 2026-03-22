import { ServicesManager } from "@/components/services-manager";
import { fetchServices } from "@/lib/bookings";

export default async function AdminServicesPage() {
  const services = await fetchServices(false);

  return <ServicesManager initialServices={services} />;
}
