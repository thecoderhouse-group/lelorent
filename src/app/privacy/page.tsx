import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Prose } from "@/components/page-shell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${COMPANY.brand} collects, uses, stores and shares your personal information, and how to exercise your rights over it.`,
};

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy policy"
      lede={`How ${COMPANY.brand} handles your personal information, in plain terms.`}
      updated={COMPANY.lastUpdated}
    >
      <Prose>
        <p>
          This policy applies to {COMPANY.brand}, operated by{" "}
          <strong>{COMPANY.legalName}</strong> (&quot;we&quot;, &quot;us&quot;).
          It describes what we collect, why, who we share it with, and what you
          can ask us to do about it.
        </p>

        <h2>1. What we collect</h2>

        <h3>When you create an account</h3>
        <ul>
          <li>
            Your email address, and — if you sign in with a third-party provider
            — the name and profile picture that provider returns to us.
          </li>
          <li>
            Your name and phone number, if you add them to your profile. A phone
            number is required only to publish a listing, because a renter has
            to be able to reach you.
          </li>
        </ul>

        <h3>When you publish a listing</h3>
        <ul>
          <li>
            Details of the property: rent, deposit, type, furnishing, amenities,
            house rules, availability, city and locality.
          </li>
          <li>
            The street address, which is <strong>not shown publicly</strong>.
            Public listing pages show only the locality and city.
          </li>
          <li>Photographs you upload.</li>
        </ul>

        <h3>When you use the site</h3>
        <ul>
          <li>
            A record of each time you reveal an owner&apos;s contact details,
            because those are metered against your plan.
          </li>
          <li>
            Subscription and plan status. We do not store card numbers; payments
            are handled by our payment provider.
          </li>
          <li>
            Standard server logs, including IP address, kept for security and
            abuse investigation.
          </li>
        </ul>
        <p>
          Search terms and filters live in the page URL and are not tied to your
          account.
        </p>

        <h2>2. Why we use it</h2>
        <ul>
          <li>To run your account and let you sign in.</li>
          <li>To show your listing to renters, and to show you listings.</li>
          <li>
            To connect a renter to an owner when the renter chooses to reveal
            contact details.
          </li>
          <li>To apply plan limits and process subscriptions.</li>
          <li>
            To detect fraud, fake listings and abuse, and to enforce our{" "}
            <Link href="/terms">Terms and conditions</Link>.
          </li>
        </ul>

        <h2>3. Who we share it with</h2>
        <p>
          <strong>We do not sell your personal information</strong>, and we do
          not pass your phone number to brokers or agents.
        </p>
        <ul>
          <li>
            <strong>Other users.</strong> If you publish a listing, the details
            of the property and your display name are public. Your phone number
            is disclosed only to a signed-in user who reveals it on your
            listing.
          </li>
          <li>
            <strong>Service providers</strong> who host the site, store the
            database and photographs, and process payments. They act on our
            instructions.
          </li>
          <li>
            <strong>Authorities</strong>, where we are legally required to
            disclose, or where it is necessary to investigate fraud or protect
            someone&apos;s safety.
          </li>
        </ul>

        <h2>4. How long we keep it</h2>
        <ul>
          <li>Account and profile data: until you delete your account.</li>
          <li>
            Listings: while published, and for a period afterwards so that
            disputes about a past tenancy can be looked into.
          </li>
          <li>
            Contact-reveal and payment records: retained for as long as required
            for accounting and legal purposes.
          </li>
        </ul>

        <h2>5. Cookies and local storage</h2>
        <p>We use a small number of strictly functional items:</p>
        <ul>
          <li>
            <strong>Session cookies</strong> that keep you signed in. Deleting
            them signs you out.
          </li>
          <li>
            <strong>A theme preference</strong> stored in your browser so the
            site remembers light or dark. It never leaves your device.
          </li>
        </ul>
        <p>We do not use advertising or cross-site tracking cookies.</p>

        <h2>6. Your rights</h2>
        <p>You can ask us to:</p>
        <ul>
          <li>give you a copy of the personal information we hold about you;</li>
          <li>correct anything inaccurate;</li>
          <li>delete your account and associated personal information;</li>
          <li>stop sending you non-essential messages.</li>
        </ul>
        <p>
          Deleting your account removes your listings from the site. We may keep
          the minimum needed for legal and accounting obligations.
        </p>

        <h2>7. Security</h2>
        <p>
          Access to the database is restricted by row-level security, so one
          account cannot read another&apos;s private data. Street addresses and
          phone numbers are excluded from the public listing data by design
          rather than by convention. No system is perfectly secure, and we
          cannot guarantee absolute security.
        </p>

        <h2>8. Children</h2>
        <p>
          The site is not intended for anyone under 18, and we do not knowingly
          collect their information.
        </p>

        <h2>9. Changes</h2>
        <p>
          If we change this policy we will update the date at the top of this
          page. Material changes will be notified to signed-in users.
        </p>

        <h2>10. Contact and grievances</h2>
        <p>
          For any privacy question, or to exercise a right above, reach us on{" "}
          <a href={COMPANY.whatsappUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>{" "}
          or by phone at{" "}
          <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>. Other routes are on{" "}
          <Link href="/contact">Contact us</Link>.
        </p>
        {COMPANY.email && (
          <p>
            Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </p>
        )}
        {COMPANY.address && (
          <p>
            Postal address: {COMPANY.address}
          </p>
        )}
      </Prose>
    </PageShell>
  );
}
