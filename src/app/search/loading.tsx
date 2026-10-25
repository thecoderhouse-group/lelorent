import { Logo } from "@/components/logo";
import {
  SearchMastheadSkeleton,
  SearchResultsSkeleton,
} from "@/components/search-skeleton";

/**
 * Shown instantly when navigating to /search, while the server renders the
 * page. The real header is async (it reads the session), so this uses a
 * static stand-in of the same height to avoid a layout jump.
 */
export default function SearchLoading() {
  return (
    <>
      <div className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center px-4 sm:px-6">
          <Logo markClassName="size-8" />
        </div>
      </div>
      <main className="flex-1">
        <SearchMastheadSkeleton />
        <SearchResultsSkeleton />
      </main>
    </>
  );
}
