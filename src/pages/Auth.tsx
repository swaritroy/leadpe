import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import LeadPeLogo from "@/components/LeadPeLogo";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sign In state
  const [siPhone, setSiPhone] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPw, setSiShowPw] = useState(false);

  // Create Account state
  const [caName, setCaName] = useState("");
  const [caPhone, setCaPhone] = useState("");
  const [caPassword, setCaPassword] = useState("");
  const [caConfirm, setCaConfirm] = useState("");
  const [caShowPw, setCaShowPw] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
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
  }, []);

  const checkProfileAndRedirect = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("whatsapp_number, business_name, business_type, city")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile || !profile.whatsapp_number || !profile.business_name || !profile.business_type || !profile.city) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate("/client/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSignIn = useCallback(async () => {
    setError("");
    if (siPhone.length !== 10) {
      setError("Enter a valid 10-digit number.");
      return;
    }
    if (!siPassword) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: siPhone + "@leadpe.com",
      password: siPassword,
    });
    if (authError) {
      setError("Incorrect number or password.");
      setLoading(false);
      return;
    }
    if (data.user) {
      await checkProfileAndRedirect(data.user.id);
    }
    setLoading(false);
  }, [siPhone, siPassword, checkProfileAndRedirect]);

  const handleCreateAccount = useCallback(async () => {
    setError("");
    if (!caName.trim()) { setError("Please enter your full name."); return; }
    if (caPhone.length !== 10) { setError("Enter a valid 10-digit number."); return; }
    if (caPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (caPassword !== caConfirm) { setError("Passwords do not match."); return; }

    setLoading(true);

    // Check duplicate
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", caPhone)
      .eq("role", "business")
      .maybeSingle();

    if (existing) {
      setError("This number is already registered. Sign in instead.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: caPhone + "@leadpe.com",
      password: caPassword,
      options: {
        data: { full_name: caName.trim(), role: "business" },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Wait for trigger to create profile, then update whatsapp
      await new Promise(r => setTimeout(r, 1500));
      await supabase
        .from("profiles")
        .update({ whatsapp_number: caPhone })
        .eq("user_id", data.user.id);

      await checkProfileAndRedirect(data.user.id);
    }
    setLoading(false);
  }, [caName, caPhone, caPassword, caConfirm, checkProfileAndRedirect]);

  const labelStyle = { color: "#444", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 500 as const };
  const inputStyle = "h-[48px] rounded-xl text-base";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[460px]">
        <div className="text-center mb-6">
          <Link to="/"><LeadPeLogo theme="light" size="lg" /></Link>
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-11 rounded-xl" style={{ backgroundColor: "#F0F0F0" }}>
              <TabsTrigger value="signin" className="rounded-lg text-sm font-semibold" style={{ fontFamily: "DM Sans, sans-serif" }}>Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg text-sm font-semibold" style={{ fontFamily: "DM Sans, sans-serif" }}>Create Account</TabsTrigger>
            </TabsList>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "DM Sans, sans-serif" }}>
                {error}
              </div>
            )}

            {/* Google Button — shared */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-[52px] rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-3 mb-4"
              style={{ backgroundColor: "#fff", color: "#1A1A1A", fontFamily: "DM Sans, sans-serif", border: "2px solid #E0E0E0" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-5 h-5 border-2 rounded-full" style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }} />
                  Connecting...
                </span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google →
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
              <span className="text-xs" style={{ color: "#999", fontFamily: "DM Sans, sans-serif" }}>or continue with phone</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
            </div>

            {/* SIGN IN TAB */}
            <TabsContent value="signin" className="space-y-4 mt-0">
              <div>
                <label style={labelStyle}>Phone Number</label>
                <Input
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={siPhone}
                  onChange={(e) => setSiPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={inputStyle}
                />
              </div>
              <div className="relative">
                <label style={labelStyle}>Password</label>
                <Input
                  type={siShowPw ? "text" : "password"}
                  placeholder="Your password"
                  value={siPassword}
                  onChange={(e) => setSiPassword(e.target.value)}
                  className={inputStyle + " pr-12"}
                />
                <button type="button" onClick={() => setSiShowPw(!siShowPw)} className="absolute right-3 top-[34px]" style={{ color: "#999" }}>
                  {siShowPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60"
                style={{ backgroundColor: "#00C853", color: "#fff", fontFamily: "DM Sans, sans-serif" }}
              >
                {loading ? "Signing in..." : "Sign In →"}
              </button>
            </TabsContent>

            {/* CREATE ACCOUNT TAB */}
            <TabsContent value="signup" className="space-y-4 mt-0">
              <div>
                <label style={labelStyle}>Full Name</label>
                <Input
                  placeholder="Dr. Ramesh Sharma"
                  value={caName}
                  onChange={(e) => setCaName(e.target.value)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <Input
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={caPhone}
                  onChange={(e) => setCaPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={inputStyle}
                />
              </div>
              <div className="relative">
                <label style={labelStyle}>Password</label>
                <Input
                  type={caShowPw ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={caPassword}
                  onChange={(e) => setCaPassword(e.target.value)}
                  className={inputStyle + " pr-12"}
                />
                <button type="button" onClick={() => setCaShowPw(!caShowPw)} className="absolute right-3 top-[34px]" style={{ color: "#999" }}>
                  {caShowPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <Input
                  type={caShowPw ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={caConfirm}
                  onChange={(e) => setCaConfirm(e.target.value)}
                  className={inputStyle}
                />
              </div>
              <button
                onClick={handleCreateAccount}
                disabled={loading}
                className="w-full h-[52px] rounded-xl font-semibold text-base transition-all disabled:opacity-60"
                style={{ backgroundColor: "#00C853", color: "#fff", fontFamily: "DM Sans, sans-serif" }}
              >
                {loading ? "Creating account..." : "Create Account →"}
              </button>
            </TabsContent>
          </Tabs>

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
