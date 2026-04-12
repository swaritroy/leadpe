import { motion } from "framer-motion";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface Props {
  firstName: string;
  onGetWebsite: () => void;
}

export default function StateANoWebsite({ firstName, onGetWebsite }: Props) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "calc(100vh - 56px)", paddingTop: 60, paddingBottom: 80 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: font.heading, fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}
        >
          Hello, {firstName} 👋
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ margin: "32px 0" }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏪</div>
          <h2 style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
            Get your business online
          </h2>
          <p style={{ fontFamily: font.body, fontSize: 16, color: "#666", lineHeight: 1.6 }}>
            Professional website in 48 hours
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onGetWebsite}
          style={{
            width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none",
            fontFamily: font.heading, fontSize: 17, fontWeight: 700,
            height: 56, borderRadius: 14, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(0,200,83,0.35)",
          }}
        >
          Build My Website — Free →
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ fontFamily: font.body, fontSize: 13, color: "#999", marginTop: 12 }}
        >
          See it before you pay anything
        </motion.p>

        {/* Trust points */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 40 }}
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
