import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";

import { PAYMENT_PROVIDER, activateOrder } from "@/lib/premium";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentEntity = { id: string; order_id: string | null };
type WebhookEvent = {
  event: string;
  payload?: { payment?: { entity?: PaymentEntity } };
};

/**
 * Server-to-server confirmation from Razorpay. Backs up the browser's verify
 * call: if the user closes the tab right after paying, this still activates
 * Premium. Configure in Razorpay Dashboard → Webhooks with the events
 * payment.captured, order.paid and payment.failed, pointing at
 * <site>/api/webhooks/razorpay, and the same secret as RAZORPAY_WEBHOOK_SECRET.
 *
 * Always answer 2xx for events we understand or ignore; Razorpay retries
 * anything else, and activation is idempotent so a retry is harmless.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // The signature covers the exact raw body, so read text, not JSON.
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !validateWebhookSignature(raw, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as WebhookEvent;
  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) {
    return Response.json({ ok: true, ignored: true });
  }

  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const result = await activateOrder(payment.order_id, payment.id);
      return Response.json({ ok: true, result: result.result });
    }

    if (event.event === "payment.failed") {
      // Only a still-pending order is marked failed; a later successful retry
      // on the same order can still activate it.
      await createAdminClient()
        .from("subscriptions")
        .update({ status: "FAILED" })
        .eq("provider", PAYMENT_PROVIDER)
        .eq("provider_order_id", payment.order_id)
        .eq("status", "PENDING");
      return Response.json({ ok: true });
    }
  } catch (error) {
    console.error("Razorpay webhook handling failed", error);
    // 500 so Razorpay retries.
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ ok: true, ignored: true });
}
