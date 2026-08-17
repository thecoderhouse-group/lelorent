import { createClient } from "./supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
};

/**
 * The signed-in user, or null.
 *
 * Always getUser(), never getSession(): getSession reads the cookie and trusts
 * it, which means a forged cookie would pass. getUser revalidates against the
 * Supabase auth server. On a page that decides what a person may see, that
 * difference is the whole point.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, phone")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? (user.user_metadata?.full_name as string) ?? null,
    avatarUrl: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string) ?? null,
    phone: profile?.phone ?? null,
  };
}
