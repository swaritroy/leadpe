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

    const TWOFACTOR_API_KEY = Deno.env.get("TWOFACTOR_API_KEY");
    const TWOFACTOR_TEMPLATE = Deno.env.get("TWOFACTOR_TEMPLATE_NAME") || "OTP1";
    const IS_PRODUCTION = Deno.env.get("ENVIRONMENT") === "production";

    console.log("Phone:", cleanPhone, "| OTP generated");

    if (!TWOFACTOR_API_KEY) {
      console.error("Missing TWOFACTOR_API_KEY");
      if (IS_PRODUCTION) {
        return new Response(
          JSON.stringify({ success: false, message: "OTP service unavailable. Try again later." }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, test_mode: true, test_otp: otp, message: "2Factor not configured. Test OTP returned." }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // 2Factor.in SMS OTP API
    const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${cleanPhone}/${otp}/${TWOFACTOR_TEMPLATE}`;
    let smsSent = false;
    let smsError: string | null = null;

    try {
      const res = await fetch(url, { method: "GET" });
      const data = await res.json();
      console.log("2Factor response:", JSON.stringify(data));

      if (res.ok && data.Status === "Success") {
        smsSent = true;
      } else {
        smsError = data.Details || data.Status || "2Factor API error";
        console.error("2Factor failed:", smsError);
      }
    } catch (err) {
      smsError = (err as Error).message;
      console.error("2Factor API call failed:", err);
    }

    // Log to message_log
    await supabase.from("message_log").insert({
      to_number: cleanPhone,
      message: `OTP: ${otp}`,
      message_type: "otp",
      channel: "sms",
      status: smsSent ? "sent" : "failed",
      delivery_status: smsSent ? "queued" : "failed",
      error_message: smsError,
      sent_at: new Date().toISOString(),
    });

    if (smsSent) {
      return new Response(
        JSON.stringify({ success: true, sms_sent: true }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (IS_PRODUCTION) {
      return new Response(
        JSON.stringify({ success: false, message: "OTP delivery failed. Please try again in a minute." }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, test_mode: true, test_otp: otp, sms_error: smsError }),
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
