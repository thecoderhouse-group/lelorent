import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on every request and forwards the rotated
 * cookies to both the incoming request and the outgoing response.
 *
 * Server Components cannot write cookies, so without this the access token
 * silently expires and the user appears logged out mid-session. This is the
 * only place tokens get refreshed.
 *
 * The dance with `supabaseResponse` matters: the cookies must be set on the
 * request (so the rest of THIS render sees them) and on the response (so the
 * browser stores them). Returning a fresh NextResponse without copying the
 * cookies over is the classic way to break auth here.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not remove. getUser() revalidates the token with Supabase; without this
  // call the cookies are never rotated. getSession() is NOT a substitute — it
  // trusts the cookie without verifying it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes that require a signed-in user. Everything else stays public so
  // search and listing pages remain crawlable.
  const protectedPaths = ["/listaproperty", "/dashboard", "/account"];
  const needsAuth = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );

  if (!user && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Round-trip the destination so sign-in returns them where they were going.
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
