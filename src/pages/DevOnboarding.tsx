import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function DevOnboaring() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPeningRequests] = useState(0);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setWhatsapp(profile.whatsapp_number || "");
      setCity(profile.city || "");
      setUpiId(profile.upi_id || "");
    }
  }, [profile]);

  useEffect(() => {
    // Pre-fetch the pending requests early so it's ready for Step 3
    const fetchPening = async () => {
      const { count } = await supabase
        .from("build_requests")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending")
        .is("assigned_coder_id", null);
      if (count !== null) setPeningRequests(count);
    };
    fetchPening();
  }, []);

  const handleNextStep1 = () => {
    const digits = whatsapp.replace(/\D/g, "");
    if (!fullName.trim()) return toast({ title: "Name required", variant: "destructive" });
    if (digits.length !== 10) return toast({ title: "Valid 10-digit WhatsApp number required", variant: "destructive" });
    if (!city.trim()) return toast({ title: "City required", variant: "destructive" });
    if (!upiId.trim()) return toast({ title: "UPI ID required", variant: "destructive" });
    
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      whatsapp_number: whatsapp.replace(/\D/g, "").slice(0, 10),
      city: city,
      upi_id: upiId,
      onboarding_complete: true
    }).eq("user_id", user.id);

    setLoading(false);

    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
      return;
    }

    navigate("/dev/dashboard", { replace: true });
  };

  const slide = { 
    enter: { opacity: 0, x: 40 }, 
    center: { opacity: 1, x: 0 }, 
    exit: { opacity: 0, x: -40 } 
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Suppress WhatsApp button */}
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
        <span style={{ fontSize: 13, color: "#999" }}>Step {step} of 3</span>
      </div>

      {/* Progress */}
      <div className="max-w-[560px] mx-auto px-6 mb-6">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
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
                <p style={{ fontSize: 15, color: "#666" }}>
                  Takes 2 minutes. Earn from today.
                </p>
              </div>

              <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 6 }}>Full Name</label>
                  <Input 
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Kumar"
                    className="h-12 border-[#E0E0E0] bg-white text-[#111]"
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 6 }}>WhatsApp Number</label>
                  <Input 
                    type="tel"
                    value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit number"
                    className="h-12 border-[#E0E0E0] bg-white text-[#111]"
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 6 }}>City</label>
                  <Input 
                    value={city} onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="h-12 border-[#E0E0E0] bg-white text-[#111]"
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", display: "block", marginBottom: 6 }}>UPI ID</label>
                  <Input 
                    value={upiId} onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="h-12 border-[#E0E0E0] bg-white text-[#111]"
                  />
                  <p style={{ fontSize: 13, color: "#666", marginTop: 8, fontStyle: "italic" }}>
                    Your earnings go directly here. No middleman.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleNextStep1} 
                style={{ width: "100%", height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", marginTop: 24 }}
              >
                Next →
              </button>
            </motion.div>
          )}

          {/* STEP 2: How it works */}
          {step === 2 && (
            <motion.div key="s2" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-8">
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
                  Here is how you earn
                </h1>
                <p style={{ fontSize: 15, color: "#666" }}>
                  Read this once. Then start earning.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  {
                    icon: "📋",
                    title: "You get a build request",
                    body: "A local business needs a website. LeadPe assigns it to you automatically."
                  },
                  {
                    icon: "🤖",
                    title: "We give you a ready AI prompt",
                    body: "Copy the prompt. Paste it in any AI website builder. Your website is ready in 2 hours."
                  },
                  {
                    icon: "🔗",
                    title: "Submit your GitHub link",
                    body: "Connect GitHub inside the builder. Paste the link in LeadPe. We deploy it automatically."
                  },
                  {
                    icon: "💰",
                    title: "Get paid to your UPI",
                    body: "Business pays. You get 80% directly to your UPI within 1 hour. Plus ₹30 every month per live site — forever."
                  }
                ].map((card, i) => (
                  <div key={i} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: 16 }}>
                    <div style={{ fontSize: 32 }}>{card.icon}</div>
                    <div>
                      <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
                        {card.title}
                      </h3>
                      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>
                        {card.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => { setStep(3); window.scrollTo(0, 0); }} 
                style={{ width: "100%", height: 52, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", marginTop: 24 }}
              >
                I Understand, Let's Go →
              </button>
            </motion.div>
          )}

          {/* STEP 3: Ready */}
          {step === 3 && (
            <motion.div key="s3" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-8">
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
                  You are all set! 🎉
                </h1>
              </div>

              <div style={{ backgroundColor: "#E8F5E9", border: "2px solid #00C853", borderRadius: 16, padding: 32, textAlign: "center", marginBottom: 24 }}>
                <p style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, color: "#00C853", marginBottom: 0 }}>
                  {pendingRequests} build request{pendingRequests !== 1 ? 's' : ''} waiting right now
                </p>
              </div>

              <p style={{ fontSize: 16, color: "#1A1A1A", fontWeight: 500, textAlign: "center", marginBottom: 32 }}>
                Your first website = ₹640 straight to your UPI.
              </p>

              <button 
                disabled={loading}
                onClick={handleFinish} 
                className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ width: "100%", height: 56, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Saving..." : "See Available Work →"}
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
