import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors"

// Renamed in spirit: now sends SMS via 2Factor.in (kept function name for backward compat).
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

    const TWOFACTOR_API_KEY = Deno.env.get('TWOFACTOR_API_KEY');
    if (!TWOFACTOR_API_KEY) throw new Error('TWOFACTOR_API_KEY is not configured');

    // Clean phone -> 10-digit Indian
    const cleanPhone = to.toString().replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Indian mobile number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2Factor Transactional SMS API
    const url = `https://2factor.in/API/R1/`;
    const params = new URLSearchParams({
      module: 'TRANS_SMS',
      apikey: TWOFACTOR_API_KEY,
      to: cleanPhone,
      from: 'LEADPE',
      msg: message,
    });

    const response = await fetch(`${url}?${params.toString()}`, { method: 'GET' });
    const data = await response.json();

    if (!response.ok || data.Status !== 'Success') {
      console.error('2Factor SMS error:', data);
      throw new Error(data.Details || `2Factor API error [${response.status}]`);
    }

    console.log('SMS sent successfully to', cleanPhone, ':', data.Details);

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
