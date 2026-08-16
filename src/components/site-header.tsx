import Link from "next/link";
import { Plus } from "@phosphor-icons/react/ssr";

import { SearchInput } from "@/components/search-input";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The plate. Identical colour in both themes by design (see globals.css) so
 * the brand has one fixed anchor the page can scroll under.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-plate">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Link
          href="/"
          className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-plate"
        >
          <span className="text-lg font-semibold tracking-tight text-plate-foreground">
            lelorent
            <span className="text-primary">.</span>
          </span>
        </Link>

        <SearchInput className="mx-auto hidden w-full max-w-md md:block" />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/post"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-transform hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-plate motion-reduce:active:translate-y-0 sm:px-4"
          >
            <Plus size={15} weight="bold" aria-hidden="true" />
            {/* Label shortens rather than wrapping on narrow phones. */}
            <span className="hidden sm:inline">List a property</span>
            <span className="sm:hidden">List</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Below md the search bar gets its own row instead of competing with
          the logo and CTA for a 360px viewport. */}
      <div className="border-t border-white/8 px-4 pb-3 pt-3 md:hidden">
        <SearchInput />
      </div>
    </header>
  );
}
