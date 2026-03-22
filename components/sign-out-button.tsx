"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseClientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

export function SignOutButton() {
  const router = useRouter();
  const auth = useMemo(() => {
    if (!isFirebaseClientConfigured()) return null;
    return getFirebaseClientAuth();
  }, []);

  async function signOut() {
    await fetch("/api/admin/auth/session", {
      method: "DELETE",
    });
    if (auth) {
      await firebaseSignOut(auth);
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 sm:w-auto sm:text-sm"
    >
      Sign out
    </button>
  );
}
