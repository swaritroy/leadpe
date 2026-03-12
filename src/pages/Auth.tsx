import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import LeadPeLogo from "@/components/LeadPeLogo";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TRIAL_DAYS } from "@/lib/constants";

export default function Auth() {
  const navigate = useNavigate();
  const { refreshRole, refreshProfile } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState("");

  // Sign in fields
  const [siPhone, setSiPhone] = useState("");
  const [siPw, setSiPw] = useState("");

  // Sign up fields
  const [suName, setSuName] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suPw, setSuPw] = useState("");
  const [suCpw, setSuCpw] = useState("");

  const redirectByRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const role = roleData?.role || "business";
    await refreshRole();
    await refreshProfile();

    if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "developer" || role === "vibe_coder") navigate("/dev/dashboard", { replace: true });
    else navigate("/client/dashboard", { replace: true });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = siPhone.replace(/\D/g, "");
    if (digits.length !== 10) { setError("Please enter a valid 10-digit number."); return; }
    if (!siPw) { setError("Please enter your password."); return; }

    setLoading(true);

    // Try @leadpe.com first, then @leadpe.business for backward compat
    const res1 = await supabase.auth.signInWithPassword({ email: `${digits}@leadpe.com`, password: siPw });
    if (!res1.error && res1.data?.user) {
      await redirectByRole(res1.data.user.id);
      setLoading(false);
      return;
    }

    const res2 = await supabase.auth.signInWithPassword({ email: `${digits}@leadpe.business`, password: siPw });
    if (!res2.error && res2.data?.user) {
      await redirectByRole(res2.data.user.id);
      setLoading(false);
      return;
    }

    setLoading(false);
    setError("Incorrect number or password.");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!suName.trim()) { setError("Please enter your full name."); return; }
    const digits = suPhone.replace(/\D/g, "");
    if (digits.length !== 10) { setError("Please enter a valid 10-digit number."); return; }
    if (suPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (suPw !== suCpw) { setError("Passwords do not match."); return; }

    setLoading(true);
    const email = `${digits}@leadpe.com`;

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password: suPw,
      options: {
        data: {
          full_name: suName,
          whatsapp_number: digits,
          role: "business",
        },
      },
    });

    if (authErr) {
      setLoading(false);
      setError(authErr.message.includes("already registered")
        ? "This number is already registered. Please sign in."
        : authErr.message);
      return;
    }

    if (authData.user) {
      // Auto sign in
      await supabase.auth.signInWithPassword({ email, password: suPw });
      await refreshRole();
      await refreshProfile();
    }

    setLoading(false);
    navigate("/client/dashboard", { replace: true });
  };

  const inputStyle = "rounded-xl h-12 bg-white border-[#E0E0E0] text-[#1A1A1A] text-base focus:border-[#00C853] focus:ring-[#00C853]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[460px]">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/"><LeadPeLogo theme="light" size="lg" /></Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-0 mb-6" style={{ borderBottom: "1px solid #E0E0E0" }}>
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className="px-6 py-3 text-[15px] transition-all"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? "#1A1A1A" : "#999",
                borderBottom: tab === t ? "2px solid #00C853" : "2px solid transparent",
              }}
            >
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-9" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <AnimatePresence>
            {tab === "signin" ? (
              <motion.form key="si" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSignIn} className="space-y-5">
                <div className="text-center mb-6">
                  <h1 className="text-[26px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Welcome Back 👋</h1>
                  <p className="text-sm" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>Sign in to your account</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>WhatsApp Number</label>
                  <Input type="tel" value={siPhone} onChange={(e) => setSiPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={inputStyle} placeholder="98765 43210" />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>Password</label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} value={siPw} onChange={(e) => setSiPw(e.target.value)}
                      className={`${inputStyle} pr-10`} placeholder="Your password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#999" }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#00C853", color: "white", fontFamily: "DM Sans, sans-serif" }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Signing in...
                    </span>
                  ) : "Sign In →"}
                </button>
              </motion.form>
            ) : (
              <motion.form key="su" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSignUp} className="space-y-4">
                <div className="text-center mb-5">
                  <h1 className="text-[26px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Create Account</h1>
                  <p className="text-sm" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>Start your {TRIAL_DAYS}-day free period</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>Full Name</label>
                  <Input value={suName} onChange={(e) => setSuName(e.target.value)} className={inputStyle} placeholder="Ramesh Gupta" />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>WhatsApp Number</label>
                  <Input type="tel" value={suPhone} onChange={(e) => setSuPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={inputStyle} placeholder="98765 43210" />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>Password</label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} value={suPw} onChange={(e) => setSuPw(e.target.value)}
                      className={`${inputStyle} pr-10`} placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#999" }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>Confirm Password</label>
                  <div className="relative">
                    <Input type={showCpw ? "text" : "password"} value={suCpw} onChange={(e) => setSuCpw(e.target.value)}
                      className={`${inputStyle} pr-10`} placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowCpw(!showCpw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#999" }}>
                      {showCpw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#00C853", color: "white", fontFamily: "DM Sans, sans-serif" }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Creating account...
                    </span>
                  ) : "Create Account →"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-sm text-center mt-6" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
          New to LeadPe?{" "}
          <Link to="/business" className="font-medium" style={{ color: "#00C853" }}>Get your free website →</Link>
        </p>
      </motion.div>
    </div>
  );
}
