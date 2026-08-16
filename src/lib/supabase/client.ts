import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Supabase client for Client Components. Safe to call repeatedly —
 * createBrowserClient returns the same underlying instance per browser context.
 *
 * This uses the anon key, which is public by design. Everything that protects
 * data here lives in the RLS policies (supabase/migrations/0005_rls.sql), not
 * in the secrecy of this key.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
