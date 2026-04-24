import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { MONTHLY_PRICE } from "@/lib/constants";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };
const ADMIN_UPI = "kisswithurmila@okaxis"; // Your UPI ID

export default function Payment() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const plan = searchParams.get("plan") || "growth";
  const baseAmount = parseInt(searchParams.get("amount") || MONTHLY_PRICE.toString());
  const referralDiscount = Math.min(baseAmount, (profile as any)?.referral_discount || 0);
  const amount = Math.max(0, baseAmount - referralDiscount);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showUpi, setShowUpi] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);
  const [payerPhone, setPayerPhone] = useState("");
  const [payerAmount, setPayerAmount] = useState(String(amount));
  const [payerName, setPayerName] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);
  const [upiLoading, setUpiLoading] = useState(false);
  const [upiSuccess, setUpiSuccess] = useState(false);

  useEffect(() => {
    const intent = sessionStorage.getItem("upgrade_intent");
    if (!intent) {
      navigate("/client/dashboard", { replace: true });
      return;
    }
    sessionStorage.removeItem("upgrade_intent");
    setGateChecked(true);
  }, [navigate]);

  useEffect(() => {
    setPayerAmount(String(amount));
  }, [amount]);

  const priceId = "growth_monthly";

  const copyUpi = () => {
    navigator.clipboard.writeText(ADMIN_UPI);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  const handleUpiConfirm = async () => {
    const cleanPhone = payerPhone.replace(/\D/g, "");
    const cleanAmount = parseInt(payerAmount.replace(/\D/g, ""), 10);
    const cleanName = payerName.trim();

    if (cleanPhone.length < 10) {
      toast({ title: "Invalid number", description: "Please enter a valid 10-digit phone number.", variant: "destructive" });
      return;
    }
    if (!cleanAmount || cleanAmount < 1) {
      toast({ title: "Invalid amount", description: "Please enter the amount you paid.", variant: "destructive" });
      return;
    }
    if (cleanName.length < 2) {
      toast({ title: "Invalid name", description: "Please enter the name on your UPI account.", variant: "destructive" });
      return;
    }

    setUpiLoading(true);
    try {
      await (supabase.from("payments") as any).insert({
        business_id: user?.id || null,
        business_name: profile?.business_name || null,
        amount: cleanAmount,
        total: cleanAmount,
        method: "upi_manual",
        payer_phone: cleanPhone,
        payer_upi_name: cleanName,
        status: "pending_verification",
        plan: "growth",
      });

      // Notify admin via WhatsApp
      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: "919973383902",
            message: `💰 MANUAL UPI PAYMENT\n━━━━━━━━━━━━\nBusiness: ${profile?.business_name || "Unknown"}\nPayer Number: +91${cleanPhone}\nAmount Paid: ₹${cleanAmount}\nUPI Name: ${cleanName}\nUser: ${user?.email || ""}\n━━━━━━━━━━━━\nVERIFY at: leadpe.online/admin`,
          },
        });
      } catch {}

      setUpiSuccess(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setUpiLoading(false);
    }
  };

  if (!gateChecked) return null;

  // UPI Success screen
  if (upiSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: "#F0FFF4" }}>
            <Check size={40} style={{ color: "#00C853" }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#1A1A1A", fontFamily: font.heading }}>Payment Submitted! ✅</h2>
          <p className="text-sm mb-6" style={{ color: "#666" }}>
            We will verify and activate your website within 2 hours. You will receive a WhatsApp confirmation.
          </p>
          <Button onClick={() => navigate("/client/dashboard")} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
            Go to Dashboard →
          </Button>
        </motion.div>
      </div>
    );
  }

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
            referralDiscount={referralDiscount}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
      <PaymentTestModeBanner />
      <nav className="bg-white border-b flex items-center justify-between px-4 h-14" style={{ borderColor: "#E0E0E0" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={20} style={{ color: "#1A1A1A" }} />
        </button>
        <LeadPeLogo theme="light" size="sm" />
        <span style={{ fontSize: 13, color: "#666" }}>🔒 Secure</span>
      </nav>

      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-6">
            <h1 style={{ fontFamily: font.heading, fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Unlock Your Customers 🚀</h1>
            <p style={{ fontSize: 14, color: "#666" }}>See who contacted you and call them directly.</p>
          </div>

          <div className="rounded-2xl mb-5" style={{ backgroundColor: "#E8F5E9", padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>What unlocks:</p>
            {["See all customer names + numbers", "Call them directly from dashboard", "New customer WhatsApp alerts", "Appear on Google + Google Maps", "Weekly Monday performance report"].map(f => (
              <div key={f} className="flex items-center gap-2 mb-2">
                <Check size={16} style={{ color: "#00C853", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>{f}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl mb-5" style={{ border: "2px solid #00C853", padding: 20 }}>
            <p style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Growth Plan 💚</p>
            {referralDiscount > 0 ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#666", marginBottom: 4 }}>
                  <span>Original</span>
                  <span style={{ textDecoration: "line-through" }}>₹{baseAmount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#00C853", fontWeight: 600, marginBottom: 8 }}>
                  <span>🎁 Referral discount</span>
                  <span>−₹{referralDiscount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, color: "#1A1A1A", fontWeight: 600 }}>You pay</span>
                  <span style={{ fontFamily: font.heading, fontSize: 32, fontWeight: 700, color: "#00C853" }}>₹{amount}</span>
                </div>
                <p style={{ fontSize: 11, color: "#999", marginTop: 4 }}>per month · Cancel anytime.</p>
              </div>
            ) : (
              <>
                <p style={{ fontFamily: font.heading, fontSize: 36, fontWeight: 700, color: "#00C853", marginBottom: 4 }}>₹{MONTHLY_PRICE} / month</p>
                <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>Cancel anytime.</p>
              </>
            )}
            {["Unlimited customers", "WhatsApp alert on every inquiry", "Custom subdomain", "Appear on Google", "Priority support", "Weekly Monday report"].map(f => (
              <div key={f} className="flex items-center gap-2 mb-1.5">
                <Check size={14} style={{ color: "#00C853" }} />
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Stripe Pay button */}
          <Button onClick={() => setShowCheckout(true)}
            className="w-full rounded-xl text-white font-semibold text-base mb-4" style={{ backgroundColor: "#00C853", height: 56 }}>
            Pay ₹{amount} / month →
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
            <span className="text-xs" style={{ color: "#999" }}>or pay manually</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
          </div>

          {/* Manual UPI Section */}
          {!showUpi ? (
            <Button onClick={() => setShowUpi(true)} variant="outline"
              className="w-full rounded-xl font-semibold text-base mb-5" style={{ borderColor: "#00C853", color: "#00C853", height: 48 }}>
              Pay via UPI (GPay / PhonePe / Paytm) →
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl mb-5 p-5" style={{ border: "2px solid #00C853" }}>
              <h3 className="font-bold text-base mb-1" style={{ color: "#1A1A1A", fontFamily: font.heading }}>Pay via UPI</h3>
              <p className="text-xs mb-4" style={{ color: "#666" }}>Instant. No extra charges.</p>

              {/* UPI ID */}
              <div className="flex items-center gap-2 rounded-xl p-3 mb-4" style={{ backgroundColor: "#F0FFF4", border: "1px solid #C8E6C9" }}>
                <span className="flex-1 font-bold text-lg" style={{ color: "#1A1A1A", fontFamily: "monospace" }}>{ADMIN_UPI}</span>
                <button onClick={copyUpi} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "#00C853", color: "white" }}>
                  {upiCopied ? "Copied! ✅" : <><Copy size={12} /> Copy</>}
                </button>
              </div>

              <p className="font-bold text-sm mb-3" style={{ color: "#00C853" }}>Amount: ₹{amount}</p>

              <div className="text-xs space-y-1 mb-4" style={{ color: "#666" }}>
                <p>1. Copy the UPI ID above</p>
                <p>2. Open any UPI app (GPay, PhonePe, Paytm)</p>
                <p>3. Send exactly ₹{amount}</p>
                <p>4. Fill the details below and confirm</p>
              </div>

              <div className="mb-3">
                <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Your Phone Number</label>
                <Input
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  className="rounded-xl h-12"
                />
              </div>

              <div className="mb-3">
                <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Amount Paid (₹)</label>
                <Input
                  value={payerAmount}
                  onChange={(e) => setPayerAmount(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter amount"
                  inputMode="numeric"
                  className="rounded-xl h-12"
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>UPI Name</label>
                <Input
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value.slice(0, 60))}
                  placeholder="Name on your UPI account"
                  className="rounded-xl h-12"
                />
                <p className="text-[11px] mt-1" style={{ color: "#999" }}>Same name as on your UPI app</p>
              </div>

              <Button onClick={handleUpiConfirm}
                disabled={upiLoading || payerPhone.length < 10 || !payerAmount || payerName.trim().length < 2}
                className="w-full h-12 rounded-xl text-white font-semibold disabled:opacity-60" style={{ backgroundColor: "#00C853" }}>
                {upiLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Submitting...
                  </span>
                ) : "I Have Paid — Confirm →"}
              </Button>
            </motion.div>
          )}

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
