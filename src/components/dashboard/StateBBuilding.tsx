import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ChangeRequestSheet from "@/components/ChangeRequestSheet";

const font = { heaing: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface Props {
  buildRequest: any;
  businessName: string;
}

export default function StateBBuilding({ buildRequest, businessName }: Props) {
  const navigate = useNavigate();
  const [showChangeSheet, setShowChangeSheet] = useState(false);
  const status = buildRequest?.status || "pending";

  // Progress bar width
  const progressMap: Record<string, number> = { pending: 15, building: 50, demo_ready: 80, live: 100 };
  const progressWidth = progressMap[status] ?? 15;

  // Status badge
  const badgeMap: Record<string, { bg: string; color: string; text: string }> = {
    pending: { bg: "#FFF8E1", color: "#F57F17", text: "Finding builder..." },
    building: { bg: "#E3F2FD", color: "#1565C0", text: "Being built ⚡" },
    demo_ready: { bg: "#E8F5E9", color: "#00C853", text: "Ready to see! 👀" },
  };
  const badge = badgeMap[status] || badgeMap.pending;

  // Progress labels
  const labels = ["Received", "Building", "Preview", "Live"];
  const activeIndex = status === "pending" ? 0 : status === "building" ? 1 : status === "demo_ready" ? 2 : 3;

  const coderFirstName = buildRequest?.assigned_coder_name?.split(" ")[0];

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
      {/* ═══ SECTION 1 — SIMPLE TRACKER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{
          margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 24,
          border: "2px solid #00C853",
          boxShadow: "0 4px 16px rgba(0,200,83,0.12)",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: font.heaing, fontSize: 18, fontWeight: 700, color: "#1A1A1A" }}>
            Your Website
          </span>
          <span style={{
            fontFamily: font.body, fontSize: 12, padding: "4px 10px", borderRadius: 20,
            backgroundColor: badge.bg, color: badge.color, fontWeight: 500,
          }}>
            {badge.text}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 20, height: 8, backgroundColor: "#F0F0F0", borderRadius: 4 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressWidth}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ height: "100%", backgroundColor: "#00C853", borderRadius: 4 }}
          />
        </div>

        {/* Labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {labels.map((label, i) => (
            <span key={label} style={{
              fontFamily: font.body, fontSize: 11,
              color: i <= activeIndex ? "#00C853" : "#999",
              fontWeight: i <= activeIndex ? 700 : 400,
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* Status message */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          {status === "pending" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
              <p style={{ fontFamily: font.heaing, fontSize: 16, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.4 }}>
                We are fining the right<br />builder for you
              </p>
              <p style={{ fontFamily: font.body, fontSize: 13, color: "#999", marginTop: 6 }}>
                Usually takes 2-4 hours
              </p>
            </>
          )}

          {status === "building" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
              <p style={{ fontFamily: font.heaing, fontSize: 16, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.4 }}>
                {coderFirstName ? `${coderFirstName} is building` : "Your website is being built"}<br />
                {coderFirstName ? "your website right now!" : "right now!"}
              </p>
              <p style={{ fontFamily: font.body, fontSize: 13, color: "#999", marginTop: 6 }}>
                You'll see it very soon
              </p>
            </>
          )}

          {status === "demo_ready" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <p style={{ fontFamily: font.heaing, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>
                Your website is ready!
              </p>

              {/* See Your Website */}
              <button
                onClick={() => window.open(buildRequest?.demo_url || buildRequest?.deploy_url, "_blank")}
                style={{
                  width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none",
                  height: 52, borderRadius: 12, fontFamily: font.heaing, fontSize: 16, fontWeight: 700,
                  cursor: "pointer", marginBottom: 10,
                }}
              >
                See Your Website 👀
              </button>

              {/* Go Live */}
              <button
                onClick={() => {
                  sessionStorage.setItem("upgrade_intent", "true");
                  navigate("/payment?plan=growth&amount=299");
                }}
                style={{
                  width: "100%", backgroundColor: "#fff", color: "#00C853",
                  border: "2px solid #00C853", height: 48, borderRadius: 12,
                  fontFamily: font.heaing, fontSize: 15, fontWeight: 600,
                  cursor: "pointer", marginBottom: 10,
                }}
              >
                Looks Good — Go Live! ✅
              </button>

              {/* Want Changes */}
              <button
                onClick={() => setShowChangeSheet(true)}
                style={{
                  width: "100%", backgroundColor: "#fff", color: "#999", border: "none",
                  height: 44, fontFamily: font.body, fontSize: 14, cursor: "pointer",
                }}
              >
                Want Changes? 🔄
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* ═══ SECTION 2 — CUSTOMERS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 20,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <h3 style={{ fontFamily: font.heaing, fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 0 }}>
          Customer Enquiries
        </h3>

        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
          <p style={{
            fontFamily: font.body, fontSize: 14, color: "#666", maxWidth: 240, margin: "0 auto",
            lineHeight: 1.6,
          }}>
            Customers will appear here once your website is live
          </p>
        </div>
      </motion.div>

      {/* Change Request Bottom Sheet */}
      <ChangeRequestSheet
        open={showChangeSheet}
        onClose={() => setShowChangeSheet(false)}
        buildRequest={buildRequest}
        businessName={businessName}
      />
    </div>
  );
}
