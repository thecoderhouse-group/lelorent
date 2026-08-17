"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function safePath(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/search";
}

export type AuthState = { error?: string; sent?: boolean };

/**
 * Email magic link. Works on Supabase's built-in mailer with no extra setup,
 * which is why it is the primary method rather than a fallback.
 */
export async function signInWithEmail(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const next = safePath(formData.get("next"));

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { error: error.message };
  return { sent: true };
}

/**
 * Google OAuth. Stays dark until a Google client id and secret are configured
 * in the Supabase dashboard under Authentication -> Providers.
 */
export async function signInWithGoogle(formData: FormData) {
  const next = safePath(formData.get("next"));
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/search");
}
