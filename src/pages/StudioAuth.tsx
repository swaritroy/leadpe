import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function StudioAuth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signup" | "signin">("signup");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpCity, setSignUpCity] = useState("");
  const [signUpUpi, setSignUpUpi] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(signInEmail)) { setError("Please enter a valid email."); return; }
    if (!signInPassword) { setError("Please enter your password."); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    setLoading(false);
    if (authError) { setError("Wrong email or password."); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("onboarding_complete").eq("user_id", user.id).maybeSingle();
      if (profile && !(profile as any).onboarding_complete) {
        navigate("/dev/onboarding", { replace: true });
        return;
      }
    }
    navigate("/dev/dashboard", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Please enter your full name."); return; }
    if (!validateEmail(signUpEmail)) { setError("Please enter a valid email."); return; }
    if (signUpPhone.replace(/\D/g, "").length !== 10) { setError("Please enter a valid 10-digit WhatsApp number."); return; }
    if (signUpPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (signUpPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    const phoneDigits = signUpPhone.replace(/\D/g, "");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: { data: { full_name: fullName, whatsapp_number: phoneDigits, role: "vibe_coder" } },
    });

    if (authError) {
      setLoading(false);
      setError(authError.message.includes("already registered") ? "Email already registered. Please sign in." : "Something went wrong.");
      return;
    }

    if (authData.user) {
      await (supabase.from("profiles") as any).upsert({
        user_id: authData.user.id,
        display_name: fullName,
        full_name: fullName,
        email: signUpEmail,
        whatsapp_number: phoneDigits,
        city: signUpCity,
        upi_id: signUpUpi,
        role: "vibe_coder",
        status: "active",
        onboarding_complete: false,
        total_earned: 0,
        total_sites_built: 0,
        total_sites_live: 0,
        monthly_passive: 0,
      }, { onConflict: "user_id" });

      await (supabase.from("user_roles") as any).upsert({
        user_id: authData.user.id,
        role: "developer",
      }, { onConflict: "user_id,role" });

      const msg = encodeURIComponent(`⚡ NEW VIBE CODER\n━━━━━━━━━━━━\nName: ${fullName}\nWhatsApp: ${phoneDigits}\nCity: ${signUpCity}\nUPI: ${signUpUpi}\n━━━━━━━━━━━━\nLeadPe Studio ⚡`);
      window.open(`https://wa.me/919973383902?text=${msg}`, "_blank", "noopener,noreferrer");
    }

    setLoading(false);
    navigate("/dev/onboarding", { replace: true });
  };

  const inputStyle = "bg-white border-[#E0E0E0] h-12 rounded-xl focus:border-[#00C853] focus:ring-[#00C853]/20 text-[#111] placeholder:text-[#999]";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-[480px]" style={{ padding: "60px 24px" }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 700 }}>
            <span style={{ color: "#1A1A1A" }}>Lead</span><span style={{ color: "#00C853" }}>Pe</span>
          </span>
          <span style={{ color: "#00C853", fontSize: 16, marginLeft: 8 }}>Studio</span>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6" style={{ borderBottom: "1px solid #E0E0E0" }}>
          {(["signup", "signin"] as const).map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setError(""); }}
              className="flex-1 pb-3 text-center transition-all"
              style={{
                fontSize: 15,
                fontWeight: activeTab === tab ? 700 : 400,
                color: activeTab === tab ? "#1A1A1A" : "#999",
                borderBottom: activeTab === tab ? "2px solid #00C853" : "2px solid transparent",
                background: "none", border: "none", cursor: "pointer",
              }}>
              {tab === "signup" ? "Join Studio" : "Sign In"}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 36, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mb-4 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === "signup" ? (
              <motion.form key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignUp} className="space-y-4">
                <div className="text-center mb-4">
                  <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 700, color: "#1A1A1A" }}>Join LeadPe Studio</h1>
                  <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>Free. Earn from day one.</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Full Name *</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputStyle} placeholder="Rajesh Kumar" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Email *</label>
                  <Input type="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} className={inputStyle} placeholder="you@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>WhatsApp Number *</label>
                  <Input type="tel" value={signUpPhone} onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className={inputStyle} placeholder="98765 43210" />
                  <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Build requests come here</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>City *</label>
                  <Input value={signUpCity} onChange={(e) => setSignUpCity(e.target.value)} className={inputStyle} placeholder="Patna, Bihar" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>UPI ID *</label>
                  <Input value={signUpUpi} onChange={(e) => setSignUpUpi(e.target.value)} className={inputStyle} placeholder="rajesh@paytm" />
                  <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Earnings sent directly here 💰</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Password *</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)}
                      className={`${inputStyle} pr-10`} placeholder="At least 6 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Confirm Password *</label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputStyle} pr-10`} placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: "100%", height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Please wait..." : "Join Studio Free →"}
                </button>

                <p style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 8 }}>
                  By joining you agree to build quality websites.
                </p>
              </motion.form>
            ) : (
              <motion.form key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSignIn} className="space-y-4">
                <div className="text-center mb-4">
                  <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 700, color: "#1A1A1A" }}>Welcome Back</h1>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Email</label>
                  <Input type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} className={inputStyle} placeholder="you@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Password</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)}
                      className={`${inputStyle} pr-10`} placeholder="Enter password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: "100%", height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Please wait..." : "Sign In →"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 16 }}>
            For businesses? <Link to="/auth" style={{ color: "#00C853", fontWeight: 500, textDecoration: "none" }}>Sign in here →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
