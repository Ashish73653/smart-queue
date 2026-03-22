import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

const cookieName = "admin_session";

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "Firebase is not configured" }, { status: 500 });
  }

  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const auth = getFirebaseAdminAuth();
    const db = getFirebaseAdminDb();
    const decoded = await auth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Authenticated email is missing" }, { status: 401 });
    }

    const adminDoc = await db
      .collection("admin_users")
      .where("email", "==", email)
      .limit(1)
      .get();

    const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL?.toLowerCase();
    const isAllowed = !adminDoc.empty || (defaultEmail ? defaultEmail === email : false);

    if (!isAllowed) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: cookieName,
      value: idToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create admin session";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: cookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
