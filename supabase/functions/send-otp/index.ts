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

    // Clean phone number — last 10 digits only
    const cleanPhone = phone.toString().replace(/\D/g, "").slice(-10);

    // Validate: exactly 10 digits starting with 6-9
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ success: false, message: "Enter a valid 10-digit Indian mobile number." }),
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
        JSON.stringify({ success: false, message: "This number is already registered. Sign in instead." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTP for this phone
    await supabase.from("otp_verifications").delete().eq("phone", cleanPhone);

    // Insert new OTP (expires in 10 minutes)
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

    // Send OTP via 2Factor.in API — use ADDON_SERVICES for guaranteed TEXT SMS
    // The /SMS/ route falls back to voice call if DLT template is not registered
    const apiKey = Deno.env.get("TWOFACTOR_API_KEY");
    const IS_PRODUCTION = Deno.env.get("ENVIRONMENT") === "production";

    console.log("Phone:", cleanPhone);
    console.log("OTP generated successfully");

    if (!apiKey) {
      console.error("TWOFACTOR_API_KEY missing");
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

    // Use 2Factor ADDON_SERVICES/SEND/TSMS for explicit TEXT SMS (not voice)
    // This sends a transactional SMS that doesn't require DLT template
    const smsUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${apiKey}&to=${cleanPhone}&from=LEADPE&templatename=LeadPe-OTP&var1=${otp}`;
    
    console.log("Calling 2Factor Transactional SMS API...");
    
    let smsResult: any;
    let smsSent = false;

    try {
      const smsResponse = await fetch(smsUrl);
      smsResult = await smsResponse.json();
      console.log("2Factor TSMS response:", JSON.stringify(smsResult));
      
      if (smsResult.Status === "Success") {
        smsSent = true;
      }
    } catch (smsErr) {
      console.error("TSMS API call failed:", smsErr);
    }

    // If transactional SMS failed, try the standard OTP route with AUTOGEN2
    // AUTOGEN2 forces TEXT SMS (AUTOGEN without 2 may use voice)
    if (!smsSent) {
      console.log("TSMS failed, trying standard SMS OTP route...");
      const fallbackUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${cleanPhone}/${otp}`;
      
      try {
        const fallbackResponse = await fetch(fallbackUrl);
        smsResult = await fallbackResponse.json();
        console.log("2Factor fallback response:", JSON.stringify(smsResult));
        
        if (smsResult.Status === "Success") {
          smsSent = true;
        }
      } catch (fallbackErr) {
        console.error("Fallback SMS failed:", fallbackErr);
      }
    }

    if (smsSent) {
      return new Response(
        JSON.stringify({ success: true, sms_sent: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All SMS methods failed
    console.error("All SMS methods failed:", JSON.stringify(smsResult));

    if (IS_PRODUCTION) {
      return new Response(
        JSON.stringify({ success: false, message: "SMS failed. Try again in a minute." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Non-production fallback: return test OTP
    return new Response(
      JSON.stringify({ success: true, test_mode: true, test_otp: otp, sms_error: smsResult?.Details || "SMS delivery failed" }),
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
