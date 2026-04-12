import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface Lead {
  id: string;
  customer_name: string;
  phone: string | null;
  message: string | null;
  created_at: string;
}

interface Props {
  buildRequest: any;
  business: any;
  profile: any;
  leads: Lead[];
  trial: any;
  user: any;
}

export default function StateCLive({ buildRequest, business, profile, leads, trial, user }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [fomoBarDismissed, setFomoBarDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("fomo_bar_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 86400000) setFomoBarDismissed(true);
  }, []);

  // Use subdomain from profile, fallback to slug
  const subdomain = (profile as any)?.subdomain || business?.slug || profile?.business_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "";
  const liveUrl = subdomain ? `https://${subdomain}.leadpe.tech` : (buildRequest?.deploy_url || buildRequest?.live_url || "");

  if (!liveUrl || buildRequest?.status !== "live") return null;

  const planType = profile?.plan_type || "free";
  const isFreePlan = planType === "free";
  const isGrowthPlan = planType === "growth";
  const isTrialPlan = planType === "trial";
  const showFullFeatures = isGrowthPlan || isTrialPlan;

  const now = new Date();
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todayLeads = leads.filter(l => new Date(l.created_at).toDateString() === now.toDateString());
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const weekLeads = leads.filter(l => new Date(l.created_at) >= thisWeekStart);

  const deployedAt = buildRequest?.deployed_at ? new Date(buildRequest.deployed_at) : null;
  const daysSinceLive = deployedAt ? Math.floor((Date.now() - deployedAt.getTime()) / 86400000) : 0;
  const showRating = showFullFeatures && !ratingSubmitted && daysSinceLive >= 7 && daysSinceLive <= 30;
  const showFeedbackCard = showFullFeatures && daysSinceLive >= 14 && !(profile as any)?.feedback_given && !feedbackSubmitted;

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

  const handleSubmitRating = async () => {
    if (!ratingValue || !buildRequest) return;
    setSubmittingRating(true);
    await supabase.from("ratings").insert({
      business_id: user?.id, coder_id: buildRequest.assigned_coder_id || null,
      build_request_id: buildRequest.id, rating: ratingValue, feedback: ratingFeedback || null,
    } as any);
    setRatingSubmitted(true);
    setSubmittingRating(false);
    toast({ title: "⭐ Rating submitted!" });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackRating) return;
    setSubmittingFeedback(true);
    await supabase.from("feedback").insert({
      user_id: user?.id, business_id: user?.id,
      rating: feedbackRating, comment: feedbackComment || null,
    } as any);
    await supabase.from("profiles").update({ feedback_given: true } as any).eq("user_id", user?.id);
    setFeedbackSubmitted(true);
    setSubmittingFeedback(false);
    toast({ title: "Thank you! 🙏" });
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "calc(100vh - 56px)", paddingBottom: isFreePlan ? 120 : 80 }}>

      {/* ═══ WEBSITE LIVE BAR ═══ */}
      <div style={{
        backgroundColor: "#00C853", padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: "#fff" }}>
            🌐 Your website is live
          </div>
        </div>
        <button onClick={() => window.open(liveUrl, "_blank")}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", fontFamily: font.body, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", padding: "6px 14px", borderRadius: 8 }}>
          Visit →
        </button>
      </div>

      {/* ═══ WEBSITE CARD ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{
          margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <p style={{ fontFamily: font.body, fontSize: 13, color: "#999", marginBottom: 4 }}>Your website</p>
        <p style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#1A1A1A", wordBreak: "break-all" }}>
          {subdomain}.leadpe.tech
        </p>
        <button onClick={() => window.open(liveUrl, "_blank")}
          style={{
            marginTop: 12, width: "100%", height: 48, borderRadius: 12,
            backgroundColor: "#E8F5E9", color: "#00C853", border: "none",
            fontFamily: font.body, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
          Visit Website →
        </button>
      </motion.div>

      {/* ═══ CUSTOMERS SECTION ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        style={{
          margin: "0 16px 16px", backgroundColor: "#fff", borderRadius: 16, padding: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden",
        }}
      >
        {/* Free plan: blurred lock overlay */}
        {isFreePlan ? (
          <>
            <p style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>
              Customers This Month
            </p>
            <div style={{ filter: "blur(8px)", pointerEvents: "none" as const }}>
              <div style={{ fontFamily: font.heading, fontSize: 64, fontWeight: 700, color: "#1A1A1A", textAlign: "center" }}>
                {thisMonthLeads.length || 3}
              </div>
            </div>
            <div style={{
              position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.85)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ textAlign: "center", padding: "0 24px" }}>
                <Lock size={28} style={{ color: "#999", margin: "0 auto 8px" }} />
                <p style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
                  {leads.length > 0 ? `${leads.length} customers couldn't reach you` : "Customers will appear here"}
                </p>
                <p style={{ fontFamily: font.body, fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.5 }}>
                  Upgrade to connect with them
                </p>
                <button onClick={handleUpgrade} style={{
                  width: "100%", maxWidth: 260, height: 52, borderRadius: 14,
                  backgroundColor: "#00C853", color: "#fff", border: "none",
                  fontFamily: font.body, fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}>
                  Unlock — ₹299/mo →
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>
              Recent Customers
            </p>
            {leads.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📬</div>
                <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 4 }}>
                  No customers yet
                </p>
                <p style={{ fontFamily: font.body, fontSize: 13, color: "#666", maxWidth: 240, margin: "0 auto 16px", lineHeight: 1.6 }}>
                  Share your website to get your first customer!
                </p>
                <button onClick={() => {
                  const msg = `Check out my website:\n${liveUrl}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                  style={{
                    width: "100%", height: 48, borderRadius: 12,
                    backgroundColor: "#fff", color: "#00C853", border: "2px solid #00C853",
                    fontFamily: font.body, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}>
                  Share My Website 📤
                </button>
              </div>
            ) : (
              <div>
                {leads.slice(0, 5).map(lead => {
                  const isNew = (Date.now() - new Date(lead.created_at).getTime()) < 3600000;
                  return (
                    <div key={lead.id} style={{
                      display: "flex", alignItems: "center", padding: "12px 0",
                      borderBottom: "1px solid #F8F8F8",
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", backgroundColor: "#00C853",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: font.heading, fontSize: 16, fontWeight: 700, flexShrink: 0,
                      }}>
                        {lead.customer_name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isNew && (
                            <span style={{
                              backgroundColor: "#00C853", color: "#fff", fontFamily: font.body,
                              fontSize: 10, padding: "2px 6px", borderRadius: 10,
                            }}>NEW</span>
                          )}
                          <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 700, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                            {lead.customer_name}
                          </span>
                        </div>
                        <p style={{ fontFamily: font.body, fontSize: 12, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                          {lead.message || "Interested in your service"}
                        </p>
                        <p style={{ fontFamily: font.body, fontSize: 11, color: "#999", marginTop: 2 }}>{timeAgo(lead.created_at)}</p>
                      </div>
                      {lead.phone && (
                        <a href={`https://wa.me/91${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                          style={{
                            backgroundColor: "#E8F5E9", color: "#00C853", fontFamily: font.body,
                            fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 20,
                            textDecoration: "none", flexShrink: 0,
                          }}>
                          WhatsApp →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ═══ STATS ROW ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: "flex", gap: 8, margin: "0 16px 16px" }}
      >
        {[
          { val: showFullFeatures ? weekLeads.length : "🔒", label: isFreePlan ? "This Week" : "This Week", color: "#00C853" },
          { val: showFullFeatures ? thisMonthLeads.length : "🔒", label: isFreePlan ? "This Month" : "This Month", color: "#1A1A1A" },
          { val: showFullFeatures ? leads.length : "🔒", label: "Total", color: "#1A1A1A" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 16, textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontFamily: font.heading, fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontFamily: font.body, fontSize: 11, color: "#999", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ═══ FEEDBACK CARD ═══ */}
      {showFeedbackCard && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            margin: "0 16px 16px", backgroundColor: "#fff", borderRadius: 16, padding: 20,
            borderTop: "3px solid #00C853", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>How is LeadPe working? ⭐</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 12, marginBottom: feedbackRating > 0 ? 12 : 0 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setFeedbackRating(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <Star size={40} fill={s <= feedbackRating ? "#FFD700" : "transparent"} stroke={s <= feedbackRating ? "#FFD700" : "#E0E0E0"} />
              </button>
            ))}
          </div>
          {feedbackRating > 0 && (
            <>
              <textarea value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)}
                placeholder="Tell us more (optional)" rows={3}
                style={{
                  width: "100%", border: "1px solid #E0E0E0", borderRadius: 12, padding: 12,
                  fontFamily: font.body, fontSize: 14, color: "#1A1A1A", resize: "none", boxSizing: "border-box", marginBottom: 12,
                }} />
              <button onClick={handleSubmitFeedback} disabled={submittingFeedback}
                style={{
                  width: "100%", height: 48, borderRadius: 12,
                  backgroundColor: "#00C853", color: "#fff", border: "none",
                  fontFamily: font.body, fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}>
                {submittingFeedback ? "Submitting..." : "Submit →"}
              </button>
            </>
          )}
        </motion.div>
      )}

      {/* ═══ RATING (7-30 days) ═══ */}
      {showRating && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            margin: "0 16px 16px", backgroundColor: "#fff", borderRadius: 16, padding: 20,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <p style={{ fontFamily: font.body, fontSize: 14, color: "#666", textAlign: "center", marginBottom: 8 }}>
            Rate your website builder:
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: ratingValue > 0 ? 12 : 0 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRatingValue(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <Star size={40} fill={s <= ratingValue ? "#FFD700" : "transparent"} stroke={s <= ratingValue ? "#FFD700" : "#E0E0E0"} />
              </button>
            ))}
          </div>
          {ratingValue > 0 && (
            <button onClick={handleSubmitRating} disabled={submittingRating}
              style={{
                width: "100%", height: 48, borderRadius: 12,
                backgroundColor: "#00C853", color: "#fff", border: "none",
                fontFamily: font.body, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>
              {submittingRating ? "Submitting..." : "Submit Rating →"}
            </button>
          )}
        </motion.div>
      )}

      {/* ═══ QUICK ACTIONS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <button onClick={() => window.open("https://wa.me/919973383902", "_blank")}
          style={{
            width: "100%", height: 48, borderRadius: 12,
            backgroundColor: "#fff", color: "#1A1A1A", border: "1px solid #E0E0E0",
            fontFamily: font.body, fontSize: 14, cursor: "pointer", marginBottom: 10,
          }}>
          📞 WhatsApp Support
        </button>
        <button onClick={() => {
          const msg = `Check out my website:\n${liveUrl}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
        }}
          style={{
            width: "100%", height: 48, borderRadius: 12,
            backgroundColor: "#fff", color: "#1A1A1A", border: "1px solid #E0E0E0",
            fontFamily: font.body, fontSize: 14, cursor: "pointer",
          }}>
          📤 Share My Website
        </button>
      </motion.div>

      {/* ═══ STICKY FOMO BAR (free plan) ═══ */}
      {isFreePlan && !fomoBarDismissed && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          backgroundColor: "#00C853", padding: "14px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button onClick={handleUpgrade} style={{
            background: "none", border: "none", fontFamily: font.body, fontSize: 13, fontWeight: 600,
            color: "#fff", cursor: "pointer", flex: 1, textAlign: "left",
          }}>
            Connect with customers on WhatsApp — ₹299/mo →
          </button>
          <button onClick={() => {
            localStorage.setItem("fomo_bar_dismissed", Date.now().toString());
            setFomoBarDismissed(true);
          }} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.7)",
            cursor: "pointer", padding: "0 4px", fontSize: 18,
          }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
