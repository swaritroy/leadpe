import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LeadPeLogo from "@/components/LeadPeLogo";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState("");

  const [siPhone, setSiPhone] = useState("");
  const [siPw, setSiPw] = useState("");
  const [suName, setSuName] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suPw, setSuPw] = useState("");
  const [suCpw, setSuCpw] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = siPhone.replace(/\D/g, "");
    if (digits.length !== 10) { setError("Please enter a valid 10-digit number."); return; }
    if (!siPw) { setError("Please enter your password."); return; }

    setLoading(true);
    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: `${digits}@leadpe.business`,
      password: siPw,
    });
    setLoading(false);

    if (authErr) { setError("Incorrect number or password."); return; }

    // Get role from profile
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    const role = profile?.role || "business";
    if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "vibe_coder" || role === "developer") navigate("/dev/dashboard", { replace: true });
    else navigate("/client/dashboard", { replace: true });
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
    const email = `${digits}@leadpe.business`;
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password: suPw,
      options: { data: { full_name: suName, whatsapp_number: digits, role: "business" } },
    });

    if (authErr) {
      setLoading(false);
      setError(authErr.message.includes("already registered") ? "This number is already registered. Please sign in." : authErr.message);
      return;
    }

    if (authData.user) {
      await (supabase.from("profiles") as any).upsert({
        user_id: authData.user.id,
        full_name: suName,
        whatsapp_number: digits,
        email,
        role: "business",
        status: "trial",
      });
      await (supabase.from("user_roles") as any).insert({ user_id: authData.user.id, role: "business" });
    }

    setLoading(false);
    navigate("/client/dashboard", { replace: true });
  };

  const inputStyle: React.CSSProperties = { backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0", color: "#1A1A1A", fontSize: "16px" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div className="text-center mb-8">
            <LeadPeLogo theme="light" size="lg" />
            <h1 className="text-2xl font-bold mb-1 mt-4" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Welcome Back</h1>
            <p className="text-sm" style={{ color: "#666666" }}>Sign in to your dashboard</p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ backgroundColor: "#F8F8F8", border: "1px solid #E0E0E0" }}>
            {(["signin", "signup"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                style={tab === t ? { backgroundColor: "#00C853", color: "white" } : { color: "#666666" }}>
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {tab === "signin" ? (
              <motion.form key="si" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>WhatsApp Number</label>
                  <Input type="tel" value={siPhone} onChange={(e) => setSiPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="rounded-xl h-12" style={inputStyle} placeholder="9876543210" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Password</label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} value={siPw} onChange={(e) => setSiPw(e.target.value)}
                      className="rounded-xl h-12 pr-10" style={inputStyle} placeholder="Enter password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#666666" }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
                  {loading ? "Please wait..." : "Sign In →"}
                </Button>
              </motion.form>
            ) : (
              <motion.form key="su" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Full Name</label>
                  <Input value={suName} onChange={(e) => setSuName(e.target.value)} className="rounded-xl h-12" style={inputStyle} placeholder="Your full name" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>WhatsApp Number</label>
                  <Input type="tel" value={suPhone} onChange={(e) => setSuPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="rounded-xl h-12" style={inputStyle} placeholder="9876543210" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Password</label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} value={suPw} onChange={(e) => setSuPw(e.target.value)}
                      className="rounded-xl h-12 pr-10" style={inputStyle} placeholder="At least 6 characters" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#666666" }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Confirm Password</label>
                  <div className="relative">
                    <Input type={showCpw ? "text" : "password"} value={suCpw} onChange={(e) => setSuCpw(e.target.value)}
                      className="rounded-xl h-12 pr-10" style={inputStyle} placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowCpw(!showCpw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#666666" }}>
                      {showCpw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
                  {loading ? "Please wait..." : "Create Account →"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-sm text-center mt-6" style={{ color: "#666666" }}>
            Starting fresh?{" "}
            <Link to="/business" className="font-medium" style={{ color: "#00C853" }}>Get free trial →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
