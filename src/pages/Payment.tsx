import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import LeadPeLogo from "@/components/LeadPeLogo";

export default function Payment() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const plan = searchParams.get("plan") || "growth";
  const amount = parseInt(searchParams.get("amount") || "299");
  const [upiId, setUpiId] = useState("");
  const [showPending, setShowPending] = useState(false);

  const handleUpiPay = () => {
    window.open(
      `upi://pay?pa=9973383902@upi&pn=LeadPe&am=${amount}&cu=INR&tn=LeadPe+Growth+Plan`,
      "_blank"
    );
  };

  const handleScreenshot = () => {
    const phone = user?.user_metadata?.whatsapp_number || "";
    const msg = `Hi LeadPe! I paid ₹${amount} for Growth Plan. My WhatsApp: ${phone}. Screenshot attached.`;
    window.open(`https://wa.me/919973383902?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleIPaid = () => {
    const phone = user?.user_metadata?.whatsapp_number || "";
    const msg = `Hi LeadPe! I paid ₹${amount} for Growth Plan. My WhatsApp: ${phone}. Please activate my account.`;
    window.open(`https://wa.me/919973383902?text=${encodeURIComponent(msg)}`, "_blank");
    setShowPending(true);
  };

  const inputStyle: React.CSSProperties = { backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0", color: "#1A1A1A", fontSize: "16px" };

  if (showPending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F0FFF4", border: "2px solid #00C853" }}>
            <Clock size={28} style={{ color: "#00C853" }} />
          </motion.div>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Activating your plan...</h2>
          <p className="text-sm mb-6" style={{ color: "#666666" }}>
            We will activate within 15 minutes and WhatsApp you. Your dashboard will update automatically.
          </p>
          <Link to="/client/dashboard">
            <Button className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
              Go to Dashboard →
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <nav className="bg-white border-b" style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/"><LeadPeLogo theme="light" size="sm" /></Link>
          <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Secure Payment 🔒</span>
          <span className="text-xs hidden sm:block" style={{ color: "#999999" }}>Safe & Secure</span>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ORDER SUMMARY */}
          <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: "#F0FFF4", border: "1px solid #00C853" }}>
            <h2 className="font-bold text-lg mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>LeadPe Growth Plan</h2>
            <p className="text-sm mb-2" style={{ color: "#666666" }}>Monthly Management</p>
            <p className="text-3xl font-bold mb-1" style={{ color: "#00C853", fontFamily: "Syne" }}>₹{amount}/month</p>
            <p className="text-xs" style={{ color: "#999999" }}>GST included • Cancel anytime</p>
          </div>

          {/* WHAT YOU GET */}
          <div className="bg-white rounded-xl p-5 mb-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "#1A1A1A" }}>What you get</h3>
            <ul className="space-y-2">
              {["Unlimited leads", "Instant WhatsApp ping", "Custom domain", "Weekly report", "Priority support"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#1A1A1A" }}>
                  <Check size={14} style={{ color: "#00C853" }} /> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* PAYMENT */}
          <div className="bg-white rounded-xl p-5 mb-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Pay via UPI</h3>
            <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="UPI ID or 9XXXXXXXXX@upi"
              className="rounded-xl h-12 mb-4" style={inputStyle} />
            <Button onClick={handleUpiPay} className="w-full h-[52px] rounded-xl text-white font-semibold text-base" style={{ backgroundColor: "#00C853" }}>
              <Lock size={16} className="mr-2" /> Pay ₹{amount} →
            </Button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
              <span className="text-xs" style={{ color: "#999999" }}>OR</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
            </div>

            {/* MANUAL */}
            <div className="rounded-xl p-4" style={{ backgroundColor: "#F9F9F9" }}>
              <p className="text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>Pay directly to UPI:</p>
              <p className="text-sm" style={{ color: "#666666" }}>📱 UPI ID: 9973383902@upi</p>
              <p className="text-sm mb-3" style={{ color: "#666666" }}>💰 Amount: ₹{amount}</p>
              <p className="text-xs mb-3" style={{ color: "#999999" }}>After payment send screenshot:</p>
              <Button onClick={handleScreenshot} variant="outline" className="w-full h-10 rounded-xl text-sm font-semibold" style={{ borderColor: "#00C853", color: "#00C853" }}>
                Send Payment Screenshot →
              </Button>
            </div>
          </div>

          {/* I HAVE PAID */}
          <div className="bg-white rounded-xl p-5 mb-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <p className="text-sm text-center mb-3" style={{ color: "#666666" }}>After payment, click below:</p>
            <Button onClick={handleIPaid} variant="outline" className="w-full h-12 rounded-xl font-semibold" style={{ borderColor: "#00C853", color: "#00C853" }}>
              I Have Paid ✅
            </Button>
          </div>

          {/* TRUST */}
          <div className="flex flex-wrap justify-center gap-3 text-xs" style={{ color: "#666666" }}>
            {["🔒 Safe", "↩️ Cancel anytime", "💬 Support", "🇮🇳 India"].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F0F0F0" }}>{t}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
