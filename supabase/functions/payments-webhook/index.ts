import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("Received event:", event.type, "env:", env);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object, env);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, env);
        break;
      case "invoice.payment_failed":
        console.log("Payment failed:", event.data.object.id);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  console.log("Checkout completed:", session.id, "mode:", session.mode);
  const userId = session.metadata?.userId;

  if (session.mode === "payment" && userId) {
    // 1-year professional hosting subscription
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // One-time payment — update profile plan
    await supabase.from("profiles").update({
      plan_type: "growth",
      plan_status: "active",
      status: "active",
      plan_renewal_date: oneYearFromNow,
    } as any).eq("user_id", userId);

    // Set subscription_expiry on businesses owned by this user
    await supabase.from("businesses").update({
      subscription_expiry: oneYearFromNow,
      subscription_active: true,
    } as any).eq("owner_id", userId);

    // Record payment
    await supabase.from("payments").insert({
      business_id: userId,
      amount: session.amount_total ? Math.round(session.amount_total / 100) : 0,
      total: session.amount_total ? Math.round(session.amount_total / 100) : 0,
      plan: "growth",
      method: "stripe",
      status: "completed",
      gateway_order_id: session.id,
      activated_at: new Date().toISOString(),
    });

    // ───── REFERRAL CONVERSION ─────
    try {
      await processReferralConversion(userId, session.metadata?.referralDiscountApplied);
    } catch (e) {
      console.error("processReferralConversion failed:", e);
    }

    // Notify admin via Twilio + queue thank-you for client in Outbox
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          event_type: "payment_received",
          payload: {
            business_name: session.customer_details?.name || userId,
            amount: session.amount_total ? Math.round(session.amount_total / 100) : 0,
            plan: "growth",
          },
          client_message: session.customer_details?.phone
            ? {
                to: session.customer_details.phone,
                message: `✅ Payment received — thank you!\n\nYour LeadPe Growth plan is now active. Leads will start flowing to your WhatsApp.\n\nLeadPe Team 🌱`,
                type: "payment_received",
                client_name: session.customer_details?.name || "",
              }
            : undefined,
        }),
      });
    } catch (e) {
      console.error("notify-admin call failed:", e);
    }
  }
}

async function processReferralConversion(payerUserId: string, discountAppliedStr?: string) {
  // Read payer profile to find referral code used
  const { data: payerProfile } = await supabase
    .from("profiles")
    .select("referred_by, business_name, whatsapp_number")
    .eq("user_id", payerUserId)
    .maybeSingle();

  const code = (payerProfile as any)?.referred_by;
  if (!code) {
    // Still clear discount if applied (defensive)
    if (discountAppliedStr) {
      await supabase.from("profiles").update({ referral_discount: 0 } as any).eq("user_id", payerUserId);
    }
    return;
  }

  // Find pending referral row
  const { data: referralRow } = await supabase
    .from("referrals")
    .select("id, referrer_id, referrer_type, status")
    .eq("referee_id", payerUserId)
    .eq("referral_code", code)
    .in("status", ["pending"])
    .maybeSingle();

  if (!referralRow) {
    if (discountAppliedStr) {
      await supabase.from("profiles").update({ referral_discount: 0 } as any).eq("user_id", payerUserId);
    }
    return;
  }

  const REWARD = 100;
  const nowIso = new Date().toISOString();

  // Look up referrer profile
  const { data: referrerProfile } = await supabase
    .from("profiles")
    .select("user_id, role, referral_discount, referral_bonus_total, whatsapp_number")
    .eq("user_id", (referralRow as any).referrer_id)
    .maybeSingle();

  if (!referrerProfile) return;

  const isCoder =
    (referrerProfile as any).role === "vibe_coder" ||
    (referrerProfile as any).role === "developer" ||
    (referralRow as any).referrer_type === "coder";

  if (isCoder) {
    // Add to coder earnings
    await supabase.from("earnings").insert({
      vibe_coder_id: (referrerProfile as any).user_id,
      amount: REWARD,
      type: "referral_bonus",
      month: nowIso.slice(0, 7),
      paid: false,
    } as any);
    await supabase.from("profiles").update({
      referral_bonus_total: ((referrerProfile as any).referral_bonus_total || 0) + REWARD,
    } as any).eq("user_id", (referrerProfile as any).user_id);
  } else {
    // Add credit to business referrer
    await supabase.from("profiles").update({
      referral_discount: ((referrerProfile as any).referral_discount || 0) + REWARD,
    } as any).eq("user_id", (referrerProfile as any).user_id);
  }

  // Mark referral rewarded
  await supabase.from("referrals").update({
    status: "rewarded",
    reward_amount: REWARD,
    converted_at: nowIso,
    rewarded_at: nowIso,
  } as any).eq("id", (referralRow as any).id);

  // Clear payer discount if it was applied
  if (discountAppliedStr) {
    await supabase.from("profiles").update({ referral_discount: 0 } as any).eq("user_id", payerUserId);
  }

  // Notify referrer over WhatsApp
  if ((referrerProfile as any).whatsapp_number) {
    const msg = isCoder
      ? `🎉 Your LeadPe referral converted! ₹${REWARD} bonus added to your earnings.`
      : `🎉 Your LeadPe referral converted! ₹${REWARD} credit added to your account — use it on your next order.`;
    await supabase.from("scheduled_messages").insert({
      to: (referrerProfile as any).whatsapp_number,
      message: msg,
      type: "referral_reward",
      status: "pending",
    } as any);
  }
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = subscription.current_period_start;
  const periodEnd = subscription.current_period_end;

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    product_id: productId,
    price_id: priceId,
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    environment: env,
    updated_at: new Date().toISOString(),
  } as any, { onConflict: "stripe_subscription_id" });

  // Update profile
  await supabase.from("profiles").update({
    plan_type: "growth",
    plan_status: "active",
    status: "active",
    plan_renewal_date: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  } as any).eq("user_id", userId);
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = subscription.current_period_start;
  const periodEnd = subscription.current_period_end;

  await supabase.from("subscriptions").update({
    status: subscription.status,
    product_id: productId,
    price_id: priceId,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  } as any).eq("stripe_subscription_id", subscription.id).eq("environment", env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await supabase.from("subscriptions").update({
    status: "canceled",
    updated_at: new Date().toISOString(),
  } as any).eq("stripe_subscription_id", subscription.id).eq("environment", env);
}
