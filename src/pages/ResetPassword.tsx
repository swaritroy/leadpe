import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import LeadPeLogo from "@/components/LeadPeLogo";
import SEO from "@/components/SEO";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase recovery link sets a session via URL hash; wait for it.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // Also check existing session in case it was already set.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (pw !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (updErr) { setError(updErr.message); return; }
    setSuccess(true);
    setTimeout(() => navigate("/auth", { replace: true }), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
      <SEO title="Reset Password | LeadPe" description="Set a new password for your LeadPe account." path="/reset-password" noindex />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
        <div className="text-center mb-6">
          <Link to="/"><LeadPeLogo theme="light" size="lg" /></Link>
        </div>
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Syne, sans-serif", color: "#1A1A1A" }}>Set a new password</h1>
          <p className="text-sm mb-6" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
            Choose a strong password (at least 6 characters).
          </p>

          {!ready && !success && (
            <div className="p-3 rounded-xl text-sm text-center mb-4" style={{ backgroundColor: "rgba(0,200,83,0.08)", color: "#00863a", border: "1px solid rgba(0,200,83,0.25)", fontFamily: "DM Sans, sans-serif" }}>
              Verifying your reset link...
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "DM Sans, sans-serif" }}>
              {error}
            </div>
          )}

          {success ? (
            <div className="p-4 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(0,200,83,0.08)", color: "#00863a", border: "1px solid rgba(0,200,83,0.25)", fontFamily: "DM Sans, sans-serif" }}>
              Password updated. Redirecting to sign in...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: "#444", fontFamily: "DM Sans, sans-serif" }}>New password</label>
                <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} disabled={!ready} className="h-[48px] rounded-xl text-base" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: "#444", fontFamily: "DM Sans, sans-serif" }}>Confirm password</label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!ready} className="h-[48px] rounded-xl text-base" placeholder="Re-enter password" />
              </div>
              <button type="submit" disabled={!ready || loading}
                className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60"
                style={{ backgroundColor: "#00C853", color: "#fff", fontFamily: "DM Sans, sans-serif" }}>
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}

          <p className="text-xs text-center mt-6" style={{ color: "#999", fontFamily: "DM Sans, sans-serif" }}>
            <Link to="/auth" style={{ color: "#00C853" }}>← Back to sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
