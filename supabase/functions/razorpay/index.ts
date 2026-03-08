import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

async function createRazorpayOrder(amount: number, receipt: string, notes: Record<string, string>) {
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amount * 100, // paise
      currency: "INR",
      receipt,
      notes,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }
  return res.json();
}

async function verifySignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(RAZORPAY_KEY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = new TextEncoder().encode(`${orderId}|${paymentId}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...body } = await req.json();

    if (action === "create_order") {
      const { amount, receipt, notes } = body;
      if (!amount || amount < 1) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const order = await createRazorpayOrder(amount, receipt || "leadpe", notes || {});
      return new Response(
        JSON.stringify({ order_id: order.id, amount: order.amount, key_id: RAZORPAY_KEY_ID }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify_payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_db_id, order_db_id, is_order_payment } = body;
      
      const valid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature", verified: false }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update payment record
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      if (payment_db_id) {
        await supabase.from("payments").update({
          status: "paid",
          gateway_order_id: razorpay_order_id,
          method: "razorpay",
          activated_at: new Date().toISOString(),
        }).eq("id", payment_db_id);
      }

      // If it's an order payment, update the order
      if (is_order_payment && order_db_id) {
        await supabase.from("orders").update({
          payment_status: "paid",
          payment_received_at: new Date().toISOString(),
          status: "paid",
        }).eq("id", order_db_id);
      }

      // If it's a plan payment, activate user profile
      if (!is_order_payment && body.user_id) {
        await supabase.from("profiles").update({
          status: "active",
          subscription_plan: body.plan || "growth",
          plan_status: "active",
        }).eq("user_id", body.user_id);
      }

      return new Response(
        JSON.stringify({ verified: true, payment_id: razorpay_payment_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
