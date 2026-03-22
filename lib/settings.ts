import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "./firebase/admin";
import type { ShopSettings } from "./types";

export async function getShopSettings() {
  if (!isFirebaseAdminConfigured()) {
    return {
      id: "local",
      shop_name: "Smart Queue Barbershop",
      contact_number: "",
      opening_time: "",
      closing_time: "",
      is_open: true,
      buffer_minutes: 0,
    };
  }

  const db = getFirebaseAdminDb();
  const snap = await db.collection("shop_settings").doc("primary").get();
  if (!snap.exists) return null;

  const data = snap.data() as Omit<ShopSettings, "id">;
  return {
    id: snap.id,
    ...data,
  };
}

export async function upsertShopSettings(values: Partial<ShopSettings>) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase is not configured");
  }

  const db = getFirebaseAdminDb();
  const existing = await getShopSettings();

  const payload = existing
    ? { ...existing, ...values, id: existing.id }
    : {
        ...values,
        shop_name: values.shop_name ?? "Smart Queue Barbershop",
        is_open: values.is_open ?? true,
      };

  const merged = {
    shop_name: payload.shop_name,
    contact_number: payload.contact_number ?? "",
    opening_time: payload.opening_time ?? "",
    closing_time: payload.closing_time ?? "",
    is_open: payload.is_open ?? true,
    buffer_minutes: payload.buffer_minutes ?? 0,
    updated_at: new Date().toISOString(),
  };

  await db.collection("shop_settings").doc("primary").set(merged, { merge: true });

  return {
    id: "primary",
    ...merged,
  };
}
