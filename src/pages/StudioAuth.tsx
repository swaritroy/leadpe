import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { notifyAdmin } from "@/lib/notify";

export default function StudioAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshRole, refreshProfile } = useAuth();
  const [tab, setTab] = useState<"join" | "signin">("join");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Join fields
  const [jName, setJName] = useState("");
  const [jEmail, setJEmail] = useState("");
  const [jPhone, setJPhone] = useState("");
  const [jCity, setJCity] = useState("");
  const [jUpi, setJUpi] = useState("");
  const [jPassword, setJPassword] = useState("");

  // Sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleGoogleSignIn = useCallback(async () => {
    if (!agreed) { setError("Please agree to the Terms and Conditions."); return; }
    setLoading(true);
    setError("");
    // Mark intent so AuthCallback promotes the new account to vibe_coder
    sessionStorage.setItem("oauth_intent", "studio");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      setError((result.error as Error).message || "Google sign-in failed.");
      setLoading(false);
    }
  }, [agreed]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agreed) return setError("Please agree to the Terms and Conditions.");
    if (!jName.trim()) return setError("Please enter your full name.");
    if (!isValidEmail(jEmail)) return setError("Please enter a valid email address.");
    const digits = jPhone.replace(/\D/g, "");
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) return setError("Enter a valid 10-digit Indian mobile number.");
    if (!jCity.trim()) return setError("Please enter your city.");
    if (!jUpi.trim()) return setError("Please enter your UPI ID.");
    if (jPassword.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);
    const email = jEmail.trim().toLowerCase();
    let { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: jPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dev/dashboard`,
        data: {
          full_name: jName.trim(),
          role: "vibe_coder",
          city: jCity.trim(),
          upi_id: jUpi.trim(),
          whatsapp_number: digits,
        },
      },
    });

    // Self-heal: if email already exists, try signing in with the password they typed
    if (signUpError && /already|registered|exists/i.test(signUpError.message)) {
      const { data: siData, error: siErr } = await supabase.auth.signInWithPassword({
        email,
        password: jPassword,
      });
      if (siErr || !siData.user) {
        setLoading(false);
        return setError("This email is already registered. Switch to Sign In and use your existing password, or use a different email.");
      }
      data = { user: siData.user, session: siData.session } as any;
      signUpError = null;
    }

    if (signUpError) {
      setLoading(false);
      return setError(signUpError.message);
    }

    if (data.user) {
      await new Promise((r) => setTimeout(r, 1200));
      await supabase.from("profiles").update({
        full_name: jName.trim(),
        city: jCity.trim(),
        upi_id: jUpi.trim(),
        whatsapp_number: digits,
        vetting_status: "pending_vetting",
      }).eq("user_id", data.user.id);

      // Admin alert + queue welcome to dev (await so request flushes before redirect)
      try {
        await notifyAdmin(
          "dev_signup",
          { name: jName.trim(), email, city: jCity.trim(), phone: digits, whatsapp: digits, upi_id: jUpi.trim() },
          {
            to: digits,
            message: `Welcome to LeadPe Studio, ${jName.trim()}! 👨‍💻\n\nYour builder account is awaiting admin approval (usually within 24h). You'll get a message once approved.\n\nLeadPe Team 🌱`,
            type: "welcome",
            client_name: jName.trim(),
          }
        );
      } catch (e) { console.log("notifyAdmin failed:", e); }

      await refreshRole();
      await refreshProfile();
      setLoading(false);
      toast({ title: "Account created!", description: "Awaiting admin approval. We'll notify you shortly." });
      navigate("/dev/onboarding", { replace: true });
      return;
    }
    setLoading(false);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agreed) return setError("Please agree to the Terms and Conditions.");
    if (!isValidEmail(siEmail)) return setError("Please enter a valid email address.");
    if (!siPassword) return setError("Please enter your password.");

    setLoading(true);
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email: siEmail.trim().toLowerCase(),
      password: siPassword,
    });
    if (signInErr || !data.user) {
      setLoading(false);
      return setError(signInErr?.message || "Invalid email or password.");
    }

    // Verify this is a builder account
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const roles = (roleData ?? []).map((r: any) => r.role);
    const isCoder = roles.includes("developer") || roles.includes("vibe_coder") || roles.includes("admin");
    if (!isCoder) {
      await supabase.auth.signOut();
      await refreshRole();
      await refreshProfile();
      setLoading(false);
      return setError("This is not a Studio account. Use the main Sign In at /auth, or Join Studio.");
    }

    await refreshRole();
    await refreshProfile();
    setLoading(false);
    toast({ title: "Welcome back!" });
    navigate("/dev/dashboard", { replace: true });
  };

  const inputStyle = "rounded-xl h-12 bg-white border-[#E0E0E0] text-[#1A1A1A] text-base focus:border-[#00C853] focus:ring-[#00C853]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F5FFF7" }}>
      <SEO
        title="LeadPe Studio — Become a Vibe Coder"
        description="Join LeadPe Studio. Build websites with AI and earn ₹480–₹1,800 per project. Work from anywhere in India."
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

        <div className="flex justify-center gap-0 mb-6" style={{ borderBottom: "1px solid #E0E0E0" }}>
          {(["join", "signin"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className="px-6 py-3 text-[15px] transition-all"
              style={{ fontFamily: "DM Sans, sans-serif", fontWeight: tab === t ? 700 : 400, color: tab === t ? "#1A1A1A" : "#999", borderBottom: tab === t ? "2px solid #00C853" : "2px solid transparent" }}>
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

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || !agreed}
            className="w-full h-[48px] rounded-xl border flex items-center justify-center gap-3 transition-all disabled:opacity-60 mb-5"
            style={{ borderColor: "#E0E0E0", backgroundColor: "#fff", color: "#1A1A1A", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 15 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.55-.2-2.28H12v4.32h5.92a5.07 5.07 0 0 1-2.2 3.32v2.76h3.55c2.08-1.92 3.27-4.74 3.27-8.12z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.27-2.66l-3.55-2.76c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            {loading ? "Opening Google..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
            <span style={{ fontSize: 12, color: "#999", fontFamily: "DM Sans, sans-serif" }}>or use email</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
          </div>

          <AnimatePresence mode="wait">
            {tab === "join" ? (
              <motion.form key="join" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleJoinSubmit} className="space-y-4">
                <div className="text-center mb-5">
                  <h1 className="text-[26px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Join LeadPe Studio</h1>
                  <p className="text-sm" style={{ color: "#666" }}>Free to join. Admin approves new builders within 24 hours.</p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Full Name *</label>
                  <Input value={jName} onChange={(e) => setJName(e.target.value)} className={inputStyle} placeholder="Rajesh Kumar" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Email *</label>
                  <Input type="email" value={jEmail} onChange={(e) => setJEmail(e.target.value)} className={inputStyle} placeholder="you@gmail.com" />
                  <p className="text-[11px] mt-1" style={{ color: "#999" }}>Used to sign in. No verification required.</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Password *</label>
                  <Input type="password" value={jPassword} onChange={(e) => setJPassword(e.target.value)} className={inputStyle} placeholder="Min. 6 characters" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Mobile Number *</label>
                  <Input type="tel" value={jPhone} onChange={(e) => setJPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className={inputStyle} placeholder="98765 43210" />
                  <p className="text-[11px] mt-1" style={{ color: "#999" }}>Admin contact only. Lead alerts coming soon.</p>
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
                  {loading ? "Creating account..." : "Create Builder Account →"}
                </button>
              </motion.form>
            ) : (
              <motion.form key="si" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSignInSubmit} className="space-y-5">
                <div className="text-center mb-6">
                  <h1 className="text-[26px] font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Welcome Back</h1>
                  <p className="text-sm" style={{ color: "#666" }}>Sign in to your Studio account</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Email</label>
                  <Input type="email" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} className={inputStyle} placeholder="you@gmail.com" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Password</label>
                  <Input type="password" value={siPassword} onChange={(e) => setSiPassword(e.target.value)} className={inputStyle} placeholder="Your password" />
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
                  {loading ? "Signing in..." : "Sign In →"}
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
