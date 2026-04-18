import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors"

// Sends SMS via Fast2SMS Quick route (no DLT required). Function name kept for backward compat.
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

    const FAST2SMS_API_KEY = Deno.env.get('FAST2SMS_API_KEY');
    if (!FAST2SMS_API_KEY) throw new Error('FAST2SMS_API_KEY is not configured');

    const cleanPhone = to.toString().replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Indian mobile number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message,
        language: "english",
        flash: 0,
        numbers: cleanPhone,
      }),
    });
    const data = await response.json();

    if (!response.ok || data.return !== true) {
      console.error('Fast2SMS error:', data);
      throw new Error(data.message || `Fast2SMS API error [${response.status}]`);
    }

    console.log('SMS sent to', cleanPhone, ':', JSON.stringify(data));

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || 'Failed to send SMS' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
