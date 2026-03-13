import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LeadPeLogo from "@/components/LeadPeLogo";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[460px]">
        <div className="text-center mb-6">
          <Link to="/"><LeadPeLogo theme="light" size="lg" /></Link>
        </div>

        <div className="bg-white rounded-2xl p-9" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="text-center mb-8">
            <h1 className="text-[26px] font-bold mb-2" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>
              Welcome to LeadPe 👋
            </h1>
            <p className="text-sm" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
              Get your business website in 48 hours
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-[56px] rounded-xl font-semibold text-base transition-all disabled:opacity-60 flex items-center justify-center gap-3"
            style={{ backgroundColor: "#fff", color: "#1A1A1A", fontFamily: "DM Sans, sans-serif", border: "2px solid #E0E0E0" }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-5 h-5 border-2 border-[#E0E0E0] border-t-[#00C853] rounded-full" />
                Connecting...
              </span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google →
              </>
            )}
          </button>

          <p className="text-xs text-center mt-4" style={{ color: "#999", fontFamily: "DM Sans, sans-serif" }}>
            Your data is safe. We never share it.
          </p>
        </div>

        <p className="text-sm text-center mt-6" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
          Are you a website builder?{" "}
          <Link to="/studio/auth" className="font-medium" style={{ color: "#00C853" }}>Join Studio →</Link>
        </p>
      </motion.div>
    </div>
  );
}