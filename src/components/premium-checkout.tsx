"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Lightning,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react/ssr";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type OrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
};

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", cb: (e: { error: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

/** Loads Razorpay Checkout once, on first use rather than on page load. */
let checkoutScript: Promise<void> | null = null;
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  checkoutScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutScript = null;
      reject(new Error("Could not load the payment window."));
    };
    document.body.appendChild(script);
  });
  return checkoutScript;
}

type Phase = "idle" | "starting" | "paying" | "verifying" | "done";

export function PremiumCheckout({
  label,
  next,
}: {
  /** Button text, e.g. "Pay ₹500" or "Extend by 30 days · ₹500". */
  label: string;
  /** Where to send the user once Premium is active. */
  next: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  async function verify(response: RazorpaySuccess) {
    setPhase("verifying");
    const res = await fetch("/api/premium/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    });
    const data = (await res.json().catch(() => ({}))) as {
      expiresAt?: string;
      error?: string;
    };

    if (!res.ok) {
      setPhase("idle");
      setError(data.error ?? "We could not confirm the payment.");
      return;
    }

    setExpiresAt(data.expiresAt ?? null);
    setPhase("done");
    router.refresh();
    // A moment to read the confirmation, then back to where they were.
    setTimeout(() => router.push(next), 2200);
  }

  async function start() {
    setError(null);
    setPhase("starting");

    try {
      const [, res] = await Promise.all([
        loadCheckout(),
        fetch("/api/premium/order", { method: "POST" }),
      ]);
      const order = (await res.json()) as OrderResponse & { error?: string };
      if (!res.ok) throw new Error(order.error ?? "Could not start the payment.");
      if (!window.Razorpay) throw new Error("Could not load the payment window.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Lelorent",
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#E3B45A" },
        handler: (response: RazorpaySuccess) => void verify(response),
        modal: {
          ondismiss: () => setPhase((p) => (p === "paying" ? "idle" : p)),
        },
      });
      checkout.on("payment.failed", (e) => {
        setError(e.error.description ?? "The payment did not go through.");
      });

      setPhase("paying");
      checkout.open();
    } catch (e) {
      setPhase("idle");
      setError(e instanceof Error ? e.message : "Could not start the payment.");
    }
  }

  if (phase === "done") {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-5 text-center"
      >
        <CheckCircle size={28} weight="fill" className="text-primary" aria-hidden="true" />
        <p className="text-base font-semibold">You&apos;re Premium</p>
        <p className="text-xs text-muted-foreground">
          {expiresAt
            ? `Unlimited owner contacts until ${new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`
            : "Unlimited owner contacts are on."}{" "}
          Taking you back…
        </p>
      </div>
    );
  }

  const busy = phase !== "idle";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_var(--primary)] transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_16px_36px_-10px_var(--primary)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:translate-y-0"
      >
        {/* Light sweep on hover. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-[300%] motion-reduce:hidden"
        />
        {busy ? (
          <>
            <SpinnerGap size={17} className="animate-spin" aria-hidden="true" />
            {phase === "verifying" ? "Confirming payment…" : "Opening secure checkout…"}
          </>
        ) : (
          <>
            <Lightning size={17} weight="fill" aria-hidden="true" />
            {label}
          </>
        )}
      </button>

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
          <WarningCircle size={14} className="mt-px shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
