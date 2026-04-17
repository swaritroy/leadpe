import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface StudioGuardProps {
  children: React.ReactNode;
}

/**
 * Guards /studio/* (developer/coder) routes.
 * - Unauthenticated → /studio/auth (NOT generic /auth)
 * - Business clients → forced to /client/dashboard
 * - Admin/dev/vibe_coder → allowed
 */
const StudioGuard = ({ children }: StudioGuardProps) => {
  const { user, role, loading, authReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authReady || loading) return;
    if (!user) {
      navigate("/studio/auth", { replace: true });
      return;
    }
    if (!role) return;
    if (role === "business") {
      navigate("/client/dashboard", { replace: true });
    }
  }, [user, role, loading, authReady, navigate]);

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }} />
      </div>
    );
  }
  if (!user || role === "business") return null;
  return <>{children}</>;
};

export default StudioGuard;
