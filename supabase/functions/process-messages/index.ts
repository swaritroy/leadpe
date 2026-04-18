import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Sends a single SMS via MSG91. Returns { ok, info }.
async function sendMsg91Sms(authKey: string, senderId: string, phone: string, message: string) {
  // MSG91 expects 91XXXXXXXXXX (no +)
  const clean = phone.replace(/\D/g, "").slice(-10);
  if (clean.length !== 10 || !/^[6-9]/.test(clean)) {
    return { ok: false, info: `Invalid Indian number: ${phone}` };
  }
  const to = `91${clean}`;

  const url = `https://api.msg91.com/api/v2/sendsms`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authkey": authKey,
    },
    body: JSON.stringify({
      sender: senderId,
      route: "4", // transactional
      country: "91",
      sms: [{ message, to: [to] }],
    }),
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(text); } catch { /* keep raw */ }

  const ok = res.ok && (data.type === "success" || (typeof data.message === "string" && (data.message as string).length > 10));
  return { ok, info: ok ? (data.message as string) || "sent" : (text || "MSG91 error") };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY");
  const MSG91_SENDER_ID = Deno.env.get("MSG91_SENDER_ID") || "LEADPE";

  if (!MSG91_AUTH_KEY) {
    return new Response(JSON.stringify({ error: "MSG91_AUTH_KEY not configured" }), {
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
      const { ok, info } = await sendMsg91Sms(MSG91_AUTH_KEY, MSG91_SENDER_ID, msg.to, msg.message);
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
        console.log(`✅ MSG91 SMS sent to ${cleanPhone}: ${info}`);
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
        console.error(`❌ MSG91 fail ${cleanPhone}: ${info}`);
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
    JSON.stringify({ processed: pending.length, sent, failed, provider: "msg91" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
