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

import { ScrollHero } from "@/components/home/scroll-hero";
import { Reveal } from "@/components/home/reveal";
import { StepStack } from "@/components/home/step-stack";
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

  const benefits = (
    <div>
      <p className="sign-label text-primary">Why renters stay</p>
      <ul className="mt-5 grid gap-5 sm:grid-cols-3">
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
          <li
            key={title}
            className="flex gap-3 rounded-lg border border-primary/25 bg-black/55 p-5 backdrop-blur-md"
          >
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Icon size={20} weight="bold" aria-hidden="true" />
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
  );

  return (
    <ScrollHero benefits={benefits}>
      <div className="max-w-3xl">
        <p className="sign-label text-primary [text-shadow:0_1px_10px_rgb(0_0_0/0.9)]">
          Pune · Mumbai · Bengaluru · Hyderabad · Delhi · Gurugram
        </p>

        <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.7)] sm:text-5xl lg:text-[3.5rem]">
          Rent a home in India,
          <br />
          straight from the owner.
        </h1>

        <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-white/85 [text-shadow:0_1px_12px_rgb(0_0_0/0.8)] sm:text-lg">
          Flats, private rooms and PG beds posted by the people who actually
          hold the keys. Filter by what genuinely decides it — rent, food
          rules, pets, who the place is for — and talk to the owner directly.
        </p>

        <div className="mt-9 max-w-2xl">
          <HeroSearch cities={cities} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-white/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.8)]">Popular right now</span>
          {cities.slice(0, 4).map((city) => (
            <Link
              key={city.slug}
              href={`/search?city=${city.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground/85 backdrop-blur transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <MapPin size={12} weight="bold" aria-hidden="true" />
              {city.name}
            </Link>
          ))}
        </div>

        {/* Live stat, read from the database so it cannot go stale. */}
        <p className="mt-8 text-xs font-medium text-white/80 [text-shadow:0_1px_8px_rgb(0_0_0/0.8)]">
          <span className="tnum text-base font-semibold text-white">
            {total}
          </span>{" "}
          {total === 1 ? "home" : "homes"} live across {cities.length} cities
        </p>
      </div>
    </ScrollHero>
  );
}

/* -----------------------------------------------------------------------------
   City picker — the step the whole flow hinges on. Real links, not a dropdown,
   so each city page is crawlable and shareable.

   Rendered as the first card of the StepStack scroll scene; glass tiles keep
   the blurred background visible between them.
   -------------------------------------------------------------------------- */

async function CityPicker() {
  const cities = await getCitiesWithCounts();

  return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {cities.map((city) => (
          <li key={city.slug}>
            <Link
              href={`/search?city=${city.slug}`}
              className={cn(
                "group flex h-full items-center gap-3 rounded-lg border border-white/10 bg-black/50 px-4 py-3.5 text-white backdrop-blur-md",
                "transition-[border-color,transform,background-color] duration-200 ease-out",
                "hover:border-primary/60 hover:bg-black/65 active:translate-y-px",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                "motion-reduce:active:translate-y-0",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                <MapPin size={16} weight="bold" aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold tracking-tight">
                  {city.name}
                </span>
                <span className="mt-0.5 block text-[0.6875rem] text-white/70">
                  <span className="tnum font-semibold text-white">
                    {city.listingCount}
                  </span>{" "}
                  {city.listingCount === 1 ? "home" : "homes"}
                </span>
              </span>

              <ArrowRight
                size={13}
                weight="bold"
                aria-hidden="true"
                className="shrink-0 text-white/35 transition-[color,transform] duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              />
            </Link>
          </li>
        ))}
      </ul>
  );
}

function CityPickerSkeleton() {
  return (
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/50 px-4 py-3.5"
          >
            <div className="size-9 shrink-0 animate-pulse rounded-md bg-white/10" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3.5 w-16 animate-pulse rounded bg-white/10" />
              <div className="h-2.5 w-12 animate-pulse rounded bg-white/10" />
            </div>
          </li>
        ))}
      </ul>
  );
}

/* -----------------------------------------------------------------------------
   Step two and How it works card bodies (StepStack cards two and three).
   -------------------------------------------------------------------------- */

function CategoryGrid() {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CATEGORIES.filter((category) => category.key !== "all").map((category) => {
        const Icon = CATEGORY_ICONS[category.key];

        return (
          <li key={category.key}>
            <Link
              href={categoryHref(category)}
              className="group flex h-full flex-col gap-2.5 rounded-lg border border-white/10 bg-black/50 p-4 text-white backdrop-blur-md transition-[border-color,transform,background-color] duration-200 ease-out hover:border-primary/60 hover:bg-black/65 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:active:translate-y-0 sm:gap-3 sm:p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:size-11">
                <Icon size={22} aria-hidden="true" />
              </span>
              <p className="text-base font-semibold tracking-tight">{category.label}</p>
              <p className="hidden text-sm leading-relaxed text-white/70 sm:block">
                {category.blurb}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function HowItWorks() {
  return (
    <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
      {STEPS.map(({ icon: Icon, title, copy }, index) => (
        <li
          key={title}
          className="flex gap-4 rounded-lg border border-white/10 bg-black/50 p-4 text-white backdrop-blur-md md:flex-col md:gap-3 md:p-6"
        >
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Icon size={20} weight="bold" aria-hidden="true" />
            </span>
            <span className="sign-label hidden text-white/50 md:inline">
              {/* Padded so 01 / 02 / 03 sit as a signage sequence. */}
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">{title}</p>
            <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-white/70 md:line-clamp-none">
              {copy}
            </p>
          </div>
        </li>
      ))}
    </ol>
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
      {listings.map((listing, index) => (
        <Reveal key={listing.id} index={index}>
          <ListingCard listing={listing} />
        </Reveal>
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

        <StepStack
          cards={[
            {
              key: "cities",
              background: "/hero/step-cities.webp?v=2",
              anchor: "cities",
              eyebrow: "Step one",
              title: "Choose your city",
              lede: "Pick a city and the listings, localities and filters all narrow to it.",
              content: (
                <Suspense fallback={<CityPickerSkeleton />}>
                  <CityPicker />
                </Suspense>
              ),
            },
            {
              key: "looking-for",
              background: "/hero/step-looking-for.webp?v=2",
              eyebrow: "Step two",
              title: "What are you looking for?",
              lede: "Four shapes of rental, each a single tap once you are on a city page. Rooms and Flatmates look alike and are not: one is a tenancy, the other is a household.",
              content: <CategoryGrid />,
            },
            {
              key: "how-it-works",
              background: "/hero/step-how-it-works.webp?v=2",
              anchor: "how-it-works",
              eyebrow: "How it works",
              title: "Three steps, no middleman",
              lede: "The whole flow, start to finish. There is no fourth step where someone calls you.",
              content: <HowItWorks />,
            },
          ]}
        />

        {/* Dark band with slowly drifting ambient light (gold + slate blue,
            echoing the photography) over a faint grid. */}
        <div className="dark relative overflow-hidden border-y border-hairline bg-background text-foreground">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="ambient-drift-a absolute -left-[10%] -top-[20%] size-[42rem] rounded-full bg-primary/15 blur-[120px]" />
            <div className="ambient-drift-b absolute -right-[12%] top-[10%] size-[46rem] rounded-full bg-[oklch(0.5_0.09_250)]/25 blur-[130px]" />
            <div className="ambient-drift-c absolute -bottom-[30%] left-[30%] size-[38rem] rounded-full bg-primary/10 blur-[120px]" />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                maskImage:
                  "radial-gradient(60rem 30rem at 50% 40%, #000 10%, transparent 75%)",
              }}
            />
          </div>

          <div className="relative">
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
          </div>
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
