import type { Metadata } from "next";
import Link from "next/link";
import { ChatCircleText, InstagramLogo, Phone } from "@phosphor-icons/react/ssr";

import { PageShell, Prose } from "@/components/page-shell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with ${COMPANY.brand}. Reach us on phone or WhatsApp at ${COMPANY.phone}, or on Instagram.`,
};

function Channel({
  icon: Icon,
  label,
  value,
  href,
  note,
  external,
}: {
  icon: React.ComponentType<{ size?: number; weight?: "bold"; className?: string }>;
  label: string;
  value: string;
  href: string;
  note: string;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="group flex items-start gap-4 rounded-lg border border-border bg-gradient-to-br from-secondary via-card to-card px-4 py-4 no-underline shadow-soft transition-[border-color,transform,box-shadow] duration-200 ease-out hover:border-primary/50 hover:shadow-lift active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:active:translate-y-0"
      >
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon size={16} weight="bold" />
        </span>
        <span className="min-w-0">
          <span className="sign-label block text-muted-foreground">{label}</span>
          <span className="mt-1.5 block text-sm font-semibold text-foreground">
            {value}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">{note}</span>
        </span>
      </a>
    </li>
  );
}

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact us"
      title="Talk to us"
      lede="One team, no call centre. The fastest route is WhatsApp."
    >
      <Prose>
        <ul className="!flex !flex-col !gap-3 !pl-0 [&>li]:!list-none">
          <Channel
            icon={ChatCircleText}
            label="WhatsApp"
            value={COMPANY.phone}
            href={COMPANY.whatsappUrl}
            note="Best for anything about a specific listing — send us the link."
            external
          />
          <Channel
            icon={Phone}
            label="Phone"
            value={COMPANY.phone}
            href={COMPANY.phoneHref}
            note="Same number. Call if it is urgent."
          />
          <Channel
            icon={InstagramLogo}
            label="Instagram"
            value={COMPANY.instagram}
            href={COMPANY.instagramUrl}
            note="General enquiries and updates."
            external
          />
        </ul>

        {COMPANY.email && (
          <>
            <h2>Email</h2>
            <p>
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </p>
          </>
        )}

        {COMPANY.address && (
          <>
            <h2>Address</h2>
            <p>{COMPANY.address}</p>
          </>
        )}

        <h2>What to contact us about</h2>
        <ul>
          <li>
            <strong>A listing looks wrong or fake.</strong> Send the link. We
            take these seriously — misleading listings are exactly what the
            product exists to avoid.
          </li>
          <li>
            <strong>An owner is asking for brokerage.</strong> They should not
            be. Tell us and we will look into the listing.
          </li>
          <li>
            <strong>Your account, contact reveals or a subscription.</strong>{" "}
            Include the email address you signed in with.
          </li>
          <li>
            <strong>A privacy request</strong> — a copy of your data, a
            correction, or deletion. See our{" "}
            <Link href="/privacy">Privacy policy</Link>.
          </li>
        </ul>

        <h2>What we cannot help with</h2>
        <p>
          We are not a party to your tenancy. We cannot negotiate rent, mediate
          a deposit dispute, or enforce an agreement between you and an owner.
          Where a listing or a user breaks our{" "}
          <Link href="/terms">Terms and conditions</Link>, we can act on the
          listing or the account.
        </p>

        <h2>Company</h2>
        <p>
          {COMPANY.brand} is operated by <strong>{COMPANY.legalName}</strong>.
        </p>
      </Prose>
    </PageShell>
  );
}
