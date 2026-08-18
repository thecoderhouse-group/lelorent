import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Prose } from "@/components/page-shell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Lelorent is a rental marketplace for flats, rooms and PG beds across six Indian metros, listed by the owners themselves. No brokerage, no intermediaries.",
};

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About us"
      title="Renting should not need a referee"
      lede="Lelorent connects people looking for a home directly with the people who own it."
    >
      <Prose>
        <h2>What we do</h2>
        <p>
          {COMPANY.brand} is a rental marketplace for flats, private rooms,
          shared rooms and PG beds across Pune, Mumbai, Bengaluru, Hyderabad,
          Delhi and Gurugram. Every listing is posted by the person letting the
          place, and renters contact them directly.
        </p>
        <p>
          We do not act as a broker. We do not take a cut of your rent, we do
          not arrange viewings on an owner&apos;s behalf, and we are not a party
          to any tenancy agreement you sign. What we run is the place where the
          two sides find each other.
        </p>

        <h2>Why we built it</h2>
        <p>
          Renting in urban India tends to involve a chain of intermediaries, and
          the two things a renter actually wants — an honest price and the
          owner&apos;s number — are the two things that chain is worst at handing
          over. A month&apos;s rent as brokerage is normal. Having your phone
          number passed to five agents after one enquiry is normal.
        </p>
        <p>
          So the product is built around removing both. Rent shown is what the
          owner asked for, not an estimate and not a marked-up figure. Contact
          details are revealed to you, on a listing you chose, rather than
          broadcast to a list.
        </p>

        <h2>How the filters are chosen</h2>
        <p>
          The things that actually end a viewing early are rarely the things
          generic property sites let you filter on. Ours are built for how India
          rents: whether the kitchen is vegetarian-only, whether pets are
          allowed, whether the owner will rent to bachelors, families or
          students, the furnishing level, the deposit, and the date the place is
          genuinely available from.
        </p>

        <h2>Who runs it</h2>
        <p>
          {COMPANY.brand} is operated by <strong>{COMPANY.legalName}</strong>,
          founded by {COMPANY.founder}.
        </p>
        {COMPANY.address && <p>{COMPANY.address}</p>}
        <p>
          Questions, corrections and complaints all go to the same place — see{" "}
          <Link href="/contact">Contact us</Link>.
        </p>

        <h2>Listing a property</h2>
        <p>
          Owners list for free and keep what a broker would otherwise take.
          Enquiries come to you rather than to an agent who marks you up. You
          can{" "}
          <Link href="/listaproperty">post a property</Link> or{" "}
          <Link href="/search">browse what is already listed</Link>.
        </p>
      </Prose>
    </PageShell>
  );
}
