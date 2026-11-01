"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** The page the user is on, including its query string. */
function useCurrentPath(): string {
  const pathname = usePathname() ?? "/";
  const query = useSearchParams()?.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** "Sign in" that brings the user back to this page afterwards. */
export function SignInLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const current = useCurrentPath();
  // Never bounce back to the login page itself.
  const next = current.startsWith("/login") ? "/" : current;
  return (
    <Link href={`/login?next=${encodeURIComponent(next)}`} className={className}>
      {children}
    </Link>
  );
}

/** Hidden field telling the sign-out action which page to return to. */
export function CurrentPathInput({ name = "next" }: { name?: string }) {
  const current = useCurrentPath();
  return <input type="hidden" name={name} value={current} />;
}
