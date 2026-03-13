import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const navigate = useNavigate();
  const { user, role, loading, authReady } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!authReady || loading) return;

    if (!user) {
      setChecked(true);
      return;
    }

    // Redirect logged-in users to their dashboard
    if (role === "developer" || role === "vibe_coder") {
      navigate("/dev/dashboard", { replace: true });
    } else if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
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

  if (!checked && user) return null;

  return <>{children}</>;
};

export default PublicRoute;