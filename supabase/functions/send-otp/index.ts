import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": 
  "authorization, x-client-info, apikey, content-type",
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

    // Validate phone — must be exactly 10 digits
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Enter a valid 10-digit number." 
        }),
        { headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }}
      );
    }

    // Check if number already registered
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", cleanPhone)
      .limit(1)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "This number is already registered. Please sign in." 
        }),
        { headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }}
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Delete any existing OTP for this phone
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("phone", cleanPhone);

    // Insert new OTP with 10 minute expiry
    await supabase
      .from("otp_verifications")
      .insert({
        phone: cleanPhone,
        otp_code: otp,
        expires_at: new Date(
          Date.now() + 10 * 60 * 1000
        ).toISOString(),
        verified: false,
      });

    // Send SMS via Fast2SMS
    const smsResponse = await fetch(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        method: "POST",
        headers: {
          authorization: Deno.env.get("FAST2SMS_API_KEY")!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: cleanPhone,
        }),
      }
    );

    const smsResult = await smsResponse.json();

    if (!smsResult.return) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "SMS failed. Try again." 
        }),
        { headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }}
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      }}
    );

  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: err 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }
      }
    );
  }
});
