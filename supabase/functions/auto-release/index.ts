import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: string[] = [];

    // ─────────────────────────────────────
    // CASE 1: No accept after 24 hours — alert admin once
    // ─────────────────────────────────────
    const { data: unaccepted } = await supabase
      .from("build_requests")
      .select("*")
      .eq("status", "pending")
      .is("assigned_coder_id", null)
      .eq("admin_notified", false)
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    for (const build of (unaccepted || [])) {
      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: "919973383902",
            message:
              "🚨 NO BUILDER ALERT\n" +
              "Business: " + build.business_name + "\n" +
              "Type: " + build.business_type + "\n" +
              "City: " + build.city + "\n" +
              "Package: " + build.package_id + "\n" +
              "24 hours passed.\n" +
              "No coder accepted.\n" +
              "Build manually: leadpe.online/admin"
          }
        });
      } catch (e) {
        console.error("WhatsApp error:", e);
      }

      await supabase
        .from("build_requests")
        .update({ admin_notified: true })
        .eq("id", build.id);

      results.push(`Admin notified for: ${build.business_name}`);
    }

    // ─────────────────────────────────────
    // CASE 2: Hard deadline expired — no coder accepted in 48 hours
    // ─────────────────────────────────────
    const { data: expired } = await supabase
      .from("build_requests")
      .select("*")
      .eq("status", "pending")
      .is("assigned_coder_id", null)
      .lt("hard_deadline", new Date().toISOString());

    for (const build of (expired || [])) {
      await supabase
        .from("build_requests")
        .update({ status: "expired" })
        .eq("id", build.id);

      // Update business profile
      if (build.business_id) {
        await supabase
          .from("profiles")
          .update({ website_status: "expired" })
          .eq("user_id", build.business_id);
      }

      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: "919973383902",
            message:
              "⛔ ORDER EXPIRED\n" +
              "Business: " + build.business_name + "\n" +
              "City: " + build.city + "\n" +
              "48 hours passed. No builder.\n" +
              "Client will see reorder option.\n" +
              "Consider building manually."
          }
        });
      } catch (e) {
        console.error("WhatsApp error:", e);
      }

      results.push(`Expired: ${build.business_name}`);
    }

    // ─────────────────────────────────────
    // CASE 3: Coder accepted but missed build deadline
    // ─────────────────────────────────────
    const { data: stale } = await supabase
      .from("build_requests")
      .select("*")
      .eq("status", "building")
      .is("github_url", null)
      .lt("hard_deadline", new Date().toISOString());

    for (const build of (stale || [])) {
      const penalisedCoder = build.assigned_coder_id;

      // Release back to pool with 4hr emergency window
      await supabase
        .from("build_requests")
        .update({
          assigned_coder_id: null,
          assigned_coder_name: null,
          status: "pending",
          admin_notified: false,
          hard_deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        })
        .eq("id", build.id);

      // Penalty for coder
      if (penalisedCoder) {
        await supabase.from("coder_penalties").insert({
          coder_id: penalisedCoder,
          reason: "missed_deadline",
          build_request_id: build.id
        });
      }

      // Alert admin
      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: "919973383902",
            message:
              "🚨 CODER MISSED DEADLINE\n" +
              "Business: " + build.business_name + "\n" +
              "4 hour emergency window open.\n" +
              "Build manually NOW:\n" +
              "leadpe.online/admin"
          }
        });
      } catch (e) {
        console.error("WhatsApp error:", e);
      }

      // Apologise to business
      if (build.owner_whatsapp) {
        try {
          await supabase.functions.invoke("send-whatsapp", {
            body: {
              to: build.owner_whatsapp,
              message:
                "We sincerely apologise for the delay on your website.\n" +
                "We are personally ensuring it is ready within 4 hours.\n" +
                "— LeadPe Team"
            }
          });
        } catch (e) {
          console.error("WhatsApp error:", e);
        }
      }

      results.push(`Released stale build: ${build.business_name}`);
    }

    console.log("Auto-release results:", JSON.stringify(results));

    return new Response(
      JSON.stringify({ success: true, actions: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Auto-release error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
