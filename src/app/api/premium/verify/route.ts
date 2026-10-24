import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

import { PAYMENT_PROVIDER, activateOrder, razorpayConfigured } from "@/lib/premium";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

/**
 * Step 3 of checkout: Razorpay hands the browser a signature over
 * order_id|payment_id. Checking it with our key secret proves the payment is
 * genuine; only then is the subscription activated.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Please sign in first." }, { status: 401 });
  }
  if (!razorpayConfigured()) {
    return Response.json({ error: "Payments are not set up." }, { status: 503 });
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  if (!orderId || !paymentId || !signature) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const valid = validatePaymentVerification(
    { order_id: orderId, payment_id: paymentId },
    signature,
    process.env.RAZORPAY_KEY_SECRET!,
  );
  if (!valid) {
    return Response.json(
      { error: "We could not verify this payment." },
      { status: 400 },
    );
  }

  // The order must belong to the signed-in user.
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("provider", PAYMENT_PROVIDER)
    .eq("provider_order_id", orderId)
    .maybeSingle();
  if (!sub || sub.user_id !== user.id) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    const result = await activateOrder(orderId, paymentId);
    if (result.result === "NOT_FOUND" || result.result === "NOT_ACTIVATABLE") {
      return Response.json(
        { error: "This order can no longer be activated." },
        { status: 409 },
      );
    }
    return Response.json({ expiresAt: result.expiresAt });
  } catch (error) {
    console.error("Activation failed", error);
    return Response.json(
      {
        error:
          "Payment received, but activation is delayed. It will complete automatically within a few minutes.",
      },
      { status: 500 },
    );
  }
}
