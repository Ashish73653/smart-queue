import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createServiceRoleClient() {
  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server actions.");
  }
  return createClient(url, serviceRoleKey);
}

export async function createServerSupabaseClient() {
  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // suppress errors when headers are immutable (e.g. during static rendering)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.delete({ name, ...options });
        } catch {
          // suppress errors when headers are immutable (e.g. during static rendering)
        }
      },
    },
  });
}

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

export function isServiceRoleConfigured() {
  return Boolean(url && anonKey && serviceRoleKey);
}
