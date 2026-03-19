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

    const now = Date.now();
    const results: string[] = [];

    // 1. Release builds with no GitHub submission in 48 hours
    const cutoff48h = new Date(now - 48 * 60 * 60 * 1000).toISOString();
    const { data: staleBuilds } = await supabase
      .from("build_requests")
      .select("*")
      .eq("status", "building")
      .is("github_url", null)
      .lt("created_at", cutoff48h);

    if (staleBuilds && staleBuilds.length > 0) {
      for (const build of staleBuilds) {
        // Release back to pool
        await supabase
          .from("build_requests")
          .update({
            assigned_coder_id: null,
            assigned_coder_name: null,
            status: "pending",
          })
          .eq("id", build.id);

        // Record penalty
        if (build.assigned_coder_id) {
          await supabase.from("coder_penalties").insert({
            coder_id: build.assigned_coder_id,
            reason: "missed_deadline",
            build_request_id: build.id,
          });
        }

        // Notify business via WhatsApp
        if (build.owner_whatsapp) {
          try {
            await supabase.functions.invoke("send-whatsapp", {
              body: {
                to: build.owner_whatsapp,
                message:
                  "We are finding a faster builder for your website. No delay to your timeline.",
              },
            });
          } catch (e) {
            console.error("WhatsApp error:", e);
          }
        }

        results.push(`Released stale build: ${build.business_name} (${build.id})`);
      }
    }

    // 2. Alert admin for requests with no accept after 24 hours
    const cutoff24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const { data: unaccepted } = await supabase
      .from("build_requests")
      .select("*")
      .eq("status", "pending")
      .is("assigned_coder_id", null)
      .lt("created_at", cutoff24h);

    if (unaccepted && unaccepted.length > 0) {
      for (const build of unaccepted) {
        try {
          await supabase.functions.invoke("send-whatsapp", {
            body: {
              to: "919973383902",
              message: `⚠️ No builder accepted: ${build.business_name} after 24 hours. Manual action needed.`,
            },
          });
        } catch (e) {
          console.error("Admin WhatsApp error:", e);
        }
        results.push(`Alerted admin for unaccepted: ${build.business_name}`);
      }
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
