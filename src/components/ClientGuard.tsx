import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ClientGuardProps {
  children: React.ReactNode;
}

/**
 * Guards /client/* (business owner) routes.
 * - Unauthenticated → /auth
 * - Coders → forced to /dev/dashboard
 * - Admin → forced to /admin
 * - Business → allowed
 */
const ClientGuard = ({ children }: ClientGuardProps) => {
  const { user, role, loading, authReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authReady || loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!role) return;
    if (role === "developer" || role === "vibe_coder") {
      navigate("/dev/dashboard", { replace: true });
    } else if (role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, role, loading, authReady, navigate]);

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }} />
      </div>
    );
  }
  if (!user || (role && role !== "business")) return null;
  return <>{children}</>;
};

export default ClientGuard;
