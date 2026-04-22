// Sends formatted WhatsApp + SMS-fallback to admin (9973383902) via DIRECT Twilio REST API,
// and optionally queues a client-facing message into scheduled_messages
// (with whatsapp_url) for manual one-click send from /admin Outbox.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PHONE = "919973383902"; // E.164 without +

function fmt(eventType: string, p: Record<string, any>): string {
  const lines: Record<string, string> = {
    business_signup: `🆕 NEW BUSINESS SIGNUP\n${p.name || "?"} • ${p.city || "?"}\n📱 ${p.phone || "-"}`,
    dev_signup: `👨‍💻 NEW DEV SIGNUP (awaiting approval)\n${p.name || "?"} • ${p.email || "-"}\nCity: ${p.city || "-"}`,
    order_placed: `🛒 NEW ORDER\n${p.business_name || "?"} • ${p.package_id || "?"}\n₹${p.amount || 0} • ${p.city || "-"}`,
    coder_accepted: `✅ BUILD ACCEPTED\nCoder: ${p.coder_name || "?"}\nFor: ${p.business_name || "?"}\nDeadline: ${p.deadline || "48h"}`,
    demo_ready: `🎨 DEMO READY\n${p.business_name || "?"}\n🔗 ${p.demo_url || "-"}`,
    website_live: `🚀 WEBSITE LIVE\n${p.business_name || "?"}\n🔗 ${p.live_url || "-"}`,
    payment_received: `💰 PAYMENT RECEIVED ₹${p.amount || 0}\n${p.business_name || "?"} • ${p.plan || "-"}`,
    new_lead: `🔔 NEW LEAD for ${p.business_name || "?"}\n${p.customer_name || "?"} • ${p.phone || "-"}`,
    revision_requested: `✏️ REVISION REQUESTED (#${p.count || 1})\n${p.business_name || "?"}`,
    deadline_warning: `⏰ DEADLINE ALERT: ${p.business_name || "?"}\n${p.message || ""}`,
    daily_summary: `📊 DAILY SUMMARY\n🆕 Signups: ${p.signups ?? 0}\n🛒 Orders: ${p.orders ?? 0}\n🎨 Demos: ${p.demos ?? 0}\n💰 Payments: ₹${p.payments ?? 0}\n📬 Outbox pending: ${p.outbox ?? 0}`,
    test: `🧪 TEST PING from LeadPe Admin Notifier\n${p.note || "If you received this, Twilio is configured correctly."}`,
  };
  return lines[eventType] || `📢 ${eventType}\n${JSON.stringify(p).slice(0, 300)}`;
}

async function twilioPost(
  accountSid: string,
  authToken: string,
  params: Record<string, string>,
): Promise<{ ok: boolean; sid?: string; err?: string; status?: number }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = btoa(`${accountSid}:${authToken}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, err: `Twilio ${res.status}: ${JSON.stringify(data).slice(0, 400)}` };
  return { ok: true, sid: data.sid };
}

async function sendToAdmin(body: string): Promise<{
  channel: "whatsapp" | "sms" | "none";
  ok: boolean;
  sid?: string;
  err?: string;
}> {
  const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!SID || !TOKEN) {
    return { channel: "none", ok: false, err: "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN" };
  }
  const FROM_WA = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886";

  // 1) Try WhatsApp first
  const wa = await twilioPost(SID, TOKEN, {
    To: `whatsapp:+${ADMIN_PHONE}`,
    From: FROM_WA,
    Body: body,
  });
  if (wa.ok) return { channel: "whatsapp", ok: true, sid: wa.sid };

  // 2) Fallback to SMS
  const FROM_SMS = Deno.env.get("TWILIO_SMS_FROM");
  if (!FROM_SMS) {
    return { channel: "none", ok: false, err: `WA failed: ${wa.err}; no TWILIO_SMS_FROM set` };
  }
  const smsBody =
    body +
    "\n\n(SMS fallback — WA sandbox may have expired. Re-join: send 'join <code>' to +1 415 523 8886)";
  const sms = await twilioPost(SID, TOKEN, {
    To: `+${ADMIN_PHONE}`,
    From: FROM_SMS,
    Body: smsBody,
  });
  if (sms.ok) return { channel: "sms", ok: true, sid: sms.sid };
  return { channel: "none", ok: false, err: `WA: ${wa.err} | SMS: ${sms.err}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { event_type, payload = {}, client_message } = await req.json();
    if (!event_type) {
      return new Response(JSON.stringify({ error: "event_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Send to admin via direct Twilio (WhatsApp → SMS fallback)
    const adminBody = fmt(event_type, payload);
    const sent = await sendToAdmin(adminBody);

    // Log admin send
    await supabase.from("message_log").insert({
      to_number: ADMIN_PHONE,
      channel: sent.channel === "none" ? "whatsapp" : sent.channel,
      message_type: event_type,
      message: adminBody,
      status: sent.ok ? "sent" : "failed",
      delivery_status: sent.ok ? "queued" : "failed",
      twilio_sid: sent.sid ?? null,
      error_message: sent.err ?? null,
      sent_at: new Date().toISOString(),
    });

    // 2) Optionally queue a client-facing message for manual send from Outbox
    let queued_id: string | null = null;
    if (client_message && client_message.to && client_message.message) {
      const cleanPhone = String(client_message.to).replace(/\D/g, "");
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(client_message.message)}`;
      const { data: row } = await supabase
        .from("scheduled_messages")
        .insert({
          to: cleanPhone,
          message: client_message.message,
          type: client_message.type || event_type,
          status: "queued_for_admin",
          recipient_type: "client",
          client_name: client_message.client_name || null,
          event_type,
          whatsapp_url: waUrl,
          business_id: client_message.business_id || null,
        })
        .select("id")
        .single();
      queued_id = row?.id ?? null;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        admin_sent: sent.ok,
        channel: sent.channel,
        queued_id,
        error: sent.err,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("notify-admin error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
