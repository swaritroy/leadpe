import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed =
    /\.lovable\.app$/.test(origin) ||
    /\.lovableproject\.com$/.test(origin) ||
    origin === "https://leadpe.tech" ||
    /\.leadpe\.tech$/.test(origin);
  const allowedOrigin = isAllowed ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: getCorsHeaders(req) });

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
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
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
        JSON.stringify({ success: false, error: "already_exists", message: "This number is already registered. Sign in instead." }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
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
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886';
    const IS_PRODUCTION = Deno.env.get("ENVIRONMENT") === "production";

    console.log("Phone:", cleanPhone);
    console.log("OTP generated successfully");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error("Missing Twilio credentials");
      if (IS_PRODUCTION) {
        return new Response(
          JSON.stringify({ success: false, message: "OTP service unavailable. Try again later." }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, test_mode: true, test_otp: otp, message: "Twilio not configured. Test OTP returned." }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    console.log("Sending OTP via WhatsApp...");
    let whatsappSent = false;

    try {
      const waResponse = await fetch(TWILIO_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: `whatsapp:+91${cleanPhone}`,
          From: twilioFrom,
          Body: `🔐 Your LeadPe verification code is: *${otp}*\n\nValid for 10 minutes. Do not share this code with anyone.`,
        }),
      });

      const waResult = await waResponse.json();
      console.log("Twilio WhatsApp response:", JSON.stringify(waResult));

      if (waResponse.ok && waResult.sid) {
        whatsappSent = true;
        console.log("WhatsApp OTP sent successfully:", waResult.sid);
      } else {
        console.error("Twilio WhatsApp failed:", JSON.stringify(waResult));
      }
    } catch (waErr) {
      console.error("WhatsApp API call failed:", waErr);
    }

    if (whatsappSent) {
      return new Response(
        JSON.stringify({ success: true, whatsapp_sent: true }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.error("WhatsApp OTP sending failed");

    if (IS_PRODUCTION) {
      return new Response(
        JSON.stringify({ success: false, message: "OTP delivery failed. Please try again in a minute." }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, test_mode: true, test_otp: otp, whatsapp_error: "WhatsApp delivery failed" }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-otp error:", e);
    return new Response(
      JSON.stringify({ success: false, message: (e as Error).message || "Something went wrong. Try again." }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
