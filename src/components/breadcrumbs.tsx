import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/ssr";

export type Crumb = {
  label: string;
  /** Omitted on the current page, which is never a link. */
  href?: string;
};

/**
 * Orientation for the listing pages, which sit three levels deep once a city
 * is chosen (home → property → city). Kept out of the header so it scrolls
 * away with the content rather than competing with the sticky plate.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "font-medium text-foreground" : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <CaretRight
                  size={11}
                  weight="bold"
                  aria-hidden="true"
                  className="text-muted-foreground/50"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
