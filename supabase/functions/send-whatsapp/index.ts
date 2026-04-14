import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message } = await req.json()

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing to or message parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    if (!TWILIO_ACCOUNT_SID) throw new Error('TWILIO_ACCOUNT_SID is not configured');

    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!TWILIO_AUTH_TOKEN) throw new Error('TWILIO_AUTH_TOKEN is not configured');

    const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886';

    // Clean phone number
    let toNumber = to.toString().replace(/\D/g, '');
    if (toNumber.length === 10) toNumber = '91' + toNumber;
    if (!toNumber.startsWith('91')) toNumber = '91' + toNumber;

    const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(TWILIO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioFrom,
        To: `whatsapp:+${toNumber}`,
        Body: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);
      throw new Error(data.message || `Twilio API error [${response.status}]`);
    }

    console.log('WhatsApp message sent successfully:', data.sid);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || 'Failed to send WhatsApp' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})