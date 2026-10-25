import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck } from "@phosphor-icons/react/ssr";

import { ListingForm } from "@/components/listing-form";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getCities } from "@/lib/listings";

export const metadata: Metadata = {
  title: "List a property",
  description:
    "Post your flat, room or PG bed. Free to list, and renters contact you directly.",
};

export default async function ListAPropertyPage() {
  // proxy.ts already redirects signed-out visitors, but the page does not
  // depend on that: this route writes rows owned by a specific user, so it
  // verifies identity itself rather than trusting an upstream check.
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Flistaproperty");

  const cities = await getCities();

  return (
    <>
      <SiteHeader showSearch={false} showListCta={false} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
          <header className="mb-9">
            <p className="sign-label text-primary">List a property</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Tell renters what you have
            </h1>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Free to list. Renters see your listing immediately and contact you
              directly, with no broker in between.
            </p>

            <p className="mt-5 flex items-start gap-2 rounded-md border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck
                size={15}
                className="mt-0.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>
                Your street address is never shown publicly, only the locality.
                Your phone number is released one renter at a time, and every
                release is logged.
              </span>
            </p>
          </header>

          <ListingForm cities={cities} />
        </div>
      </main>
    </>
  );
}
