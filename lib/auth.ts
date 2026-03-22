import {
  createServerSupabaseClient,
  createServiceRoleClient,
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from "./supabase/server";

export async function requireAdmin() {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    return {
      ok: false as const,
      status: 500,
      message: "Supabase is not configured",
    };
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false as const, status: 401, message: "Not authenticated" };
  }

  const service = createServiceRoleClient();
  const { data: admin } = await service
    .from("admin_users")
    .select("email, role")
    .eq("email", user.email)
    .maybeSingle();

  if (!admin) {
    return { ok: false as const, status: 403, message: "Not authorized" };
  }

  return { ok: true as const, admin, user };
}
