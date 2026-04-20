// Auto-send ONLY to admin (9973383902). All other recipients stay queued
// in scheduled_messages with status='queued_for_admin' for manual send via /admin Outbox.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_PHONE = "919973383902";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

async function sendWA(to: string, body: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY")!;
  const FROM = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886";
  const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: `whatsapp:+${to}`, From: FROM, Body: body }),
  });
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, sid: d.sid, err: res.ok ? null : JSON.stringify(d) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: pending } = await supabase
    .from("scheduled_messages")
    .select("id, to, message")
    .eq("status", "pending")
    .limit(50);

  let sent = 0, queued = 0;
  for (const m of pending ?? []) {
    const clean = String(m.to).replace(/\D/g, "");
    if (clean === ADMIN_PHONE) {
      const r = await sendWA(clean, m.message);
      await supabase.from("scheduled_messages").update({
        status: r.ok ? "sent" : "failed",
        sent_at: new Date().toISOString(),
      }).eq("id", m.id);
      sent++;
    } else {
      const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent(m.message)}`;
      await supabase.from("scheduled_messages").update({
        status: "queued_for_admin",
        recipient_type: "client",
        whatsapp_url: waUrl,
      }).eq("id", m.id);
      queued++;
    }
  }

  return new Response(
    JSON.stringify({ processed: pending?.length ?? 0, sent_to_admin: sent, queued_for_admin: queued }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
