import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    return new Response(JSON.stringify({ error: "Missing Twilio credentials" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch all pending messages
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
      // Format phone number
      let toNumber = msg.to.replace(/\D/g, "");
      if (toNumber.length === 10) toNumber = "91" + toNumber;
      if (!toNumber.startsWith("91")) toNumber = "91" + toNumber;

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: twilioFrom,
            To: `whatsapp:+${toNumber}`,
            Body: msg.message,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Update scheduled message
        await supabase
          .from("scheduled_messages")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", msg.id);

        // Log to message_log with tracking
        await supabase.from("message_log").insert({
          to_number: toNumber,
          message: msg.message,
          message_type: msg.type || "general",
          channel: "whatsapp",
          status: "sent",
          delivery_status: data.status || "queued",
          twilio_sid: data.sid,
          sent_at: new Date().toISOString(),
        });

        sent++;
        console.log(`✅ Sent to ${toNumber}: ${data.sid} (status: ${data.status})`);
      } else {
        const errorMsg = data.message || data.more_info || "Unknown Twilio error";
        
        await supabase
          .from("scheduled_messages")
          .update({ status: "failed" })
          .eq("id", msg.id);

        // Log failure to message_log
        await supabase.from("message_log").insert({
          to_number: toNumber,
          message: msg.message,
          message_type: msg.type || "general",
          channel: "whatsapp",
          status: "failed",
          delivery_status: "failed",
          error_message: errorMsg,
          sent_at: new Date().toISOString(),
        });

        failed++;
        console.error(`❌ Failed ${toNumber}: ${errorMsg}`);
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
        channel: "whatsapp",
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
