import Link from "next/link";
import { Plus } from "@phosphor-icons/react/ssr";

import { SearchInput } from "@/components/search-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/auth";

/**
 * Paper, translucent, with a hairline rule — the page scrolls under it rather
 * than beneath a dark band. Previously this was the enamel plate; a permanent
 * near-black bar above an otherwise light document was the largest single
 * reason the product read as a dark app.
 *
 * `showSearch` is off on the landing page. The header's search box writes
 * filter params onto the *current* route, which is correct on /search and
 * would strand the user on `/?q=…` anywhere else — and the landing hero
 * already owns that job with a control built to navigate.
 */
export async function SiteHeader({
  showSearch = true,
}: {
  showSearch?: boolean;
} = {}) {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Link
          href="/"
          className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="text-lg font-semibold tracking-tight text-foreground">
            lelorent
            <span className="text-primary">.</span>
          </span>
        </Link>

        {showSearch && (
          <SearchInput className="mx-auto hidden w-full max-w-md md:block" />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/listaproperty"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:active:translate-y-0 sm:px-4"
          >
            <Plus size={15} weight="bold" aria-hidden="true" />
            {/* Label shortens rather than wrapping on narrow phones. */}
            <span className="hidden sm:inline">List a property</span>
            <span className="sm:hidden">List</span>
          </Link>
          <UserMenu user={user} />
          <ThemeToggle />
        </div>
      </div>

      {/* Below md the search bar gets its own row instead of competing with
          the logo and CTA for a 360px viewport. */}
      {showSearch && (
        <div className="border-t border-hairline px-4 pb-3 pt-3 md:hidden">
          <SearchInput />
        </div>
      )}
    </header>
  );
}
