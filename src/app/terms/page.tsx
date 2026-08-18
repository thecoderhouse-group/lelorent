import type { Metadata } from "next";
import Link from "next/link";

import { PageShell, Prose } from "@/components/page-shell";
import { COMPANY, GOVERNING_LAW } from "@/lib/company";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: `The terms on which you may use ${COMPANY.brand} — eligibility, listing rules, contact reveals, payments and liability.`,
};

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms and conditions"
      lede={`The rules for using ${COMPANY.brand}, for renters and owners alike.`}
      updated={COMPANY.lastUpdated}
    >
      <Prose>
        <p>
          These terms are an agreement between you and{" "}
          <strong>{COMPANY.legalName}</strong>, which operates {COMPANY.brand}.
          By using the site you accept them. If you do not, please do not use
          the site.
        </p>

        <h2>1. What Lelorent is</h2>
        <p>
          {COMPANY.brand} is a platform where property owners publish rental
          listings and renters find them. <strong>We are not a broker, an
          agent, or a party to any tenancy.</strong> We do not own, inspect,
          manage or guarantee any property listed here, and we do not verify
          every claim an owner makes about their property.
        </p>
        <p>
          Any agreement you reach — rent, deposit, notice period, the tenancy
          itself — is between you and the other person, and is your
          responsibility to satisfy yourself about.
        </p>

        <h2>2. Eligibility and your account</h2>
        <ul>
          <li>You must be 18 or over and able to enter a contract.</li>
          <li>
            The information you give us must be accurate, and you must keep it
            up to date.
          </li>
          <li>
            You are responsible for activity on your account. Tell us
            immediately if you think someone else has access to it.
          </li>
          <li>One person, one account. Do not share or transfer it.</li>
        </ul>

        <h2>3. Rules for listings</h2>
        <p>If you publish a listing, you confirm that:</p>
        <ul>
          <li>
            you own the property or are otherwise entitled to let it out;
          </li>
          <li>
            the rent, deposit and other charges are stated honestly and in full
            — there are no charges you intend to introduce later;
          </li>
          <li>
            the photographs are of that property, and are recent enough not to
            mislead;
          </li>
          <li>the property is genuinely available on the date you state.</li>
        </ul>
        <p>You must not:</p>
        <ul>
          <li>
            charge or attempt to charge brokerage or a finder&apos;s fee to a
            renter who found you here;
          </li>
          <li>
            list a property you have no connection to, or repost the same
            property to appear more than once;
          </li>
          <li>
            use the platform to collect phone numbers for marketing, or to build
            a lead list;
          </li>
          <li>
            post anything unlawful, or discriminate on any ground prohibited by
            law.
          </li>
        </ul>
        <p>
          Tenant preferences that the site offers as filters — such as food
          preference or suitability for families, students or working
          professionals — must be used to describe the property honestly and not
          as a cover for unlawful discrimination.
        </p>

        <h2>4. Contact reveals, plans and payments</h2>
        <ul>
          <li>
            Owners&apos; contact details are metered. Revealing a contact uses
            one credit from your plan, and the credit is consumed at the moment
            of reveal.
          </li>
          <li>
            A credit pays for the disclosure of the contact detail. It is not a
            promise that the owner will reply, that the property is still free,
            or that you will get the property.
          </li>
          <li>
            Paid plans run for the stated period. Prices may change, but not for
            a period you have already paid for.
          </li>
          <li>
            Payments are handled by our payment provider. Refunds, where they
            apply, are dealt with case by case — contact us.
          </li>
        </ul>

        <h2>5. Acceptable use</h2>
        <p>You must not scrape the site, attempt to breach its security, circumvent plan limits, or use it to harass anyone. We may suspend or remove an account or a listing that breaks these terms.</p>

        <h2>6. Your content</h2>
        <p>
          You keep ownership of what you upload. By posting it you give us
          permission to host, resize and display it for the purpose of running
          and promoting the platform. You are responsible for having the right
          to post it in the first place.
        </p>

        <h2>7. Liability</h2>
        <p>
          The site is provided as it is. To the fullest extent the law allows,
          we are not liable for losses arising from a listing&apos;s accuracy, a
          person&apos;s conduct, a tenancy that does or does not happen, or any
          dealings between users. Nothing here excludes liability that cannot
          lawfully be excluded.
        </p>

        <h2>8. Ending your use</h2>
        <p>
          You may stop using the site and delete your account at any time. We
          may suspend or end access where these terms are broken, or where we
          are required to.
        </p>

        <h2>9. Changes to these terms</h2>
        <p>
          We may update these terms. The date at the top of this page shows when
          they last changed, and continuing to use the site after a change means
          you accept it.
        </p>

        <h2>10. Governing law</h2>
        <p>
          These terms are governed by the laws of {GOVERNING_LAW.country}, and
          disputes are subject to {GOVERNING_LAW.courts}.
        </p>

        <h2>11. Contact</h2>
        <p>
          Reach us on{" "}
          <a href={COMPANY.whatsappUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>{" "}
          or at <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>. Full details on{" "}
          <Link href="/contact">Contact us</Link>. See also our{" "}
          <Link href="/privacy">Privacy policy</Link>.
        </p>
      </Prose>
    </PageShell>
  );
}
