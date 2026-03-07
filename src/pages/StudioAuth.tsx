import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import LeadPeLogo from "@/components/LeadPeLogo";

export default function StudioAuth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => phone.replace(/\D/g, "").length === 10;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(signInEmail)) { setError("Please enter a valid email."); return; }
    if (!signInPassword) { setError("Please enter your password."); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: signInEmail, password: signInPassword });
    setLoading(false);
    if (authError) { setError(authError.message.includes("Invalid login") ? "Wrong email or password." : "Something went wrong."); return; }

    // Check onboarding status
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
    if (!validatePhone(signUpPhone)) { setError("Please enter a valid 10-digit WhatsApp number."); return; }
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
        role: "vibe_coder",
        status: "active",
        onboarding_complete: false,
      }, { onConflict: "user_id" });

      await (supabase.from("user_roles") as any).upsert({
        user_id: authData.user.id,
        role: "developer",
      }, { onConflict: "user_id,role" });

      const msg = encodeURIComponent(`⚡ NEW VIBE CODER\n━━━━━━━━━━━━\nName: ${fullName}\nEmail: ${signUpEmail}\nWhatsApp: ${phoneDigits}\n━━━━━━━━━━━━\nLeadPe Studio ⚡`);
      window.open(`https://wa.me/919973383902?text=${msg}`, "_blank", "noopener,noreferrer");
    }

    setLoading(false);
    navigate("/dev/onboarding", { replace: true });
  };

  const inputClass = "rounded-xl border-[#E0E0E0] h-12 focus:border-[#00C853] focus:ring-[#00C853] text-[#111] placeholder:text-[#9ca3af]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <LeadPeLogo theme="light" size="lg" />
              <span className="font-bold text-xl" style={{ color: "#00C853" }}>Studio</span>
            </div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Join LeadPe Studio</h1>
            <p className="text-sm text-[#666]">Build websites. Earn every month.</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl p-1 mb-6 border border-[#E0E0E0]" style={{ backgroundColor: "#F8F8F8" }}>
            {(["signin", "signup"] as const).map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab ? "text-white bg-[#00C853]" : "text-[#666] hover:text-[#1A1A1A]"}`}>
                {tab === "signin" ? "Sign In" : "Join Free"}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mb-4 p-3 rounded-xl text-sm text-center bg-red-50 text-red-500 border border-red-200">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === "signin" ? (
              <motion.form key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Email</label>
                  <Input type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)}
                    className={inputClass} style={{ backgroundColor: "#FAFAFA" }} placeholder="you@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Password</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)}
                      className={`${inputClass} pr-10`} style={{ backgroundColor: "#FAFAFA" }} placeholder="Enter password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-white font-semibold bg-[#00C853] hover:bg-[#00A843]">
                  {loading ? "Please wait..." : "Sign In →"}
                </Button>
              </motion.form>
            ) : (
              <motion.form key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className={inputClass} style={{ backgroundColor: "#FAFAFA" }} placeholder="Your full name" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Email</label>
                  <Input type="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)}
                    className={inputClass} style={{ backgroundColor: "#FAFAFA" }} placeholder="you@email.com" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">WhatsApp Number</label>
                  <Input type="tel" value={signUpPhone} onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={inputClass} style={{ backgroundColor: "#FAFAFA" }} placeholder="9876543210" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Password</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)}
                      className={`${inputClass} pr-10`} style={{ backgroundColor: "#FAFAFA" }} placeholder="At least 6 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Confirm Password</label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pr-10`} style={{ backgroundColor: "#FAFAFA" }} placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-white font-semibold bg-[#00C853] hover:bg-[#00A843]">
                  {loading ? "Please wait..." : "Join Studio →"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-[#999] mt-4">
            For businesses? <Link to="/auth" className="text-[#00C853] font-medium hover:underline">Sign in here →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
