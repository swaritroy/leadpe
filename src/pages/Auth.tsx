import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (role === "developer") navigate("/dev/dashboard", { replace: true });
      else if (role === "business") navigate("/client/dashboard", { replace: true });
      else if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/select-role", { replace: true });
    }
  }, [user, role, loading, navigate]);

  const handleGoogleLogin = async () => {
    await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-8 rounded-2xl border bg-card shadow-lg text-center"
      >
        <div className="hexagon-clip bg-gradient-hero w-12 h-12 flex items-center justify-center mx-auto mb-4">
          <Zap size={20} className="text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-1">SYNAPSE SHIFT</h1>
        <p className="text-sm text-muted-foreground mb-8">Sign in to your account</p>

        <Button
          onClick={handleGoogleLogin}
          className="w-full h-12 text-base font-semibold bg-gradient-hero text-primary-foreground border-0 hover:opacity-90"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
      </motion.div>
    </div>
  );
};

export default Auth;
