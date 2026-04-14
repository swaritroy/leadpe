import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors"

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { phone } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cleanPhone = phone.toString().replace(/\D/g, "").slice(-10);

    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ success: false, message: "Enter a valid 10-digit Indian mobile number." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", cleanPhone)
      .in("role", ["dev", "vibe_coder", "developer"])
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, message: "This number is already registered. Sign in instead." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otp = (100000 + (array[0] % 900000)).toString();

    await supabase.from("otp_verifications").delete().eq("phone", cleanPhone);

    const { error: insertError } = await supabase.from("otp_verifications").insert({
      phone: cleanPhone,
      otp_code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      verified: false,
    });

    if (insertError) {
      console.error("OTP insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, message: "Database error. Try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioSmsFrom = Deno.env.get('TWILIO_SMS_FROM') || Deno.env.get('TWILIO_WHATSAPP_FROM')?.replace('whatsapp:', '') || '+14155238886';
    const IS_PRODUCTION = Deno.env.get("ENVIRONMENT") === "production";

    console.log("Phone:", cleanPhone);
    console.log("OTP generated successfully");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error("Missing Twilio credentials");
      if (IS_PRODUCTION) {
        return new Response(
          JSON.stringify({ success: false, message: "SMS service unavailable. Try again later." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, test_mode: true, test_otp: otp, message: "SMS not configured. Test OTP returned." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    console.log("Sending OTP via Twilio API...");
    let smsSent = false;

    try {
      const smsResponse = await fetch(TWILIO_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: `+91${cleanPhone}`,
          From: twilioSmsFrom,
          Body: `Your LeadPe verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
        }),
      });

      const smsResult = await smsResponse.json();
      console.log("Twilio SMS response:", JSON.stringify(smsResult));

      if (smsResponse.ok && smsResult.sid) {
        smsSent = true;
        console.log("SMS sent successfully:", smsResult.sid);
      } else {
        console.error("Twilio SMS failed:", JSON.stringify(smsResult));
      }
    } catch (smsErr) {
      console.error("SMS API call failed:", smsErr);
    }

    if (smsSent) {
      return new Response(
        JSON.stringify({ success: true, sms_sent: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.error("SMS sending failed");

    if (IS_PRODUCTION) {
      return new Response(
        JSON.stringify({ success: false, message: "SMS failed. Try again in a minute." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, test_mode: true, test_otp: otp, sms_error: "SMS delivery failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-otp error:", e);
    return new Response(
      JSON.stringify({ success: false, message: (e as Error).message || "Something went wrong. Try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});