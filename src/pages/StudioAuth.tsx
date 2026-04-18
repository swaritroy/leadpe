import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

// OTP Input Component defined OUTSIDE
function OtpInput({ value, onChange, onComplete }: { value: string; onChange: (v: string) => void; onComplete: () => void }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleChange = useCallback((index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join("").replace(/ /g, "");
    onChange(newValue);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (newValue.length === 6) setTimeout(() => onComplete(), 300);
  }, [digits, onChange, onComplete]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      onChange(newDigits.join("").replace(/ /g, ""));
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits, onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      onChange(pasted);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      if (pasted.length === 6) setTimeout(() => onComplete(), 500);
    }
  }, [onChange, onComplete]);

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "24px 0" }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => { e.target.style.borderColor = "#00C853"; }}
          onBlur={(e) => { e.target.style.borderColor = "#E0E0E0"; }}
          autoFocus={i === 0}
          style={{
            width: 48, height: 56, textAlign: "center", fontSize: 24, fontWeight: 700,
            border: "2px solid #E0E0E0", borderRadius: 12, outline: "none",
            transition: "border-color 0.2s", color: "#1A1A1A", backgroundColor: "#fff",
          }}
        />
      ))}
    </div>
  );
}

export default function StudioAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshRole, refreshProfile } = useAuth();
  const [tab, setTab] = useState<"join" | "signin">("join");
  const [screen, setScreen] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Join fields
  const [jName, setJName] = useState("");
  const [jEmail, setJEmail] = useState("");
  const [jPhone, setJPhone] = useState("");
  const [jCity, setJCity] = useState("");
  const [jUpi, setJUpi] = useState("");

  // Sign in
  const [siEmail, setSiEmail] = useState("");

  // OTP
  const [otp, setOtp] = useState("");
  const [activeEmail, setActiveEmail] = useState("");
  const [flow, setFlow] = useState<"join" | "signin">("join");
  const [timer, setTimer] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (screen === "otp" && timer > 0) {
      timerRef.current = setInterval(() => setTimer((p) => p - 1), 1000);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, timer]);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const sendEmailOtp = async (email: string, isSignup: boolean) => {
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: isSignup,
        emailRedirectTo: `${window.location.origin}/dev/dashboard`,
        data: isSignup ? {
          full_name: jName, role: "vibe_coder",
          city: jCity, upi_id: jUpi, whatsapp_number: jPhone,
        } : undefined,
      },
    });
    return err;
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agreed) return setError("Please agree to the Terms and Conditions.");
    if (!jName.trim()) return setError("Please enter your full name.");
    if (!isValidEmail(jEmail)) return setError("Please enter a valid email address.");
    const digits = jPhone.replace(/\D/g, "");
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) return setError("Enter a valid Indian WhatsApp number.");
    if (!jCity.trim()) return setError("Please enter your city.");
    if (!jUpi.trim()) return setError("Please enter your UPI ID.");

    setLoading(true);
    const err = await sendEmailOtp(jEmail, true);
    setLoading(false);
    if (err) return setError(err.message);
    setActiveEmail(jEmail.trim().toLowerCase());
    setFlow("join");
    setOtp("");
    setTimer(60);
    setScreen("otp");
    toast({ title: "Code sent!", description: `Check your inbox at ${jEmail}` });
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agreed) return setError("Please agree to the Terms and Conditions.");
    if (!isValidEmail(siEmail)) return setError("Please enter a valid email address.");

    setLoading(true);
    const err = await sendEmailOtp(siEmail, false);
    setLoading(false);
    if (err) return setError(err.message);
    setActiveEmail(siEmail.trim().toLowerCase());
    setFlow("signin");
    setOtp("");
    setTimer(60);
    setScreen("otp");
    toast({ title: "Code sent!", description: `Check your inbox at ${siEmail}` });
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (otp.length !== 6) return setError("Enter the 6-digit code.");
    setLoading(true);
    const { data, error: verifyErr } = await supabase.auth.verifyOtp({
      email: activeEmail,
      token: otp,
      type: "email",
    });
    if (verifyErr || !data.user) {
      setLoading(false);
      return setError(verifyErr?.message || "Invalid or expired code.");
    }

    // Verify role for sign-in flow
    if (flow === "signin") {
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const roles = (roleData ?? []).map((r: any) => r.role);
      const isCoder = roles.includes("developer") || roles.includes("vibe_coder");
      if (!isCoder) {
        await supabase.auth.signOut();
        await refreshRole();
        await refreshProfile();
        setLoading(false);
        return setError("This email is not a Studio account. Use the main Sign In at /auth, or Join Studio.");
      }
    }

    await refreshRole();
    await refreshProfile();
    setLoading(false);
    toast({ title: flow === "join" ? "Welcome to LeadPe Studio!" : "Welcome back!" });
    navigate(flow === "join" ? "/dev/onboarding" : "/dev/dashboard", { replace: true });
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    const err = await sendEmailOtp(activeEmail, flow === "join");
    setLoading(false);
    if (err) return setError(err.message);
    setOtp("");
    setTimer(60);
    toast({ title: "Code resent", description: `Check your inbox at ${activeEmail}` });
  };

  const inputStyle = "rounded-xl h-12 bg-white border-[#E0E0E0] text-[#1A1A1A] text-base focus:border-[#00C853] focus:ring-[#00C853]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F5FFF7" }}>
      <SEO
        title="Join LeadPe Studio | Sign In or Create Builder Account"
        description="Join the LeadPe Studio builder network. Earn from AI-built websites for Indian local businesses."
        path="/studio/auth"
        noindex
      />
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

        {screen === "form" && (
          <div className="flex justify-center gap-0 mb-6" style={{ borderBottom: "1px solid #E0E0E0" }}>
            {(["join", "signin"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                className="px-6 py-3 text-[15px] transition-all"
                style={{ fontFamily: "DM Sans, sans-serif", fontWeight: tab === t ? 700 : 400, color: tab === t ? "#1A1A1A" : "#999", borderBottom: tab === t ? "2px solid #00C853" : "2px solid transparent" }}>
                {t === "join" ? "Join Studio" : "Sign In"}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl p-9" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {screen === "otp" ? (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button type="button" onClick={() => { setScreen("form"); setOtp(""); setError(""); }} className="flex items-center gap-1.5 text-sm font-medium hover:text-[#00C853] transition-colors" style={{ color: "#666" }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <div className="text-center">
                  <h1 className="text-[26px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Check your inbox</h1>
                  <p className="text-sm" style={{ color: "#666" }}>We sent a 6-digit code to<br /><strong>{activeEmail}</strong></p>
                </div>

                <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />

                <button type="button" onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}
                  className="w-full h-[52px] rounded-xl font-bold text-base transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#00C853", color: "white", fontFamily: "DM Sans, sans-serif" }}>
                  {loading ? "Verifying..." : flow === "join" ? "Verify & Create Account →" : "Verify & Sign In →"}
                </button>

                <div className="text-center">
                  {timer > 0 ? (
                    <p className="text-sm" style={{ color: "#999" }}>Resend in 00:{timer < 10 ? `0${timer}` : timer}</p>
                  ) : (
                    <button type="button" onClick={handleResend} className="text-sm font-bold" style={{ color: "#00C853" }}>Resend code →</button>
                  )}
                </div>

                <p className="text-xs text-center" style={{ color: "#999" }}>
                  Tip: Check your spam folder if you don't see it within a minute.
                </p>
              </motion.div>
            ) : tab === "join" ? (
              <motion.form key="join" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleJoinSubmit} className="space-y-4">
                <div className="text-center mb-5">
                  <h1 className="text-[26px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Join LeadPe Studio</h1>
                  <p className="text-sm" style={{ color: "#666" }}>Free. Earn from day one.</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Full Name *</label>
                  <Input value={jName} onChange={(e) => setJName(e.target.value)} className={inputStyle} placeholder="Rajesh Kumar" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Email *</label>
                  <Input type="email" value={jEmail} onChange={(e) => setJEmail(e.target.value)} className={inputStyle} placeholder="you@gmail.com" />
                  <p className="text-[11px] mt-1" style={{ color: "#999" }}>We'll send a 6-digit login code here</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>WhatsApp Number *</label>
                  <Input type="tel" value={jPhone} onChange={(e) => setJPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className={inputStyle} placeholder="98765 43210" />
                  <p className="text-[11px] mt-1" style={{ color: "#999" }}>Build requests sent here</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>City *</label>
                  <Input value={jCity} onChange={(e) => setJCity(e.target.value)} className={inputStyle} placeholder="Patna, Bihar" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>UPI ID *</label>
                  <Input value={jUpi} onChange={(e) => setJUpi(e.target.value)} className={inputStyle} placeholder="name@paytm" />
                  <p className="text-[11px] mt-1" style={{ color: "#999" }}>Earnings sent directly here 💰</p>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox id="studio-terms" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                  <label htmlFor="studio-terms" className="text-xs leading-tight" style={{ color: "#666" }}>
                    I agree to LeadPe's{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium underline" style={{ color: "#00C853" }}>Terms and Conditions</a>{" "}including the Builder Agreement
                  </label>
                </div>

                <button type="submit" disabled={loading || !agreed}
                  className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#00C853", color: "white", fontFamily: "DM Sans, sans-serif" }}>
                  {loading ? "Sending code..." : "Send Email Code →"}
                </button>
              </motion.form>
            ) : (
              <motion.form key="si" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSignInSubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <h1 className="text-[26px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Welcome Back</h1>
                  <p className="text-sm" style={{ color: "#666" }}>Sign in with a code sent to your email</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Email</label>
                  <Input type="email" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} className={inputStyle} placeholder="you@gmail.com" />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox id="studio-si-terms" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                  <label htmlFor="studio-si-terms" className="text-xs leading-tight" style={{ color: "#666" }}>
                    I agree to LeadPe's{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium underline" style={{ color: "#00C853" }}>Terms and Conditions</a>
                  </label>
                </div>

                <button type="submit" disabled={loading || !agreed}
                  className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#00C853", color: "white", fontFamily: "DM Sans, sans-serif" }}>
                  {loading ? "Sending code..." : "Send Email Code →"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-sm text-center mt-6" style={{ color: "#666" }}>
          Business owner?{" "}
          <Link to="/auth" className="font-medium" style={{ color: "#00C853" }}>Sign in here →</Link>
        </p>
      </motion.div>
    </div>
  );
}
