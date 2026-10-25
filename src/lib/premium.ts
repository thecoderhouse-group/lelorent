import Razorpay from "razorpay";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Premium plan, payments and access — server only.
 *
 * Flow:
 *   1. POST /api/premium/order    creates a Razorpay order + PENDING row
 *   2. Razorpay Checkout runs in the browser
 *   3. POST /api/premium/verify   checks the signature, activates the row
 *   4. POST /api/webhooks/razorpay  same activation, server to server, in
 *      case the browser never makes step 3 (tab closed, network drop)
 *
 * Steps 3 and 4 both call activate_subscription(), which is idempotent.
 */

export const PREMIUM_PLAN_CODE = "PREMIUM_1M";
export const PAYMENT_PROVIDER = "razorpay";
/** GST in basis points. Carved out of the price, never added on top. */
export const GST_RATE_BP = 1800;

export type PremiumPlan = {
  name: string;
  description: string | null;
  pricePaise: number;
  durationDays: number;
};

export type PremiumStatus = {
  active: boolean;
  expiresAt: string | null;
  freeUsed: number;
  freeQuota: number;
};

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayClient(): Razorpay {
  if (!razorpayConfigured()) {
    throw new Error("Razorpay keys are not configured");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

/** Same arithmetic as public.gst_split(): base + tax = price. */
export function gstSplit(pricePaise: number, rateBp = GST_RATE_BP) {
  const base = Math.round((pricePaise * 10000) / (10000 + rateBp));
  return { basePaise: base, taxPaise: pricePaise - base };
}

export async function getPremiumPlan(): Promise<PremiumPlan | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("name, description, price_paise, duration_days")
    .eq("code", PREMIUM_PLAN_CODE)
    .maybeSingle();

  if (!data || data.duration_days == null) return null;
  return {
    name: data.name,
    description: data.description,
    pricePaise: data.price_paise,
    durationDays: data.duration_days,
  };
}

export async function getPremiumStatus(userId: string): Promise<PremiumStatus> {
  const admin = createAdminClient();

  const [{ data: sub }, { count }, { data: freePlan }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle(),
    // contact_reveals is closed to users under RLS; the row count per viewer
    // is their used free quota.
    admin
      .from("contact_reveals")
      .select("*", { count: "exact", head: true })
      .eq("viewer_id", userId),
    admin.from("plans").select("reveal_quota").eq("code", "FREE").maybeSingle(),
  ]);

  return {
    active: Boolean(sub),
    expiresAt: sub?.expires_at ?? null,
    freeUsed: count ?? 0,
    freeQuota: freePlan?.reveal_quota ?? 3,
  };
}

export type ActivationResult = {
  result: "ACTIVATED" | "ALREADY_ACTIVE" | "NOT_FOUND" | "NOT_ACTIVATABLE";
  subscriptionId: string | null;
  expiresAt: string | null;
};

/** Idempotent; safe to call from both the verify route and the webhook. */
export async function activateOrder(
  orderId: string,
  paymentId: string,
): Promise<ActivationResult> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("activate_subscription", {
      p_provider: PAYMENT_PROVIDER,
      p_provider_order_id: orderId,
      p_provider_payment_id: paymentId,
    })
    .single<{ result: ActivationResult["result"]; subscription_id: string | null; expires_at: string | null }>();

  if (error) throw new Error(`activate_subscription failed: ${error.message}`);
  return {
    result: data.result,
    subscriptionId: data.subscription_id,
    expiresAt: data.expires_at,
  };
}

/** Only allow same-site relative paths as a post-payment destination. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/search";
  return next;
}
