import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Github, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AI_TOOLS = [
  { id: "lovable", label: "Lovable", icon: "💜" },
  { id: "cursor", label: "Cursor", icon: "⚡" },
  { id: "bolt", label: "Bolt.new", icon: "⚡" },
  { id: "v0", label: "v0.dev", icon: "🔲" },
  { id: "replit", label: "Replit", icon: "🔁" },
  { id: "chatgpt", label: "ChatGPT", icon: "🤖" },
  { id: "claude", label: "Claude", icon: "🧠" },
  { id: "other", label: "Other", icon: "🔧" },
];

export default function DevOnboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Profile details
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [upiId, setUpiId] = useState("");

  // Step 2: AI tools
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Step 3: Test site
  const [testSiteUrl, setTestSiteUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setWhatsapp(profile.whatsapp_number || "");
      setCity(profile.city || "");
      setUpiId(profile.upi_id || "");
    }
  }, [profile]);

  const handleNextStep1 = () => {
    const digits = whatsapp.replace(/\D/g, "");
    if (!fullName.trim()) return toast({ title: "Name required", variant: "destructive" });
    if (digits.length !== 10) return toast({ title: "Valid 10-digit WhatsApp number required", variant: "destructive" });
    if (!city.trim()) return toast({ title: "City required", variant: "destructive" });
    if (!upiId.trim()) return toast({ title: "UPI ID required", variant: "destructive" });
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleNextStep2 = () => {
    if (selectedTools.length === 0) return toast({ title: "Select at least one AI tool", variant: "destructive" });
    setStep(3);
    window.scrollTo(0, 0);
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const isValidGithubUrl = (url: string) => {
    return /^https?:\/\/(www\.)?github\.com\/[\w\-]+\/[\w\-\.]+/i.test(url.trim());
  };

  const handleFinish = async () => {
    if (!user) return;
    if (!testSiteUrl.trim()) return toast({ title: "Please enter your test site GitHub URL", variant: "destructive" });
    if (!isValidGithubUrl(testSiteUrl)) return toast({ title: "Please enter a valid GitHub repository URL", description: "e.g. https://github.com/username/repo", variant: "destructive" });

    setLoading(true);

    const { error } = await (supabase.from("profiles") as any).update({
      full_name: fullName,
      whatsapp_number: whatsapp.replace(/\D/g, "").slice(0, 10),
      city: city,
      upi_id: upiId,
      onboarding_complete: true,
      ai_tools: selectedTools,
      test_site_url: testSiteUrl.trim(),
      vetting_status: "pending_vetting",
    }).eq("user_id", user.id);

    setLoading(false);

    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
      return;
    }

    // Send WhatsApp to admin about new coder for vetting
    try {
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: "919973383902",
          message: `🆕 New Vibe Coder for Review!\n\n👤 ${fullName}\n📍 ${city}\n🛠️ Tools: ${selectedTools.join(", ")}\n🔗 Test Site: ${testSiteUrl.trim()}\n\nReview in Admin Panel → Vibe Coders section`
        }
      });
    } catch {}

    navigate("/dev/dashboard", { replace: true });
  };

  const slide = { 
    enter: { opacity: 0, x: 40 }, 
    center: { opacity: 1, x: 0 }, 
    exit: { opacity: 0, x: -40 } 
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7", fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        #whatsapp-tooltip, button[aria-label="Chat on WhatsApp"] {
          display: none !important;
        }
      `}} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 max-w-[560px] mx-auto">
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700 }}>
          <span style={{ color: "#1A1A1A" }}>Lead</span><span style={{ color: "#00C853" }}>Pe</span>
          <span style={{ color: "#00C853", fontSize: 14, marginLeft: 6 }}>Studio</span>
        </span>
        <span style={{ fontSize: 13, color: "#999" }}>Step {step} of {totalSteps}</span>
      </div>

      {/* Progress */}
      <div className="max-w-[560px] mx-auto px-6 mb-6">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
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
          
          {/* STEP 1: Details */}
          {step === 1 && (
            <motion.div key="s1" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-8">
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
                  Let's get you set up
                </h1>
                <p style={{ fontSize: 15, color: "#666" }}>Takes 2 minutes. Earn from today.</p>
              </div>

              <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 6 }}>Full Name</label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Rahul Kumar" className="h-12 border-[#E0E0E0] bg-white text-[#111]" />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 6 }}>WhatsApp Number</label>
                  <Input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" className="h-12 border-[#E0E0E0] bg-white text-[#111]" />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 6 }}>City</label>
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Bangalore" className="h-12 border-[#E0E0E0] bg-white text-[#111]" />
                </div>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 6 }}>UPI ID</label>
                  <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" className="h-12 border-[#E0E0E0] bg-white text-[#111]" />
                  <p style={{ fontSize: 13, color: "#666", marginTop: 8, fontStyle: "italic" }}>Your earnings go directly here. No middleman.</p>
                </div>
              </div>

              <button onClick={handleNextStep1} style={{ width: "100%", height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", marginTop: 24 }}>
                Next →
              </button>
            </motion.div>
          )}

          {/* STEP 2: AI Tools Selection */}
          {step === 2 && (
            <motion.div key="s2" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-8">
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
                  Which AI tools do you use?
                </h1>
                <p style={{ fontSize: 15, color: "#666" }}>Select all that apply. This helps us match you with the right projects.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {AI_TOOLS.map((tool) => {
                  const isSelected = selectedTools.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      style={{
                        backgroundColor: isSelected ? "#E8F5E9" : "#fff",
                        border: `2px solid ${isSelected ? "#00C853" : "#E0E0E0"}`,
                        borderRadius: 16,
                        padding: "16px 12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{tool.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: isSelected ? 600 : 400, color: "#1A1A1A" }}>{tool.label}</span>
                      {isSelected && <Check size={16} style={{ color: "#00C853", marginLeft: "auto" }} />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setStep(1); window.scrollTo(0, 0); }} style={{ flex: 1, height: 52, backgroundColor: "#fff", color: "#666", border: "1px solid #E0E0E0", borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: "pointer" }}>
                  ← Back
                </button>
                <button onClick={handleNextStep2} style={{ flex: 2, height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Test Website Submission */}
          {step === 3 && (
            <motion.div key="s3" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-8">
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
                  Build a test website 🚀
                </h1>
                <p style={{ fontSize: 15, color: "#666" }}>
                  Show us your skill! Build ONE website on any topic using your preferred AI tool, push it to GitHub, and paste the link below.
                </p>
              </div>

              <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="flex flex-col gap-4">
                  {[
                    { icon: "🎯", text: "Pick any topic — restaurant, gym, salon, portfolio, anything!" },
                    { icon: "🤖", text: "Use any AI website builder (Lovable, Bolt, Cursor, etc.)" },
                    { icon: "📱", text: "Make it mobile responsive and professional looking" },
                    { icon: "🔗", text: "Push to a PUBLIC GitHub repo (branch: main)" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <p style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 6 }}>
                    <Github size={16} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                    GitHub Repository URL
                  </label>
                  <Input
                    value={testSiteUrl}
                    onChange={e => setTestSiteUrl(e.target.value)}
                    placeholder="https://github.com/username/my-test-site"
                    className="h-12 border-[#E0E0E0] bg-white text-[#111]"
                  />
                  <p style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                    Must be a public repo. We'll review it within 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setStep(2); window.scrollTo(0, 0); }} style={{ flex: 1, height: 52, backgroundColor: "#fff", color: "#666", border: "1px solid #E0E0E0", borderRadius: 12, fontSize: 16, fontWeight: 500, cursor: "pointer" }}>
                  ← Back
                </button>
                <button onClick={() => { setStep(4); window.scrollTo(0, 0); }} style={{ flex: 2, height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: How it works + Submit */}
          {step === 4 && (
            <motion.div key="s4" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-8">
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
                  Here's how you earn 💰
                </h1>
                <p style={{ fontSize: 15, color: "#666" }}>Read this once. Then start earning.</p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { icon: "📋", title: "You get a build request", body: "A local business needs a website. LeadPe assigns it to you automatically." },
                  { icon: "🤖", title: "We give you a ready AI prompt", body: "Copy the prompt. Paste it in any AI website builder. Your website is ready in 2 hours." },
                  { icon: "🔗", title: "Submit your GitHub link", body: "Connect GitHub inside the builder. Paste the link in LeadPe. We deploy it automatically." },
                  { icon: "💰", title: "Get paid to your UPI", body: "Business pays. You get 80% directly to your UPI within 1 hour. Plus ₹30 every month per live site — forever." }
                ].map((card, i) => (
                  <div key={i} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: 16 }}>
                    <div style={{ fontSize: 32 }}>{card.icon}</div>
                    <div>
                      <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>{card.title}</h3>
                      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>{card.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: "#FFF9E6", border: "2px solid #FFD54F", borderRadius: 16, padding: 20, marginTop: 20, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#7B6B00", fontWeight: 500 }}>
                  ⏳ After you submit, our team reviews your test site within <strong>24 hours</strong>. 
                  Once approved, you'll see live build requests!
                </p>
              </div>

              <button
                disabled={loading}
                onClick={handleFinish}
                className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ width: "100%", height: 56, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: "pointer", marginTop: 24, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Submitting..." : "Submit for Review ✅"}
              </button>

              <p style={{ fontSize: 13, color: "#999", textAlign: "center", marginTop: 16 }}>
                Free to join. No commitment. Work at your pace.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
