import { headers } from "next/headers";

/**
 * The absolute base URL for this request, used to build auth redirect targets.
 *
 * Resolution order matters:
 *   1. the request's own Origin/Host — always correct, including on preview
 *      deployments, where every branch gets a different hostname
 *   2. NEXT_PUBLIC_SITE_URL — an explicit override for a custom domain
 *   3. VERCEL_PROJECT_PRODUCTION_URL — the stable production host
 *   4. VERCEL_URL — the per-deployment host
 *   5. localhost
 *
 * Hardcoding NEXT_PUBLIC_SITE_URL alone is the usual mistake: it sends every
 * preview deployment's magic link to production, so testing auth on a branch
 * silently signs you in somewhere else.
 */
export async function getSiteUrl(): Promise<string> {
  const h = await headers();

  const origin = h.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  // Server Actions do not always carry Origin; Host plus the forwarded scheme
  // reconstructs it.
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;

  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;

  return "http://localhost:3000";
}
