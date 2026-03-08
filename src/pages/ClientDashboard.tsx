import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Clock, MessageCircle, Lock, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { getTrialStatus, TrialStatus } from "@/lib/trialManager";

interface ProfileData {
  full_name: string | null;
  whatsapp_number: string | null;
  subscription_plan: string | null;
  status: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  site_url: string | null;
  business_name: string | null;
  business_type: string | null;
  city: string | null;
}

interface Lead {
  id: string;
  customer_name: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  source: string | null;
}

interface SEOData {
  page_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  whatsapp_bio: string | null;
  google_description: string | null;
}

export default function ClientDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [seoLoading, setSeoLoading] = useState(true);
  const [copiedField, setCopiedField] = useState("");

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await (supabase.from("profiles") as any)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setTrial(getTrialStatus(data));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      await fetchProfile(user.id);
      setLoading(false);
    };
    init();

    // Poll every 30s for activation changes
    const interval = setInterval(() => fetchProfile(user.id), 30000);
    return () => clearInterval(interval);
  }, [user, fetchProfile]);

  // Realtime leads subscription
  useEffect(() => {
    if (!user) return;

    // Fetch leads (using profile as business_id won't work without a business, so we skip if no business)
    // For now leads show empty state
    const channel = supabase
      .channel("client-leads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        setLeads((prev) => [payload.new as Lead, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
  const startDateStr = trialStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const endDateStr = trialEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // Trial bar config
  const getTrialBarConfig = () => {
    if (trial?.isActive) {
      return { bg: "#F0FFF4", border: "#00C853", text: "✅ Growth Plan — Active", textColor: "#00C853", btnText: "Manage →", btnBg: "#E0E0E0", btnColor: "#666" };
    }
    if (trial?.isExpired) {
      return { bg: "#FFEBEE", border: "#ef4444", text: "⛔ Trial ended", textColor: "#ef4444", btnText: "See Waiting Customers →", btnBg: "#ef4444", btnColor: "#fff" };
    }
    if (trial?.isTrialEnding) {
      return { bg: "#FFF3E0", border: "#FF6D00", text: `🔴 Trial ends in ${trial.daysLeft} days!`, textColor: "#FF6D00", btnText: "Upgrade Before It Ends →", btnBg: "#FF6D00", btnColor: "#fff" };
    }
    if (trial?.isWarning) {
      return { bg: "#FFF8E1", border: "#FFA000", text: `⚠️ Trial ends in ${trial?.daysLeft} days`, textColor: "#FFA000", btnText: "Upgrade Now ₹299 →", btnBg: "#FFA000", btnColor: "#fff" };
    }
    return { bg: "#F0FFF4", border: "#00C853", text: `🟢 Free Trial — ${trial?.daysLeft ?? 21} days left`, textColor: "#1A1A1A", btnText: "Upgrade ₹299 →", btnBg: "#00C853", btnColor: "#fff" };
  };

  const barCfg = getTrialBarConfig();

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

      {/* DYNAMIC TRIAL STATUS BAR */}
      <div style={{ backgroundColor: barCfg.bg, borderBottom: `2px solid ${barCfg.border}`, padding: "12px 0" }}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: barCfg.textColor }}>{barCfg.text}</span>
          <Button onClick={() => navigate("/payment?plan=growth&amount=299")} size="sm" className="rounded-lg text-xs"
            style={{ backgroundColor: barCfg.btnBg, color: barCfg.btnColor }}>
            {barCfg.btnText}
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
          <h3 className="font-bold text-lg mb-4" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Your Website 🏗️</h3>
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
          className="bg-white rounded-2xl p-6 mb-4 relative" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <h3 className="font-bold text-lg mb-4" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Your Leads 📊</h3>

          {leads.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-bold text-lg mb-2" style={{ color: "#1A1A1A" }}>No leads yet</p>
              <p className="text-sm mb-4" style={{ color: "#666666" }}>Once your site goes live, leads will appear here automatically.</p>
              <div className="rounded-xl p-4" style={{ backgroundColor: "#F0FFF4", border: "1px solid #E0E0E0" }}>
                <p className="text-sm" style={{ color: "#1A1A1A" }}>💡 Pro Tip: Share your site link in local WhatsApp groups to get first lead faster!</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Blur leads if trial expired */}
              <div style={trial?.isExpired ? { filter: "blur(6px)", pointerEvents: "none" } : {}}>
                {leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="border-b py-3" style={{ borderColor: "#E0E0E0" }}>
                    <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{lead.customer_name}</p>
                    <p className="text-xs" style={{ color: "#666" }}>{lead.phone} • {new Date(lead.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                ))}
              </div>

              {trial?.isExpired && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-xl p-6 text-center" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                    <Lock size={32} style={{ color: "#ef4444" }} className="mx-auto mb-3" />
                    <p className="font-bold text-lg mb-1" style={{ color: "#1A1A1A" }}>🔒 {leads.length} customers waiting</p>
                    <p className="text-sm mb-1" style={{ color: "#666" }}>They searched for {profile?.business_type} in {profile?.city}</p>
                    <p className="text-sm mb-4" style={{ color: "#666" }}>Don't let them go to a competitor.</p>
                    <Button onClick={() => navigate("/payment?plan=growth&amount=299")} className="w-full h-10 rounded-xl text-white font-semibold" style={{ backgroundColor: "#ef4444" }}>
                      See Their Details — ₹299 →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* TRIAL INFO */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <h3 className="font-bold text-lg mb-3" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Free Trial 🎁</h3>
          <div className="text-sm space-y-1 mb-3" style={{ color: "#666666" }}>
            <p>Started: {startDateStr}</p>
            <p>Ends: {endDateStr}</p>
          </div>
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: "#666666" }}>
            <span>Day {trial?.daysUsed ?? 1} of {trial?.totalDays ?? 21}</span>
            <span>{trial?.daysLeft ?? 21} days left</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E0E0E0" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${trial?.percentage ?? 0}%`, backgroundColor: "#00C853" }} />
          </div>
        </motion.div>

        {/* SUPPORT */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <h3 className="font-bold text-lg mb-2" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Need Help? 💬</h3>
          <p className="text-sm mb-4" style={{ color: "#666666" }}>We're available on WhatsApp</p>
          <Button onClick={() => window.open("https://wa.me/919973383902", "_blank")} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
            <MessageCircle size={16} className="mr-2" /> WhatsApp Support →
          </Button>
        </motion.div>

        {/* UPGRADE */}
        {!trial?.isActive && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl p-6 mb-4" style={{ backgroundColor: "#F0FFF4", border: "1px solid #E0E0E0" }}>
            <h3 className="font-bold text-lg mb-2" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Upgrade to Growth Plan 💚</h3>
            <p className="text-sm mb-4" style={{ color: "#666666" }}>Get unlimited leads forever for just ₹299/month</p>
            <Button onClick={() => navigate("/payment?plan=growth&amount=299")} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
              Upgrade Now →
            </Button>
          </motion.div>
        )}

        {/* Plan activated celebration */}
        {trial?.isActive && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl p-6 mb-4 text-center" style={{ backgroundColor: "#F0FFF4", border: "2px solid #00C853" }}>
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-bold text-lg mb-1" style={{ color: "#00C853", fontFamily: "Syne" }}>Growth Plan Active!</h3>
            <p className="text-sm" style={{ color: "#666666" }}>Unlimited leads. You're all set.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
