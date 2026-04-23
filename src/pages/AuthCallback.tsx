import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { claimPendingReferral } from "@/lib/referral";
import { logAuthEvent } from "@/lib/authEvents";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshRole, refreshProfile } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      // Detect Studio intent (Google sign-in initiated from /studio/auth)
      const params = new URLSearchParams(location.search);
      const intent = params.get("intent") || sessionStorage.getItem("oauth_intent") || "";
      const isStudioIntent = intent === "studio";

      await logAuthEvent({
        event: "callback_started",
        intent: intent || null,
        details: { source: params.get("intent") ? "url" : (sessionStorage.getItem("oauth_intent") ? "session" : "none") },
      });

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        await logAuthEvent({
          event: "session_error",
          intent: intent || null,
          error: sessionError?.message || "no session",
        });
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate(isStudioIntent ? "/studio/auth" : "/auth", { replace: true }), 2000);
        return;
      }

      const userId = session.user.id;
      const email = session.user.email ?? null;

      await logAuthEvent({
        event: "intent_detected",
        userId,
        email,
        intent: intent || null,
        details: { isStudioIntent },
      });

      // Attribute referral if a /ref/CODE link was used pre-signup
      try {
        await claimPendingReferral(userId);
      } catch (err) {
        await logAuthEvent({
          event: "referral_claim_failed",
          userId,
          email,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("whatsapp_number, business_name, business_type, city, role")
        .eq("user_id", userId)
        .maybeSingle();

      await logAuthEvent({
        event: existingProfile ? "profile_loaded" : "profile_missing",
        userId,
        email,
        intent: intent || null,
        previousRole: existingProfile?.role ?? null,
      });

      // If Studio intent and profile is fresh-business (default trigger), promote to vibe_coder
      if (isStudioIntent && existingProfile && existingProfile.role === "business") {
        await logAuthEvent({
          event: "role_promotion_attempt",
          userId,
          email,
          intent,
          previousRole: "business",
          newRole: "vibe_coder",
        });

        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ role: "vibe_coder", status: "pending_vetting" })
          .eq("user_id", userId);

        const { error: roleErr } = await supabase
          .from("user_roles")
          .upsert({ user_id: userId, role: "vibe_coder" as never }, { onConflict: "user_id,role" });

        if (profileErr || roleErr) {
          await logAuthEvent({
            event: "role_promotion_failed",
            userId,
            email,
            intent,
            previousRole: "business",
            newRole: "vibe_coder",
            promoted: false,
            error: [profileErr?.message, roleErr?.message].filter(Boolean).join(" | ") || "unknown",
            details: { profileErr: profileErr?.message ?? null, roleErr: roleErr?.message ?? null },
          });
        } else {
          existingProfile.role = "vibe_coder";
          await logAuthEvent({
            event: "role_promotion_success",
            userId,
            email,
            intent,
            previousRole: "business",
            newRole: "vibe_coder",
            promoted: true,
          });
        }
      }

      sessionStorage.removeItem("oauth_intent");

      await refreshRole();
      await refreshProfile();

      let redirectTo: string;

      if (!existingProfile) {
        // Profile auto-created by trigger — wait and retry
        await new Promise(r => setTimeout(r, 1500));
        await refreshProfile();
        redirectTo = isStudioIntent ? "/dev/onboarding" : "/onboarding";
      } else if (existingProfile.role === "admin") {
        redirectTo = "/admin";
      } else if (existingProfile.role === "developer" || existingProfile.role === "vibe_coder") {
        redirectTo = "/dev/dashboard";
      } else {
        // Business user — check profile completeness
        const isComplete = existingProfile.whatsapp_number &&
          existingProfile.business_name &&
          existingProfile.business_type &&
          existingProfile.city;
        redirectTo = isComplete ? "/client/dashboard" : "/onboarding";
      }

      await logAuthEvent({
        event: "redirect",
        userId,
        email,
        intent: intent || null,
        previousRole: existingProfile?.role ?? null,
        redirectTo,
      });

      navigate(redirectTo, { replace: true });
    };

    handleCallback();
  }, [navigate, refreshRole, refreshProfile, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
      <div className="text-center">
        {error ? (
          <p style={{ color: "#ef4444", fontFamily: "DM Sans, sans-serif" }}>{error}</p>
        ) : (
          <>
            <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto mb-4" style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }} />
            <p style={{ color: "#666", fontFamily: "DM Sans, sans-serif", fontSize: 14 }}>Setting up your account...</p>
          </>
        )}
      </div>
    </div>
  );
}
