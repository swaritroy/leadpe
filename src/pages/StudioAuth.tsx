import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function StudioAuth() {
  const navigate = useNavigate();
  const { refreshRole, refreshProfile } = useAuth();
  const [tab, setTab] = useState<"join" | "signin">("join");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState("");

  const [jName, setJName] = useState("");
  const [jPhone, setJPhone] = useState("");
  const [jCity, setJCity] = useState("");
  const [jUpi, setJUpi] = useState("");
  const [jPw, setJPw] = useState("");
  const [jCpw, setJCpw] = useState("");

  const [siPhone, setSiPhone] = useState("");
  const [siPw, setSiPw] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!jName.trim()) { setError("Please enter your full name."); return; }
    const digits = jPhone.replace(/\D/g, "");
    if (digits.length !== 10) { setError("Please enter a valid 10-digit number."); return; }
    if (!jCity.trim()) { setError("Please enter your city."); return; }
    if (!jUpi.trim()) { setError("Please enter your UPI ID."); return; }
    if (jPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (jPw !== jCpw) { setError("Passwords do not match."); return; }

    setLoading(true);
    const email = `${digits}@leadpe.com`;

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password: jPw,
      options: {
        data: {
          full_name: jName,
          whatsapp_number: digits,
          role: "vibe_coder",
          city: jCity,
          upi_id: jUpi,
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
      await supabase.auth.signInWithPassword({ email, password: jPw });
      await refreshRole();
      await refreshProfile();
    }

    setLoading(false);
    navigate("/dev/onboarding", { replace: true });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = siPhone.replace(/\D/g, "");
    if (digits.length !== 10) { setError("Please enter a valid 10-digit number."); return; }
    if (!siPw) { setError("Please enter your password."); return; }

    setLoading(true);

    const res1 = await supabase.auth.signInWithPassword({ email: `${digits}@leadpe.com`, password: siPw });
    if (!res1.error && res1.data?.user) {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", res1.data.user.id).maybeSingle();
      const role = roleData?.role;
      if (role !== "developer" && role !== "vibe_coder") {
        setLoading(false);
        setError("This account is not a Studio account. Try the main sign in.");
        await supabase.auth.signOut();
        return;
      }
      await refreshRole();
      await refreshProfile();
      setLoading(false);
      navigate("/dev/dashboard", { replace: true });
      return;
    }

    const res2 = await supabase.auth.signInWithPassword({ email: `${digits}@leadpe.business`, password: siPw });
    if (!res2.error && res2.data?.user) {
      await refreshRole();
      await refreshProfile();
      setLoading(false);
      navigate("/dev/dashboard", { replace: true });
      return;
    }

    setLoading(false);
    setError("Incorrect number or password.");
  };

  const inputStyle = "rounded-xl h-12 bg-white border-[#E0E0E0] text-[#1A1A1A] text-base focus:border-[#00C853] focus:ring-[#00C853]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F5FFF7" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[460px]">

        <div className="text-center mb-6">
          <Link to="/studio" className="inline-flex items-center gap-2">
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 22 }}>
              <span style={{ color: "#1A1A1A" }}>Lead</span>
              <span style={{ color: "#00C853" }}>Pe</span>
            </span>
            <span style={{ color: "#E0E0E0", fontSize: 20 }}>|</span>
            <span style={{ color: "#00C853", fontFamily: "DM Sans, sans-serif", fontSize: 16 }}>Studio</span>
          </Link>
        </div>

        <div className="flex justify-center gap-0 mb-6" style={{ borderBottom: "1px solid #E0E0E0" }}>
          {(["join", "signin"] as const).map((t) => (
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
              {t === "join" ? "Join Studio" : "Sign In"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-9" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <AnimatePresence>
            {tab === "join" ? (
              <motion.form key="join" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleJoin} className="space-y-4">
                <div className="text-center mb-5">
                  <h1 className="text-[26px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Join LeadPe Studio</h1>
                  <p className="text-sm" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>Free. Earn from day one.</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>Full Name *</label>
                  <Input value={jName} onChange={(e) => setJName(e.target.value)} className={inputStyle} placeholder="Rajesh Kumar" />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>WhatsApp Number *</label>
                  <Input type="tel" value={jPhone} onChange={(e) => setJPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={inputStyle} placeholder="98765 43210" />
                  <p className="text-[11px] mt-1" style={{ color: "#999", fontFamily: "DM Sans, sans-serif" }}>Build requests sent here</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>City *</label>
                  <Input value={jCity} onChange={(e) => setJCity(e.target.value)} className={inputStyle} placeholder="Patna, Bihar" />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>UPI ID *</label>
                  <Input value={jUpi} onChange={(e) => setJUpi(e.target.value)} className={inputStyle} placeholder="name@paytm" />
                  <p className="text-[11px] mt-1" style={{ color: "#999", fontFamily: "DM Sans, sans-serif" }}>Earnings sent directly here 💰</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>Password *</label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} value={jPw} onChange={(e) => setJPw(e.target.value)}
                      className={`${inputStyle} pr-10`} placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#999" }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A", fontFamily: "DM Sans, sans-serif" }}>Confirm Password *</label>
                  <div className="relative">
                    <Input type={showCpw ? "text" : "password"} value={jCpw} onChange={(e) => setJCpw(e.target.value)}
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
                  ) : "Join Studio Free →"}
                </button>

                <p className="text-[12px] text-center" style={{ color: "#999", fontFamily: "DM Sans, sans-serif" }}>
                  By joining you agree to build quality websites.
                </p>
              </motion.form>
            ) : (
              <motion.form key="si" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSignIn} className="space-y-5">
                <div className="text-center mb-6">
                  <h1 className="text-[26px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Welcome Back</h1>
                  <p className="text-sm" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>Sign in to your Studio dashboard</p>
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
            )}
          </AnimatePresence>
        </div>

        <p className="text-sm text-center mt-6" style={{ color: "#666", fontFamily: "DM Sans, sans-serif" }}>
          Looking to get a website?{" "}
          <Link to="/" className="font-medium" style={{ color: "#00C853" }}>Go to main site →</Link>
        </p>
      </motion.div>
    </div>
  );
}