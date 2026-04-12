import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ChangeRequestSheet from "@/components/ChangeRequestSheet";

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
  const [showChangeSheet, setShowChangeSheet] = useState(false);
  const status = buildRequest?.status || "pending";

  const activeIndex = status === "pending" ? 0 : status === "building" ? 2 : status === "demo_ready" ? 3 : 1;
  const isAssigned = !!buildRequest?.assigned_coder_id;

  // demo_ready state
  const isDemoReady = status === "demo_ready";
  const demoUrl = buildRequest?.demo_url || buildRequest?.deploy_url;
  const packagePrice = buildRequest?.package_price || 800;

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>

      {/* ═══ TOP STATUS BAR ═══ */}
      <div style={{
        backgroundColor: isDemoReady ? "#00C853" : "#E8F5E9",
        padding: "14px 20px",
        textAlign: "center",
      }}>
        <span style={{
          fontFamily: font.body, fontSize: 14, fontWeight: 600,
          color: isDemoReady ? "#fff" : "#1A1A1A",
        }}>
          {isDemoReady ? "🎉 Your website preview is ready!" : "⚡ Your website is being built"}
        </span>
      </div>

      {/* ═══ PROGRESS TRACKER (non-demo_ready) ═══ */}
      {!isDemoReady && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            {/* Connecting line */}
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

      {/* ═══ STATUS MESSAGE (non-demo_ready) ═══ */}
      {!isDemoReady && (
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

            {/* Pay & Go Live button */}
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
              Pay ₹299 & Go Live →
            </button>

            <p style={{ fontFamily: font.body, fontSize: 12, color: "#666", marginTop: 16, lineHeight: 1.5 }}>
              Your website will be live at:<br />
              <span style={{ color: "#00C853", fontWeight: 600 }}>
                {businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}.leadpe.tech
              </span>
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══ WANT CHANGES ═══ */}
      {isDemoReady && (
        <div style={{ margin: "0 16px 16px", textAlign: "center" }}>
          <button
            onClick={() => setShowChangeSheet(true)}
            style={{
              background: "none", border: "none", fontFamily: font.body,
              fontSize: 14, color: "#999", cursor: "pointer", padding: "12px 0",
            }}
          >
            Want changes? 🔄
          </button>
        </div>
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

      <ChangeRequestSheet
        open={showChangeSheet}
        onClose={() => setShowChangeSheet(false)}
        buildRequest={buildRequest}
        businessName={businessName}
      />
    </div>
  );
}
