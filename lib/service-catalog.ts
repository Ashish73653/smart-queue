import type { Service, ServiceCategory } from "./types";

export type ServiceSeed = Pick<Service, "name" | "price" | "duration_minutes" | "category">;

export const DEFAULT_BARBER_SERVICES: ServiceSeed[] = [
  { name: "Haircut", price: 100, duration_minutes: 20, category: "hair" },
  { name: "Beard Trim", price: 50, duration_minutes: 10, category: "beard" },
  { name: "Shave", price: 60, duration_minutes: 10, category: "beard" },
  { name: "Hair Wash", price: 40, duration_minutes: 10, category: "grooming" },
  { name: "Facial", price: 200, duration_minutes: 30, category: "grooming" },
  { name: "Haircut + Beard Combo", price: 140, duration_minutes: 30, category: "combo" },
];

type ServiceMeta = {
  description: string;
  group: ServiceCategory;
  popular?: boolean;
};

const SERVICE_META: Record<string, ServiceMeta> = {
  "haircut": {
    description: "Classic cut with shape and clean finish.",
    group: "hair",
    popular: true,
  },
  "beard trim": {
    description: "Clean beard line-up and neat trim.",
    group: "beard",
  },
  "shave": {
    description: "Smooth shave with hot towel finish.",
    group: "beard",
  },
  "hair wash": {
    description: "Quick wash before or after your cut.",
    group: "grooming",
  },
  "facial": {
    description: "Refresh and clean-up for tired skin.",
    group: "grooming",
  },
  "haircut + beard combo": {
    description: "Full look update in one visit.",
    group: "combo",
    popular: true,
  },
};

export function getServiceMeta(name: string, category?: ServiceCategory): ServiceMeta {
  if (category) {
    return {
      description: "Professional grooming service.",
      group: category,
    };
  }

  const key = name.trim().toLowerCase();
  return (
    SERVICE_META[key] ?? {
      description: "Professional grooming service.",
      group: "grooming",
    }
  );
}
