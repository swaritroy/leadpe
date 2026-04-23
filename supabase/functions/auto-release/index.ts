import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: string[] = [];

    // ─────────────────────────────────────
    // CASE 0: Auto-assign to admin coder when ≤20h remain
    // (Build requests have a 48h SLA from creation. If still unassigned
    //  with 20h or less left → auto-assign to admin so client gets delivery.)
    // ─────────────────────────────────────
    const ADMIN_CODER_ID = Deno.env.get("ADMIN_CODER_ID");

    if (ADMIN_CODER_ID) {
      // 48h SLA - 20h remaining = older than 28h unassigned
      const cutoff = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString();
      const { data: unassigned } = await supabase
        .from("build_requests")
        .select("*")
        .eq("status", "pending")
        .is("assigned_coder_id", null)
        .lt("created_at", cutoff);

      for (const build of (unassigned || [])) {
        // Auto-assign to admin with the remaining ~20h as the hard deadline
        await supabase
          .from("build_requests")
          .update({
            assigned_coder_id: ADMIN_CODER_ID,
            assigned_coder_name: "Admin Builder",
            status: "building",
            hard_deadline: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", build.id);

        // Get business profile for WhatsApp details
        let businessName = build.business_name || "Unknown";
        let businessType = build.business_type || "N/A";
        let city = build.city || "N/A";

        if (build.business_id) {
          const { data: bizProfile } = await supabase
            .from("profiles")
            .select("full_name, business_type, city")
            .eq("user_id", build.business_id)
            .maybeSingle();
          if (bizProfile) {
            businessName = bizProfile.full_name || businessName;
            businessType = bizProfile.business_type || businessType;
            city = bizProfile.city || city;
          }
        }

        // Alert admin via WhatsApp
        try {
          await supabase.functions.invoke("send-whatsapp", {
            body: {
              to: "919973383902",
              message:
                "🔔 AUTO-ASSIGNED TO YOU\n" +
                "Business: " + businessName + "\n" +
                "Type: " + businessType + "\n" +
                "City: " + city + "\n" +
                "You have 47 hours.\n" +
                "Accept now: leadpe.online/studio"
            }
          });
        } catch (e) {
          console.error("WhatsApp error:", e);
        }

        results.push(`Auto-assigned to admin: ${businessName}`);
      }
    }

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

      if (penalisedCoder) {
        await supabase.from("coder_penalties").insert({
          coder_id: penalisedCoder,
          reason: "missed_deadline",
          build_request_id: build.id
        });
      }

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
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Auto-release error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
