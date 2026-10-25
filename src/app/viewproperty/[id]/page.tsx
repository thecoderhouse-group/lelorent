import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Bathtub,
  Bed,
  Buildings,
  CalendarBlank,
  Car,
  CheckCircle,
  Dog,
  ForkKnife,
  MapPin,
  Phone,
  Ruler,
  Users,
  Warning,
} from "@phosphor-icons/react/ssr";

import { PropertyShowcase } from "@/components/property-showcase";
import { RevealContact } from "@/components/reveal-contact";
import { SiteHeader } from "@/components/site-header";
import {
  AMENITY_LABELS,
  FLAT_TYPE_LABELS,
  FOOD_PREF_LABELS,
  FURNISHING_LABELS,
  PARKING_LABELS,
  TENANT_PREF_LABELS,
  formatAvailability,
  formatRupees,
} from "@/lib/format";
import { getListingById, storageUrl } from "@/lib/listings";

export async function generateMetadata({
  params,
}: PageProps<"/viewproperty/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: "Listing not found" };

  return {
    title: listing.title ?? "Listing",
    description: `${FLAT_TYPE_LABELS[listing.flat_type!]} in ${listing.locality}, ${listing.city} at ${formatRupees(listing.rent!)} per month.`,
    openGraph: {
      title: listing.title ?? "Listing",
      images: listing.cover_card_path
        ? [storageUrl(listing.cover_card_path)!]
        : undefined,
    },
  };
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="sign-label text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

export default async function ViewPropertyPage({
  params,
}: PageProps<"/viewproperty/[id]">) {
  const { id } = await params;
  const listing = await getListingById(id);

  // Covers not-found, drafts, rented and expired alike: the view only exposes
  // PUBLISHED rows, so anything else is genuinely not there for this visitor.
  if (!listing) notFound();

  const flatType = FLAT_TYPE_LABELS[listing.flat_type!] ?? listing.flat_type!;
  const availability = formatAvailability(listing.available_from!);
  const isAvailableNow = availability === "Available now";

  const rules = [
    { ok: listing.pets_allowed, label: "Pets", icon: Dog },
    { ok: listing.smoking_allowed, label: "Smoking", icon: Warning },
    { ok: listing.drinking_allowed, label: "Drinking", icon: Warning },
    { ok: listing.couples_allowed, label: "Couples", icon: Users },
  ];

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <PropertyShowcase
          photos={listing.photos.map((p) => ({
            id: p.id,
            cardUrl: storageUrl(p.card_path)!,
            fullUrl: storageUrl(p.full_path)!,
            blurDataUrl: p.blur_data_url,
            width: p.width,
            height: p.height,
          }))}
          flatTypeLabel={flatType}
          alt={`${flatType} in ${listing.locality}`}
          topLeft={
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3.5 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to search
            </Link>
          }
          overlay={
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="sign-label rounded-full bg-white/15 px-2.5 py-1 text-white backdrop-blur">
                  {flatType}
                </span>
                <span className="sign-label rounded-full bg-white/15 px-2.5 py-1 text-white backdrop-blur">
                  {FURNISHING_LABELS[listing.furnishing!]}
                </span>
                {isAvailableNow && (
                  <span className="sign-label rounded-full bg-primary px-2.5 py-1 text-primary-foreground">
                    Available now
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {listing.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-white/85 sm:text-base">
                  <MapPin size={16} aria-hidden="true" />
                  {listing.locality}, {listing.city}
                  {listing.pincode ? ` ${listing.pincode}` : ""}
                </p>
                <p className="tnum text-xl font-semibold text-primary sm:text-2xl">
                  {formatRupees(listing.rent!)}
                  <span className="ml-1 font-sans text-sm font-normal text-white/70">/month</span>
                </p>
              </div>
            </>
          }
        >
          {/* The details sheet: frosted glass sliding up over the pinned
              photo. Always dark so text stays legible on the dimmed image. */}
          <div className="dark rounded-t-3xl border-t border-white/15 bg-black/30 text-foreground shadow-[0_-24px_60px_-20px_rgb(0_0_0/0.6)] backdrop-blur-2xl backdrop-saturate-150">
            <div aria-hidden="true" className="mx-auto h-1.5 w-12 translate-y-3 rounded-full bg-white/25" />

            <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-4 pb-32 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14 lg:pb-20 lg:pt-14">
              {/* ---------------------------------------------- details --- */}
              <div className="min-w-0">
                {listing.description && (
                  <section>
                    <h2 className="sign-label mb-4 text-muted-foreground">About this place</h2>
                    <p className="max-w-[65ch] whitespace-pre-line text-[0.9375rem] leading-relaxed text-foreground/85 sm:text-base">
                      {listing.description}
                    </p>
                  </section>
                )}

                {/* --- specs --- */}
                <section className="mt-8 border-t border-hairline pt-7">
                  <h2 className="sr-only">Property details</h2>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
                    {listing.bedrooms != null && (
                      <Spec icon={Bed} label="Bedrooms" value={String(listing.bedrooms)} />
                    )}
                    {listing.bathrooms != null && (
                      <Spec icon={Bathtub} label="Bathrooms" value={String(listing.bathrooms)} />
                    )}
                    {listing.carpet_area_sqft != null && (
                      <Spec icon={Ruler} label="Carpet area" value={`${listing.carpet_area_sqft} sqft`} />
                    )}
                    {listing.floor_number != null && (
                      <Spec
                        icon={Buildings}
                        label="Floor"
                        value={
                          listing.total_floors != null
                            ? `${listing.floor_number} of ${listing.total_floors}`
                            : String(listing.floor_number)
                        }
                      />
                    )}
                    <Spec
                      icon={Car}
                      label="Parking"
                      value={PARKING_LABELS[listing.parking!] ?? "Not specified"}
                    />
                    <Spec
                      icon={ForkKnife}
                      label="Food"
                      value={FOOD_PREF_LABELS[listing.food_pref!]}
                    />
                    <Spec
                      icon={CalendarBlank}
                      label="Available from"
                      value={availability}
                    />
                    {listing.min_stay_months != null && (
                      <Spec
                        icon={CalendarBlank}
                        label="Minimum stay"
                        value={`${listing.min_stay_months} months`}
                      />
                    )}
                  </dl>
                </section>

                {/* --- house rules --- */}
                <section className="mt-8 border-t border-hairline pt-7">
                  <h2 className="sign-label mb-4 text-muted-foreground">House rules</h2>
                  <ul className="flex flex-wrap gap-2">
                    {rules.map((rule) => (
                      <li
                        key={rule.label}
                        className={
                          rule.ok
                            ? "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
                            : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground line-through decoration-muted-foreground/40"
                        }
                      >
                        <rule.icon size={13} aria-hidden="true" />
                        {rule.label} {rule.ok ? "allowed" : "not allowed"}
                      </li>
                    ))}
                  </ul>

                  {listing.tenant_prefs && listing.tenant_prefs.length > 0 && (
                    <div className="mt-5">
                      <h3 className="sign-label mb-3 text-muted-foreground">
                        Suitable for
                      </h3>
                      <ul className="flex flex-wrap gap-2">
                        {listing.tenant_prefs.map((t) => (
                          <li
                            key={t}
                            className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                          >
                            {TENANT_PREF_LABELS[t]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>

                {/* --- amenities --- */}
                {listing.amenities && listing.amenities.length > 0 && (
                  <section className="mt-8 border-t border-hairline pt-7">
                    <h2 className="sign-label mb-4 text-muted-foreground">Amenities</h2>
                    <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      {listing.amenities.map((a) => (
                        <li key={a} className="flex items-center gap-2 text-sm">
                          <CheckCircle
                            size={15}
                            weight="fill"
                            className="shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          {AMENITY_LABELS[a] ?? a}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              {/* ---------------------------------------- price + contact --- */}
              <aside
                id="contact"
                className="order-first scroll-mt-24 lg:order-none lg:sticky lg:top-24 lg:h-fit"
              >
                <div className="rounded-xl border border-white/10 bg-black/35 p-5 backdrop-blur-md">
                  <p className="tnum text-3xl font-semibold leading-none">
                    {formatRupees(listing.rent!)}
                    <span className="ml-1.5 font-sans text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>

                  <dl className="mt-4 flex flex-col gap-2 border-t border-hairline pt-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Deposit</dt>
                      <dd className="tnum font-medium">{formatRupees(listing.deposit ?? 0)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Maintenance</dt>
                      <dd className="tnum font-medium">
                        {listing.maintenance
                          ? `${formatRupees(listing.maintenance)}${listing.maintenance_included ? " (incl.)" : ""}`
                          : "None"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 border-t border-hairline pt-5">
                    <RevealContact listingId={listing.id!} ownerName={listing.owner_name} />
                  </div>
                </div>

                <p className="mt-4 px-1 text-xs leading-relaxed text-muted-foreground">
                  Listed by an owner, not a broker. Always visit in person before
                  paying a deposit, and never transfer money before seeing the
                  property.
                </p>
              </aside>
            </div>
          </div>
        </PropertyShowcase>

        {/* Phones: rent and a jump to the contact card, always in reach. */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <p className="tnum text-lg font-semibold leading-none">
              {formatRupees(listing.rent!)}
              <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">/month</span>
            </p>
            <a
              href="#contact"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-transform active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:active:translate-y-0"
            >
              <Phone size={16} weight="fill" aria-hidden="true" />
              Contact owner
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
