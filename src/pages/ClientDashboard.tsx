import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, ExternalLink, Bell, Phone, Share2, CreditCard, Star, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { getTrialStatus, TrialStatus } from "@/lib/trialManager";
import { ADMIN_WHATSAPP } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  customer_name: string;
  phone: string | null;
  message: string | null;
  created_at: string;
}

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

export default function ClientDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [buildRequest, setBuildRequest] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newLeadAlert, setNewLeadAlert] = useState<Lead | null>(null);
  const [showSignOut, setShowSignOut] = useState(false);

  // Customize form state
  const [colorPref, setColorPref] = useState("green");
  const [stylePref, setStylePref] = useState("modern");
  const [hasLogo, setHasLogo] = useState(true);
  const [hasPhotos, setHasPhotos] = useState(true);
  const [specialReqs, setSpecialReqs] = useState("");
  const [saving, setSaving] = useState(false);

  // Change request state
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeFeedback, setChangeFeedback] = useState("");
  const [submittingChange, setSubmittingChange] = useState(false);

  // Rating state
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Countdown timer
  const [countdown, setCountdown] = useState("");
  const countdownRef = useRef<NodeJS.Timeout>();

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    if (!profile) return;
    setTrial(getTrialStatus(profile));
  }, [profile]);

  // Countdown timer
  useEffect(() => {
    if (!buildRequest?.deadline) return;
    const tick = () => {
      const diff = new Date(buildRequest.deadline).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Being finalized..."); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => clearInterval(countdownRef.current);
  }, [buildRequest?.deadline]);

  // Fetch data
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: br } = await (supabase.from("build_requests") as any)
        .select("*").eq("business_id", user.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (br) {
        setBuildRequest(br);
        if (br.color_preference) setColorPref(br.color_preference);
        if (br.style_preference) setStylePref(br.style_preference);
        if (br.special_requirements) setSpecialReqs(br.special_requirements);
      }

      const { data: biz } = await (supabase.from("businesses") as any)
        .select("*").eq("owner_id", user.id).maybeSingle();
      if (biz) setBusiness(biz);

      setLoading(false);
    };
    init();

    // Realtime build status
    const buildChannel = supabase.channel("build-status")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "build_requests",
        filter: `business_id=eq.${user.id}`,
      }, (payload) => {
        setBuildRequest(payload.new);
        if ((payload.new as any).status === "live") setShowCelebration(true);
      }).subscribe();

    return () => { supabase.removeChannel(buildChannel); };
  }, [user]);

  // Fetch leads
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

      const channel = supabase.channel("client-leads")
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "leads",
          filter: `business_id=eq.${biz.id}`,
        }, (payload) => {
          const newLead = payload.new as Lead;
          setLeads((prev) => [newLead, ...prev]);
          setNewLeadAlert(newLead);
          setTimeout(() => setNewLeadAlert(null), 5000);
        }).subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    fetchLeads();
  }, [user]);

  // Realtime profile (detect activation)
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("profile-status")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "profiles",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if ((payload.new as any).status === "active" && profile?.status !== "active") {
          setShowCelebration(true);
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, profile?.status]);

  const handleSignOut = async () => { await signOut(); navigate("/", { replace: true }); };

  // Save customize form
  const handleSavePrefs = async () => {
    if (!buildRequest) return;
    setSaving(true);
    await (supabase.from("build_requests") as any).update({
      color_preference: colorPref,
      style_preference: stylePref,
      special_requirements: specialReqs,
    }).eq("id", buildRequest.id);

    const msg = `📝 New preferences from ${profile?.business_name || profile?.full_name}.\nColor: ${colorPref}\nStyle: ${stylePref}\n${specialReqs ? `Notes: ${specialReqs}` : ""}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");

    toast({ title: "✅ Saved!", description: "Your builder will follow these preferences." });
    setSaving(false);
  };

  // Submit change request
  const handleSubmitChange = async () => {
    if (!changeFeedback.trim() || !buildRequest) return;
    setSubmittingChange(true);
    const newCount = (buildRequest.revision_count || 0) + 1;
    await (supabase.from("build_requests") as any).update({
      status: "building",
      revision_feedback: changeFeedback,
      revision_count: newCount,
    }).eq("id", buildRequest.id);

    const msg = `🔄 Change requested for ${buildRequest.business_name}:\n${changeFeedback}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");

    toast({ title: "Request sent! ✅", description: "Usually fixed within 24 hours." });
    setShowChangeModal(false);
    setChangeFeedback("");
    setSubmittingChange(false);
  };

  // Submit rating
  const handleSubmitRating = async () => {
    if (!ratingValue || !buildRequest) return;
    setSubmittingRating(true);
    await (supabase as any).from("ratings").insert({
      business_id: business?.id || user?.id,
      coder_id: buildRequest.assigned_coder_id || "unknown",
      build_request_id: buildRequest.id,
      rating: ratingValue,
      feedback: ratingFeedback || null,
    });
    const msg = `⭐ Rating: ${ratingValue}/5 from ${profile?.business_name}\n${ratingFeedback || "No comment"}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
    setRatingSubmitted(true);
    setSubmittingRating(false);
    toast({ title: "⭐ Rating submitted!", description: "Thank you!" });
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!feedbackRating) return;
    setSubmittingFeedback(true);
    await (supabase as any).from("feedback").insert({
      user_id: user?.id,
      business_id: business?.id,
      rating: feedbackRating,
      comment: feedbackComment || null,
    });
    await (supabase.from("profiles") as any).update({ feedback_given: true }).eq("user_id", user?.id);
    const msg = `📝 Feedback: ${feedbackRating}/5 from ${profile?.business_name}\n${feedbackComment || ""}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
    setFeedbackSubmitted(true);
    setSubmittingFeedback(false);
    toast({ title: "Thank you! 🙏" });
    setTimeout(() => setFeedbackSubmitted(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00C853", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // Computed values
  const now = new Date();
  const thisMonthLeads = leads.filter(l => { const d = new Date(l.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const todayLeads = leads.filter(l => new Date(l.created_at).toDateString() === now.toDateString());
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - now.getDay()); thisWeekStart.setHours(0, 0, 0, 0);
  const weekLeads = leads.filter(l => new Date(l.created_at) >= thisWeekStart);

  const isExpired = trial?.isExpired;
  const isPaid = profile?.status === "active" && !trial?.isTrial;
  const status = buildRequest?.status || "pending";
  const isLive = status === "live";
  const isDemoReady = status === "demo_ready";
  const isBuilding = status === "building" || status === "pending";

  const stepMap: Record<string, number> = { pending: 0, building: 1, demo_ready: 2, approved: 2, deploying: 2, live: 3 };
  const currentStep = stepMap[status] ?? 0;

  // Hide tracker 7 days after live
  const deployedAt = buildRequest?.deployed_at ? new Date(buildRequest.deployed_at) : null;
  const daysSinceLive = deployedAt ? Math.floor((Date.now() - deployedAt.getTime()) / 86400000) : 0;
  const hideTracker = isLive && daysSinceLive > 7 && ratingSubmitted;

  // Show feedback card
  const showFeedbackCard = isLive && daysSinceLive >= 7 && !(profile as any)?.feedback_given && !feedbackSubmitted;

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleUpgrade = () => {
    sessionStorage.setItem("upgrade_intent", "true");
    navigate("/payment?plan=growth&amount=299");
  };

  // Status bar
  const getStatusBar = () => {
    if (isPaid) return { bg: "#E8F5E9", text: "✅ Growth Plan — Active", color: "#1A1A1A", showBtn: false };
    if (isExpired) return { bg: "#FFEBEE", text: "🔴 Trial ended", color: "#C62828", showBtn: true, btnText: "Unlock Leads →", btnColor: "#FF5252" };
    if (trial?.isTrialEnding) return { bg: "#FFF3E0", text: `⚠️ ${trial.daysLeft} days left!`, color: "#E65100", showBtn: true, btnText: "Upgrade →", btnColor: "#FF6B00" };
    if (trial?.isWarning) return { bg: "#FFF3E0", text: `⚠️ ${trial.daysLeft} days left`, color: "#E65100", showBtn: true, btnText: "Upgrade ₹299", btnColor: "#FF6B00" };
    return { bg: "#E8F5E9", text: `🟢 Trial — ${trial?.daysLeft ?? 21} days left`, color: "#1A1A1A", showBtn: false };
  };
  const sb = getStatusBar();

  const colors = [
    { id: "green", hex: "#00C853" },
    { id: "blue", hex: "#2196F3" },
    { id: "orange", hex: "#FF6B35" },
    { id: "dark", hex: "#1A1A1A" },
  ];
  const styles = [
    { id: "modern", label: "Modern", icon: "✨" },
    { id: "classic", label: "Classic", icon: "🏛️" },
    { id: "bold", label: "Bold", icon: "🎨" },
  ];

  const steps = [
    { label: "Received", desc: "Details saved", icon: "✓", emoji: "" },
    { label: "Building", desc: buildRequest?.assigned_coder_name ? `${buildRequest.assigned_coder_name.split(" ")[0]} is building!` : "AI builder working", icon: "🔨", emoji: "🔨" },
    { label: "Preview", desc: "See your website", icon: "👀", emoji: "👀" },
    { label: "Live!", desc: "Customers finding you", icon: "🚀", emoji: "🚀" },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white" style={{ height: 56, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div className="max-w-lg mx-auto px-5 h-full flex items-center justify-between">
          <LeadPeLogo theme="light" size="sm" />
          <div className="relative">
            <button onClick={() => setShowSignOut(!showSignOut)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: "#00C853", fontFamily: font.heading }}>
              {firstName[0]?.toUpperCase() || "U"}
            </button>
            {showSignOut && (
              <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg p-3 z-50" style={{ border: "1px solid #E0E0E0", minWidth: 160 }}>
                <p className="text-sm font-medium mb-2 px-2" style={{ color: "#1A1A1A" }}>{profile?.full_name}</p>
                <button onClick={handleSignOut} className="w-full text-left text-sm px-2 py-2 rounded-lg hover:bg-gray-50" style={{ color: "#FF5252" }}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* STATUS BAR */}
      <div style={{ backgroundColor: sb.bg, padding: "0 20px", height: 44 }} className="flex items-center justify-between max-w-lg mx-auto">
        <span style={{ color: sb.color, fontSize: 13, fontWeight: 500 }}>{sb.text}</span>
        {sb.showBtn && (
          <button onClick={handleUpgrade} style={{ color: sb.btnColor, fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            {sb.btnText}
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* ═══ DEMO APPROVAL CARD ═══ */}
        {isDemoReady && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-white rounded-2xl overflow-hidden"
            style={{ borderLeft: "4px solid #00C853", boxShadow: "0 4px 20px rgba(0,200,83,0.15)", padding: 20 }}>
            <h3 style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              🎉 Your Website is Ready!
            </h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>Preview it and go live today!</p>

            <button onClick={() => window.open(buildRequest?.demo_url || buildRequest?.deploy_url, "_blank")}
              style={{ width: "100%", backgroundColor: "#1A1A1A", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 10, minHeight: 52 }}>
              Preview Your Website 👀
            </button>
            <button onClick={handleUpgrade}
              style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 10, minHeight: 52 }}>
              ✅ I Love It — Go Live! ₹299/mo
            </button>
            <button onClick={() => setShowChangeModal(true)}
              style={{ width: "100%", backgroundColor: "#fff", color: "#666", border: "1px solid #E0E0E0", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 500, cursor: "pointer", minHeight: 44 }}>
              🔄 Request Changes
            </button>
          </motion.div>
        )}

        {/* ═══ WEBSITE DELIVERY TRACKER ═══ */}
        {!hideTracker && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-[20px] overflow-hidden"
            style={{ background: "linear-gradient(135deg, #00C853, #00A846)", padding: 24, boxShadow: "0 8px 32px rgba(0,200,83,0.3)" }}>

            {/* Top row */}
            <div className="flex items-center justify-between mb-5">
              <span style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#fff" }}>Your Website 🏗️</span>
              {buildRequest?.deadline && (
                <span style={{ fontSize: 14, fontWeight: 600, color: countdown.includes("finalized") ? "#FFB74D" : "#fff", fontFamily: "monospace" }}>
                  {countdown || "..."}
                </span>
              )}
            </div>

            {/* Progress steps */}
            <div className="flex items-start justify-between mb-5" style={{ padding: "0 4px" }}>
              {steps.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                const pending = i > currentStep;
                return (
                  <div key={step.label} className="flex flex-col items-center flex-1 relative">
                    {/* Connecting line */}
                    {i > 0 && (
                      <div className="absolute top-[24px] right-1/2 w-full h-[2px]" style={{ zIndex: 0 }}>
                        <div className="h-full transition-all duration-700" style={{
                          backgroundColor: done || active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
                          width: done ? "100%" : active ? "50%" : "0%",
                        }} />
                      </div>
                    )}
                    {/* Circle */}
                    <div className="relative z-10 flex items-center justify-center rounded-full mb-2 transition-all"
                      style={{
                        width: 48, height: 48,
                        backgroundColor: done ? "#fff" : active ? "#fff" : "transparent",
                        border: pending ? "2px solid rgba(255,255,255,0.3)" : "none",
                        boxShadow: active ? "0 0 0 8px rgba(255,255,255,0.2)" : "none",
                        animation: active ? "pulse-ring 2s ease-in-out infinite" : "none",
                      }}>
                      {done ? (
                        <Check size={20} style={{ color: "#00C853" }} />
                      ) : (
                        <span style={{ fontSize: 20, color: active ? "#00C853" : "rgba(255,255,255,0.4)" }}>{step.emoji || "○"}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: pending ? "rgba(255,255,255,0.5)" : "#fff", textAlign: "center" }}>{step.label}</span>
                    <span style={{ fontSize: 9, color: pending ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 2, maxWidth: 70 }}>{step.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* Dynamic message */}
            <div className="text-center" style={{ marginTop: 8 }}>
              {status === "pending" && (
                <>
                  <div className="flex justify-center gap-1 mb-2">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
                        className="w-2 h-2 rounded-full bg-white" />
                    ))}
                  </div>
                  <p style={{ fontSize: 14, color: "#fff" }}>
                    Finding the perfect builder for your {profile?.business_type || "business"} in {profile?.city || "your city"}...
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Usually takes 2-4 hours</p>
                </>
              )}
              {status === "building" && (
                <>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                    {buildRequest?.assigned_coder_name ? `${buildRequest.assigned_coder_name.split(" ")[0]} is building your website! ⚡` : "Your website is being built! ⚡"}
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Preview coming very soon...</p>
                </>
              )}
              {isDemoReady && (
                <>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Your website is ready to preview! 🎉</p>
                  <button onClick={() => window.open(buildRequest?.demo_url || buildRequest?.deploy_url, "_blank")}
                    style={{ width: "100%", backgroundColor: "#fff", color: "#1A1A1A", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 8, minHeight: 48 }}>
                    See Preview →
                  </button>
                  <button onClick={handleUpgrade}
                    style={{ width: "100%", backgroundColor: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.6)", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                    Go Live — ₹299/month →
                  </button>
                </>
              )}
              {isLive && !ratingSubmitted && (
                <>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>🎉 You're LIVE! Customers can find you on Google!</p>
                  <button onClick={() => window.open(buildRequest?.live_url || buildRequest?.deploy_url, "_blank")}
                    style={{ width: "100%", backgroundColor: "#fff", color: "#1A1A1A", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 12, minHeight: 48 }}>
                    Visit Your Website →
                  </button>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", wordBreak: "break-all" }}>{buildRequest?.live_url || buildRequest?.deploy_url}</p>

                  {/* Rating section */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 16, paddingTop: 16 }}>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>Rate your builder:</p>
                    <div className="flex justify-center gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setRatingValue(s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 32, padding: 0, lineHeight: 1 }}>
                          <Star size={32} fill={s <= ratingValue ? "#FFD700" : "transparent"} stroke={s <= ratingValue ? "#FFD700" : "rgba(255,255,255,0.5)"} />
                        </button>
                      ))}
                    </div>
                    {ratingValue > 0 && (
                      <>
                        <textarea value={ratingFeedback} onChange={e => setRatingFeedback(e.target.value)}
                          placeholder="Tell us more (optional)" rows={2}
                          style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: 10, color: "#fff", fontSize: 13, resize: "none", marginBottom: 8 }} />
                        <button onClick={handleSubmitRating} disabled={submittingRating}
                          style={{ width: "100%", backgroundColor: "#fff", color: "#00C853", border: "none", borderRadius: 10, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                          {submittingRating ? "Submitting..." : "Submit Rating →"}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
              {isLive && ratingSubmitted && (
                <>
                  <p style={{ fontSize: 14, color: "#fff", marginBottom: 8 }}>🌐 Your website is live!</p>
                  <button onClick={() => window.open(buildRequest?.live_url || buildRequest?.deploy_url, "_blank")}
                    style={{ width: "100%", backgroundColor: "#fff", color: "#1A1A1A", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                    Visit Website →
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Compact live bar (after tracker hides) */}
        {hideTracker && (
          <div className="mb-4 rounded-xl flex items-center justify-between px-4"
            style={{ backgroundColor: "#00C853", height: 48 }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>🌐 {buildRequest?.live_url || buildRequest?.deploy_url}</span>
            <button onClick={() => window.open(buildRequest?.live_url || buildRequest?.deploy_url, "_blank")}
              style={{ color: "#fff", fontSize: 13, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
              Visit →
            </button>
          </div>
        )}

        {/* ═══ FEEDBACK CARD ═══ */}
        {showFeedbackCard && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-white rounded-2xl overflow-hidden"
            style={{ borderTop: "4px solid #00C853", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 20 }}>
            <h3 style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              How's LeadPe working? ⭐
            </h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              You've been live {daysSinceLive} days! Share your experience.
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setFeedbackRating(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <Star size={40} fill={s <= feedbackRating ? "#FFD700" : "transparent"} stroke={s <= feedbackRating ? "#FFD700" : "#E0E0E0"} />
                </button>
              ))}
            </div>
            {feedbackRating > 0 && (
              <>
                <textarea value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)}
                  placeholder="Tell us more (optional)..." rows={3}
                  style={{ width: "100%", border: "1px solid #E0E0E0", borderRadius: 12, padding: 12, fontSize: 14, color: "#1A1A1A", resize: "none", marginBottom: 12 }} />
                <button onClick={handleSubmitFeedback} disabled={submittingFeedback}
                  style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 52 }}>
                  {submittingFeedback ? "Submitting..." : "Submit Feedback →"}
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* ═══ CUSTOMIZE FORM ═══ */}
        {isBuilding && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mb-4 bg-white rounded-2xl"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 20 }}>
            <h3 style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 2 }}>
              Customize Your Website ✏️
            </h3>
            <p style={{ fontSize: 13, color: "#999", marginBottom: 16 }}>Help us build it perfectly</p>

            {/* Color preference */}
            <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Preferred color?</p>
            <div className="flex gap-3 mb-5">
              {colors.map(c => (
                <button key={c.id} onClick={() => setColorPref(c.id)}
                  style={{
                    width: 52, height: 52, borderRadius: "50%", backgroundColor: c.hex, border: "none", cursor: "pointer",
                    boxShadow: colorPref === c.id ? `0 0 0 3px #fff, 0 0 0 6px ${c.hex}` : "none",
                    transition: "box-shadow 0.2s",
                  }} />
              ))}
            </div>

            {/* Style preference */}
            <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Website style?</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {styles.map(s => (
                <button key={s.id} onClick={() => setStylePref(s.id)}
                  className="flex flex-col items-center justify-center rounded-xl"
                  style={{
                    height: 80, border: stylePref === s.id ? "2px solid #00C853" : "1px solid #E0E0E0",
                    backgroundColor: "#fff", cursor: "pointer",
                  }}>
                  <span style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</span>
                  <span style={{ fontSize: 12, color: stylePref === s.id ? "#00C853" : "#666", fontWeight: stylePref === s.id ? 600 : 400 }}>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Logo toggle */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span style={{ fontSize: 14, color: "#666" }}>I have a logo</span>
              <button onClick={() => setHasLogo(!hasLogo)}
                style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: hasLogo ? "#00C853" : "#E0E0E0", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 3, left: hasLogo ? 23 : 3, transition: "left 0.2s" }} />
              </button>
            </div>
            {!hasLogo && <p style={{ fontSize: 12, color: "#999", marginBottom: 12, paddingLeft: 4 }}>We'll create a text logo for you ✨</p>}

            {/* Photos toggle */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span style={{ fontSize: 14, color: "#666" }}>I have business photos</span>
              <button onClick={() => setHasPhotos(!hasPhotos)}
                style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: hasPhotos ? "#00C853" : "#E0E0E0", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 3, left: hasPhotos ? 23 : 3, transition: "left 0.2s" }} />
              </button>
            </div>
            {!hasPhotos && <p style={{ fontSize: 12, color: "#999", marginBottom: 12, paddingLeft: 4 }}>We'll use professional stock photos 📷</p>}

            {/* Special requirements */}
            <p style={{ fontSize: 14, color: "#666", marginBottom: 6, marginTop: 12 }}>Anything specific?</p>
            <div className="relative">
              <textarea value={specialReqs} onChange={e => setSpecialReqs(e.target.value.slice(0, 200))}
                placeholder="e.g. Open 9am-8pm, Home service available, 20 years experience..."
                rows={3}
                style={{ width: "100%", border: "1px solid #E0E0E0", borderRadius: 12, padding: 12, fontSize: 14, color: "#1A1A1A", resize: "none" }} />
              <span style={{ position: "absolute", bottom: 8, right: 12, fontSize: 11, color: "#999" }}>{specialReqs.length}/200</span>
            </div>

            <button onClick={handleSavePrefs} disabled={saving}
              style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 16, minHeight: 52 }}>
              {saving ? "Saving..." : "Save Preferences →"}
            </button>
          </motion.div>
        )}

        {/* ═══ LEADS SECTION ═══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl mb-4 relative overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "24px 20px" }}>
          <p style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>Your Leads 📊</p>

          {!isLive ? (
            /* BEFORE LIVE — Motivational preview */
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>📱 Leads will appear here</p>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.6 }}>
                Once live, real customers from {profile?.city || "your city"} will contact you here. Every inquiry → your WhatsApp instantly.
              </p>

              {/* Fake blurred leads */}
              <div style={{ filter: "blur(6px)", pointerEvents: "none", opacity: 0.6, marginBottom: 16 }}>
                {[
                  { name: "Rahul Sharma", msg: "Interested in your services", time: "2h ago" },
                  { name: "Priya Singh", msg: "Asked about pricing", time: "5h ago" },
                  { name: "Amit Kumar", msg: "Wants to book appointment", time: "Yesterday" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3" style={{ padding: "10px 0", borderBottom: "1px solid #F5F5F5" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#00C853", color: "#fff", fontWeight: 700, fontSize: 14 }}>
                      {f.name[0]}
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{f.name}</p>
                      <p style={{ fontSize: 12, color: "#666" }}>{f.msg}</p>
                    </div>
                    <span style={{ fontSize: 11, color: "#999" }}>{f.time}</span>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Step {currentStep + 1} of 4 to go live</p>
                <div style={{ height: 6, backgroundColor: "#E0E0E0", borderRadius: 3 }}>
                  <div style={{ height: "100%", backgroundColor: "#00C853", borderRadius: 3, width: `${((currentStep + 1) / 4) * 100}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            </div>
          ) : (
            /* AFTER LIVE */
            <div>
              <div className="text-center" style={{ padding: "8px 0 16px" }}>
                <div style={{ fontFamily: font.heading, fontSize: 80, fontWeight: 700, color: isExpired ? undefined : "#1A1A1A", lineHeight: 1, filter: isExpired ? "blur(8px)" : "none" }}>
                  {thisMonthLeads.length}
                </div>
                <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>customers this month</p>
              </div>

              <div style={{ height: 1, backgroundColor: "#F0F0F0", margin: "0 -20px", width: "calc(100% + 40px)" }} />

              <div className="flex items-center justify-between" style={{ paddingTop: 16 }}>
                {[
                  { val: todayLeads.length, label: "Today", color: "#00C853" },
                  { val: weekLeads.length, label: "This Week", color: "#1A1A1A" },
                  { val: leads.length, label: "All Time", color: "#1A1A1A" },
                ].map(s => (
                  <div key={s.label} className="text-center flex-1">
                    <div style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: isExpired ? "#999" : s.color }}>{isExpired ? "—" : s.val}</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Lock overlay */}
              {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.85)" }}>
                  <div className="text-center px-6">
                    <Lock size={32} style={{ color: "#999", margin: "0 auto 12px" }} />
                    <p style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
                      {leads.length} customers tried to reach you
                    </p>
                    <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>Upgrade to see and contact them</p>
                    <button onClick={handleUpgrade}
                      style={{ backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", minHeight: 52 }}>
                      Unlock for ₹299/month →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ═══ RECENT LEADS LIST ═══ */}
        {isLive && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl mb-4 relative" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 20 }}>
            <p style={{ fontFamily: font.heading, fontSize: 14, fontWeight: 600, color: "#666", marginBottom: 12 }}>Recent Customers 👥</p>

            {leads.length === 0 ? (
              <div className="text-center py-6">
                <div style={{ fontSize: 36, marginBottom: 8 }}>📬</div>
                <p style={{ fontFamily: font.heading, fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>No leads yet today</p>
                <p style={{ fontSize: 13, color: "#666", maxWidth: 260, margin: "0 auto 16px", lineHeight: 1.6 }}>
                  Share your website in local WhatsApp groups to get your first lead faster!
                </p>
                <button onClick={() => {
                  const url = buildRequest?.live_url || buildRequest?.deploy_url || "";
                  const msg = `Hi! Check out my website: ${url}\nWe offer ${profile?.business_type || "services"} in ${profile?.city || ""}.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                  style={{ backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
                  Share My Website 📤
                </button>
              </div>
            ) : (
              <div style={isExpired ? { filter: "blur(5px)", pointerEvents: "none" as const } : {}}>
                {leads.slice(0, 5).map(lead => {
                  const isNew = (Date.now() - new Date(lead.created_at).getTime()) < 3600000;
                  return (
                    <div key={lead.id} className="flex items-center gap-3" style={{ padding: "12px 0", borderBottom: "1px solid #F5F5F5" }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#00C853", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: font.heading }}>
                        {lead.customer_name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }} className="truncate">{lead.customer_name}</p>
                          {isNew && <span style={{ backgroundColor: "#00C853", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>NEW</span>}
                        </div>
                        <p style={{ fontSize: 12, color: "#666" }} className="truncate">{lead.message || "Interested in your service"}</p>
                        <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{timeAgo(lead.created_at)}</p>
                      </div>
                      {lead.phone && (
                        <a href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                          style={{ backgroundColor: "#E8F5E9", color: "#00C853", fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 10, textDecoration: "none", flexShrink: 0, minHeight: 36, display: "flex", alignItems: "center" }}>
                          Call →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {isExpired && leads.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.85)" }}>
                <div className="text-center">
                  <Lock size={24} style={{ color: "#999", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Unlock to see details</p>
                  <button onClick={handleUpgrade} style={{ color: "#00C853", fontSize: 13, fontWeight: 700, background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>
                    Upgrade →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ QUICK ACTIONS ═══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 20 }}>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>Quick Actions</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => window.open("https://wa.me/919973383902", "_blank")}
              className="flex flex-col items-center justify-center gap-2 rounded-xl"
              style={{ border: "1px solid #E0E0E0", padding: 14, background: "#fff", cursor: "pointer", minHeight: 80 }}>
              <Phone size={18} style={{ color: "#1A1A1A" }} />
              <span style={{ fontSize: 13, color: "#1A1A1A" }}>WhatsApp Support</span>
            </button>
            {isLive && (
              <button onClick={() => {
                const url = buildRequest?.live_url || buildRequest?.deploy_url || "";
                window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my website! 🌐\n${url}`)}`, "_blank");
              }}
                className="flex flex-col items-center justify-center gap-2 rounded-xl"
                style={{ border: "1px solid #E0E0E0", padding: 14, background: "#fff", cursor: "pointer", minHeight: 80 }}>
                <Share2 size={18} style={{ color: "#00C853" }} />
                <span style={{ fontSize: 13, color: "#00C853", fontWeight: 600 }}>Share Website</span>
              </button>
            )}
            <button onClick={() => {
              const url = `https://leadpe.lovable.app/business?ref=${profile?.trial_code || ""}`;
              const msg = `I'm using LeadPe for my business website. Get yours free!\n${url}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
            }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl"
              style={{ border: "1px solid #E0E0E0", padding: 14, background: "#fff", cursor: "pointer", minHeight: 80 }}>
              <Share2 size={18} style={{ color: "#00C853" }} />
              <span style={{ fontSize: 13, color: "#00C853", fontWeight: 600 }}>Refer & Earn</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* ═══ NEW LEAD NOTIFICATION ═══ */}
      <AnimatePresence>
        {newLeadAlert && (
          <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="fixed top-14 left-0 right-0 z-40 px-4 py-3" style={{ backgroundColor: "#00C853" }}>
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Bell size={16} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>🔔 New customer! {newLeadAlert.customer_name}</span>
              </div>
              {newLeadAlert.phone && (
                <a href={`https://wa.me/91${newLeadAlert.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-white" style={{ color: "#00C853" }}>Call →</a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CHANGE REQUEST MODAL ═══ */}
      <AnimatePresence>
        {showChangeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>What would you like changed?</h3>
                <button onClick={() => setShowChangeModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
              </div>
              {(buildRequest?.revision_count || 0) >= 1 && (
                <div className="mb-3 rounded-xl px-3 py-2" style={{ backgroundColor: "#FFF3E0" }}>
                  <p style={{ fontSize: 13, color: "#E65100" }}>First revision was free. This costs ₹200.</p>
                </div>
              )}
              <textarea value={changeFeedback} onChange={e => setChangeFeedback(e.target.value)}
                placeholder="e.g. Change color, Add my address, Fix the phone number..."
                rows={4} style={{ width: "100%", border: "1px solid #E0E0E0", borderRadius: 12, padding: 12, fontSize: 14, color: "#1A1A1A", resize: "none", marginBottom: 12 }} />
              <button onClick={handleSubmitChange} disabled={!changeFeedback.trim() || submittingChange}
                style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 52, opacity: !changeFeedback.trim() ? 0.5 : 1 }}>
                {submittingChange ? "Sending..." : "Send Request →"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CELEBRATION ═══ */}
      {showCelebration && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowCelebration(false)}>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-4">🎉</div>
            <h2 style={{ fontFamily: font.heading, fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>You're on Growth Plan!</h2>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>All leads unlocked. Start growing!</p>
            <button onClick={() => setShowCelebration(false)}
              style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Let's Go! →
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Pulse animation CSS */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
      `}</style>
    </div>
  );
}
