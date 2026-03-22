import { cookies } from "next/headers";
import { getFirebaseAdminAuth, getFirebaseAdminDb, isFirebaseAdminConfigured } from "./firebase/admin";

export async function requireAdmin() {
  if (!isFirebaseAdminConfigured()) {
    return {
      ok: false as const,
      status: 500,
      message: "Firebase is not configured",
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) {
    return { ok: false as const, status: 401, message: "Not authenticated" };
  }

  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();

  let decoded: { uid: string; email?: string };
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return { ok: false as const, status: 401, message: "Invalid session" };
  }

  const email = decoded.email?.toLowerCase();
  if (!email) {
    return { ok: false as const, status: 401, message: "Not authenticated" };
  }

  const adminUsers = await db
    .collection("admin_users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (!adminUsers.empty) {
    const admin = adminUsers.docs[0].data() as { email: string; role?: string };
    return {
      ok: true as const,
      admin: { email: admin.email, role: admin.role ?? "admin" },
      user: { uid: decoded.uid, email },
    };
  }

  const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL?.toLowerCase();
  if (defaultEmail && defaultEmail === email) {
    return {
      ok: true as const,
      admin: { email, role: "owner" },
      user: { uid: decoded.uid, email },
    };
  }

  return { ok: false as const, status: 403, message: "Not authorized" };
}
