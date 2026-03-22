import { createServiceRoleClient } from "./supabase/server";
import type { Service } from "./types";
import { serviceSchema } from "./validation";

export async function createService(raw: unknown) {
  const supabase = createServiceRoleClient();
  const payload = serviceSchema.parse(raw);

  const { data, error } = await supabase
    .from("services")
    .insert({
      name: payload.name,
      price: payload.price,
      duration_minutes: payload.duration_minutes,
      is_active: payload.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Service;
}

export async function updateService(id: string, raw: unknown) {
  const supabase = createServiceRoleClient();
  const payload = serviceSchema.partial().parse(raw);

  const { data, error } = await supabase
    .from("services")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Service;
}
