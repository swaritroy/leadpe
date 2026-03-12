import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (mounted) setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!mounted) return;

      const role = profile?.role;
      if (role === "developer" || role === "vibe_coder" || role === "dev" || role === "coder") {
        navigate("/dev/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/client/dashboard", { replace: true });
      }
    };

    checkSession();
    
    return () => { mounted = false; };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }} />
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicRoute;
