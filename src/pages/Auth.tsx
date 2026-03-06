
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LeadPeLogo from "@/components/LeadPeLogo";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Language } from "@/lib/trialSequence";

export default function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  // Sign In fields
  const [signInPhone, setSignInPhone] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up fields
  const [fullName, setFullName] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Language selector state
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    return digits;
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePhone(signInPhone)) {
      setError("Please enter a valid WhatsApp number.");
      return;
    }

    if (!signInPassword) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    const email = `${signInPhone.replace(/\D/g, "")}@leadpe.business`;
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
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

    navigate("/client/dashboard", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
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
    const email = `${phoneDigits}@leadpe.business`;
    const trialCode = "LP-" + Math.floor(100000 + Math.random() * 900000).toString();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: signUpPassword,
      options: {
        data: {
          full_name: fullName,
          whatsapp_number: phoneDigits,
          role: "business",
        },
      },
    });

    if (authError) {
      setLoading(false);
      if (authError.message.includes("already registered")) {
        setError("This number is already registered. Please sign in.");
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
        whatsapp_number: phoneDigits,
        email: email,
        role: "business",
        status: "trial",
        trial_code: trialCode,
        created_at: new Date().toISOString(),
        subscription_plan: "basic",
        preferred_language: "hinglish", // Default to Hinglish
      });

      // Create user_roles entry
      await (supabase.from("user_roles") as any).insert({
        user_id: authData.user.id,
        role: "business",
      });

      // Store user ID for language selection
      setNewUserId(authData.user.id);
    }

    setLoading(false);
    // Show language selector instead of navigating immediately
    setShowLanguageSelector(true);
  };

  const handleLanguageSelect = async (language: Language) => {
    if (newUserId) {
      // Update profile with selected language
      await (supabase.from("profiles") as any)
        .update({ preferred_language: language })
        .eq("id", newUserId);
    }
    
    setShowLanguageSelector(false);
    navigate("/client/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="text-center mb-8">
            <LeadPeLogo theme="light" size="lg" />
            <h1 className="text-2xl font-bold mb-2 text-[#1A1A1A] mt-4">Welcome Back</h1>
            <p className="text-sm text-[#666666]">Sign in to your LeadPe dashboard</p>
          </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl p-1 mb-6 border border-[#E0E0E0]" style={{ backgroundColor: "#F8F8F8" }}>
          <button
            onClick={() => { setActiveTab("signin"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "signin" ? "text-white" : "text-[#666666] hover:text-[#1A1A1A]"
            }`}
            style={activeTab === "signin" ? { backgroundColor: "#00C853" } : {}}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab("signup"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "signup" ? "text-white" : "text-[#666666] hover:text-[#1A1A1A]"
            }`}
            style={activeTab === "signup" ? { backgroundColor: "#00C853" } : {}}
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
                <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">WhatsApp Number (10 digits)</label>
                <Input
                  type="tel"
                  value={signInPhone}
                  onChange={(e) => setSignInPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                   className="rounded-xl border-[#E0E0E0] h-12 focus:border-[#00C853] focus:ring-[#00C853] text-[#111111] placeholder:text-[#9ca3af]"
                   style={{ backgroundColor: "#F8F8F8", color: "#111111" }}
                   placeholder="9876543210"
                 />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                     className="rounded-xl border-[#E0E0E0] h-12 pr-10 focus:border-[#00C853] focus:ring-[#00C853] text-[#111111] placeholder:text-[#9ca3af]"
                     style={{ backgroundColor: "#F8F8F8", color: "#111111" }}
                     placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#1A1A1A]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button type="button" className="text-xs text-[#00C853] hover:text-[#00A843] font-medium">
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-white font-semibold bg-[#00C853] hover:bg-[#00A843]"
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
                <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                   className="rounded-xl border-[#E0E0E0] h-12 focus:border-[#00C853] focus:ring-[#00C853] text-[#111111] placeholder:text-[#9ca3af]"
                   style={{ backgroundColor: "#F8F8F8", color: "#111111" }}
                   placeholder="Your full name"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">WhatsApp Number (10 digits)</label>
                <Input
                  type="tel"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                   className="rounded-xl border-[#E0E0E0] h-12 focus:border-[#00C853] focus:ring-[#00C853] text-[#111111] placeholder:text-[#9ca3af]"
                   style={{ backgroundColor: "#F8F8F8", color: "#111111" }}
                   placeholder="9876543210"
                 />
               </div>

               <div>
                 <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Password</label>
                 <div className="relative">
                   <Input
                     type={showPassword ? "text" : "password"}
                     value={signUpPassword}
                     onChange={(e) => setSignUpPassword(e.target.value)}
                     className="rounded-xl border-[#E0E0E0] h-12 pr-10 focus:border-[#00C853] focus:ring-[#00C853] text-[#111111] placeholder:text-[#9ca3af]"
                     style={{ backgroundColor: "#F8F8F8", color: "#111111" }}
                     placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#1A1A1A]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                     className="rounded-xl border-[#E0E0E0] h-12 pr-10 focus:border-[#00C853] focus:ring-[#00C853] text-[#111111] placeholder:text-[#9ca3af]"
                     style={{ backgroundColor: "#F8F8F8", color: "#111111" }}
                     placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#1A1A1A]"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-white font-semibold bg-[#00C853] hover:bg-[#00A843]"
              >
                {loading ? "Please wait..." : "Create Account"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
        </div>
      </motion.div>

      {/* Language Selector Modal */}
      <LanguageSelector
        isOpen={showLanguageSelector}
        onClose={() => {
          setShowLanguageSelector(false);
          navigate("/client/dashboard", { replace: true });
        }}
        onSelect={handleLanguageSelect}
        currentLanguage="hinglish"
        title="Choose your preferred language"
        subtitle="Apni pasandeeda bhasha chunein"
      />
    </div>
  );
}
