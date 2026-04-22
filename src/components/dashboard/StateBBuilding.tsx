import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import RevisionRequestSheet from "@/components/RevisionRequestSheet";
import { ADMIN_WHATSAPP } from "@/lib/constants";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface Props {
  buildRequest: any;
  businessName: string;
}

const STEPS = [
  { label: "Received", icon: "📋" },
  { label: "Builder Assigned", icon: "👨‍💻" },
  { label: "Building", icon: "⚡" },
  { label: "Preview Ready", icon: "👀" },
];

export default function StateBBuilding({ buildRequest, businessName }: Props) {
  const navigate = useNavigate();
  const [showRevisionSheet, setShowRevisionSheet] = useState(false);
  const status = buildRequest?.status || "pending";

  const activeIndex = status === "pending" ? 0 : status === "building" ? 2 : status === "demo_ready" ? 3 : status === "revision" ? 2 : 1;
  const isAssigned = !!buildRequest?.assigned_coder_id;

  const isDemoReady = status === "demo_ready";
  const isRevision = status === "revision";
  const demoUrl = buildRequest?.demo_url || buildRequest?.deploy_url;

  const revisionCount = buildRequest?.revision_count || 0;
  const maxRevisions = buildRequest?.max_revisions || 2;
  const canRequestRevision = revisionCount < maxRevisions;

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>

      {/* ═══ TOP STATUS BAR ═══ */}
      <div style={{
        backgroundColor: isDemoReady ? "#00C853" : isRevision ? "#FF9800" : "#E8F5E9",
        padding: "14px 20px",
        textAlign: "center",
      }}>
        <span style={{
          fontFamily: font.body, fontSize: 14, fontWeight: 600,
          color: isDemoReady || isRevision ? "#fff" : "#1A1A1A",
        }}>
          {isDemoReady ? "🎉 Your website preview is ready!" : isRevision ? "✏️ Revision in progress" : "⚡ Your website is being built"}
        </span>
      </div>

      {/* ═══ REVISION IN PROGRESS STATE ═══ */}
      {isRevision && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            margin: 16, backgroundColor: "#FFF8E1", borderRadius: 16, padding: 24,
            border: "1px solid #FFE0B2", textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔧</div>
          <p style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
            Your builder is making the changes
          </p>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "#666", lineHeight: 1.6 }}>
            Ready in 24 hours. We'll notify you when the updated preview is ready.
          </p>
          <div style={{
            marginTop: 16, backgroundColor: "#fff", borderRadius: 12, padding: 12,
            display: "inline-block",
          }}>
            <span style={{ fontFamily: font.body, fontSize: 13, color: "#999" }}>
              Revision {revisionCount} of {maxRevisions} used
            </span>
          </div>
        </motion.div>
      )}

      {/* ═══ PROGRESS TRACKER (non-demo_ready, non-revision) ═══ */}
      {!isDemoReady && !isRevision && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            <div style={{
              position: "absolute", top: 18, left: 28, right: 28, height: 2,
              backgroundColor: "#E0E0E0", zIndex: 0,
            }} />
            <div style={{
              position: "absolute", top: 18, left: 28, height: 2,
              backgroundColor: "#00C853", zIndex: 1,
              width: `${Math.min((activeIndex / (STEPS.length - 1)) * 100, 100)}%`,
              transition: "width 0.6s ease",
            }} />

            {STEPS.map((s, i) => {
              const isComplete = i < activeIndex || (i === 1 && isAssigned && activeIndex >= 1);
              const isCurrent = i === activeIndex || (i === 1 && isAssigned && activeIndex < 2);
              return (
                <div key={s.label} style={{ textAlign: "center", zIndex: 2, flex: 1 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", margin: "0 auto 8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: isComplete ? "#00C853" : isCurrent ? "#fff" : "#F5F5F5",
                    border: isCurrent ? "2px solid #00C853" : "2px solid transparent",
                    fontSize: 16,
                    boxShadow: isCurrent ? "0 0 0 4px rgba(0,200,83,0.15)" : "none",
                  }}>
                    {isComplete ? "✅" : s.icon}
                  </div>
                  <span style={{
                    fontFamily: font.body, fontSize: 11,
                    color: isComplete ? "#00C853" : isCurrent ? "#1A1A1A" : "#999",
                    fontWeight: isComplete || isCurrent ? 600 : 400,
                  }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══ STATUS MESSAGE (non-demo_ready, non-revision) ═══ */}
      {!isDemoReady && !isRevision && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            margin: "0 16px 16px", backgroundColor: "#F5F5F5", borderRadius: 16, padding: 20,
            textAlign: "center",
          }}
        >
          {status === "pending" && !isAssigned && (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
              <p style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>
                Finding the right builder for you
              </p>
              <p style={{ fontFamily: font.body, fontSize: 13, color: "#999", marginTop: 6 }}>
                Usually takes 2-4 hours
              </p>
            </>
          )}
          {(status === "pending" && isAssigned) && (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>👨‍💻</div>
              <p style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>
                Builder assigned!
              </p>
              <p style={{ fontFamily: font.body, fontSize: 13, color: "#999", marginTop: 6 }}>
                Your website is being prepared
              </p>
            </>
          )}
          {status === "building" && (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
              <p style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>
                Builder is working on your site
              </p>
              <p style={{ fontFamily: font.body, fontSize: 13, color: "#999", marginTop: 6 }}>
                You'll see it very soon
              </p>
            </>
          )}

          <div style={{
            marginTop: 20, backgroundColor: "#fff", borderRadius: 12, padding: 16,
          }}>
            <p style={{ fontFamily: font.body, fontSize: 13, color: "#666" }}>Estimated delivery</p>
            <p style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginTop: 4 }}>
              Within 48 hours
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══ DEMO READY STATE ═══ */}
      {isDemoReady && demoUrl && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 24,
            border: "2px solid #00C853", boxShadow: "0 4px 24px rgba(0,200,83,0.12)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <p style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              {businessName}
            </p>
            <p style={{ fontFamily: font.body, fontSize: 12, color: "#999", marginBottom: 24, wordBreak: "break-all" }}>
              Preview: {demoUrl}
            </p>

            {/* See Preview button */}
            <button
              onClick={() => window.open(demoUrl, "_blank")}
              style={{
                width: "100%", height: 52, borderRadius: 14,
                backgroundColor: "#fff", color: "#00C853", border: "2px solid #00C853",
                fontFamily: font.heading, fontSize: 16, fontWeight: 700,
                cursor: "pointer", marginBottom: 12,
              }}
            >
              See Preview →
            </button>

            {/* Approve & Pay button */}
            <button
              onClick={() => {
                sessionStorage.setItem("upgrade_intent", "true");
                navigate("/payment?plan=growth&amount=299");
              }}
              style={{
                width: "100%", height: 56, borderRadius: 14,
                backgroundColor: "#00C853", color: "#fff", border: "none",
                fontFamily: font.heading, fontSize: 17, fontWeight: 700,
                cursor: "pointer", boxShadow: "0 8px 24px rgba(0,200,83,0.35)",
              }}
            >
              ✅ Approve & Pay →
            </button>

            {/* Request Changes button — only if revisions left */}
            {canRequestRevision && (
              <button
                onClick={() => setShowRevisionSheet(true)}
                style={{
                  width: "100%", height: 44, borderRadius: 12, marginTop: 12,
                  backgroundColor: "#fff", color: "#666", border: "1px solid #E0E0E0",
                  fontFamily: font.body, fontSize: 14, fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                ✏️ Request Changes
              </button>
            )}

            {/* Max revisions reached */}
            {!canRequestRevision && (
              <div style={{
                marginTop: 16, backgroundColor: "#FFF8E1", borderRadius: 12, padding: 16,
                border: "1px solid #FFE0B2",
              }}>
                <p style={{ fontFamily: font.body, fontSize: 13, color: "#F57F17", fontWeight: 600, marginBottom: 8 }}>
                  Maximum revisions reached.
                </p>
                <p style={{ fontFamily: font.body, fontSize: 12, color: "#666", lineHeight: 1.5, marginBottom: 12 }}>
                  You have used all {maxRevisions} revisions. If you are still not satisfied, please contact us on WhatsApp. We will find a solution.
                </p>
                <button
                  onClick={() => window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(`Hi, I need help with my website: ${businessName}`)}`, "_blank")}
                  style={{
                    width: "100%", height: 40, borderRadius: 10,
                    backgroundColor: "#25D366", color: "#fff", border: "none",
                    fontFamily: font.body, fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Contact on WhatsApp →
                </button>
              </div>
            )}

            <p style={{ fontFamily: font.body, fontSize: 12, color: "#666", marginTop: 16, lineHeight: 1.5 }}>
              Your website will be live at:<br />
              <span style={{ color: "#00C853", fontWeight: 600 }}>
                {businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}.leadpe.online
              </span>
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══ ENQUIRIES PLACEHOLDER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{
          margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <h3 style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 0 }}>
          Customer Enquiries
        </h3>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "#666", maxWidth: 240, margin: "0 auto", lineHeight: 1.6 }}>
            Customers will appear here once your website is live
          </p>
        </div>
      </motion.div>

      <RevisionRequestSheet
        open={showRevisionSheet}
        onClose={() => setShowRevisionSheet(false)}
        buildRequest={buildRequest}
        businessName={businessName}
        onSubmitted={() => window.location.reload()}
      />
    </div>
  );
}
