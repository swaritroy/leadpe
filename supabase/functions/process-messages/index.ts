import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Send a single SMS via Fast2SMS Quick route. No DLT, no template approval.
async function sendFast2SmsSms(apiKey: string, phone: string, message: string) {
  const clean = phone.replace(/\D/g, "").slice(-10);
  if (clean.length !== 10 || !/^[6-9]/.test(clean)) {
    return { ok: false, info: `Invalid Indian number: ${phone}` };
  }

  const url = "https://www.fast2sms.com/dev/bulkV2";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "q", // quick SMS — no DLT/template required
      message,
      language: "english",
      flash: 0,
      numbers: clean,
    }),
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(text); } catch { /* keep raw */ }

  const ok = res.ok && data.return === true;
  const info = ok
    ? (Array.isArray((data as { request_id?: string[] }).request_id)
        ? ((data as { request_id: string[] }).request_id[0] || "sent")
        : ((data as { request_id?: string }).request_id || "sent"))
    : (typeof data.message === "string" ? data.message : (text || "Fast2SMS error"));
  return { ok, info };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");

  if (!FAST2SMS_API_KEY) {
    return new Response(JSON.stringify({ error: "FAST2SMS_API_KEY not configured" }), {
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
      const { ok, info } = await sendFast2SmsSms(FAST2SMS_API_KEY, msg.to, msg.message);
      const cleanPhone = msg.to.replace(/\D/g, "").slice(-10);

      if (ok) {
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
          twilio_sid: info,
          sent_at: new Date().toISOString(),
        });

        sent++;
        console.log(`✅ Fast2SMS sent to ${cleanPhone}: ${info}`);
      } else {
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
          error_message: info,
          sent_at: new Date().toISOString(),
        });

        failed++;
        console.error(`❌ Fast2SMS fail ${cleanPhone}: ${info}`);
      }
    } catch (e: unknown) {
      const errMsg = (e as Error).message;
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
        error_message: errMsg,
        sent_at: new Date().toISOString(),
      });

      failed++;
      console.error(`❌ Error for ${msg.id}:`, errMsg);
    }
  }

  return new Response(
    JSON.stringify({ processed: pending.length, sent, failed, provider: "fast2sms" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
