import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS, so it is for trusted server
 * code only: payment routes that create and activate subscriptions, which
 * users are deliberately not allowed to write themselves.
 *
 * Never import this from a Client Component. SUPABASE_SECRET_KEY has no
 * NEXT_PUBLIC_ prefix, so it is never bundled for the browser; the guard
 * below makes an accidental import fail loudly instead of silently.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must only be used on the server");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SECRET_KEY is not configured");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
