import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Check, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";

interface ProfileData {
  full_name: string | null;
  whatsapp_number: string | null;
  subscription_plan: string | null;
  status: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  site_url: string | null;
  business_name: string | null;
}

export default function ClientDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await (supabase.from("profiles") as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00C853", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const ownerName = profile?.full_name || "there";
  const trialStart = profile?.trial_start_date ? new Date(profile.trial_start_date) : new Date();
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : new Date(Date.now() + 21 * 86400000);
  const totalDays = Math.max(1, Math.ceil((trialEnd.getTime() - trialStart.getTime()) / 86400000));
  const daysPassed = Math.max(0, Math.ceil((Date.now() - trialStart.getTime()) / 86400000));
  const daysLeft = Math.max(0, totalDays - daysPassed);
  const progress = Math.min(100, (daysPassed / totalDays) * 100);

  const startDateStr = trialStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const endDateStr = trialEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F5FFF7" }}>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <LeadPeLogo theme="light" size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{ownerName}</span>
            <button onClick={handleSignOut} className="text-sm" style={{ color: "#666666" }}>Sign Out</button>
          </div>
        </div>
      </nav>

      {/* TRIAL STATUS BAR */}
      <div className="border-b" style={{ backgroundColor: "#F0FFF4", borderColor: "#00C853", borderBottomWidth: "2px", padding: "12px 0" }}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>🟢 Free Trial — {daysLeft} days left</span>
          <Button onClick={() => navigate("/payment?plan=growth&amount=299")} size="sm" className="rounded-lg text-white text-xs" style={{ backgroundColor: "#00C853" }}>
            Upgrade ₹299 →
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 max-w-lg">
        {/* WELCOME */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Welcome, {ownerName}! 👋</h1>
          <p className="text-sm" style={{ color: "#666666" }}>Your website is being set up. Sit back and relax.</p>
        </motion.div>

        {/* WEBSITE STATUS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: "#1A1A1A" }}>Your Website 🏗️</h3>
          <div className="space-y-4">
            {[
              { done: true, label: "Request received", sub: "We have your details" },
              { done: false, label: "Builder being assigned", sub: "Within 2-4 hours" },
              { done: false, label: "Building your site", sub: "48 hours" },
              { done: false, label: "Going live!", sub: "Your site will be live" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: s.done ? "#00C853" : "#E0E0E0" }}>
                  {s.done ? <Check size={14} className="text-white" /> : <Clock size={14} style={{ color: "#999999" }} />}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: s.done ? "#1A1A1A" : "#999999" }}>{s.label}</p>
                  <p className="text-xs" style={{ color: "#999999" }}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm mt-4 font-medium" style={{ color: "#00C853" }}>Expected: Live in 48 hours 🚀</p>
        </motion.div>

        {/* LEADS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: "#1A1A1A" }}>Your Leads 📊</h3>
          <div className="text-center py-6">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-bold text-lg mb-2" style={{ color: "#1A1A1A" }}>No leads yet</p>
            <p className="text-sm mb-4" style={{ color: "#666666" }}>Once your site goes live, leads will appear here automatically.</p>
            <div className="rounded-xl p-4" style={{ backgroundColor: "#F0FFF4", border: "1px solid #E0E0E0" }}>
              <p className="text-sm" style={{ color: "#1A1A1A" }}>💡 Pro Tip: Share your site link in local WhatsApp groups to get first lead faster!</p>
            </div>
          </div>
        </motion.div>

        {/* TRIAL INFO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <h3 className="font-bold text-lg mb-3" style={{ color: "#1A1A1A" }}>Free Trial 🎁</h3>
          <div className="text-sm space-y-1 mb-3" style={{ color: "#666666" }}>
            <p>Started: {startDateStr}</p>
            <p>Ends: {endDateStr}</p>
          </div>
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: "#666666" }}>
            <span>Day {daysPassed} of {totalDays}</span>
            <span>{daysLeft} days left</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E0E0E0" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "#00C853" }} />
          </div>
        </motion.div>

        {/* SUPPORT */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <h3 className="font-bold text-lg mb-2" style={{ color: "#1A1A1A" }}>Need Help? 💬</h3>
          <p className="text-sm mb-4" style={{ color: "#666666" }}>We're available on WhatsApp</p>
          <Button onClick={() => window.open("https://wa.me/919973383902", "_blank")} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
            <MessageCircle size={16} className="mr-2" /> WhatsApp Support →
          </Button>
        </motion.div>

        {/* UPGRADE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-6 mb-4" style={{ backgroundColor: "#F0FFF4", border: "1px solid #E0E0E0" }}>
          <h3 className="font-bold text-lg mb-2" style={{ color: "#1A1A1A" }}>Upgrade to Growth Plan 💚</h3>
          <p className="text-sm mb-4" style={{ color: "#666666" }}>Get unlimited leads forever for just ₹299/month</p>
          <Button onClick={() => navigate("/payment?plan=growth&amount=299")} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
            Upgrade Now →
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
