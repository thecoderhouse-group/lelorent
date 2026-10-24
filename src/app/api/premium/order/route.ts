import {
  PAYMENT_PROVIDER,
  PREMIUM_PLAN_CODE,
  getPremiumPlan,
  gstSplit,
  razorpayClient,
  razorpayConfigured,
} from "@/lib/premium";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Step 1 of checkout: create a Razorpay order for the Premium plan and record
 * it as a PENDING subscription. The amount always comes from the plans table,
 * never from the request, so the client cannot choose its own price.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Please sign in first." }, { status: 401 });
  }

  if (!razorpayConfigured()) {
    return Response.json(
      { error: "Payments are not set up yet. Please try again later." },
      { status: 503 },
    );
  }

  const plan = await getPremiumPlan();
  if (!plan) {
    return Response.json({ error: "Premium is not available." }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  let order;
  try {
    order = await razorpayClient().orders.create({
      amount: plan.pricePaise,
      currency: "INR",
      // Razorpay caps receipts at 40 characters.
      receipt: `prem_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, plan: PREMIUM_PLAN_CODE },
    });
  } catch (error) {
    console.error("Razorpay order creation failed", error);
    return Response.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 },
    );
  }

  const { taxPaise } = gstSplit(plan.pricePaise);
  const admin = createAdminClient();
  const { error: insertError } = await admin.from("subscriptions").insert({
    user_id: user.id,
    plan_code: PREMIUM_PLAN_CODE,
    status: "PENDING",
    amount_paise: plan.pricePaise,
    tax_paise: taxPaise,
    provider: PAYMENT_PROVIDER,
    provider_order_id: order.id,
  });
  if (insertError) {
    console.error("Could not record pending subscription", insertError);
    return Response.json(
      { error: "Could not start the payment. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({
    orderId: order.id,
    amount: plan.pricePaise,
    currency: "INR",
    // The key id is public by design (Checkout needs it); the secret never
    // leaves the server.
    keyId: process.env.RAZORPAY_KEY_ID,
    description: `${plan.name} · ${plan.durationDays} days`,
    prefill: {
      name: profile?.full_name ?? undefined,
      email: user.email ?? undefined,
      contact: profile?.phone ?? undefined,
    },
  });
}
