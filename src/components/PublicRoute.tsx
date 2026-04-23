import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const navigate = useNavigate();
  const { user, role, profile, loading, authReady, refreshRole, refreshProfile } = useAuth();
  const [checked, setChecked] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const promotedRef = useRef(false);

  // Handle post-OAuth studio intent promotion (Google login from /studio/auth lands at "/")
  useEffect(() => {
    if (!authReady || loading || !user || promotedRef.current) return;
    const intent = sessionStorage.getItem("oauth_intent");
    if (intent !== "studio") return;

    promotedRef.current = true;
    sessionStorage.removeItem("oauth_intent");

    (async () => {
      setPromoting(true);
      try {
        const { data: existing } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing && existing.role === "business") {
          await supabase
            .from("profiles")
            .update({ role: "vibe_coder", status: "pending_vetting" })
            .eq("user_id", user.id);
          await supabase
            .from("user_roles")
            .upsert({ user_id: user.id, role: "vibe_coder" as never }, { onConflict: "user_id,role" });
          await refreshRole();
          await refreshProfile();
        }
      } catch (e) {
        console.log("studio promotion failed:", e);
      } finally {
        setPromoting(false);
      }
    })();
  }, [user, authReady, loading, refreshRole, refreshProfile]);

  useEffect(() => {
    if (!authReady || loading || promoting) return;

    if (!user) {
      setChecked(true);
      return;
    }

    // Wait for role to load before deciding — prevents coders being routed as business
    if (!role) return;

    // Clear stale intent for non-studio flows
    if (sessionStorage.getItem("oauth_intent") === "business") {
      sessionStorage.removeItem("oauth_intent");
    }

    // Redirect logged-in users to their dashboard
    if (role === "developer" || role === "vibe_coder") {
      navigate("/dev/dashboard", { replace: true });
    } else if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "business") {
      const isComplete = profile?.whatsapp_number && profile?.business_name && profile?.business_type && profile?.city;
      if (!isComplete) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/client/dashboard", { replace: true });
      }
    }
  }, [user, role, profile, loading, authReady, promoting, navigate]);

  if (!authReady || loading || promoting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }} />
      </div>
    );
  }

  if (!checked && user) return null;

  return <>{children}</>;
};

export default PublicRoute;
