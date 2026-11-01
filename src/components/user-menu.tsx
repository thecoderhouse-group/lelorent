import { Suspense } from "react";
import Link from "next/link";
import { SignOut, User } from "@phosphor-icons/react/ssr";

import { signOut } from "@/app/auth/actions";
import { CurrentPathInput, SignInLink } from "@/components/auth-return";
import type { CurrentUser } from "@/lib/auth";

const signInClass =
  "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function UserMenu({ user }: { user: CurrentUser | null }) {
  if (!user) {
    return (
      // The return path is read on the client; until then a plain link works.
      <Suspense
        fallback={
          <Link href="/login" className={signInClass}>
            Sign in
          </Link>
        }
      >
        <SignInLink className={signInClass}>Sign in</SignInLink>
      </Suspense>
    );
  }

  const label = user.fullName ?? user.email ?? "Account";
  const initial = label.trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-1">
      {/* Just the avatar (or initial); the name is in the tooltip and label. */}
      <Link
        href="/"
        title={label}
        aria-label={`Signed in as ${label}. Go to home page`}
        className="inline-flex size-9 items-center justify-center rounded-full transition-[box-shadow,transform] duration-200 hover:ring-2 hover:ring-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- provider avatar, fixed size, no optimisation worth the quota
          <img
            src={user.avatarUrl}
            alt=""
            width={32}
            height={32}
            referrerPolicy="no-referrer"
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial || <User size={15} aria-hidden="true" />}
          </span>
        )}
      </Link>

      <form action={signOut}>
        <Suspense fallback={null}>
          <CurrentPathInput />
        </Suspense>
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <SignOut size={17} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
