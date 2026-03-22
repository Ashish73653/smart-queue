import { z } from "zod";

export const bookingSchema = z.object({
  customer_name: z.string().min(2, "Name is required"),
  phone: z.string().min(6, "Phone number is required"),
  booking_date: z.string(),
  preferred_time_range: z.string().optional(),
  note: z.string().max(200).optional().or(z.literal("")),
  services: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().int().min(1).default(1),
      }),
    )
    .min(1, "Pick at least one service"),
  is_walk_in: z.boolean().optional(),
});

export const trackSchema = z.object({
  phone: z.string().min(6, "Phone is required"),
  booking_reference: z.string().min(4, "Reference is required"),
});

export const adminDelaySchema = z.object({
  minutes: z.number().int().min(1).max(180),
});

export const serviceSchema = z.object({
  name: z.string().min(2),
  price: z.number().nonnegative(),
  duration_minutes: z.number().int().positive(),
  is_active: z.boolean().optional(),
});
