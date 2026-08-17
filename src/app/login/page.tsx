import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { EnvelopeSimple, GoogleLogo, WarningCircle } from "@phosphor-icons/react/ssr";

import { EmailSignInForm } from "@/components/email-signin-form";
import { SiteHeader } from "@/components/site-header";
import { signInWithGoogle } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to unlock owner contacts and list your property.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/search";
  const error = typeof params.error === "string" ? params.error : null;

  const user = await getCurrentUser();
  if (user) redirect(next.startsWith("/") ? next : "/search");

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Unlock owner contacts and list your own property. No password to
            remember.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground"
            >
              <WarningCircle
                size={16}
                className="mt-0.5 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <span>{error.replace(/_/g, " ")}</span>
            </div>
          )}

          <div className="mt-7">
            <EmailSignInForm next={next} />
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="sign-label text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-border bg-card text-sm font-medium transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <GoogleLogo size={18} weight="bold" aria-hidden="true" />
              Continue with Google
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
            By continuing you agree that owner contact details are for genuine
            rental enquiries only.{" "}
            <Link
              href="/search"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Back to search
            </Link>
          </p>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
            <EnvelopeSimple size={13} aria-hidden="true" />
            Signing in gives you 3 free owner contacts
          </p>
        </div>
      </main>
    </>
  );
}
