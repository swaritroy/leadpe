import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up fields
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(signInEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!signInPassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });

    setLoading(false);

    if (authError) {
      if (authError.message.includes("Invalid login")) {
        setError("Wrong password. Try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    navigate("/dev/dashboard", { replace: true });
  };

  const sendWhatsAppNotification = (name: string, email: string, phone: string) => {
    const message = [
      "⚡ NEW VIBE CODER SIGNUP",
      "━━━━━━━━━━━━",
      `Name: ${name}`,
      `Email: ${email}`,
      `WhatsApp: ${phone}`,
      "━━━━━━━━━━━━",
      "LeadPe Studio ⚡",
    ].join("%0A");

    window.open(
      `https://wa.me/919973383902?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!validateEmail(signUpEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!validatePhone(signUpPhone)) {
      setError("Please enter a valid WhatsApp number.");
      return;
    }

    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const phoneDigits = signUpPhone.replace(/\D/g, "");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        data: {
          full_name: fullName,
          whatsapp_number: phoneDigits,
          role: "vibe_coder",
        },
      },
    });

    if (authError) {
      setLoading(false);
      if (authError.message.includes("already registered")) {
        setError("This email is already registered. Please sign in.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    if (authData.user) {
      // Create profile
      await (supabase.from("profiles") as any).insert({
        id: authData.user.id,
        full_name: fullName,
        email: signUpEmail,
        whatsapp_number: phoneDigits,
        role: "vibe_coder",
        status: "active",
        created_at: new Date().toISOString(),
        subscription_plan: "basic",
      });

      // Create user_roles entry
      await (supabase.from("user_roles") as any).insert({
        user_id: authData.user.id,
        role: "vibe_coder",
      });

      // Send WhatsApp notification
      sendWhatsAppNotification(fullName, signUpEmail, phoneDigits);
    }

    setLoading(false);
    navigate("/dev/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#080C09" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <LeadPeLogo theme="dark" size="lg" />
          <p className="text-sm text-muted-foreground mt-4">Sign in to start building and earning</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl p-1 mb-6 border border-border" style={{ backgroundColor: "#101810" }}>
          <button
            onClick={() => { setActiveTab("signin"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "signin" ? "text-black" : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === "signin" ? { backgroundColor: "#00E676" } : {}}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab("signup"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "signup" ? "text-black" : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === "signup" ? { backgroundColor: "#00E676" } : {}}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl text-sm text-center border border-red-500/30"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign In Form */}
        <AnimatePresence mode="wait">
          {activeTab === "signin" ? (
            <motion.form
              key="signin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSignIn}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium block mb-1.5">Email</label>
                <Input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="rounded-xl border-border h-12"
                  style={{ backgroundColor: "#080C09" }}
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="rounded-xl border-border h-12 pr-10"
                    style={{ backgroundColor: "#080C09" }}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-black font-semibold"
                style={{ backgroundColor: "#00E676" }}
              >
                {loading ? "Please wait..." : "Sign In"}
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSignUp}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium block mb-1.5">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-xl border-border h-12"
                  style={{ backgroundColor: "#080C09" }}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Email</label>
                <Input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="rounded-xl border-border h-12"
                  style={{ backgroundColor: "#080C09" }}
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">WhatsApp Number (10 digits)</label>
                <Input
                  type="tel"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="rounded-xl border-border h-12"
                  style={{ backgroundColor: "#080C09" }}
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="rounded-xl border-border h-12 pr-10"
                    style={{ backgroundColor: "#080C09" }}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl border-border h-12 pr-10"
                    style={{ backgroundColor: "#080C09" }}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-black font-semibold"
                style={{ backgroundColor: "#00E676" }}
              >
                {loading ? "Please wait..." : "Join Studio"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
