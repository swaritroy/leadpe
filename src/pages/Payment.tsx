import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { MONTHLY_PRICE } from "@/lib/constants";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

export default function Payment() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const plan = searchParams.get("plan") || "growth";
  const amount = parseInt(searchParams.get("amount") || MONTHLY_PRICE.toString());
  const [showCheckout, setShowCheckout] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);

  // Gate check: only allow if upgrade_intent set
  useEffect(() => {
    const intent = sessionStorage.getItem("upgrade_intent");
    if (!intent) {
      navigate("/client/dashboard", { replace: true });
      return;
    }
    sessionStorage.removeItem("upgrade_intent");
    setGateChecked(true);
  }, [navigate]);

  const priceId = plan === "growth" ? "growth_monthly" : "growth_monthly";

  if (!gateChecked) return null;

  if (showCheckout) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
        <PaymentTestModeBanner />
        <nav className="bg-white border-b flex items-center justify-between px-4 h-14" style={{ borderColor: "#E0E0E0" }}>
          <button onClick={() => setShowCheckout(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={20} style={{ color: "#1A1A1A" }} />
          </button>
          <LeadPeLogo theme="light" size="sm" />
          <span style={{ fontSize: 13, color: "#666" }}>🔒 Secure</span>
        </nav>
        <div className="max-w-lg mx-auto px-4 py-8">
          <StripeEmbeddedCheckout
            priceId={priceId}
            customerEmail={user?.email || undefined}
            userId={user?.id || ""}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
      <PaymentTestModeBanner />
      {/* Navbar */}
      <nav className="bg-white border-b flex items-center justify-between px-4 h-14" style={{ borderColor: "#E0E0E0" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={20} style={{ color: "#1A1A1A" }} />
        </button>
        <LeadPeLogo theme="light" size="sm" />
        <span style={{ fontSize: 13, color: "#666" }}>🔒 Secure</span>
      </nav>

      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero */}
          <div className="text-center mb-6">
            <h1 style={{ fontFamily: font.heading, fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Unlock Your Customers 🚀</h1>
            <p style={{ fontSize: 14, color: "#666" }}>See who contacted you and call them directly.</p>
          </div>

          {/* What unlocks */}
          <div className="rounded-2xl mb-5" style={{ backgroundColor: "#E8F5E9", padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>What unlocks:</p>
            {[
              "See all customer names + numbers",
              "Call them directly from dashboard",
              "New customer WhatsApp alerts",
              "Appear on Google + Google Maps",
              "Weekly Monday performance report",
            ].map(f => (
              <div key={f} className="flex items-center gap-2 mb-2">
                <Check size={16} style={{ color: "#00C853", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Plan card */}
          <div className="bg-white rounded-2xl mb-5" style={{ border: "2px solid #00C853", padding: 20 }}>
            <p style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Growth Plan 💚</p>
            <p style={{ fontFamily: font.heading, fontSize: 36, fontWeight: 700, color: "#00C853", marginBottom: 4 }}>₹{MONTHLY_PRICE} / month</p>
            <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>Cancel anytime.</p>
            {["Unlimited customers", "WhatsApp alert on every inquiry", "Custom subdomain", "Appear on Google", "Priority support", "Weekly Monday report"].map(f => (
              <div key={f} className="flex items-center gap-2 mb-1.5">
                <Check size={14} style={{ color: "#00C853" }} />
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Pay button */}
          <Button onClick={() => setShowCheckout(true)}
            className="w-full rounded-xl text-white font-semibold text-base mb-5" style={{ backgroundColor: "#00C853", height: 56 }}>
            Pay ₹{amount} / month →
          </Button>

          {/* Trust */}
          <div className="flex flex-wrap justify-center gap-2 text-xs" style={{ color: "#666" }}>
            {["🔒 Secure", "↩️ Cancel anytime", "💬 WhatsApp support", "🇮🇳 Made in India"].map(t => (
              <span key={t} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F0F0F0" }}>{t}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
