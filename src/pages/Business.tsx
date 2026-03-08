import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { generateSEO, generateWelcomeMessage } from "@/lib/aiService";

const businessTypes = [
  "Coaching Centre", "Doctor / Clinic", "Lawyer / CA", "Salon / Parlour",
  "Gym / Fitness", "Plumber / Electrician", "Photographer", "Real Estate",
  "Restaurant", "Dance / Music Class", "Other",
];

const languages = [
  { code: "english", label: "🇬🇧 English" },
  { code: "hindi", label: "🇮🇳 Hindi" },
  { code: "hinglish", label: "⚡ Hinglish" },
];

export default function Business() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [trialCode, setTrialCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    businessName: "", businessType: "", city: "", whatsappNumber: "", ownerName: "",
    plan: "growth", language: "hinglish",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.businessName.trim()) e.businessName = "Required";
    if (!form.businessType.trim()) e.businessType = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.ownerName.trim()) e.ownerName = "Required";
    const digits = form.whatsappNumber.replace(/\D/g, "");
    if (!digits) e.whatsappNumber = "Required";
    else if (digits.length !== 10) e.whatsappNumber = "Please enter 10 digit number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate()) setStep((s) => Math.min(s + 1, 3)); };
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const code = "LP-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const digits = form.whatsappNumber.replace(/\D/g, "");
    const email = `${digits}@leadpe.com`;
    const trialStart = new Date().toISOString();
    const trialEnd = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();

    try {
      // 1. Insert to signups table
      const { error: dbError } = await supabase.from("signups").insert({
        business_name: form.businessName,
        business_type: form.businessType,
        city: form.city,
        whatsapp_number: digits,
        owner_name: form.ownerName,
        plan_selected: form.plan,
        preferred_language: form.language,
        status: "trial",
        trial_code: code,
        trial_start_date: trialStart,
        trial_end_date: trialEnd,
      });

      if (dbError) {
        console.log("Supabase signups error:", dbError);
        setError("Error: " + dbError.message);
        setLoading(false);
        return;
      }

      // 2. Auto create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: code,
        options: {
          data: {
            full_name: form.ownerName,
            whatsapp_number: digits,
            role: "business",
            trial_code: code,
          },
        },
      });

      if (authError) {
        console.log("Auth signup error:", authError);
        // If user already exists, try sign in
        if (authError.message.includes("already registered")) {
          setError("This WhatsApp number is already registered. Please sign in at /auth");
          setLoading(false);
          return;
        }
        setError("Error: " + authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // 3. Update the auto-created profile with full details
        await (supabase.from("profiles") as any).update({
          full_name: form.ownerName,
          whatsapp_number: digits,
          email,
          role: "business",
          status: "trial",
          subscription_plan: form.plan,
          trial_code: code,
          preferred_language: form.language,
          business_name: form.businessName,
          business_type: form.businessType,
          city: form.city,
          trial_start_date: trialStart,
          trial_end_date: trialEnd,
          onboarding_complete: false,
        }).eq("user_id", authData.user.id);

        // 4. Insert user role
        await (supabase.from("user_roles") as any).insert({
          user_id: authData.user.id,
          role: "business",
        });

        // 5. Auto sign in immediately
        await supabase.auth.signInWithPassword({ email, password: code });
      }

      // 6. WhatsApp admin notification
      const msg = `🔔 NEW LEADPE SIGNUP\n━━━━━━━━━━━━\nBusiness: ${form.businessName}\nType: ${form.businessType}\nCity: ${form.city}\nWhatsApp: ${digits}\nOwner: ${form.ownerName}\nPlan: ${form.plan}\nCode: ${code}\nLogin: ${email}\nPassword: ${code}\n━━━━━━━━━━━━\nLeadPe ⚡`;
      window.open(`https://wa.me/919973383902?text=${encodeURIComponent(msg)}`, "_blank");

      setTrialCode(code);
      setShowSuccess(true);
    } catch (err: any) {
      console.log("Error:", err);
      setError("Something went wrong: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(trialCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SUCCESS SCREEN
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: "#F0FFF4" }}>
            <Check size={40} style={{ color: "#00C853" }} />
          </motion.div>
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Welcome to LeadPe! 🎉</h2>

          <div className="rounded-xl p-5 mb-6 flex items-center justify-between" style={{ backgroundColor: "#F0FFF4", border: "2px solid #00C853" }}>
            <div className="text-left">
              <p className="text-xs" style={{ color: "#666666" }}>Your Trial Code (also your password)</p>
              <p className="text-2xl font-bold" style={{ color: "#00C853", fontFamily: "Syne" }}>{trialCode}</p>
            </div>
            <Button onClick={copyCode} variant="outline" size="sm" className="rounded-lg" style={{ borderColor: "#00C853", color: "#00C853" }}>
              {copied ? "Copied! ✓" : <><Copy size={14} /> Copy</>}
            </Button>
          </div>

          <p className="text-sm mb-3" style={{ color: "#666666" }}>
            Your login: <strong>{form.whatsappNumber.replace(/\D/g, "")}@leadpe.com</strong>
          </p>
          <p className="text-sm mb-8" style={{ color: "#666666" }}>
            Our team will WhatsApp you on +91{form.whatsappNumber.replace(/\D/g, "")} within 2 hours to start building your website.
          </p>

          <Button onClick={() => navigate("/client/dashboard")} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
            Go to Dashboard →
          </Button>
        </motion.div>
      </div>
    );
  }

  // INPUT HELPER
  const Field = ({ label, hint, error: fieldError, children }: { label: string; hint: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>
        {label} <span className="text-xs block" style={{ color: "#666666" }}>{hint}</span>
      </label>
      {children}
      {fieldError && <p className="text-xs text-red-500 mt-1">{fieldError}</p>}
    </div>
  );

  const inputStyle = "rounded-xl h-12 text-base";
  const inputCSS: React.CSSProperties = { backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "10px", padding: "12px 16px", color: "#1A1A1A", fontSize: "16px" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <nav className="bg-white border-b" style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <LeadPeLogo theme="light" size="sm" />
          <Button onClick={() => navigate("/")} variant="ghost" className="text-sm" style={{ color: "#00C853" }}>← Back to Home</Button>
        </div>
      </nav>

      <div className="container px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            {/* PROGRESS */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${s <= step ? "text-white" : "text-gray-400"}`}
                    style={{ backgroundColor: s <= step ? "#00C853" : "#E0E0E0" }}>
                    {s < step ? <Check size={16} /> : s}
                  </div>
                  {s < 3 && <div className="w-12 h-1 mx-2" style={{ backgroundColor: s < step ? "#00C853" : "#E0E0E0" }} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <h2 className="text-xl font-bold text-center mb-2" style={{ color: "#1A1A1A" }}>Tell us about your business</h2>
                  <p className="text-sm text-center mb-6" style={{ color: "#666666" }}>Takes 2 minutes</p>

                  <Field label="Business Name" hint="Apne business ka naam" error={errors.businessName}>
                    <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="e.g. Shiva Study Centre"
                      className={inputStyle} style={inputCSS} />
                  </Field>

                  <Field label="Business Type" hint="Aap kya karte hain?" error={errors.businessType}>
                    <div className="relative">
                      <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full text-left flex items-center justify-between"
                        style={{ ...inputCSS, display: "flex", cursor: "pointer", border: errors.businessType ? "1px solid #ef4444" : "1px solid #E0E0E0" }}>
                        <span style={{ color: form.businessType ? "#1A1A1A" : "#9ca3af" }}>{form.businessType || "Choose type"}</span>
                        <ChevronDown size={16} className={dropdownOpen ? "rotate-180" : ""} style={{ color: "#666666" }} />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border max-h-60 overflow-y-auto" style={{ borderColor: "#E0E0E0", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                          {businessTypes.map((t) => (
                            <div key={t} onClick={() => { update("businessType", t); setDropdownOpen(false); }}
                              className="px-4 py-3 cursor-pointer hover:bg-[#F0FFF4] text-sm" style={{ color: "#1A1A1A" }}>{t}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>

                  <Field label="City / Town" hint="Kaunse shehar mein?" error={errors.city}>
                    <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Vaishali, Bihar"
                      className={inputStyle} style={inputCSS} />
                  </Field>

                  <Field label="WhatsApp Number" hint="Leads isi number pe aayenge" error={errors.whatsappNumber}>
                    <Input value={form.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210" type="tel" className={inputStyle} style={inputCSS} />
                  </Field>

                  <Field label="Owner Name" hint="Aapka naam" error={errors.ownerName}>
                    <Input value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} placeholder="e.g. Sanjay Singhania"
                      className={inputStyle} style={inputCSS} />
                  </Field>

                  <Button onClick={handleNext} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>Next →</Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <h2 className="text-xl font-bold text-center mb-1" style={{ color: "#1A1A1A" }}>Choose your plan</h2>
                  <p className="text-sm text-center mb-6" style={{ color: "#666666" }}>Start free. Upgrade anytime.</p>

                  {[
                    { value: "trial", name: "Free Trial", desc: "21 days — no credit card", price: "₹0", priceColor: "#1A1A1A" },
                    { value: "growth", name: "Growth Plan", desc: "Unlimited leads + WhatsApp ping", price: "₹299/mo", priceColor: "#00C853" },
                  ].map((p) => (
                    <div key={p.value} onClick={() => update("plan", p.value)}
                      className="rounded-2xl p-5 cursor-pointer transition-all flex items-center gap-4"
                      style={{ backgroundColor: "#FFFFFF", border: form.plan === p.value ? "2px solid #00C853" : "2px solid #E0E0E0" }}>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: form.plan === p.value ? "#00C853" : "#ccc" }}>
                        {form.plan === p.value && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#00C853" }} />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm" style={{ color: "#1A1A1A" }}>{p.name}</h3>
                        <p className="text-xs" style={{ color: "#666666" }}>{p.desc}</p>
                      </div>
                      <span className="font-bold" style={{ color: p.priceColor }}>{p.price}</span>
                    </div>
                  ))}

                  <div className="flex gap-4 pt-2">
                    <Button onClick={handleBack} variant="outline" className="flex-1 h-12 rounded-xl" style={{ borderColor: "#00C853", color: "#00C853" }}>← Back</Button>
                    <Button onClick={handleNext} className="flex-1 h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>Continue →</Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <h2 className="text-xl font-bold text-center mb-6" style={{ color: "#1A1A1A" }}>Almost done! 🎉</h2>

                  <div className="rounded-xl p-5 space-y-2" style={{ backgroundColor: "#F0FFF4", border: "1px solid #E0E0E0" }}>
                    {[
                      ["Business", form.businessName],
                      ["Type", form.businessType],
                      ["City", form.city],
                      ["Plan", form.plan === "growth" ? "Growth Plan" : "Free Trial"],
                      ["WhatsApp", "+91 " + form.whatsappNumber],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span style={{ color: "#666666" }}>{k}:</span>
                        <span className="font-medium" style={{ color: "#1A1A1A" }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-3" style={{ color: "#1A1A1A" }}>WhatsApp messages in:</label>
                    <div className="flex gap-3">
                      {languages.map((l) => (
                        <button key={l.code} onClick={() => update("language", l.code)}
                          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                          style={form.language === l.code
                            ? { backgroundColor: "#00C853", color: "white" }
                            : { backgroundColor: "white", border: "1px solid #E0E0E0", color: "#1A1A1A" }}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                  <div className="flex gap-4">
                    <Button onClick={handleBack} variant="outline" className="flex-1 h-12 rounded-xl" style={{ borderColor: "#00C853", color: "#00C853" }}>← Back</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
                      {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</span> : "Get My Website Free →"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
