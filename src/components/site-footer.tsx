import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";

import { Logo } from "@/components/logo";
import { CATEGORIES, categoryHref } from "@/lib/categories";
import { getCities } from "@/lib/listings";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="sign-label text-primary">{title}</h2>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="rounded-sm text-sm text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        {children}
      </Link>
    </li>
  );
}

/**
 * Always dark, matching the landing page's gold-on-black scenes, over a
 * heavily dimmed skyline so it has texture without competing with content.
 *
 * The city column is the secondary route into the listings for anyone who
 * scrolled past the grid — and the crawlable one, since the hero's picker is a
 * form rather than a set of links.
 */
export async function SiteFooter() {
  const cities = await getCities();
  const year = new Date().getFullYear();

  return (
    <footer className="dark relative mt-auto overflow-hidden border-t border-primary/15 bg-background text-foreground">
      {/* Dim skyline, anchored to the bottom edge. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-[position:center_45%] opacity-60 brightness-[.4] saturate-[.5]"
        style={{ backgroundImage: "url(/hero/cities-band.webp?v=2)" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--background)_0%,rgb(0_0_0/0.55)_45%,rgb(0_0_0/0.75)_100%)]"
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6">
        <div className="grid gap-12 py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-16 lg:py-20">
          {/* Brand */}
          <div className="flex flex-col items-start gap-5">
            <Link
              href="/"
              aria-label="lelorent home"
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Logo markClassName="size-11" wordClassName="text-2xl text-white" />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/65">
              Flats, rooms and PGs listed by the people who actually own them. No
              brokerage, no gatekeeping, no phone number sold on three times.
            </p>
            <Link
              href="/listaproperty"
              className="group mt-1 inline-flex h-10 items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              List your property free
              <ArrowRight
                size={14}
                weight="bold"
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </Link>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <Column title="Cities">
              {cities.map((city) => (
                <FooterLink key={city.slug} href={`/search?city=${city.slug}`}>
                  Rent in {city.name}
                </FooterLink>
              ))}
            </Column>

            <Column title="Browse">
              {CATEGORIES.map((category) => (
                <FooterLink key={category.key} href={categoryHref(category)}>
                  {category.label}
                </FooterLink>
              ))}
            </Column>

            <Column title="Company">
              <FooterLink href="/about">About us</FooterLink>
              <FooterLink href="/contact">Contact us</FooterLink>
              <FooterLink href="/#how-it-works">How it works</FooterLink>
              <FooterLink href="/listaproperty">List a property</FooterLink>
            </Column>

            <Column title="Legal">
              <FooterLink href="/privacy">Privacy policy</FooterLink>
              <FooterLink href="/terms">Terms and conditions</FooterLink>
            </Column>
          </div>
        </div>

        {/* Oversized wordmark, decorative. */}
        <p
          aria-hidden="true"
          className="pointer-events-none select-none text-center text-[22vw] font-semibold leading-[0.8] tracking-tighter text-primary/[0.07] lg:text-[17rem]"
        >
          lelorent
        </p>

        <div className="flex flex-col gap-1 border-t border-white/10 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Lelorent. Made in India.</p>
          <p>Rents shown are what owners asked for, not estimates.</p>
        </div>
      </div>
    </footer>
  );
}
