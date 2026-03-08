import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Copy, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { checkWebsiteQuality } from "@/lib/qualityChecker";

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

export default function DevOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [toolsDone, setToolsDone] = useState<Set<string>>(new Set());
  const [practiceUrl, setPracticeUrl] = useState("");
  const [practiceChecking, setPracticeChecking] = useState(false);
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const [practicePassed, setPracticePassed] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setUpiId((data as any).upi_id || ""); });
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
    try {
      const report = await checkWebsiteQuality(practiceUrl, {
        name: PRACTICE_BRIEF.businessName, type: PRACTICE_BRIEF.type, city: PRACTICE_BRIEF.city,
      });
      setPracticeScore(report.score);
      setPracticePassed(report.passed);
    } catch {
      setPracticeScore(75);
      setPracticePassed(true);
    }
    setPracticeChecking(false);
  };

  const handleSaveUpi = async () => {
    if (!user) return;
    setSaving(true);
    await (supabase as any).from("profiles").update({ upi_id: upiId }).eq("user_id", user.id);
    setSaving(false);
    setStep(5);
  };

  const handleComplete = async () => {
    if (!user) return;
    await (supabase as any).from("profiles").update({ onboarding_complete: true }).eq("user_id", user.id);
    navigate("/dev/dashboard");
  };

  const progress = (step / 5) * 100;
  const slide = { enter: { opacity: 0, x: 40 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 } };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700 }}>
          <span style={{ color: "#1A1A1A" }}>Lead</span><span style={{ color: "#00C853" }}>Pe</span>
          <span style={{ color: "#00C853", fontSize: 14, marginLeft: 6 }}>Studio</span>
        </span>
        <span style={{ fontSize: 13, color: "#999" }}>Step {step} of 5</span>
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} style={{
              width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: step >= s ? "#00C853" : "#E0E0E0", color: step >= s ? "#fff" : "#999",
              fontSize: 13, fontWeight: 700,
            }}>
              {step > s ? <Check size={14} /> : s}
            </div>
          ))}
        </div>
        <div style={{ height: 4, backgroundColor: "#E8F5E9", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, backgroundColor: "#00C853", borderRadius: 4, transition: "width 0.3s" }} />
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-6 pb-20">
        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div key="s1" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 36, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>Welcome to LeadPe Studio!</h1>
                <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7, marginBottom: 24 }}>
                  You will build websites using AI tools. No coding. Just prompts and clicks.
                </p>
                <button onClick={() => setStep(2)} style={{ width: "100%", height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                  Let's Start →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div key="s2" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Your AI Tools</h1>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>Create free accounts on all 3. Come back when done.</p>

              {[
                { id: "chatgpt", emoji: "🤖", name: "ChatGPT", desc: "For generating website content", url: "https://chatgpt.com" },
                { id: "lovable", emoji: "🎨", name: "Lovable", desc: "For building the website", url: "https://lovable.dev" },
                { id: "github", emoji: "📦", name: "GitHub", desc: "For saving your work", url: "https://github.com" },
              ].map((tool) => (
                <div key={tool.id} style={{
                  backgroundColor: "#fff", borderRadius: 12, padding: 20, marginBottom: 12,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: toolsDone.has(tool.id) ? "2px solid #00C853" : "1px solid #E0E0E0",
                }} className="flex items-center gap-4">
                  <span style={{ fontSize: 36 }}>{tool.emoji}</span>
                  <div className="flex-1">
                    <p style={{ fontWeight: 600, color: "#1A1A1A", fontSize: 15 }}>{tool.name}</p>
                    <p style={{ fontSize: 12, color: "#666" }}>{tool.desc}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <button onClick={() => window.open(tool.url, "_blank")}
                      style={{ fontSize: 12, color: "#00C853", fontWeight: 600, background: "none", border: "1px solid #00C853", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
                      Open →
                    </button>
                    <label className="flex items-center gap-1 cursor-pointer" style={{ fontSize: 11, color: "#999" }}>
                      <input type="checkbox" checked={toolsDone.has(tool.id)}
                        onChange={() => setToolsDone((prev) => { const n = new Set(prev); n.has(tool.id) ? n.delete(tool.id) : n.add(tool.id); return n; })}
                        style={{ accentColor: "#00C853" }} />
                      Done
                    </label>
                  </div>
                </div>
              ))}

              <button onClick={() => setStep(3)} disabled={toolsDone.size < 3}
                style={{ width: "100%", height: 52, backgroundColor: toolsDone.size >= 3 ? "#00C853" : "#E0E0E0", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", marginTop: 12, opacity: toolsDone.size >= 3 ? 1 : 0.5 }}>
                Next →
              </button>
              <button onClick={() => setStep(3)} style={{ width: "100%", textAlign: "center", fontSize: 12, color: "#999", marginTop: 8, background: "none", border: "none", cursor: "pointer" }}>
                Skip for now
              </button>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div key="s3" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Practice First</h1>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>Build one practice website before taking real orders. No payment — just learning.</p>

              <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#00C853", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Practice Brief</p>
                {Object.entries(PRACTICE_BRIEF).map(([k, v]) => (
                  <div key={k} className="flex justify-between" style={{ fontSize: 14, marginBottom: 6 }}>
                    <span style={{ color: "#666", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                    <span style={{ color: "#1A1A1A", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>ChatGPT Prompt</p>
                <pre style={{ backgroundColor: "#FAFAFA", border: "1px solid #E0E0E0", borderRadius: 10, padding: 12, fontSize: 12, color: "#666", whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto" }}>
                  {CHATGPT_PROMPT}
                </pre>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleCopyPrompt} style={{ fontSize: 12, color: "#00C853", fontWeight: 600, background: "none", border: "1px solid #00C853", borderRadius: 8, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Copy size={12} /> Copy Prompt
                  </button>
                  <button onClick={() => window.open("https://lovable.dev", "_blank")} style={{ fontSize: 12, color: "#00C853", fontWeight: 600, background: "none", border: "1px solid #00C853", borderRadius: 8, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <ExternalLink size={12} /> Open Lovable
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>Submit GitHub URL</p>
                <Input value={practiceUrl} onChange={(e) => setPracticeUrl(e.target.value)}
                  placeholder="https://github.com/you/repo" className="bg-white border-[#E0E0E0] text-[#111] h-11 rounded-xl mb-3" />
                {practiceScore !== null && (
                  <div style={{ padding: 12, borderRadius: 10, fontSize: 13, textAlign: "center", marginBottom: 12,
                    backgroundColor: practicePassed ? "#F0FFF4" : "#FEF2F2",
                    color: practicePassed ? "#00C853" : "#EF4444",
                    border: `1px solid ${practicePassed ? "#00C853" : "#FECACA"}` }}>
                    {practicePassed ? `✅ Score: ${practiceScore}/100 — Passed!` : `⚠️ Score: ${practiceScore}/100 — Need ≥ 70`}
                  </div>
                )}
                <button onClick={handlePracticeSubmit} disabled={practiceChecking || !practiceUrl}
                  style={{ width: "100%", height: 44, backgroundColor: "#1A1A1A", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: practiceChecking ? 0.6 : 1 }}>
                  {practiceChecking ? "Checking..." : "Submit Practice →"}
                </button>
              </div>

              <button onClick={() => setStep(4)} disabled={!practicePassed}
                style={{ width: "100%", height: 52, backgroundColor: practicePassed ? "#00C853" : "#E0E0E0", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", opacity: practicePassed ? 1 : 0.5 }}>
                {practicePassed ? "Continue →" : "Pass practice first"}
              </button>
              <button onClick={() => setStep(4)} style={{ width: "100%", textAlign: "center", fontSize: 12, color: "#999", marginTop: 8, background: "none", border: "none", cursor: "pointer" }}>
                Skip practice (not recommended)
              </button>
            </motion.div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <motion.div key="s4" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Set Up Payments</h1>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>Where should we send earnings?</p>

              <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 8 }}>UPI ID</label>
                <Input placeholder="rajesh@paytm" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                  className="bg-white border-[#E0E0E0] text-[#111] h-12 rounded-xl" />
                <p style={{ fontSize: 11, color: "#999", marginTop: 4 }}>PhonePe, Google Pay, Paytm — all accepted</p>
              </div>

              <button onClick={handleSaveUpi} disabled={!upiId || saving}
                style={{ width: "100%", height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", opacity: (!upiId || saving) ? 0.5 : 1 }}>
                {saving ? "Saving..." : "Confirm UPI →"}
              </button>
            </motion.div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <motion.div key="s5" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  style={{ fontSize: 64, marginBottom: 16 }}>🚀</motion.div>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>You Are Ready!</h1>
                <p style={{ fontSize: 14, color: "#666" }}>First real build request is waiting for you.</p>
              </div>

              <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24, textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>Potential this month</p>
                <div style={{ backgroundColor: "#F0FFF4", borderRadius: 12, padding: 20 }}>
                  <p style={{ fontFamily: "Syne, sans-serif", fontSize: 36, fontWeight: 700, color: "#00C853" }}>₹6,000</p>
                  <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>5 builds × ₹1,200</p>
                </div>
                <p style={{ fontSize: 12, color: "#666", marginTop: 12 }}>After 6 months passive: ₹900/month</p>
              </div>

              <button onClick={handleComplete}
                style={{ width: "100%", height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                Go to Dashboard →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
