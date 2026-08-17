import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next 16 renamed the `middleware` file convention to `proxy`. Same execution
 * model: runs before any route renders, used here to refresh the Supabase
 * session cookie and gate the owner-only routes.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /**
     * Every path except static assets and images. Auth cookies are irrelevant
     * to a font or an icon, and running this on them would add a Supabase
     * round trip to every asset request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
