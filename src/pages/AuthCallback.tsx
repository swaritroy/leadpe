import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshRole, refreshProfile } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for auth session to be established
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError("Authentication failed. Please try again.");
        setTimeout(() => navigate("/auth", { replace: true }), 2000);
        return;
      }

      const userId = session.user.id;

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("whatsapp_number, role")
        .eq("user_id", userId)
        .maybeSingle();

      await refreshRole();
      await refreshProfile();

      if (!existingProfile) {
        // Profile should be auto-created by trigger, wait a moment and retry
        await new Promise(r => setTimeout(r, 1500));
        await refreshProfile();
        navigate("/get-website", { replace: true });
        return;
      }

      // Check role - if admin or dev, redirect appropriately
      if (existingProfile.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }
      if (existingProfile.role === "developer" || existingProfile.role === "vibe_coder") {
        navigate("/dev/dashboard", { replace: true });
        return;
      }

      // Business user - check if they have WhatsApp number (completed onboarding)
      if (!existingProfile.whatsapp_number) {
        navigate("/get-website", { replace: true });
      } else {
        navigate("/client/dashboard", { replace: true });
      }
    };

    handleCallback();
  }, [navigate, refreshRole, refreshProfile]);

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