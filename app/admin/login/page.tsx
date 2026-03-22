"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<
    typeof createBrowserSupabaseClient
  > | null>(null);
  const [email, setEmail] = useState("barber@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupabase(createBrowserSupabaseClient());
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-12">
      <div className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-100">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
          Barber login
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Access dashboard
        </h1>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
              placeholder="barber@example.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-slate-400"
              placeholder="••••••••"
            />
          </label>
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          <p className="text-xs text-slate-500">
            Use the Supabase Auth email/password created for the barber/admin.
          </p>
        </form>
      </div>
    </main>
  );
}
