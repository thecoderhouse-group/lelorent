import { Breadcrumbs } from "@/components/breadcrumbs";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Chrome for the standalone content pages (about, contact, policies).
 *
 * They share a masthead with the search page rather than inventing a second
 * one, so the product feels like one site — the breadcrumb in particular is
 * what stops a policy page from being a dead end reached from the footer.
 */
export function PageShell({
  eyebrow,
  title,
  lede,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  /** Policy pages only. Readers check this before they read anything else. */
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <div className="border-b border-border bg-card/40">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:py-10">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />

            <p className="sign-label mt-4 text-primary">{eyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>

            {lede && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {lede}
              </p>
            )}

            {updated && (
              <p className="mt-4 text-xs text-muted-foreground">
                Last updated{" "}
                <span className="font-medium text-foreground">{updated}</span>
              </p>
            )}
          </div>
        </div>

        {/* Measure capped near 70 characters — these are the longest stretches
            of prose in the product and the only place line length decides
            whether they get read. */}
        <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
          {children}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

/**
 * Long-form text styling, applied by descendant selector so the page bodies
 * stay readable as plain HTML instead of every element carrying a class list.
 * The project has no typography plugin, so this is the one place that defines
 * what prose looks like.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        "text-sm leading-relaxed text-muted-foreground",
        "[&>*+*]:mt-4",
        "[&_h2]:mt-10 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
        "[&_h2:first-child]:mt-0",
        "[&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
        "[&_li]:list-disc [&_li]:marker:text-muted-foreground/50",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
