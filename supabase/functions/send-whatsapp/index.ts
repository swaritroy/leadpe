import { serve } from 
"https://deno.land/std@0.168.0/http/server.ts"

/*
NOTE: Admin must add these secrets in Supabase dashboard:
Settings → Edge Functions → Secrets:
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
*/

const ALLOWED_ORIGINS = [
  "https://leadpe.lovable.app",
  "https://id-preview--22f543a5-dc93-422b-8514-e3fff158bc80.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...getCorsHeaders(req),
        
        
      }
    })
  }

  try {
    const { to, message } = await req.json()
    
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing to or message parameter' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...getCorsHeaders(req)
          }
        }
      )
    }
    
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    
    if (!accountSid || !authToken) {
      console.error('Missing Twilio credentials in environment')
      throw new Error('Missing Twilio credentials')
    }
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + 
            btoa(`${accountSid}:${authToken}`),
          'Content-Type': 
            'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: 'whatsapp:+14155238886',
          To: `whatsapp:+91${to}`,
          Body: message,
        }),
      }
    )
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Twilio API error:', data)
      throw new Error(data.message || 'Twilio API error')
    }
    
    console.log('WhatsApp message sent successfully:', data.sid)
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...getCorsHeaders(req)
        }
      }
    )
  } catch (error) {
    console.error('Error sending WhatsApp:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message || 'Failed to send WhatsApp'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...getCorsHeaders(req)
        }
      }
    )
  }
})
