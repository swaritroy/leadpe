import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, quantity, customerEmail, userId, returnUrl, environment, referralDiscount } = await req.json();
    if (!priceId || typeof priceId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = (environment || 'sandbox') as StripeEnv;
    const stripe = createStripeClient(env);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    // Apply referral discount only on one-time payments via price_data
    const discountRupees = Math.max(0, parseInt(String(referralDiscount || 0), 10) || 0);
    const useDiscount = !isRecurring && discountRupees > 0 && stripePrice.unit_amount;

    let line_items: any;
    if (useDiscount) {
      const discountedAmount = Math.max(0, (stripePrice.unit_amount as number) - discountRupees * 100);
      line_items = [{
        price_data: {
          currency: stripePrice.currency,
          product: stripePrice.product as string,
          unit_amount: discountedAmount,
        },
        quantity: quantity || 1,
      }];
    } else {
      line_items = [{ price: stripePrice.id, quantity: quantity || 1 }];
    }

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded",
      return_url: returnUrl || `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      ...(customerEmail && { customer_email: customerEmail }),
      ...(userId && {
        metadata: {
          userId,
          ...(useDiscount && { referralDiscountApplied: String(discountRupees) }),
        },
        ...(isRecurring && { subscription_data: { metadata: { userId } } }),
      }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
