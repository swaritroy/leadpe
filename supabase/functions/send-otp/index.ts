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

    // Send OTP via 2Factor.in API (GET request)
    const apiKey = Deno.env.get("TWOFACTOR_API_KEY");
    const templateName = Deno.env.get("TWOFACTOR_TEMPLATE_NAME") || "LeadPe-OTP";
    const IS_PRODUCTION = Deno.env.get("ENVIRONMENT") === "production";

    console.log("Phone:", cleanPhone);
    console.log("OTP generated (will not log in production)");

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

    const smsUrl = `https://2factor.in/API/V1/${apiKey}/SMS/${cleanPhone}/AUTOGEN/${templateName}`;
    console.log("Calling 2Factor API...");

    const smsResponse = await fetch(smsUrl);
    const smsResult = await smsResponse.json();
    console.log("2Factor response:", JSON.stringify(smsResult));

    if (smsResult.Status === "Success") {
      return new Response(
        JSON.stringify({ success: true, sms_sent: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SMS failed
    console.error("2Factor SMS failed:", smsResult.Details || JSON.stringify(smsResult));

    if (IS_PRODUCTION) {
      return new Response(
        JSON.stringify({ success: false, message: "SMS failed. Try again." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Non-production fallback: return test OTP
    return new Response(
      JSON.stringify({ success: true, test_mode: true, test_otp: otp, sms_error: smsResult.Details || "SMS delivery failed" }),
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
