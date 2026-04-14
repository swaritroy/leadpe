import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center max-w-sm">
        {sessionId ? (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="text-7xl mb-6">🎉</motion.div>
            <h2 style={{ fontFamily: font.heading, fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Customers Unlocked! 🚀</h2>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>You're now on the Growth Plan.</p>
            <p style={{ fontSize: 13, color: "#999", marginBottom: 24 }}>See all customer names and call them directly.</p>
            <Link to="/client/dashboard">
              <Button className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>Go to Dashboard →</Button>
            </Link>
          </>
        ) : (
          <>
            <div className="text-5xl mb-6">😕</div>
            <h2 style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>No session information found.</p>
            <Link to="/client/dashboard">
              <Button className="w-full h-12 rounded-xl" variant="outline">Back to Dashboard</Button>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
