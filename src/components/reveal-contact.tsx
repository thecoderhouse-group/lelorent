"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Lock,
  Phone,
  SpinnerGap,
  WarningCircle,
  Sparkle,
} from "@phosphor-icons/react/ssr";

import { createClient } from "@/lib/supabase/client";

type Status = {
  is_authenticated: boolean;
  is_premium: boolean;
  already_unlocked: boolean;
  used: number;
  quota: number;
  remaining: number;
};

type RevealRow = {
  result: "OK" | "NOT_AUTHENTICATED" | "NOT_FOUND" | "QUOTA_EXCEEDED" | "RATE_LIMITED";
  owner_name: string | null;
  owner_phone: string | null;
  remaining: number | null;
};

const PLAN_PRICE = "₹500";

export function RevealContact({
  listingId,
  ownerName,
}: {
  listingId: string;
  ownerName: string | null;
}) {
  const supabase = createClient();
  const pathname = usePathname();

  const [status, setStatus] = useState<Status | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywalled, setPaywalled] = useState(false);

  /**
   * reveal_status is read-only and costs no credit. Calling reveal_contact
   * just to decide which button to render would spend one on page load.
   */
  useEffect(() => {
    let cancelled = false;

    supabase
      .rpc("reveal_status", { p_listing_id: listingId })
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setStatus(data as Status);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, listingId]);

  async function reveal() {
    setRevealing(true);
    setError(null);

    const { data, error: rpcError } = await supabase
      .rpc("reveal_contact", { p_listing_id: listingId })
      .single();

    setRevealing(false);

    if (rpcError) {
      setError("Could not load the number. Please try again.");
      return;
    }

    const row = data as RevealRow;

    switch (row.result) {
      case "OK":
        setPhone(row.owner_phone);
        setStatus((s) => (s ? { ...s, already_unlocked: true, remaining: row.remaining ?? s.remaining } : s));
        break;
      case "QUOTA_EXCEEDED":
        setPaywalled(true);
        break;
      case "RATE_LIMITED":
        setError("You have unlocked a lot of numbers in the last hour. Try again shortly.");
        break;
      case "NOT_FOUND":
        setError("This listing is no longer available.");
        break;
      case "NOT_AUTHENTICATED":
        setStatus((s) => (s ? { ...s, is_authenticated: false } : s));
        break;
    }
  }

  // --- loading -------------------------------------------------------------
  if (!status) {
    return <div className="h-[3.25rem] animate-pulse rounded-md bg-muted" />;
  }

  // --- signed out ----------------------------------------------------------
  if (!status.is_authenticated) {
    return (
      <div className="flex flex-col gap-2.5">
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-md bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:active:translate-y-0"
        >
          <Lock size={16} weight="bold" aria-hidden="true" />
          Sign in to see owner number
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          {status.quota} owner contacts free when you sign in
        </p>
      </div>
    );
  }

  // --- unlocked ------------------------------------------------------------
  if (phone) {
    return (
      <div className="flex flex-col gap-2.5">
        <a
          href={`tel:${phone}`}
          className="flex items-center justify-center gap-2.5 rounded-md border border-primary/45 bg-accent px-5 py-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Phone size={17} weight="fill" className="text-primary" aria-hidden="true" />
          <span className="tnum text-lg font-semibold text-accent-foreground">
            {phone}
          </span>
        </a>
        <p className="text-center text-xs text-muted-foreground">
          {ownerName ? `${ownerName} · ` : ""}
          {status.is_premium
            ? "Premium, unlimited contacts"
            : `${status.remaining} of ${status.quota} free contacts left`}
        </p>
      </div>
    );
  }

  // --- out of credits ------------------------------------------------------
  if (paywalled || (!status.is_premium && status.remaining <= 0 && !status.already_unlocked)) {
    return (
      <div className="rounded-md border border-primary/40 bg-accent p-4">
        <div className="flex items-start gap-3">
          <Sparkle
            size={18}
            weight="fill"
            className="mt-0.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-accent-foreground">
              You have used all {status.quota} free contacts
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Go premium to unlock every owner number for 30 days. The contacts
              you already unlocked stay yours.
            </p>
          </div>
        </div>

        <Link
          href={`/premium?next=${encodeURIComponent(pathname)}`}
          className="mt-4 flex h-11 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-transform hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:active:translate-y-0"
        >
          Unlock all numbers
          <span className="tnum">{PLAN_PRICE}</span>
          <span className="font-normal opacity-80">/month</span>
        </Link>
      </div>
    );
  }

  // --- can reveal ----------------------------------------------------------
  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={reveal}
        disabled={revealing}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:active:translate-y-0"
      >
        {revealing ? (
          <>
            <SpinnerGap size={16} className="animate-spin" aria-hidden="true" />
            Getting number…
          </>
        ) : (
          <>
            <Phone size={16} weight="fill" aria-hidden="true" />
            Show owner number
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground" aria-live="polite">
        {status.already_unlocked
          ? "You already unlocked this one. Viewing again is free."
          : status.is_premium
            ? "Premium, unlimited contacts"
            : `${status.remaining} of ${status.quota} free contacts left`}
      </p>

      {error && (
        <p
          role="alert"
          className="flex items-center justify-center gap-1.5 text-xs text-destructive"
        >
          <WarningCircle size={13} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
