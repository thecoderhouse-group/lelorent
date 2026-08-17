import Link from "next/link";
import { CalendarBlank, Dog, ForkKnife, MapPin, Ruler } from "@phosphor-icons/react/ssr";

import {
  FLAT_TYPE_LABELS,
  FOOD_PREF_LABELS,
  FURNISHING_LABELS,
  formatAvailability,
  formatRupees,
} from "@/lib/format";
import { storageUrl, type ListingCardData } from "@/lib/listings";
import { cn } from "@/lib/utils";

/**
 * Photo slot.
 *
 * The no-photo state is deliberately designed rather than a grey box: it is a
 * nameplate carrying the flat type, which is on-direction for the signage
 * language and stays legible in a grid. Listings without photos are a real
 * and permanent state (owners publish before uploading), not a dev artifact.
 */
function PhotoSlot({ listing }: { listing: ListingCardData }) {
  const src = storageUrl(listing.cover_card_path);
  const flatType = FLAT_TYPE_LABELS[listing.flat_type] ?? listing.flat_type;

  if (!src) {
    return (
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-plate"
        aria-hidden="true"
      >
        {/* Faint rule grid, the way an enamel plate is scored. */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--plate-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--plate-muted) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <span className="relative font-mono text-2xl font-medium tracking-tight text-plate-foreground/85">
          {flatType}
        </span>
        <span className="sign-label absolute bottom-3 text-plate-muted">
          No photos yet
        </span>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- variants are
          pre-compressed to exact display size at upload, so next/image
          optimisation would only burn transformation quota. */}
      <img
        src={src}
        alt={`${FLAT_TYPE_LABELS[listing.flat_type]} in ${listing.locality}, ${listing.city}`}
        width={640}
        height={480}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        style={
          listing.cover_blur
            ? {
                backgroundImage: `url(${listing.cover_blur})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
    </div>
  );
}

function Fact({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold"; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon size={14} className="shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const flatType = FLAT_TYPE_LABELS[listing.flat_type] ?? listing.flat_type;
  const food = FOOD_PREF_LABELS[listing.food_pref];
  const availability = formatAvailability(listing.available_from);
  const isAvailableNow = availability === "Available now";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card",
        "transition-[border-color,transform] duration-200 ease-out",
        "hover:border-primary/45 focus-within:border-primary/45",
        "active:translate-y-px motion-reduce:active:translate-y-0",
      )}
    >
      <div className="relative">
        <PhotoSlot listing={listing} />

        {/* A flatmate ad is a different proposition from a tenancy — you are
            joining a household, not signing for a unit. That is the first
            thing to know about the card, so it sits on the photo rather than
            in the fact row where it would read as one spec among many. */}
        {listing.listing_kind === "FLATMATE" && (
          <span className="sign-label absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1.5 text-primary-foreground shadow-sm">
            Flatmate wanted
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="tnum text-xl font-semibold leading-none text-foreground">
            {formatRupees(listing.rent)}
            <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">
              /mo
            </span>
          </p>
          <span className="sign-label shrink-0 rounded-full bg-secondary px-2 py-1 text-secondary-foreground">
            {flatType}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-[0.9375rem] font-medium leading-snug">
            {/* Whole card is the hit target via the stretched link, but only
                the title is in the tab order, so the grid stays navigable. */}
            <Link
              href={`/viewproperty/${listing.id}`}
              className="rounded-sm outline-none after:absolute after:inset-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {listing.title}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <MapPin size={14} className="shrink-0" aria-hidden="true" />
            {listing.locality}, {listing.city}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
          <Fact icon={ForkKnife}>{food}</Fact>
          {listing.pets_allowed && <Fact icon={Dog}>Pets ok</Fact>}
          {listing.carpet_area_sqft ? (
            <Fact icon={Ruler}>{listing.carpet_area_sqft} sqft</Fact>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs",
              isAvailableNow ? "font-medium text-primary" : "text-muted-foreground",
            )}
          >
            <CalendarBlank size={14} className="shrink-0" aria-hidden="true" />
            {availability}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {FURNISHING_LABELS[listing.furnishing]}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
