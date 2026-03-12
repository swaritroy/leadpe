import { useState } from "react";
import { motion } from "framer-motion";

const font = { heaing: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface Props {
  firstName: string;
  onGetWebsite: () => void;
}

export default function StateANoWebsite({ firstName, onGetWebsite }: Props) {
  const [exploreMode, setExploreMode] = useState(false);

  if (exploreMode) {
    return (
      <div style={{ backgroundColor: "#F5FFF7", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
        {/* Dummy Dashboard Section */}
        <div style={{ position: "relative", margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          
          <div style={{ filter: "blur(8px)", pointerEvents: "none" }}>
            <p style={{ fontFamily: font.body, fontSize: 14, color: "#666", marginBottom: 8 }}>Customers This Month</p>
            <div style={{ fontFamily: font.heaing, fontSize: 72, fontWeight: 700, color: "#1A1A1A", textAlign: "center", lineHeight: 1 }}>
              0
            </div>
            <p style={{ fontFamily: font.body, fontSize: 14, color: "#666", textAlign: "center", marginTop: 4 }}>
              people contacted you
            </p>
            <div style={{ height: 1, backgroundColor: "#F5F5F5", margin: "16px 0" }} />
            <div style={{ display: "flex" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: font.heaing, fontSize: 22, fontWeight: 700, color: "#00C853" }}>0</div>
                <div style={{ fontFamily: font.body, fontSize: 11, color: "#999", marginTop: 2 }}>Today</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: font.heaing, fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>0</div>
                <div style={{ fontFamily: font.body, fontSize: 11, color: "#999", marginTop: 2 }}>This week</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: font.heaing, fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>0</div>
                <div style={{ fontFamily: font.body, fontSize: 11, color: "#999", marginTop: 2 }}>All Time</div>
              </div>
            </div>
          </div>

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
            <p style={{ fontFamily: font.body, fontSize: 16, fontWeight: 700, color: "#1A1A1A", textAlign: "center", backgroundColor: "rgba(255,255,255,0.9)", padding: "16px 20px", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              Your customers will appear here once your website is live 👀
            </p>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div 
          onClick={() => setExploreMode(false)}
          style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, backgroundColor: "#00C853", height: 52, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 -4px 12px rgba(0,200,83,0.2)" }} 
        >
          <span style={{ fontFamily: font.body, fontSize: 16, fontWeight: 700, color: "#fff" }}>
            Get your website — Free for 21 days →
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F5FFF7", minHeight: "calc(100vh - 56px)", paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px", textAlign: "center" }}>
        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: font.heaing, fontSize: 26, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}
        >
          Namaste, {firstName}! 👋
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ fontFamily: font.body, fontSize: 16, color: "#666", marginBottom: 48, lineHeight: 1.6 }}
        >
          Ready to get customers<br />on WhatsApp daily?
        </motion.p>

        {/* Phone illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          style={{ fontSize: 120, lineHeight: 1, marginBottom: 32 }}
        >
          📱
        </motion.div>

        {/* THE ONE BIG BUTTON */}
        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.97 }}
          onClick={onGetWebsite}
          style={{
            width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none",
            fontFamily: font.heaing, fontSize: 18, fontWeight: 700,
            height: 64, borderRadius: 16, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(0,200,83,0.35)",
          }}
        >
          Get My Website 🚀
        </motion.button>

        {/* Sub text */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ fontFamily: font.body, fontSize: 13, color: "#999", marginTop: 12 }}
        >
          Free for 21 days. No card needed.
        </motion.p>

        {/* Explore link */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          onClick={() => setExploreMode(true)}
          className="hover:underline"
          style={{
            background: "none", border: "none", fontFamily: font.body, fontSize: 14,
            color: "#666666", cursor: "pointer", marginTop: 16, display: "inline-block"
          }}
        >
          Explore dashboard first →
        </motion.button>

        {/* 3 Trust points */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 32 }}
        >
          {[
            { icon: "⚡", text: "48 hours" },
            { icon: "📱", text: "WhatsApp alerts" },
            { icon: "✅", text: "See before paying" },
          ].map((tp) => (
            <div key={tp.text} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{tp.icon}</div>
              <div style={{ fontFamily: font.body, fontSize: 12, color: "#666" }}>{tp.text}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
