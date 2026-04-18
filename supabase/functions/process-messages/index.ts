import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const TWOFACTOR_API_KEY = Deno.env.get('TWOFACTOR_API_KEY');
  if (!TWOFACTOR_API_KEY) {
    return new Response(JSON.stringify({ error: "TWOFACTOR_API_KEY is not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: pending, error: fetchErr } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .limit(20);

  if (fetchErr || !pending?.length) {
    return new Response(
      JSON.stringify({ processed: 0, message: fetchErr?.message || "No pending messages" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let sent = 0;
  let failed = 0;

  for (const msg of pending) {
    try {
      const cleanPhone = msg.to.replace(/\D/g, "").slice(-10);
      if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
        throw new Error(`Invalid Indian number: ${msg.to}`);
      }

      const params = new URLSearchParams({
        module: 'TRANS_SMS',
        apikey: TWOFACTOR_API_KEY,
        to: cleanPhone,
        from: 'LEADPE',
        msg: msg.message,
      });

      const res = await fetch(`https://2factor.in/API/R1/?${params.toString()}`, { method: "GET" });
      const data = await res.json();

      if (res.ok && data.Status === 'Success') {
        await supabase
          .from("scheduled_messages")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", msg.id);

        await supabase.from("message_log").insert({
          to_number: cleanPhone,
          message: msg.message,
          message_type: msg.type || "general",
          channel: "sms",
          status: "sent",
          delivery_status: "queued",
          twilio_sid: data.Details || null,
          sent_at: new Date().toISOString(),
        });

        sent++;
        console.log(`✅ SMS sent to ${cleanPhone}: ${data.Details}`);
      } else {
        const errorMsg = data.Details || data.Status || "Unknown 2Factor error";

        await supabase
          .from("scheduled_messages")
          .update({ status: "failed" })
          .eq("id", msg.id);

        await supabase.from("message_log").insert({
          to_number: cleanPhone,
          message: msg.message,
          message_type: msg.type || "general",
          channel: "sms",
          status: "failed",
          delivery_status: "failed",
          error_message: errorMsg,
          sent_at: new Date().toISOString(),
        });

        failed++;
        console.error(`❌ Failed ${cleanPhone}: ${errorMsg}`);
      }
    } catch (e: unknown) {
      await supabase
        .from("scheduled_messages")
        .update({ status: "failed" })
        .eq("id", msg.id);

      await supabase.from("message_log").insert({
        to_number: msg.to,
        message: msg.message,
        message_type: msg.type || "general",
        channel: "sms",
        status: "failed",
        delivery_status: "error",
        error_message: (e as Error).message,
        sent_at: new Date().toISOString(),
      });

      failed++;
      console.error(`❌ Error for ${msg.id}:`, (e as Error).message);
    }
  }

  return new Response(
    JSON.stringify({ processed: pending.length, sent, failed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
