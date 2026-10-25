import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CheckCircle,
  Infinity as InfinityIcon,
  LockKeyOpen,
  ShieldCheck,
  Sparkle,
} from "@phosphor-icons/react/ssr";

import { PremiumCheckout } from "@/components/premium-checkout";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import {
  getPremiumPlan,
  getPremiumStatus,
  gstSplit,
  razorpayConfigured,
  safeNext,
} from "@/lib/premium";

export const metadata: Metadata = {
  title: "Premium",
  description:
    "Unlock every owner's phone number for 30 days. One payment, no auto-renewal.",
};

const BENEFITS = [
  {
    icon: InfinityIcon,
    title: "Unlimited owner contacts",
    copy: "Reveal the number on every listing you like for the whole period.",
  },
  {
    icon: LockKeyOpen,
    title: "Unlocked numbers stay yours",
    copy: "Anything you unlock remains visible to you, even after Premium ends.",
  },
  {
    icon: ShieldCheck,
    title: "One payment, no auto-renewal",
    copy: "Pay once by UPI, card or netbanking. Nothing is charged again unless you choose to.",
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function paise(amount: number) {
  return (amount / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  });
}

export default async function PremiumPage({ searchParams }: PageProps<"/premium">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/premium?next=${next}`)}`);
  }

  const [plan, status] = await Promise.all([
    getPremiumPlan(),
    getPremiumStatus(user.id),
  ]);

  const price = plan ? paise(plan.pricePaise) : null;
  const { taxPaise } = gstSplit(plan?.pricePaise ?? 0);
  const freeLeft = Math.max(0, status.freeQuota - status.freeUsed);

  return (
    <>
      <SiteHeader />

      <main className="dark relative flex-1 overflow-hidden bg-background text-foreground">
        {/* Backdrop: the society photo, blurred and dimmed, with a gold glow. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl brightness-[.4] saturate-[.7]"
          style={{ backgroundImage: "url(/hero/society.webp?v=2)" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(50rem_30rem_at_75%_20%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]"
        />

        <div className="relative mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:py-16">
          <Link
            href={next}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3.5 py-2 text-sm font-medium text-white/85 backdrop-blur transition-colors hover:bg-black/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back
          </Link>

          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
            {/* ------------------------------------------------- pitch --- */}
            <div className="[text-shadow:0_1px_12px_rgb(0_0_0/0.6)]">
              <p className="sign-label inline-flex items-center gap-1.5 text-primary">
                <Sparkle size={13} weight="fill" aria-hidden="true" />
                Lelorent Premium
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                Every owner&apos;s number,
                <br />
                for {plan?.durationDays ?? 30} days.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
                Your free account unlocks {status.freeQuota} owner contacts. Premium
                removes the limit, so you can call every owner on your shortlist
                and book visits the same day.
              </p>

              <ul className="mt-9 flex flex-col gap-5">
                {BENEFITS.map(({ icon: Icon, title, copy }) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
                      <Icon size={20} weight="bold" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/65">{copy}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* -------------------------------------------- price card --- */}
            <div className="rounded-2xl border border-primary/25 bg-black/45 p-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl sm:p-8">
              {status.active && status.expiresAt ? (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4">
                  <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-white">You&apos;re Premium</p>
                    <p className="mt-0.5 text-xs text-white/70">
                      Unlimited contacts until {formatDate(status.expiresAt)}.
                      Paying again adds {plan?.durationDays ?? 30} days to that date.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                  <span>Free contacts left</span>
                  <span className="tnum text-sm font-semibold text-white">
                    {freeLeft} of {status.freeQuota}
                  </span>
                </div>
              )}

              <p className="sign-label text-white/60">{plan?.name ?? "Premium"}</p>
              <p className="tnum mt-2 text-5xl font-semibold tracking-tight text-white">
                {price ?? "—"}
                <span className="ml-2 font-sans text-base font-normal text-white/60">
                  / {plan?.durationDays ?? 30} days
                </span>
              </p>
              <p className="mt-2 text-xs text-white/55">
                Includes {paise(taxPaise)} GST. One-time payment, no auto-renewal.
              </p>

              <div className="mt-7">
                {plan && razorpayConfigured() ? (
                  <PremiumCheckout
                    next={next}
                    label={
                      status.active
                        ? `Extend by ${plan.durationDays} days · ${price}`
                        : `Unlock all numbers · ${price}`
                    }
                  />
                ) : (
                  <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
                    Payments are being set up. Please check back shortly.
                  </p>
                )}
              </div>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-[0.6875rem] text-white/50">
                <ShieldCheck size={13} aria-hidden="true" />
                Secure payment by Razorpay · UPI, cards, netbanking
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
