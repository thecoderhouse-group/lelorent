import Link from "next/link";
import {
  ArrowRight,
  CalendarBlank,
  Dog,
  ForkKnife,
  ImageSquare,
  MapPin,
  Ruler,
} from "@phosphor-icons/react/ssr";

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
 * TEMPORARY — stand-in artwork so the grid can be judged with images in it
 * while Storage is still empty. Delete this constant, the PLACEHOLDERS array,
 * the branch that uses them, and public/placeholders/ to remove the feature
 * entirely; nothing else references any of it.
 *
 * Local SVG rather than a remote placeholder service: this renders offline,
 * adds no third-party request to the page, and cannot start 404ing later.
 */
const SHOW_PLACEHOLDER_PHOTOS = true;

const PLACEHOLDERS = [
  "/placeholders/room-1.svg",
  "/placeholders/room-2.svg",
  "/placeholders/room-3.svg",
  "/placeholders/room-4.svg",
  "/placeholders/room-5.svg",
  "/placeholders/room-6.svg",
];

/** Stable per listing, so a card keeps its image across renders and pages. */
function placeholderFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PLACEHOLDERS[hash % PLACEHOLDERS.length]!;
}

/**
 * Photo slot.
 *
 * The no-photo state is quiet on purpose. It used to be a green enamel plate
 * with a scored grid and the flat type set 24px in mono — a maximally loud
 * treatment for the absence of content. In a results grid where most listings
 * have no photo yet, that made three saturated slabs the dominant visual of
 * the whole page and set the mood for the product.
 *
 * Now it is a neutral surface a half-step off the card, one small icon and a
 * label. The flat type is not repeated here: it is already a chip beside the
 * rent, six millimetres below.
 */
function PhotoSlot({ listing }: { listing: ListingCardData }) {
  const src =
    storageUrl(listing.cover_card_path) ??
    (SHOW_PLACEHOLDER_PHOTOS ? placeholderFor(listing.id) : null);

  if (!src) {
    return (
      <div
        className="flex aspect-3/2 flex-col items-center justify-center gap-2.5 border-b border-hairline bg-secondary/60"
        aria-hidden="true"
      >
        <ImageSquare
          size={26}
          weight="light"
          className="text-muted-foreground/45"
        />
        <span className="text-[0.6875rem] tracking-wide text-muted-foreground/70">
          No photos yet
        </span>
      </div>
    );
  }

  return (
    <div className="relative aspect-3/2 overflow-hidden bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- variants are
          pre-compressed to exact display size at upload, so next/image
          optimisation would only burn transformation quota. */}
      <img
        src={src}
        alt={`${FLAT_TYPE_LABELS[listing.flat_type]} in ${listing.locality}, ${listing.city}`}
        width={640}
        height={427}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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

      {/* Hover: a soft darkening at the foot, a light glint sweeping across,
          and a "View details" pill. All decorative; the card is the link. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-out group-hover:translate-x-[300%] group-hover:opacity-100 motion-reduce:hidden"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 inline-flex translate-y-2 items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-[0.6875rem] font-semibold text-white opacity-0 backdrop-blur transition-[transform,opacity] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:translate-y-0"
      >
        View details
        <ArrowRight size={11} weight="bold" />
      </span>
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
    <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
      <Icon size={12} className="shrink-0" aria-hidden="true" />
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
        "group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft",
        "transition-[border-color,transform,box-shadow] duration-300 ease-out",
        // Lift with a gold-edged shadow rather than only recolouring the border.
        "hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-[0_22px_45px_-15px_rgb(0_0_0/0.55),0_0_0_1px_color-mix(in_oklab,var(--primary)_30%,transparent)]",
        "focus-within:border-primary/45 active:translate-y-0",
        "motion-reduce:hover:translate-y-0",
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

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="tnum text-base font-semibold leading-none text-foreground transition-colors duration-300 group-hover:text-primary">
            {formatRupees(listing.rent)}
            <span className="ml-1 font-sans text-[0.6875rem] font-normal text-muted-foreground">
              /mo
            </span>
          </p>
          <span className="sign-label shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-secondary-foreground">
            {flatType}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium leading-snug">
            {/* Whole card is the hit target via the stretched link, but only
                the title is in the tab order, so the grid stays navigable. */}
            <Link
              href={`/viewproperty/${listing.id}`}
              className="rounded-sm outline-none after:absolute after:inset-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {listing.title}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[0.6875rem] text-muted-foreground">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            {listing.locality}, {listing.city}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
          <Fact icon={ForkKnife}>{food}</Fact>
          {listing.pets_allowed && <Fact icon={Dog}>Pets ok</Fact>}
          {listing.carpet_area_sqft ? (
            <Fact icon={Ruler}>{listing.carpet_area_sqft} sqft</Fact>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-hairline pt-2.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[0.6875rem]",
              isAvailableNow ? "font-medium text-primary" : "text-muted-foreground",
            )}
          >
            <CalendarBlank size={12} className="shrink-0" aria-hidden="true" />
            {availability}
          </span>
          <span className="truncate text-[0.6875rem] text-muted-foreground">
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
      <div className="aspect-3/2 shimmer" />
      <div className="flex flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-20 shimmer rounded" />
          <div className="h-4 w-12 shimmer rounded-full" />
        </div>
        <div className="h-3.5 w-full shimmer rounded" />
        <div className="h-2.5 w-2/3 shimmer rounded" />
        <div className="mt-0.5 h-2.5 w-1/2 shimmer rounded" />
      </div>
    </div>
  );
}
