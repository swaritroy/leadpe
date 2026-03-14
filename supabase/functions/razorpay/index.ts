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

      // Activate user profile (both plan and order payments)
      if (body.user_id) {
        await supabase.from("profiles").update({
          status: "active",
          subscription_plan: body.plan || "growth",
          plan_status: "active",
          website_status: "live",
        }).eq("user_id", body.user_id);
      }

      // ──────────────────────────────────────────────
      // STEP 1: Trigger Vercel redeployment (demo → live)
      // ──────────────────────────────────────────────
      const userId = body.user_id;
      let buildRequest: any = null;
      let ownerProfile: any = null;

      if (userId) {
        // Fetch the build_request for this user
        const { data: brData } = await supabase
          .from("build_requests")
          .select("*")
          .eq("business_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        buildRequest = brData;

        // Fetch the owner's profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        ownerProfile = profileData;
      }

      if (buildRequest) {
        const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
        const VERCEL_API = "https://api.vercel.com";

        if (VERCEL_TOKEN) {
          try {
            // Derive the Vercel project name (same pattern as deploy-website function)
            const bName = (buildRequest.business_name || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20);
            const bCity = (buildRequest.city || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 10);
            const projectName = `leadpe-${bName}-${bCity}`.replace(/-+/g, "-").replace(/-$/, "");

            const vercelHeaders = {
              Authorization: `Bearer ${VERCEL_TOKEN}`,
              "Content-Type": "application/json",
            };

            // Fetch existing project to get its ID
            const projectResp = await fetch(`${VERCEL_API}/v9/projects/${projectName}`, { headers: vercelHeaders });
            const projectData = await projectResp.json();

            if (projectResp.ok && projectData.id) {
              // Update env var VITE_LEADPE_MODE to "live"
              // First, try to find existing env var
              const envResp = await fetch(`${VERCEL_API}/v9/projects/${projectData.id}/env`, { headers: vercelHeaders });
              const envData = await envResp.json();
              const existingEnv = envData.envs?.find((e: any) => e.key === "VITE_LEADPE_MODE");

              if (existingEnv) {
                // PATCH existing env var
                await fetch(`${VERCEL_API}/v9/projects/${projectData.id}/env/${existingEnv.id}`, {
                  method: "PATCH",
                  headers: vercelHeaders,
                  body: JSON.stringify({ value: "live", target: ["production"] }),
                });
              } else {
                // Create new env var
                await fetch(`${VERCEL_API}/v10/projects/${projectData.id}/env`, {
                  method: "POST",
                  headers: vercelHeaders,
                  body: JSON.stringify([{ key: "VITE_LEADPE_MODE", value: "live", type: "plain", target: ["production"] }]),
                });
              }

              // Trigger redeployment from GitHub
              if (buildRequest.github_url) {
                const cleaned = buildRequest.github_url.replace("https://", "").replace("http://", "").replace("github.com/", "");
                const parts = cleaned.split("/").filter(Boolean);
                const githubOrg = parts[0];
                const githubRepo = parts[1]?.replace(".git", "");

                if (githubOrg && githubRepo) {
                  const deployResp = await fetch(`${VERCEL_API}/v13/deployments`, {
                    method: "POST",
                    headers: vercelHeaders,
                    body: JSON.stringify({
                      name: projectName,
                      gitSource: { type: "github", org: githubOrg, repo: githubRepo, ref: "main" },
                      projectSettings: { framework: "vite", buildCommand: "npm run build", outputDirectory: "dist" },
                    }),
                  });
                  const deployData = await deployResp.json();
                  console.log("✅ Live redeployment triggered:", deployData.id || deployData.url);
                }
              }
            }
          } catch (vercelErr) {
            console.error("Vercel redeployment error (non-blocking):", vercelErr);
          }
        }

        // Update build_requests to "live"
        await supabase.from("build_requests").update({
          status: "live",
          deployed_at: new Date().toISOString(),
        }).eq("id", buildRequest.id);

        // ──────────────────────────────────────────────
        // STEP 2: Send WhatsApp to business owner
        // ──────────────────────────────────────────────
        if (ownerProfile?.whatsapp_number) {
          try {
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
            const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

            const whatsappMsg = `🎉 Your website is LIVE! Customers can now find you. Visit your dashboard to see them.`;

            await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SERVICE_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: ownerProfile.whatsapp_number.replace(/\D/g, ""),
                message: whatsappMsg,
              }),
            });
            console.log("✅ WhatsApp sent to business owner:", ownerProfile.whatsapp_number);
          } catch (waErr) {
            console.error("WhatsApp to owner error (non-blocking):", waErr);
          }
        }

        // ──────────────────────────────────────────────
        // STEP 3: Log coder earning + WhatsApp to coder
        // ──────────────────────────────────────────────
        if (buildRequest.assigned_coder_id) {
          const packagePrice = buildRequest.package_price || buildRequest.coder_earning || 800;
          const coderAmount = Math.round(packagePrice * 0.80);

          // Insert earnings record
          await supabase.from("earnings").insert({
            vibe_coder_id: buildRequest.assigned_coder_id,
            deployment_id: buildRequest.id,
            amount: coderAmount,
            type: "building_fee",
            month: new Date().toISOString().slice(0, 7),
            paid: false,
            created_at: new Date().toISOString(),
          });

          // Update coder profile totals
          const { data: coderProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", buildRequest.assigned_coder_id)
            .single();

          if (coderProfile) {
            await supabase.from("profiles").update({
              total_earned: ((coderProfile as any).total_earned || 0) + coderAmount,
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
                  headers: {
                    Authorization: `Bearer ${SERVICE_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    to: (coderProfile as any).whatsapp_number.replace(/\D/g, ""),
                    message: `₹${coderAmount} earned! Payout in 1 hour.`,
                  }),
                });
                console.log("✅ WhatsApp sent to coder:", (coderProfile as any).whatsapp_number);
              } catch (coderWaErr) {
                console.error("WhatsApp to coder error (non-blocking):", coderWaErr);
              }
            }
          }
        }
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
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
