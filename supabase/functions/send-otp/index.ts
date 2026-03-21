import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    if (cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ success: false, message: "Enter a valid 10-digit number." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check duplicate coder account
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", cleanPhone)
      .in("role", ["dev", "vibe_coder", "developer"])
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, message: "Number already registered. Sign in instead." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTP for this phone
    await supabase.from("otp_verifications").delete().eq("phone", cleanPhone);

    // Insert new OTP
    const { error: insertError } = await supabase.from("otp_verifications").insert({
      phone: cleanPhone,
      otp_code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      verified: false,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, message: "Database error. Try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Fast2SMS API key
    const apiKey = Deno.env.get("FAST2SMS_API_KEY");

    console.log("Phone:", cleanPhone);
    console.log("OTP generated:", otp);

    const IS_PRODUCTION = Deno.env.get("ENVIRONMENT") === "production";

    if (!apiKey) {
      console.error("FAST2SMS_API_KEY missing");
      return new Response(
        JSON.stringify({
          success: true,
          test_mode: true,
          test_otp: IS_PRODUCTION ? undefined : otp,
          message: IS_PRODUCTION ? "SMS service unavailable." : "SMS not configured. Test OTP returned.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send SMS via Fast2SMS using "q" (quick) route — no DLT required
    const smsResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message:
          "Your LeadPe verification code is " +
          otp +
          ". Valid for 10 minutes. Do not share with anyone.",
        numbers: cleanPhone,
        flash: 0,
      }),
    });

    const smsResult = await smsResponse.json();
    console.log("Fast2SMS response:", JSON.stringify(smsResult));

    if (!smsResult.return) {
      console.error("SMS failed:", JSON.stringify(smsResult));
      return new Response(
        JSON.stringify({
          success: true,
          test_mode: true,
          test_otp: IS_PRODUCTION ? undefined : otp,
          sms_error: smsResult.message || "SMS delivery failed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sms_sent: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-otp error:", e);
    return new Response(
      JSON.stringify({ success: false, message: (e as Error).message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
