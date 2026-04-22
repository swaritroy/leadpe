import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

interface StudioGuardProps {
  children: React.ReactNode;
}

/**
 * Guards /studio/* (developer/coder) routes.
 * - Unauthenticated → /studio/auth
 * - Business clients → forced to /client/dashboard
 * - Admins → always allowed
 * - Developers/vibe_coders → require vetting_status = 'approved'
 */
const StudioGuard = ({ children }: StudioGuardProps) => {
  const { user, role, loading, authReady } = useAuth();
  const navigate = useNavigate();
  const [vettingStatus, setVettingStatus] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [vettingChecked, setVettingChecked] = useState(false);

  useEffect(() => {
    if (!authReady || loading) return;
    if (!user) {
      navigate("/studio/auth", { replace: true });
      return;
    }
    if (!role) return;
    if (role === "business") {
      navigate("/client/dashboard", { replace: true });
      return;
    }
    if (role === "admin") {
      setVettingChecked(true);
      return;
    }
    // Developer / vibe_coder → check onboarding + approval
    supabase
      .from("profiles")
      .select("vetting_status, onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const complete = !!data?.onboarding_complete;
        setVettingStatus(data?.vetting_status ?? "pending_vetting");
        setOnboardingComplete(complete);
        setVettingChecked(true);

        // If onboarding not done, force them to /dev/onboarding (unless already there)
        if (!complete && window.location.pathname !== "/dev/onboarding") {
          navigate("/dev/onboarding", { replace: true });
        }
      });
  }, [user, role, loading, authReady, navigate]);

  if (!authReady || loading || !vettingChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }} />
      </div>
    );
  }
  if (!user || role === "business") return null;

  // Allow access to onboarding page regardless of approval status
  const isOnboardingRoute = window.location.pathname === "/dev/onboarding";

  // Developer who completed onboarding but not yet approved → waiting screen
  if (role !== "admin" && onboardingComplete && vettingStatus !== "approved" && !isOnboardingRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#FFF4E5" }}>
            <Clock className="w-8 h-8" style={{ color: "#F59E0B" }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#111111" }}>
            Awaiting Admin Approval
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#666" }}>
            Thanks for completing onboarding! Our team is reviewing your profile and test site.
            You'll get a WhatsApp message the moment you're approved — usually within 24 hours.
          </p>
          <div className="text-xs px-4 py-3 rounded-lg" style={{ backgroundColor: "#F5FFF7", color: "#00863F" }}>
            Status: <strong>{vettingStatus === "rejected" ? "Not Approved" : "Pending Review"}</strong>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => navigate("/"))}
            className="mt-6 text-sm underline"
            style={{ color: "#00C853" }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default StudioGuard;
