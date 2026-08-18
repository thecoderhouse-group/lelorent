import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Bed,
  Buildings,
  CurrencyInr,
  Handshake,
  Key,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  SquaresFour,
  UserCirclePlus,
  UsersThree,
} from "@phosphor-icons/react/ssr";

import { CityArt } from "@/components/home/city-art";
import { HeroArt } from "@/components/home/hero-art";
import { HeroSearch } from "@/components/home/hero-search";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES, categoryHref, type CategoryKey } from "@/lib/categories";
import { getCitiesWithCounts, getNewestListings } from "@/lib/listings";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  all: SquaresFour,
  flats: Buildings,
  rooms: Bed,
  flatmates: UserCirclePlus,
  pg: UsersThree,
} satisfies Record<CategoryKey, typeof SquaresFour>;

/* -----------------------------------------------------------------------------
   Section chrome. One heading treatment reused everywhere so the page reads as
   a single document rather than a stack of unrelated marketing blocks.
   -------------------------------------------------------------------------- */

function Section({
  id,
  eyebrow,
  title,
  lede,
  action,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lede?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      // scroll-mt clears the sticky header when the footer links jump here.
      className="mx-auto w-full max-w-[1400px] scroll-mt-24 px-4 py-14 sm:px-6 lg:py-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="sign-label text-primary">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {lede && (
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {lede}
            </p>
          )}
        </div>
        {action}
      </div>

      <div className="mt-8 lg:mt-10">{children}</div>
    </section>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-sm text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
      <ArrowRight
        size={15}
        weight="bold"
        aria-hidden="true"
        className="transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      />
    </Link>
  );
}

/* -----------------------------------------------------------------------------
   Hero
   -------------------------------------------------------------------------- */

