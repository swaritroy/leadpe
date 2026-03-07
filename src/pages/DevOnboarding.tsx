import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Copy, ExternalLink, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";

const CHATGPT_PROMPT = `Create a professional website for [Business Name], a [Type] in [City], India.
Include: Hero section, services, about section, contact form with name and WhatsApp number fields, floating WhatsApp button linking to +91[WhatsApp Number].
Style: Clean, professional, mobile-first, white and green color scheme, trust-building for Indian local businesses.`;

const FEE_OPTIONS = [
  { value: 500, label: "₹500 (Budget)" },
  { value: 800, label: "₹800 (Standard)" },
  { value: 1200, label: "₹1200 (Premium)" },
  { value: 2000, label: "₹2000 (Professional)" },
];

const CAPACITY_OPTIONS = [
  "1-2 sites",
  "3-5 sites",
  "6-10 sites",
  "10+ sites",
];

export default function DevOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [preferredFee, setPreferredFee] = useState(800);
  const [monthlyCapacity, setMonthlyCapacity] = useState("3-5 sites");
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfileData(data);
      });
  }, [user]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(CHATGPT_PROMPT);
    toast({ title: "Copied!", description: "Prompt copied to clipboard" });
  };

  const handleSaveEarnings = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        upi_id: upiId,
        preferred_fee: preferredFee,
        monthly_capacity: monthlyCapacity,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    setStep(5);
  };

  const handleComplete = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ onboarding_complete: true } as any)
      .eq("user_id", user.id);
    navigate("/dev/dashboard");
  };

  const progress = (step / 5) * 100;

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-[#F5FFF7]">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <LeadPeLogo theme="light" size="md" />
        <span className="text-sm text-gray-500">Step {step} of 5</span>
      </div>
      <Progress value={progress} className="h-1.5 mx-4 rounded-full bg-gray-200 [&>div]:bg-[#00C853]" />

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* STEP 1 — WELCOME */}
          {step === 1 && (
            <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-4">
                <div className="text-6xl">🚀</div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>
                  Welcome to LeadPe Studio!
                </h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  You're about to start earning by building AI websites for local Indian businesses. Let's set you up in 5 minutes.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: "💰", text: "₹500-2000 per site built" },
                  { emoji: "📈", text: "₹30/mo passive per client" },
                  { emoji: "🎯", text: "Zero clients to find yourself" },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <div className="text-2xl mb-1">{s.emoji}</div>
                    <p className="text-xs text-gray-700 font-medium">{s.text}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep(2)} className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl text-base">
                Let's Start <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2 — HOW TO BUILD */}
          {step === 2 && (
            <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>How to Build a Website</h1>
              <p className="text-sm text-gray-500">Follow these exact steps every time.</p>

              {[
                {
                  emoji: "🤖", title: "Use ChatGPT", desc: "Copy this prompt and fill in the client details:",
                  extra: (
                    <div className="mt-2">
                      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap">{CHATGPT_PROMPT}</pre>
                      <Button variant="outline" size="sm" onClick={handleCopyPrompt} className="mt-2 text-xs border-[#00C853] text-[#00C853]">
                        <Copy className="w-3 h-3 mr-1" /> Copy Prompt
                      </Button>
                    </div>
                  ),
                },
                {
                  emoji: "🎨", title: "Paste in Lovable", desc: "Go to lovable.dev, start new project, paste the ChatGPT output. Takes 5-10 minutes.",
                  extra: (
                    <Button variant="outline" size="sm" onClick={() => window.open("https://lovable.dev", "_blank")} className="mt-2 text-xs border-[#00C853] text-[#00C853]">
                      <ExternalLink className="w-3 h-3 mr-1" /> Open Lovable
                    </Button>
                  ),
                },
                { emoji: "📤", title: "Export to GitHub", desc: "In Lovable top right: Click 'Export to GitHub'. Free button — no upgrade needed. Creates GitHub repo automatically." },
                { emoji: "🚀", title: "Import to LeadPe", desc: "Copy the GitHub URL. Paste in your LeadPe dashboard. We handle rest automatically." },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{card.emoji}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{card.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
                      {card.extra}
                    </div>
                  </div>
                </div>
              ))}

              <Button onClick={() => setStep(3)} className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl text-base">
                I Understand <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 3 — MANDATORY ELEMENTS */}
          {step === 3 && (
            <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Every Site MUST Have These</h1>
              <p className="text-sm text-gray-500">Sites without these will be rejected automatically.</p>

              <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                <p className="text-xs font-bold text-[#00C853] uppercase tracking-wide">✅ Required</p>
                {[
                  { title: "Lead capture form", hint: "Name + Phone + Interest fields. Without this — no leads for business = they leave" },
                  { title: "WhatsApp button", hint: "Floating, bottom right. Direct contact = more conversions" },
                  { title: "Mobile responsive", hint: "80% visitors on mobile in India" },
                  { title: "Fast loading", hint: "Slow site = people leave. Our vetting checks this" },
                  { title: "Business contact details", hint: "Name, city, WhatsApp number" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded border-2 border-[#00C853] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#00C853]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.hint}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide">❌ Never Add</p>
                {["Fake reviews", "Stock photos of foreign people", "Prices (unless client confirms)", "Services client didn't mention"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded border-2 border-red-300 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-400 text-xs">✕</span>
                    </div>
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>

              <Button onClick={() => setStep(4)} className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl text-base">
                Got it <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 4 — EARNINGS SETUP */}
          {step === 4 && (
            <motion.div key="s4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Set Up Your Earnings</h1>

              <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">UPI ID or Phone Number</label>
                  <Input
                    placeholder="9XXXXXXXXX or name@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Payouts every Friday</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900">Preferred building fee</label>
                  <select
                    value={preferredFee}
                    onChange={(e) => setPreferredFee(Number(e.target.value))}
                    className="mt-1 w-full h-10 rounded-md border border-gray-300 bg-white text-gray-900 px-3 text-sm"
                  >
                    {FEE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">You can change per project</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900">Capacity per month</label>
                  <select
                    value={monthlyCapacity}
                    onChange={(e) => setMonthlyCapacity(e.target.value)}
                    className="mt-1 w-full h-10 rounded-md border border-gray-300 bg-white text-gray-900 px-3 text-sm"
                  >
                    {CAPACITY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleSaveEarnings}
                disabled={!upiId || saving}
                className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl text-base disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save & Continue"} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 5 — READY */}
          {step === 5 && (
            <motion.div key="s5" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-6">
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-[#00C853] flex items-center justify-center mx-auto"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>
                  You're Ready to Earn! 🎉
                </h1>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm space-y-2">
                <p className="text-sm font-semibold text-gray-900 mb-3">Your Profile:</p>
                {[
                  { label: "Name", value: profileData?.display_name || "—" },
                  { label: "UPI", value: upiId || "—" },
                  { label: "Capacity", value: monthlyCapacity },
                  { label: "Preferred fee", value: `₹${preferredFee}` },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="text-gray-900 font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-gray-900">What happens next:</p>
                {[
                  "We will WhatsApp you when a new client needs a site.",
                  "You build using the ChatGPT + Lovable method.",
                  "Import to LeadPe Studio.",
                  `Get paid ₹${preferredFee} + ₹30/mo passive.`,
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#00C853] font-bold text-sm">{i + 1}.</span>
                    <p className="text-sm text-gray-700">{text}</p>
                  </div>
                ))}
              </div>

              <Button onClick={handleComplete} className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl text-base">
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
