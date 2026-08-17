import Link from "next/link";

import { CATEGORIES, categoryHref } from "@/lib/categories";
import { getCities } from "@/lib/listings";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="sign-label text-plate-muted">{title}</h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="rounded-sm text-sm text-plate-foreground/75 transition-colors hover:text-plate-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-plate"
      >
        {children}
      </Link>
    </li>
  );
}

/**
 * Same plate colour as the header, so the page is bookended by the brand
 * constant and the content sits on paper between them.
 *
 * The city column is the secondary route into the listings for anyone who
 * scrolled past the grid — and the crawlable one, since the hero's picker is a
 * form rather than a set of links.
 */
export async function SiteFooter() {
  const cities = await getCities();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-plate">
      <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-14">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-semibold tracking-tight text-plate-foreground">
            lelorent
            <span className="text-primary">.</span>
          </span>
          <p className="max-w-xs text-sm leading-relaxed text-plate-foreground/70">
            Flats, rooms and PGs listed by the people who actually own them. No
            brokerage, no gatekeeping, no phone number sold on three times.
          </p>
        </div>

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
          <FooterLink href="/#how-it-works">How it works</FooterLink>
          <FooterLink href="/#why-lelorent">Why lelorent</FooterLink>
          <FooterLink href="/listaproperty">List a property</FooterLink>
          <FooterLink href="/login">Sign in</FooterLink>
        </Column>
      </div>

      <div className="border-t border-white/8">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-1 px-4 py-5 text-xs text-plate-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} Lelorent. Made in India.</p>
          <p>Rents shown are what owners asked for, not estimates.</p>
        </div>
      </div>
    </footer>
  );
}
