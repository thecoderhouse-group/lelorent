import Link from "next/link";

import { CATEGORIES, categoryHref } from "@/lib/categories";
import { getCities } from "@/lib/listings";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="sign-label text-muted-foreground">{title}</h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
      >
        {children}
      </Link>
    </li>
  );
}

/**
 * A sunken paper tone rather than the enamel plate. The footer is the tallest
 * block on the page, so making it near-black set the mood for the whole
 * document; a half-step down from the page background separates it just as
 * clearly and costs nothing in lightness.
 *
 * The city column is the secondary route into the listings for anyone who
 * scrolled past the grid — and the crawlable one, since the hero's picker is a
 * form rather than a set of links.
 */
export async function SiteFooter() {
  const cities = await getCities();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-secondary/50">
      <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:py-14">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            lelorent
            <span className="text-primary">.</span>
          </span>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
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

      <div className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-1 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} Lelorent. Made in India.</p>
          <p>Rents shown are what owners asked for, not estimates.</p>
        </div>
      </div>
    </footer>
  );
}
