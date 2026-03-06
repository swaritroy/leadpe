import { serve } from 
"https://deno.land/std@0.168.0/http/server.ts"

/*
NOTE: Admin must add these secrets in Supabase dashboard:
Settings → Edge Functions → Secrets:
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
*/

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
            'Access-Control-Allow-Origin': '*'
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
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    console.error('Error sending WhatsApp:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send WhatsApp' 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
