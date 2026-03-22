import { getFirebaseAdminDb } from "./firebase/admin";
import type { Service } from "./types";
import { serviceSchema } from "./validation";

export async function createService(raw: unknown) {
  const db = getFirebaseAdminDb();
  const payload = serviceSchema.parse(raw);

  const docRef = db.collection("services").doc();
  const data: Service = {
    id: docRef.id,
    name: payload.name,
    price: payload.price,
    duration_minutes: payload.duration_minutes,
    category: payload.category,
    is_active: payload.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await docRef.set(data);
  return data;
}

export async function updateService(id: string, raw: unknown) {
  const db = getFirebaseAdminDb();
  const payload = serviceSchema.partial().parse(raw);

  const docRef = db.collection("services").doc(id);
  const existing = await docRef.get();
  if (!existing.exists) {
    throw new Error("Service not found");
  }

  await docRef.set(
    {
      ...payload,
      updated_at: new Date().toISOString(),
    },
    { merge: true },
  );

  const updated = await docRef.get();
  const data = updated.data() as Service;

  return {
    ...data,
    id,
  };
}
