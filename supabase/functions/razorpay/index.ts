import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://leadpe.lovable.app",
  "https://id-preview--22f543a5-dc93-422b-8514-e3fff158bc80.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

async function createRazorpayOrder(amount: number, receipt: string, notes: Record<string, string>) {
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amount * 100, currency: "INR", receipt, notes }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }
  return res.json();
}

async function verifySignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(RAZORPAY_KEY_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const data = new TextEncoder().encode(`${orderId}|${paymentId}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { action, ...body } = await req.json();

    if (action === "create_order") {
      const { amount, receipt, notes } = body;
      if (!amount || amount < 1) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const order = await createRazorpayOrder(amount, receipt || "leadpe", notes || {});
      return new Response(
        JSON.stringify({ order_id: order.id, amount: order.amount, key_id: RAZORPAY_KEY_ID }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (action === "verify_payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_db_id, order_db_id, is_order_payment } = body;

      const valid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature", verified: false }), {
          status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // ═══ IDEMPOTENCY CHECK ═══
      // Prevent double processing if webhook fires multiple times
      const { data: existingPayment } = await supabase.from("payments")
        .select("id")
        .eq("gateway_order_id", razorpay_order_id)
        .eq("status", "paid")
        .maybeSingle();

      if (existingPayment) {
        console.log("⚡ Payment already processed, skipping:", razorpay_order_id);
        return new Response(
          JSON.stringify({ verified: true, payment_id: razorpay_payment_id, already_processed: true }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // ═══ STEP 1: Update payment record ═══
      if (payment_db_id) {
        await supabase.from("payments").update({
          status: "paid",
          gateway_order_id: razorpay_order_id,
          method: "razorpay",
          activated_at: new Date().toISOString(),
        }).eq("id", payment_db_id);
      }

      // ═══ STEP 2: Update order ═══
      if (is_order_payment && order_db_id) {
        await supabase.from("orders").update({
          payment_status: "paid",
          payment_received_at: new Date().toISOString(),
          status: "paid",
        }).eq("id", order_db_id);
      }

      const userId = body.user_id;
      let buildRequest: any = null;
      let ownerProfile: any = null;

      if (userId) {
        const { data: brData } = await supabase.from("build_requests")
          .select("*").eq("business_id", userId)
          .order("created_at", { ascending: false }).limit(1).single();
        buildRequest = brData;

        const { data: profileData } = await supabase.from("profiles")
          .select("*").eq("user_id", userId).single();
        ownerProfile = profileData;
      }

      // ═══ STEP 3: Activate user profile ═══
      if (userId) {
        const subdomain = ownerProfile?.subdomain || ownerProfile?.business_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "";
        const liveUrl = subdomain ? `https://${subdomain}.leadpe.tech` : "";
        
        await supabase.from("profiles").update({
          status: "active",
          subscription_plan: body.plan || "growth",
          plan_type: body.plan || "growth",
          plan_status: "active",
          website_status: "live",
          site_url: liveUrl || undefined,
          subdomain: subdomain || undefined,
        }).eq("user_id", userId);
      }

      // ═══ STEP 4: Deploy live version with custom domain ═══
      if (buildRequest) {
        const subdomain = ownerProfile?.subdomain || ownerProfile?.business_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "";

        // Trigger live deployment via deploy-website function
        if (subdomain && buildRequest.github_url) {
          try {
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
            const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

            await fetch(`${SUPABASE_URL}/functions/v1/deploy-website`, {
              method: "POST",
              headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "deploy_live",
                data: {
                  buildRequestId: buildRequest.id,
                  subdomain,
                  userId,
                },
              }),
            });
            console.log("✅ Live deployment triggered for", subdomain);
          } catch (deployErr) {
            console.error("Live deploy trigger error (non-blocking):", deployErr);
          }
        }

        // Update build_requests to live (fallback if deploy_live takes time)
        const customDomain = ownerProfile?.subdomain ? `https://${ownerProfile.subdomain}.leadpe.tech` : buildRequest.deploy_url;
        await supabase.from("build_requests").update({
          status: "live",
          deploy_url: customDomain,
          deployed_at: new Date().toISOString(),
        }).eq("id", buildRequest.id);

        // ═══ STEP 5: WhatsApp to business owner ═══
        if (ownerProfile?.whatsapp_number) {
          try {
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
            const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const liveUrlMsg = ownerProfile.subdomain ? `${ownerProfile.subdomain}.leadpe.tech` : "your dashboard";

            await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
              method: "POST",
              headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                to: ownerProfile.whatsapp_number.replace(/\D/g, ""),
                message: `🎉 Your website is LIVE!\nVisit: ${liveUrlMsg}\nCustomers can now find you on Google!`,
              }),
            });
          } catch (waErr) {
            console.error("WhatsApp to owner error:", waErr);
          }
        }

        // ═══ STEP 6: Coder earnings (with idempotency) ═══
        if (buildRequest.assigned_coder_id) {
          // Check if already credited
          const { data: existingEarning } = await supabase.from("earnings")
            .select("id")
            .eq("deployment_id", buildRequest.id)
            .eq("vibe_coder_id", buildRequest.assigned_coder_id)
            .maybeSingle();

          if (!existingEarning) {
            const coderAmount = buildRequest.coder_earning || Math.round((buildRequest.package_price || 800) * 0.60);

            await supabase.from("earnings").insert({
              vibe_coder_id: buildRequest.assigned_coder_id,
              deployment_id: buildRequest.id,
              amount: coderAmount,
              type: "building",
              month: new Date().toISOString().slice(0, 7),
              paid: false,
              created_at: new Date().toISOString(),
            });

            // Update coder profile totals
            const { data: coderProfile } = await supabase.from("profiles")
              .select("*").eq("user_id", buildRequest.assigned_coder_id).single();

            if (coderProfile) {
              await supabase.from("profiles").update({
                total_earned: ((coderProfile as any).total_earned || 0) + coderAmount,
                total_sites_built: ((coderProfile as any).total_sites_built || 0) + 1,
                total_sites_live: ((coderProfile as any).total_sites_live || 0) + 1,
                monthly_passive: (((coderProfile as any).total_sites_live || 0) + 1) * 30,
              }).eq("user_id", buildRequest.assigned_coder_id);

              // WhatsApp to coder
              if ((coderProfile as any).whatsapp_number) {
                try {
                  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
                  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
                  await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: (coderProfile as any).whatsapp_number.replace(/\D/g, ""),
                      message: `💰 ₹${coderAmount} earned! Build completed. Payout within 24 hours.`,
                    }),
                  });
                } catch (coderWaErr) {
                  console.error("WhatsApp to coder error:", coderWaErr);
                }
              }
            }
          } else {
            console.log("⚡ Coder earning already credited for build:", buildRequest.id);
          }
        }
      }

      return new Response(
        JSON.stringify({ verified: true, payment_id: razorpay_payment_id }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
