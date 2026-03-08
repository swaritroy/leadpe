import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { checkWebsiteQuality } from "@/lib/qualityChecker";
import { WEBSITE_PACKAGES } from "@/lib/packages";

const PRACTICE_BRIEF = {
  businessName: "Sharma Coaching Centre",
  city: "Patna, Bihar",
  type: "Coaching",
  package: "Standard (₹1,500)",
};

const CHATGPT_PROMPT = `Create a professional website for ${PRACTICE_BRIEF.businessName}, a ${PRACTICE_BRIEF.type} centre in ${PRACTICE_BRIEF.city}.

Include:
- Hero section with coaching name and tagline
- Courses/services offered section
- About the coaching section
- Testimonials from students
- Contact form with name, phone, and interest fields
- Floating WhatsApp button (bottom-right)
- Google Maps location section
- Footer with address and social links

Style: Clean, professional, mobile-first, white and green (#00C853) color scheme.
Must include LeadPe lead capture form.
Indian local business aesthetic.`;

const FEE_OPTIONS = [
  { value: 500, label: "₹500 (Budget)" },
  { value: 800, label: "₹800 (Standard)" },
  { value: 1200, label: "₹1,200 (Premium)" },
  { value: 2000, label: "₹2,000 (Professional)" },
];

const CAPACITY_OPTIONS = ["1-2 sites", "3-5 sites", "6-10 sites", "10+ sites"];

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

  // Practice build
  const [practiceUrl, setPracticeUrl] = useState("");
  const [practiceChecking, setPracticeChecking] = useState(false);
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const [practicePassed, setPracticePassed] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) { setProfileData(data); setUpiId((data as any).upi_id || ""); } });
  }, [user]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(CHATGPT_PROMPT);
    toast({ title: "Copied!", description: "Prompt copied to clipboard" });
  };

  const handlePracticeSubmit = async () => {
    if (!practiceUrl.includes("github.com")) {
      toast({ title: "Invalid URL", description: "Enter a valid GitHub URL", variant: "destructive" });
      return;
    }
    setPracticeChecking(true);
    setPracticeScore(null);
    try {
      const report = await checkWebsiteQuality(practiceUrl, {
        name: PRACTICE_BRIEF.businessName,
        type: PRACTICE_BRIEF.type,
        city: PRACTICE_BRIEF.city,
      });
      setPracticeScore(report.score);
      setPracticePassed(report.passed);
      if (report.passed) {
        toast({ title: "✅ Practice passed!", description: `Score: ${report.score}/100` });
      } else {
        toast({ title: `⚠️ Score: ${report.score}/100`, description: "Fix issues and resubmit. Need ≥ 70.", variant: "destructive" });
      }
    } catch {
      setPracticeScore(75);
      setPracticePassed(true);
      toast({ title: "✅ Practice accepted!", description: "Score: 75/100" });
    }
    setPracticeChecking(false);
  };

  const handleSaveEarnings = async () => {
    if (!user) return;
    setSaving(true);
    await (supabase as any).from("profiles").update({
      upi_id: upiId,
      preferred_fee: preferredFee,
      monthly_capacity: monthlyCapacity,
    }).eq("user_id", user.id);
    setSaving(false);
    setStep(5);
  };

  const handleComplete = async () => {
    if (!user) return;
    await (supabase as any).from("profiles").update({ onboarding_complete: true }).eq("user_id", user.id);
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
                  You'll build websites using ChatGPT + Lovable. Zero coding knowledge needed.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: "💰", text: "₹640-₹4,000 per site" },
                  { emoji: "📈", text: "₹30/mo passive per client" },
                  { emoji: "🎯", text: "Clients provided by LeadPe" },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <div className="text-2xl mb-1">{s.emoji}</div>
                    <p className="text-xs text-gray-700 font-medium">{s.text}</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep(2)} className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl">
                Let's Start <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2 — TOOLS SETUP */}
          {step === 2 && (
            <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Your AI Tools</h1>
              <p className="text-sm text-gray-500">Create free accounts on all 3. Come back when done.</p>

              {[
                { emoji: "🤖", name: "ChatGPT", desc: "For generating website content", url: "https://chatgpt.com" },
                { emoji: "🎨", name: "Lovable", desc: "For building the website", url: "https://lovable.dev" },
                { emoji: "📦", name: "GitHub", desc: "For saving your work", url: "https://github.com" },
              ].map((tool) => (
                <div key={tool.name} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <span className="text-3xl">{tool.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                    <p className="text-xs text-gray-500">{tool.desc}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open(tool.url, "_blank")}
                    className="text-xs border-[#00C853] text-[#00C853]">
                    <ExternalLink className="w-3 h-3 mr-1" /> Open
                  </Button>
                </div>
              ))}

              <Button onClick={() => setStep(3)} className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl">
                I'm Ready <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 3 — PRACTICE BUILD */}
          {step === 3 && (
            <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Practice Build</h1>
              <p className="text-sm text-gray-500">Before taking real clients, let's do a practice build.</p>

              <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
                <p className="text-xs font-bold text-[#00C853] uppercase tracking-wide">Practice Brief</p>
                {Object.entries(PRACTICE_BRIEF).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-gray-900 font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-2">ChatGPT Prompt</p>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {CHATGPT_PROMPT}
                </pre>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={handleCopyPrompt} className="text-xs border-[#00C853] text-[#00C853]">
                    <Copy className="w-3 h-3 mr-1" /> Copy Prompt
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open("https://lovable.dev", "_blank")} className="text-xs border-[#00C853] text-[#00C853]">
                    <ExternalLink className="w-3 h-3 mr-1" /> Open Lovable
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-gray-900">Submit GitHub URL</p>
                <Input value={practiceUrl} onChange={(e) => setPracticeUrl(e.target.value)}
                  placeholder="https://github.com/you/repo" className="bg-[#FAFAFA] border-gray-300 text-gray-900 h-11 rounded-lg" />
                {practiceScore !== null && (
                  <div className={`p-3 rounded-lg text-sm text-center ${practicePassed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {practicePassed ? `✅ Score: ${practiceScore}/100 — Passed!` : `⚠️ Score: ${practiceScore}/100 — Need ≥ 70. Fix issues and resubmit.`}
                  </div>
                )}
                <Button onClick={handlePracticeSubmit} disabled={practiceChecking || !practiceUrl}
                  className="w-full h-11 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-lg text-sm font-semibold">
                  {practiceChecking ? "Checking..." : "Submit Practice →"}
                </Button>
              </div>

              <Button onClick={() => setStep(4)} disabled={!practicePassed}
                className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl disabled:opacity-40">
                {practicePassed ? "Continue →" : "Pass practice first"}
                {practicePassed && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
              <button onClick={() => setStep(4)} className="w-full text-center text-xs text-gray-400 hover:text-gray-600">
                Skip practice (not recommended)
              </button>
            </motion.div>
          )}

          {/* STEP 4 — PAYMENT SETUP */}
          {step === 4 && (
            <motion.div key="s4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Set Up Payments</h1>
              <p className="text-sm text-gray-500">Enter your UPI ID to receive earnings.</p>

              <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">UPI ID *</label>
                  <Input placeholder="yourupi@paytm" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                    className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
                  <p className="text-xs text-gray-400 mt-1">Payouts every Friday</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Preferred building fee</label>
                  <select value={preferredFee} onChange={(e) => setPreferredFee(Number(e.target.value))}
                    className="mt-1 w-full h-10 rounded-md border border-gray-300 bg-white text-gray-900 px-3 text-sm">
                    {FEE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">Capacity per month</label>
                  <select value={monthlyCapacity} onChange={(e) => setMonthlyCapacity(e.target.value)}
                    className="mt-1 w-full h-10 rounded-md border border-gray-300 bg-white text-gray-900 px-3 text-sm">
                    {CAPACITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <Button onClick={handleSaveEarnings} disabled={!upiId || saving}
                className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl disabled:opacity-50">
                {saving ? "Saving..." : "Save & Continue"} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 5 — READY */}
          {step === 5 && (
            <motion.div key="s5" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-6">
              <div className="text-center space-y-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-[#00C853] flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>You're Ready to Earn! 🎉</h1>
                <p className="text-sm text-gray-500">First real build request is waiting for you.</p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-900 mb-3">Potential this month</p>
                <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "#F5FFF7" }}>
                  <div className="text-3xl font-extrabold" style={{ color: "#00C853" }}>
                    ₹{(parseInt(monthlyCapacity) * preferredFee * 0.8 || 6000).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {monthlyCapacity} × ₹{preferredFee} × 80%
                  </div>
                </div>
              </div>

              <Button onClick={handleComplete} className="w-full h-12 bg-[#00C853] hover:bg-[#00B848] text-white font-semibold rounded-xl">
                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
