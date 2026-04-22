import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Sends WhatsApp (preferred) or SMS via Twilio. Function name kept for backward compat.
// Bypasses Fast2SMS (which requires a ₹100 prepaid recharge).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function twilioPost(
  sid: string,
  token: string,
  params: Record<string, string>,
): Promise<{ ok: boolean; sid?: string; err?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, err: `Twilio ${res.status}: ${JSON.stringify(data).slice(0, 300)}` };
  return { ok: true, sid: data.sid };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { to, message } = await req.json();
    if (!to || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing to or message parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!SID || !TOKEN) throw new Error('TWILIO credentials not configured');

    const FROM_WA = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886';
    const FROM_SMS = Deno.env.get('TWILIO_SMS_FROM');

    const digits = to.toString().replace(/\D/g, '');
    // Normalize Indian numbers to E.164 (+91...)
    const e164 = digits.length === 10 ? `+91${digits}` : `+${digits}`;

    // 1) Try WhatsApp
    const wa = await twilioPost(SID, TOKEN, {
      To: `whatsapp:${e164}`,
      From: FROM_WA,
      Body: message,
    });
    if (wa.ok) {
      console.log('WhatsApp sent to', e164, wa.sid);
      return new Response(
        JSON.stringify({ success: true, channel: 'whatsapp', sid: wa.sid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Fallback to SMS if configured
    if (FROM_SMS) {
      const sms = await twilioPost(SID, TOKEN, {
        To: e164,
        From: FROM_SMS,
        Body: message,
      });
      if (sms.ok) {
        console.log('SMS sent to', e164, sms.sid);
        return new Response(
          JSON.stringify({ success: true, channel: 'sms', sid: sms.sid }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`WA failed: ${wa.err} | SMS failed: ${sms.err}`);
    }

    throw new Error(wa.err || 'WhatsApp send failed and no SMS fallback configured');
  } catch (error) {
    console.error('send-whatsapp error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || 'Failed to send' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
