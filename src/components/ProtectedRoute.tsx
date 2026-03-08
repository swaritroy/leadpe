import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "admin" | "business" | "developer" | "vibe_coder";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

const ProtectedRoute = ({ children, allowedRoles, redirectTo }: ProtectedRouteProps) => {
  const { user, role, loading, authReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authReady || loading) return;

    if (!user) {
      const target = redirectTo || (
        allowedRoles?.some(r => r === "developer" || r === "vibe_coder")
          ? "/studio/auth"
          : "/auth"
      );
      navigate(target, { replace: true });
      return;
    }

    if (!role) return; // Still loading role

    if (allowedRoles && !allowedRoles.includes(role)) {
      // Redirect to correct dashboard based on actual role
      if (role === "business") navigate("/client/dashboard", { replace: true });
      else if (role === "developer" || role === "vibe_coder") navigate("/dev/dashboard", { replace: true });
      else if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/", { replace: true });
    }
  }, [user, role, loading, authReady, allowedRoles, redirectTo, navigate, location]);

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }} />
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && role && !allowedRoles.includes(role)) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
