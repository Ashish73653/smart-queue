"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseClientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";

export default function AdminLogin() {
  const router = useRouter();
  const auth = useMemo(() => {
    if (!isFirebaseClientConfigured()) return null;
    return getFirebaseClientAuth();
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!auth && typeof window !== "undefined") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl bg-white/90 p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:rounded-3xl sm:p-6">
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p className="font-semibold">Configuration Error</p>
            <p className="mt-1">Firebase is not configured. Please check your environment variables.</p>
          </div>
        </div>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) {
      setError("Firebase is not configured");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const sessionResponse = await fetch("/api/admin/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const sessionJson = await sessionResponse.json().catch(() => ({}));
      if (!sessionResponse.ok) {
        throw new Error(sessionJson.error || "Unable to create session");
      }

      // Small delay to ensure cookie is set before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8 sm:px-6 sm:py-12">
      <div className="rounded-2xl bg-white/90 p-4 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100 sm:rounded-3xl sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 sm:text-sm">
          Barber login
        </p>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Access dashboard
        </h1>
        <form className="mt-6 space-y-4 sm:mt-4 sm:space-y-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900 shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
              placeholder="your.email@example.com"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-900 shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
              placeholder="••••••••"
            />
          </label>
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:rounded-xl sm:px-3 sm:py-2">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-3 text-base font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-xl sm:py-2.5 sm:text-sm"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          <p className="text-xs text-slate-500">
            Use your Firebase Authentication email/password.
          </p>
        </form>
      </div>
    </main>
  );
}
