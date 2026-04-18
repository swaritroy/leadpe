import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// PAUSED: SMS/WhatsApp sending is temporarily disabled while we finalize the
// notification provider. Messages still queue into scheduled_messages, but this
// worker no-ops them so nothing actually goes out (and no provider charges hit).
// To re-enable: restore the Fast2SMS / MSG91 / WhatsApp send block below.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Mark any stuck pending messages as 'paused' so the queue doesn't grow forever.
  const { data: pending } = await supabase
    .from("scheduled_messages")
    .select("id")
    .eq("status", "pending")
    .limit(50);

  if (pending?.length) {
    const ids = pending.map((m) => m.id);
    await supabase
      .from("scheduled_messages")
      .update({ status: "paused" })
      .in("id", ids);
  }

  return new Response(
    JSON.stringify({
      processed: pending?.length ?? 0,
      provider: "paused",
      note: "SMS/WhatsApp sending is paused. Messages remain queued in scheduled_messages.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
