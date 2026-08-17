import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth and magic-link landing point. Supabase redirects here with a one-time
 * `code`, which is exchanged for a session cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/search";

  // Only same-site paths. An open redirect here would let a phishing link
  // bounce a freshly authenticated user to an attacker's page.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/search";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Behind a proxy the origin is not the public host, so prefer the forwarded
  // host when Next tells us the deployment is load-balanced.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;

  return NextResponse.redirect(`${base}${safeNext}`);
}
