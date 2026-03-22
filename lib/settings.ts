import { createServiceRoleClient, isServiceRoleConfigured } from "./supabase/server";
import type { ShopSettings } from "./types";

export async function getShopSettings() {
  if (!isServiceRoleConfigured()) {
    return {
      id: "local",
      shop_name: "Neighborhood Barber",
      contact_number: "",
      opening_time: "",
      closing_time: "",
      is_open: true,
      buffer_minutes: 0,
    };
  }
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("shop_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ShopSettings | null;
}

export async function upsertShopSettings(values: Partial<ShopSettings>) {
  if (!isServiceRoleConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const supabase = createServiceRoleClient();
  const existing = await getShopSettings();

  const payload = existing
    ? { ...existing, ...values, id: existing.id }
    : {
        ...values,
        shop_name: values.shop_name ?? "Neighborhood Barber",
        is_open: values.is_open ?? true,
      };

  const { data, error } = await supabase
    .from("shop_settings")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as ShopSettings;
}
