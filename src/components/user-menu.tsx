import Link from "next/link";
import { SignOut, User } from "@phosphor-icons/react/ssr";

import { signOut } from "@/app/auth/actions";
import type { CurrentUser } from "@/lib/auth";

export function UserMenu({ user }: { user: CurrentUser | null }) {
  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Sign in
      </Link>
    );
  }

  const label = user.fullName ?? user.email ?? "Account";
  const initial = label.trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/dashboard"
        title={label}
        className="inline-flex items-center gap-2 rounded-md py-1 pl-1 pr-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- provider avatar, fixed 28px, no optimisation worth the quota
          <img
            src={user.avatarUrl}
            alt=""
            width={28}
            height={28}
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initial || <User size={14} aria-hidden="true" />}
          </span>
        )}
        <span className="hidden max-w-28 truncate lg:inline">{label}</span>
      </Link>

      <form action={signOut}>
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
