import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Lock, ExternalLink, MessageCircle, Bell, Phone, Share2, HelpCircle, CreditCard, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { getTrialStatus, TrialStatus } from "@/lib/trialManager";

interface Lead {
  id: string;
  customer_name: string;
  phone: string | null;
  message: string | null;
  created_at: string;
}

export default function ClientDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [buildRequest, setBuildRequest] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newLeadAlert, setNewLeadAlert] = useState<Lead | null>(null);
  const [showSignOut, setShowSignOut] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    if (!profile) return;
    setTrial(getTrialStatus(profile));
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      // Fetch build request
      const { data: br } = await (supabase.from("build_requests") as any)
        .select("*")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (br) setBuildRequest(br);
      setLoading(false);
    };
    init();

    // Realtime build status
    const buildChannel = supabase
      .channel("build-status")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "build_requests",
        filter: `business_id=eq.${user.id}`,
      }, (payload) => {
        setBuildRequest(payload.new);
        if ((payload.new as any).status === "live") setShowCelebration(true);
      })
      .subscribe();

    return () => { supabase.removeChannel(buildChannel); };
  }, [user]);

  // Realtime leads
  useEffect(() => {
    if (!user) return;
    const fetchLeads = async () => {
      const { data: biz } = await (supabase.from("businesses") as any)
        .select("id").eq("owner_id", user.id).maybeSingle();
      if (!biz) return;

      const { data } = await (supabase.from("leads") as any)
        .select("*").eq("business_id", biz.id)
        .order("created_at", { ascending: false }).limit(50);
      setLeads(data || []);

      const channel = supabase
        .channel("client-leads")
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "leads",
          filter: `business_id=eq.${biz.id}`,
        }, (payload) => {
          const newLead = payload.new as Lead;
          setLeads((prev) => [newLead, ...prev]);
          setNewLeadAlert(newLead);
          setTimeout(() => setNewLeadAlert(null), 5000);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    fetchLeads();
  }, [user]);

  // Realtime profile changes (detect plan activation)
  useEffect(() => {
    if (!user) return;
    const profileChannel = supabase
      .channel("profile-status")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "profiles",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new as any;
        if (updated.status === "active" && profile?.status !== "active") {
          setShowCelebration(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(profileChannel); };
  }, [user, profile?.status]);

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

  // Lead stats
  const now = new Date();
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todayLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.toDateString() === now.toDateString();
  });
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const weekLeads = leads.filter(l => new Date(l.created_at) >= thisWeekStart);

  const isExpired = trial?.isExpired;
  const isActive = trial?.isActive;
  const isPaid = profile?.status === "active" && !trial?.isTrial;
  const isLive = buildRequest?.status === "live";

  // Status bar config
  const getStatusBar = () => {
    if (isPaid || isActive) {
      return { bg: "#E8F5E9", text: "✅ Growth Plan — Active", color: "#1A1A1A", btn: "", btnColor: "#666", showBtn: false };
    }
    if (isExpired) return { bg: "#FFEBEE", text: "🔴 Trial ended", color: "#C62828", btn: "Unlock Leads →", btnColor: "#FF5252", showBtn: true };
    if (trial?.isTrialEnding) return { bg: "#FFF3E0", text: `⚠️ Trial ends in ${trial.daysLeft} days!`, color: "#E65100", btn: "Upgrade Now →", btnColor: "#FF6B00", showBtn: true };
    if (trial?.isWarning) return { bg: "#FFF3E0", text: `⚠️ Trial ends in ${trial.daysLeft} days`, color: "#E65100", btn: "Upgrade ₹299", btnColor: "#FF6B00", showBtn: true };
    return { bg: "#E8F5E9", text: `🟢 Free Trial — ${trial?.daysLeft ?? 21} days left`, color: "#1A1A1A", btn: "Upgrade ₹299", btnColor: "#00C853", showBtn: true };
  };
  const sb = getStatusBar();

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F5FFF7", fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white" style={{ height: 56, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div className="max-w-lg mx-auto px-5 h-full flex items-center justify-between">
          <LeadPeLogo theme="light" size="sm" />
          <div className="relative">
            <button
              onClick={() => setShowSignOut(!showSignOut)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: "#00C853", fontFamily: "Syne, sans-serif" }}
            >
              {firstName[0]?.toUpperCase() || "U"}
            </button>
            {showSignOut && (
              <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg p-3 z-50" style={{ border: "1px solid #E0E0E0", minWidth: 160 }}>
                <p className="text-sm font-medium mb-2 px-2" style={{ color: "#1A1A1A" }}>{profile?.full_name}</p>
                <button onClick={handleSignOut} className="w-full text-left text-sm px-2 py-2 rounded-lg hover:bg-gray-50" style={{ color: "#FF5252" }}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* STATUS BAR */}
      <div style={{ backgroundColor: sb.bg, padding: "0 20px", height: 44 }} className="flex items-center justify-between max-w-lg mx-auto">
        <span style={{ color: sb.color, fontSize: 13, fontWeight: 500 }}>{sb.text}</span>
        {sb.showBtn && (
          <button onClick={() => navigate("/payment?plan=growth&amount=299")} style={{ color: sb.btnColor, fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            {sb.btn}
          </button>
        )}
        {!sb.showBtn && sb.btn && <span style={{ color: "#666", fontSize: 12 }}>{sb.btn}</span>}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        {/* WELCOME */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
            Welcome, {firstName}! 👋
          </h1>
          <p style={{ fontSize: 14, color: "#666" }}>
            {isLive ? "Your website is live and working." : "Your website is being set up."}
          </p>
        </motion.div>

        {/* HERO NUMBER — LEADS */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl mb-4 relative overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "28px 24px" }}>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Your Leads 📊</p>

          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 80, fontWeight: 700, color: "#1A1A1A", lineHeight: 1 }}>
              {isExpired ? (
                <span style={{ filter: "blur(8px)", userSelect: "none" }}>??</span>
              ) : (
                thisMonthLeads.length
              )}
            </div>
            <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
              customers contacted you this month
            </p>
          </div>

          <div style={{ height: 1, backgroundColor: "#F0F0F0", margin: "0 -24px", width: "calc(100% + 48px)" }} />

          <div className="flex items-center justify-between" style={{ paddingTop: 16 }}>
            {[
              { val: todayLeads.length, label: "Today", color: "#00C853" },
              { val: weekLeads.length, label: "This Week", color: "#1A1A1A" },
              { val: leads.length, label: "All Time", color: "#1A1A1A" },
            ].map((s) => (
              <div key={s.label} className="text-center flex-1">
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, color: s.color }}>{isExpired ? "—" : s.val}</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Lock overlay for expired */}
          {isExpired && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.85)" }}>
              <div className="text-center px-6">
                <Lock size={32} style={{ color: "#999", margin: "0 auto 12px" }} />
                <p style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
                  {leads.length} customers waiting
                </p>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>Upgrade to see them</p>
                <button
                  onClick={() => navigate("/payment?plan=growth&amount=299")}
                  style={{ backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}
                >
                  Unlock for ₹299 →
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* RECENT LEADS */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl mb-4 relative" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 20 }}>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 14, color: "#666" }}>Recent Customers 👥</p>
            {leads.length > 3 && <span style={{ fontSize: 12, color: "#00C853", fontWeight: 600, cursor: "pointer" }}>View All</span>}
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-8">
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <p style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>No leads yet</p>
              <p style={{ fontSize: 13, color: "#666", maxWidth: 240, margin: "0 auto" }}>
                Once your website goes live, customers will appear here.
              </p>
            </div>
          ) : (
            <div style={isExpired ? { filter: "blur(5px)", pointerEvents: "none" as const } : {}}>
              {leads.slice(0, 3).map((lead) => (
                <div key={lead.id} className="flex items-center gap-3" style={{ padding: "12px 0", borderBottom: "1px solid #F5F5F5" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#00C853", fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#fff", fontSize: 14 }}>
                    {lead.customer_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }} className="truncate">{lead.customer_name}</p>
                    <p style={{ fontSize: 12, color: "#666" }} className="truncate">{lead.message || "Interested in your service"}</p>
                    <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{timeAgo(lead.created_at)}</p>
                  </div>
                  {lead.phone && (
                    <a href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      style={{ backgroundColor: "#E8F5E9", color: "#00C853", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, textDecoration: "none", flexShrink: 0 }}>
                      Call →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {isExpired && leads.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.8)" }}>
              <div className="text-center">
                <Lock size={24} style={{ color: "#999", margin: "0 auto 8px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Unlock to see details</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* WEBSITE STATUS */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 20 }}>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>Your Website 🌐</p>

          {isLive ? (
            <div style={{ backgroundColor: "#E8F5E9", border: "1px solid #00C853", borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#00C853", marginBottom: 4 }}>🌐 Your website is Live!</p>
              <p style={{ fontSize: 13, color: "#1A1A1A", marginBottom: 12, wordBreak: "break-all" }}>
                {buildRequest?.deploy_url || `${profile?.business_name?.toLowerCase().replace(/\s+/g, "")}.leadpe.online`}
              </p>
              <button
                onClick={() => window.open(buildRequest?.deploy_url || "#", "_blank")}
                style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Visit Website →
              </button>
            </div>
          ) : (
            <div>
              {/* Horizontal stepper */}
              <div className="flex items-center justify-between mb-4" style={{ padding: "0 8px" }}>
                {["Received", "Building", "Review", "Live"].map((label, i) => {
                  const status = buildRequest?.status || "pending";
                  const stepMap: Record<string, number> = { pending: 0, building: 1, review: 2, deploying: 2, live: 3 };
                  const current = stepMap[status] ?? 0;
                  const done = i <= current;
                  const active = i === current;
                  return (
                    <div key={label} className="flex flex-col items-center flex-1">
                      <div className="flex items-center w-full">
                        {i > 0 && <div className="flex-1 h-0.5" style={{ backgroundColor: done ? "#00C853" : "#E0E0E0" }} />}
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: done ? "#00C853" : "#E0E0E0",
                            boxShadow: active ? "0 0 0 4px rgba(0,200,83,0.2)" : undefined,
                          }}
                        >
                          {done && <Check size={10} className="text-white" />}
                        </div>
                        {i < 3 && <div className="flex-1 h-0.5" style={{ backgroundColor: i < current ? "#00C853" : "#E0E0E0" }} />}
                      </div>
                      <span style={{ fontSize: 10, color: done ? "#1A1A1A" : "#999", marginTop: 6, fontWeight: active ? 600 : 400 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                  {buildRequest?.assigned_coder_name ? "Being built now..." : "Builder being assigned"}
                </p>
                <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>Expected in 48 hours</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* QUICK ACTIONS */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 20 }}>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.open("https://wa.me/919973383902", "_blank")}
              className="flex flex-col items-center justify-center gap-2 rounded-xl"
              style={{ border: "1px solid #E0E0E0", padding: 14, background: "#fff", cursor: "pointer", minHeight: 80 }}
            >
              <Phone size={18} style={{ color: "#1A1A1A" }} />
              <span style={{ fontSize: 13, color: "#1A1A1A" }}>WhatsApp Support</span>
            </button>

            {!isPaid && (
              <button
                onClick={() => navigate("/payment?plan=growth&amount=299")}
                className="flex flex-col items-center justify-center gap-2 rounded-xl"
                style={{ border: "1px solid #00C853", padding: 14, background: "#fff", cursor: "pointer", minHeight: 80 }}
              >
                <CreditCard size={18} style={{ color: "#00C853" }} />
                <span style={{ fontSize: 13, color: "#00C853", fontWeight: 600 }}>Upgrade Plan</span>
              </button>
            )}

            {isLive && (
              <button
                onClick={() => {
                  const url = buildRequest?.deploy_url || "";
                  window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my website! 🌐\n${url}`)}`, "_blank");
                }}
                className="flex flex-col items-center justify-center gap-2 rounded-xl"
                style={{ border: "1px solid #E0E0E0", padding: 14, background: "#fff", cursor: "pointer", minHeight: 80 }}
              >
                <Share2 size={18} style={{ color: "#1A1A1A" }} />
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>Share Website</span>
              </button>
            )}

            <button
              onClick={() => {
                const code = profile?.trial_code || "N/A";
                navigator.clipboard.writeText(code);
                alert(`Your trial code: ${code}\n\nCopied to clipboard!`);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl"
              style={{ border: "1px solid #E0E0E0", padding: 14, background: "#fff", cursor: "pointer", minHeight: 80 }}
            >
              <FileText size={18} style={{ color: "#1A1A1A" }} />
              <span style={{ fontSize: 13, color: "#1A1A1A" }}>My Trial Code</span>
            </button>

            <button
              onClick={() => {
                const url = `https://leadpe.lovable.app/business?ref=${profile?.trial_code || ""}`;
                const msg = `I'm using LeadPe for my business website. Get yours free for 21 days!\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl"
              style={{ border: "1px solid #E0E0E0", padding: 14, background: "#fff", cursor: "pointer", minHeight: 80 }}
            >
              <Share2 size={18} style={{ color: "#00C853" }} />
              <span style={{ fontSize: 13, color: "#00C853", fontWeight: 600 }}>Refer & Earn</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* NEW LEAD NOTIFICATION */}
      <AnimatePresence>
        {newLeadAlert && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="fixed top-14 left-0 right-0 z-40 px-4 py-3"
            style={{ backgroundColor: "#00C853" }}
          >
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Bell size={16} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  🔔 New customer! {newLeadAlert.customer_name}
                </span>
              </div>
              {newLeadAlert.phone && (
                <a href={`https://wa.me/91${newLeadAlert.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-white" style={{ color: "#00C853" }}>
                  Call Now →
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CELEBRATION MODAL */}
      {showCelebration && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowCelebration(false)}>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl mb-4">🎉</div>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Your Website is LIVE!</h2>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>Share it with your customers!</p>
            <button
              onClick={() => {
                const url = buildRequest?.deploy_url || "";
                window.open(`https://wa.me/?text=${encodeURIComponent(`Meri website ab live hai! 🎉\n${url}`)}`, "_blank");
              }}
              style={{ width: "100%", backgroundColor: "#25D366", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}
            >
              Share on WhatsApp →
            </button>
            <button onClick={() => setShowCelebration(false)} style={{ color: "#666", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>Close</button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