async function Hero() {
  // getCitiesWithCounts is memoised per request, so the banner's live count
  // and the city grid below share one set of queries rather than doubling them.
  const cities = await getCitiesWithCounts();
  const total = cities.reduce((sum, city) => sum + city.listingCount, 0);

  return (
    <section className="paper-wash relative overflow-hidden border-b border-hairline">
      {/* Scored rule grid, same treatment as the no-photo card slot — the one
          texture in the system. Drawn in the border colour rather than on a
          dark plate, so it reads as graph paper: the signage language survives
          the move to light without a near-black band carrying it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage:
            "radial-gradient(70rem 40rem at 20% 0%, #000 20%, transparent 78%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 lg:py-24">
        {/* Two columns from lg: the copy never competes with the art, and the
            right-hand emptiness that made the hero look unfinished at desktop
            width now carries the banner. */}
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:gap-16">
        <div className="max-w-3xl">
          <p className="sign-label text-primary">
            Pune · Mumbai · Bengaluru · Hyderabad · Delhi · Gurugram
          </p>

          <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
            Rent a home in India,
            <br />
            straight from the owner.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Flats, private rooms and PG beds posted by the people who actually
            hold the keys. Filter by what genuinely decides it — rent, food
            rules, pets, who the place is for — and talk to the owner directly.
          </p>

          <div className="mt-9 max-w-2xl">
            <HeroSearch cities={cities} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Popular right now</span>
            {cities.slice(0, 4).map((city) => (
              <Link
                key={city.slug}
                href={`/search?city=${city.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/85 shadow-soft transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MapPin size={12} weight="bold" aria-hidden="true" />
                {city.name}
              </Link>
            ))}
          </div>
        </div>

          {/* Banner column. The stat is read live rather than written into the
              copy, so it cannot quietly become a lie as inventory changes. */}
          <div className="relative">
            <HeroArt className="w-full text-foreground" />

            <div className="absolute bottom-6 left-2 rounded-lg border border-border bg-card px-5 py-4 shadow-lift">
              <p className="tnum text-2xl font-semibold leading-none text-foreground">
                {total}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                homes live across {cities.length} cities
              </p>
            </div>
          </div>
        </div>

        <ul className="mt-12 grid gap-x-8 gap-y-5 border-t border-hairline pt-8 sm:grid-cols-3 lg:mt-16">
          {[
            {
              icon: CurrencyInr,
              title: "Zero brokerage",
              copy: "You pay the owner rent and deposit. That is the whole list.",
            },
            {
              icon: ShieldCheck,
              title: "Contact stays private",
              copy: "Numbers are revealed to you, never sold on to a call centre.",
            },
            {
              icon: SlidersHorizontal,
              title: "Filters that matter here",
              copy: "Veg-only kitchens, pets, bachelor policies, availability date.",
            },
          ].map(({ icon: Icon, title, copy }) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon size={18} weight="bold" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {copy}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -----------------------------------------------------------------------------
   City picker — the step the whole flow hinges on. Real links, not a dropdown,
   so each city page is crawlable and shareable.

   Laid out as compact tiles beside the signpost art. The tiles carry only what
   decides the click — the city and how much is in it. State and the arrow
   affordance were padding the old cards to five times the height they needed
   and pushing the six cities across two full-width rows.
   -------------------------------------------------------------------------- */

async function CityPicker() {
  const cities = await getCitiesWithCounts();

  return (
    // Roughly 55/45. The art is a wide strip now, so it can take the larger
    // share without dominating vertically, and the tiles get enough width to
    // carry an icon without crowding.
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
      {/* Art first in the source on large screens, but ordered after the tiles
          on small ones: on a phone the actionable list should come first. */}
      <CityArt
        cities={cities}
        className="order-2 w-full text-foreground lg:order-1"
      />

      <ul className="order-1 grid grid-cols-2 gap-4 lg:order-2">
        {cities.map((city) => (
          <li key={city.slug}>
            <Link
              href={`/search?city=${city.slug}`}
              className={cn(
                "group flex h-full items-center gap-3 rounded-lg border border-border px-4 py-3.5 shadow-soft",
                // Gradient runs from the lighter surface into the card, so the
                // tile reads as a lit face rather than a flat rectangle. Both
                // stops are tokens, so it inverts correctly with the theme.
                "bg-gradient-to-br from-secondary via-card to-card",
                "transition-[border-color,transform,box-shadow] duration-200 ease-out",
                "hover:border-primary/50 hover:shadow-lift active:translate-y-px",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "motion-reduce:active:translate-y-0",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                <MapPin size={16} weight="bold" aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold tracking-tight">
                  {city.name}
                </span>
                <span className="mt-0.5 block text-[0.6875rem] text-muted-foreground">
                  <span className="tnum font-semibold text-foreground">
                    {city.listingCount}
                  </span>{" "}
                  {city.listingCount === 1 ? "home" : "homes"}
                </span>
              </span>

              <ArrowRight
                size={13}
                weight="bold"
                aria-hidden="true"
                className="shrink-0 text-muted-foreground/40 transition-[color,transform] duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CityPickerSkeleton() {
  return (
    <div
      className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16"
      aria-hidden="true"
    >
      {/* Reserves the art's box so the tiles do not jump sideways when the
          real content arrives. Ratio tracks the SVG viewBox. */}
      <div className="order-2 aspect-760/250 w-full animate-pulse rounded-lg bg-muted/40 lg:order-1" />

      <ul className="order-1 grid grid-cols-2 gap-4 lg:order-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5"
          >
            <div className="size-9 shrink-0 animate-pulse rounded-md bg-muted" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Newest listings shelf
   -------------------------------------------------------------------------- */

async function NewestListings() {
  // Eight, not six: the shelf is a four-column grid, and six would leave a
  // half-empty second row.
  const listings = await getNewestListings(8);

  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
        <h3 className="text-base font-semibold">Nothing published yet</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          The first listings land here as soon as owners start posting. Pick a
          city above to be ready when they do.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

function NewestListingsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

const STEPS = [
  {
    icon: MapPin,
    title: "Pick your city",
    copy: "Six metros to start with. Everything after this is scoped to the one you choose, so you are never scrolling past Powai while looking in Baner.",
  },
  {
    icon: SlidersHorizontal,
    title: "Narrow it honestly",
    copy: "Rent range, locality, furnishing, food rule, pets, who the owner will rent to. The filters mirror the questions that end most viewings early.",
  },
  {
    icon: Key,
    title: "Talk to the owner",
    copy: "Reveal the contact on a listing you actually want and arrange the visit yourself. Nobody sits in the middle taking a month's rent for it.",
  },
];

const REASONS = [
  {
    icon: Handshake,
    title: "Owners, not intermediaries",
    copy: "Every listing is posted by the person letting the place. If the photos are of that flat, it is because they took them.",
  },
  {
    icon: CurrencyInr,
    title: "Nothing between you and the rent",
    copy: "No brokerage, no finder's fee, no 'processing charge'. The number on the card is the number you discuss.",
  },
  {
    icon: ShieldCheck,
    title: "Your details stay yours",
    copy: "Contact details are exchanged when you choose to reveal them, on a listing you chose. They are not broadcast to a list of agents.",
  },
  {
    icon: MagnifyingGlass,
    title: "Built for how India rents",
    copy: "Veg-only kitchens, bachelor policies, deposit in months, PG beds and shared rooms are first-class filters here, not free-text afterthoughts.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader showSearch={false} />

      <main className="flex-1">
        <Hero />

        <Section
          id="cities"
          eyebrow="Step one"
          title="Choose your city"
          lede="Pick a city and the listings, localities and filters all narrow to it."
        >
          <Suspense fallback={<CityPickerSkeleton />}>
            <CityPicker />
          </Suspense>
        </Section>

        <div className="border-y border-hairline bg-secondary/40">
          <Section
            eyebrow="Step two"
            title="What are you looking for?"
            lede="Four shapes of rental, each a single tap once you are on a city page. Rooms and Flatmates look alike and are not: one is a tenancy, the other is a household."
          >
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.filter((category) => category.key !== "all").map(
                (category) => {
                  const Icon = CATEGORY_ICONS[category.key];

                  return (
                    <li key={category.key}>
                      <Link
                        href={categoryHref(category)}
                        className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-soft transition-[border-color,transform,box-shadow] duration-200 ease-out hover:border-primary/45 hover:shadow-lift active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:active:translate-y-0"
                      >
                        <span className="flex size-11 items-center justify-center rounded-md bg-secondary text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon size={22} aria-hidden="true" />
                        </span>
                        <p className="text-base font-semibold tracking-tight">
                          {category.label}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {category.blurb}
                        </p>
                      </Link>
                    </li>
                  );
                },
              )}
            </ul>
          </Section>
        </div>

        <Section
          eyebrow="On the market"
          title="Newest homes"
          lede="The most recently published listings across every city."
          action={<TextLink href="/search">Browse all homes</TextLink>}
        >
          <Suspense fallback={<NewestListingsSkeleton />}>
            <NewestListings />
          </Suspense>
        </Section>

        <div className="border-y border-hairline bg-secondary/40">
          <Section
            id="how-it-works"
            eyebrow="How it works"
            title="Three steps, no middleman"
            lede="The whole flow, start to finish. There is no fourth step where someone calls you."
          >
            <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, copy }, index) => (
                <li
                  key={title}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-md bg-primary/12 text-primary">
                      <Icon size={20} weight="bold" aria-hidden="true" />
                    </span>
                    <span className="sign-label text-muted-foreground">
                      {/* Padded so 01 / 02 / 03 sit as a signage sequence. */}
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-base font-semibold tracking-tight">{title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {copy}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <Section
          id="why-lelorent"
          eyebrow="Why lelorent"
          title="Renting here should not need a referee"
          lede="Lelorent exists because the two things renters actually want — an honest price and the owner's number — are the two things the rental market is worst at handing over."
        >
          <ul className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
            {REASONS.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
                  <Icon size={20} weight="bold" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-base font-semibold tracking-tight">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {copy}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* Closing CTA, aimed at the other side of the marketplace. */}
        <section className="mx-auto w-full max-w-[1400px] px-4 pb-16 sm:px-6 lg:pb-24">
          {/* Tinted green paper rather than the plate: a dark slab here was
              the second of the two bands that made the page read dark, and the
              accent surface gives the same "this is the closing note" emphasis
              without leaving the light palette. */}
          <div className="relative overflow-hidden rounded-xl border border-primary/15 bg-accent px-6 py-12 shadow-soft sm:px-10 lg:py-16">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--primary) 1px, transparent 1px), linear-gradient(to bottom, var(--primary) 1px, transparent 1px)",
                backgroundSize: "34px 34px",
                maskImage:
                  "radial-gradient(40rem 20rem at 88% 110%, #000 10%, transparent 70%)",
              }}
            />
            <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                {/* accent-foreground, not primary: --primary on the --accent
                    band measures 4.30:1 and misses normal-text AA. This is the
                    same hue a step darker, and clears 10:1. */}
                <p className="sign-label text-accent-foreground">
                  Have a place to let?
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-accent-foreground sm:text-3xl">
                  List it yourself, keep the brokerage
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-accent-foreground/80 sm:text-base">
                  Post the flat, set the rent, choose who you want to rent to.
                  Enquiries come to you, not to an agent who marks you up.
                </p>
              </div>

              <Link
                href="/listaproperty"
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-accent motion-reduce:active:translate-y-0"
              >
                List a property
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
