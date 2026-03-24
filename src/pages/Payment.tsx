import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Lock, Clock, CreditCard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logEvent, ORDER_EVENTS } from "@/lib/evidence";
import LeadPeLogo from "@/components/LeadPeLogo";
import { ADMIN_WHATSAPP, UPI_ID, RAZORPAY_KEY_ID, MONTHLY_PRICE } from "@/lib/constants";

const font = { heaing: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const orderId = searchParams.get("order");
  const plan = searchParams.get("plan") || "growth";
  const amount = parseInt(searchParams.get("amount") || MONTHLY_PRICE.toString());
  const [showPending, setShowPending] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);

  const isOrderPayment = !!orderId;

  // Gate check: only allow if upgrade_intent set or order payment
  useEffect(() => {
    if (isOrderPayment) {
      setGateChecked(true);
      return;
    }
    const intent = sessionStorage.getItem("upgrade_intent");
    if (!intent) {
      navigate("/client/dashboard", { replace: true });
      return;
    }
    sessionStorage.removeItem("upgrade_intent");
    setGateChecked(true);
  }, [isOrderPayment, navigate]);

  useEffect(() => {
    if (orderId) {
      (supabase as any).from("orders").select("*").eq("order_id", orderId).single().then(({ data }: any) => {
        if (data) setOrder(data);
      });
    }
  }, [orderId]);

  // Realtime subscription for UPI payment activation (replaces setInterval polling)
  useEffect(() => {
    if (!showPending || !user) return;

    const channel = supabase
      .channel("payment-activation")
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `business_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new?.status === "paid") {
            setShowPending(false);
            setShowCelebration(true);
            toast({ title: "Payment confirmed! 🎉" });
            refreshProfile();
          }
        }
      )
      .subscribe();

    // Also check profile status for admin-activated cases
    const profileChannel = supabase
      .channel("profile-activation")
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new?.status === "active") {
            setShowPending(false);
            setShowCelebration(true);
            toast({ title: "Account activated! 🎉" });
            refreshProfile();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(profileChannel);
    };
  }, [showPending, user, toast, refreshProfile]);

  const displayAmount = isOrderPayment ? (order?.total_price || amount) : amount;
  const gstAmount = Math.round(displayAmount * 0.18);
  const businessName = profile?.business_name || profile?.full_name || "";

  const handleRazorpayPay = useCallback(async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast({ title: "Failed to load payment", variant: "destructive" }); setPaying(false); return; }

      const { data: orderData, error } = await supabase.functions.invoke("razorpay", {
        body: {
          action: "create_order",
          amount: displayAmount,
          receipt: isOrderPayment ? orderId : `plan_${plan}`,
          notes: { type: isOrderPayment ? "order" : "plan", plan: isOrderPayment ? order?.package_id : plan, business: businessName },
        },
      });

      if (error || !orderData?.order_id) { toast({ title: "Payment error", variant: "destructive" }); setPaying(false); return; }

      const { data: paymentRecord } = await (supabase as any).from("payments").insert({
        business_id: user?.id, business_name: businessName,
        amount: displayAmount, gst: gstAmount, total: displayAmount,
        plan: isOrderPayment ? order?.package_id : plan, method: "razorpay", status: "pending", gateway_order_id: orderData.order_id,
      }).select("id").single();

      const options = {
        key: RAZORPAY_KEY_ID, amount: orderData.amount, currency: "INR", name: "LeadPe",
        description: isOrderPayment ? `Order ${orderId}` : "Growth Plan",
        order_id: orderData.order_id,
        prefill: { name: profile?.full_name || "", contact: profile?.whatsapp_number || "", email: user?.email || "" },
        theme: { color: "#00C853" },
        handler: async (response: any) => {
          const { data: verifyData, error: verifyErr } = await supabase.functions.invoke("razorpay", {
            body: {
              action: "verify_payment", razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature,
              payment_db_id: paymentRecord?.id, order_db_id: isOrderPayment ? order?.id : null,
              is_order_payment: isOrderPayment, user_id: user?.id, plan,
            },
          });
          if (verifyErr || !verifyData?.verified) { toast({ title: "Verification failed", variant: "destructive" }); setPaying(false); return; }
          toast({ title: "Payment successful! ✅" });
          await refreshProfile();
          setShowCelebration(true);
          setPaying(false);
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast({ title: "Payment cancelled", description: "Payment failed or cancelled. Please try again.", variant: "destructive" });
          },
        },
      };
      new (window as any).Razorpay(options).open();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); setPaying(false); }
  }, [displayAmount, isOrderPayment, orderId, order, plan, user, gstAmount, toast, businessName, profile, refreshProfile]);

  const handleUpiPay = () => {
    window.open(`upi://pay?pa=${UPI_ID}&pn=LeadPe&am=${displayAmount}&cu=INR&tn=LeadPe+Growth+Plan`, "_blank");
  };

  const handleIPaid = async () => {
    const phone = profile?.whatsapp_number || "";
    const msg = `Hi! I paid ₹${displayAmount} for LeadPe Growth Plan.\nBusiness: ${businessName}\nWhatsApp: ${phone}\nPlease activate my account.`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");

    await (supabase as any).from("payments").insert({
      business_id: user?.id, business_name: businessName,
      amount: displayAmount, gst: gstAmount, total: displayAmount,
      plan, method: "upi", status: "pending",
    });
    setShowPending(true);
  };

  if (!gateChecked) return null;

  if (showCelebration) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="text-7xl mb-6">🎉</motion.div>
          <h2 style={{ fontFamily: font.heaing, fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>You're on Growth Plan! 🚀</h2>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>All customers visible now!</p>
          <Link to="/client/dashboard">
            <Button className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>Go to Dashboard →</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (showPending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F0FFF4", border: "2px solid #00C853" }}>
            <Clock size={28} style={{ color: "#00C853" }} />
          </motion.div>
          <h2 style={{ fontFamily: font.heaing, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Activating your account...</h2>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>Usually within 15 minutes.</p>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>We'll WhatsApp you when live!</p>
          <p style={{ fontSize: 12, color: "#999", marginBottom: 20 }}>This page updates automatically ⚡</p>
          <Link to="/client/dashboard">
            <Button className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>Go to Dashboard →</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
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
            <h1 style={{ fontFamily: font.heaing, fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>One Step to Go Live! 🚀</h1>
            <p style={{ fontSize: 14, color: "#666" }}>Your website is built and ready.</p>
          </div>

          {/* What changes */}
          <div className="rounded-2xl mb-5" style={{ backgroundColor: "#E8F5E9", padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>After payment:</p>
            {[
              `Real domain: ${businessName.toLowerCase().replace(/\s+/g, "")}.leadpe.online`,
              "Watermark removed",
              "Google can find you",
              "Customers start flowing",
            ].map(f => (
              <div key={f} className="flex items-center gap-2 mb-2">
                <Check size={16} style={{ color: "#00C853", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Plan card */}
          <div className="bg-white rounded-2xl mb-5" style={{ border: "2px solid #00C853", padding: 20 }}>
            <p style={{ fontFamily: font.heaing, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Growth Plan 💚</p>
            <p style={{ fontFamily: font.heaing, fontSize: 36, fontWeight: 700, color: "#00C853", marginBottom: 4 }}>₹{MONTHLY_PRICE} / month</p>
            <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>GST included. Cancel anytime.</p>
            {["Unlimited customers", "WhatsApp alert on every inquiry", "Custom subdomain", "Appear on Google", "Priority support"].map(f => (
              <div key={f} className="flex items-center gap-2 mb-1.5">
                <Check size={14} style={{ color: "#00C853" }} />
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Razorpay */}
          <div className="bg-white rounded-2xl mb-4 p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <h3 style={{ fontFamily: font.heaing, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 2 }}>Pay Online</h3>
            <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>UPI • Cards • Net Banking</p>
            <Button onClick={handleRazorpayPay} disabled={paying}
              className="w-full rounded-xl text-white font-semibold text-base" style={{ backgroundColor: "#00C853", height: 56 }}>
              <CreditCard size={16} className="mr-2" />
              {paying ? "Processing..." : `Pay ₹${displayAmount} →`}
            </Button>
          </div>

          {/* UPI Manual */}
          <div className="bg-white rounded-2xl p-5 mb-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
              <span style={{ fontSize: 12, color: "#999" }}>or pay via UPI</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
            </div>

            <Button onClick={handleUpiPay} variant="outline" className="w-full rounded-xl font-medium mb-3" style={{ borderColor: "#E0E0E0", height: 48 }}>
              Pay ₹{displayAmount} via UPI App
            </Button>

            <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: "#F9F9F9" }}>
              <p style={{ fontSize: 13, color: "#666" }}>📱 UPI ID: <strong>{UPI_ID}</strong></p>
              <p style={{ fontSize: 13, color: "#666" }}>💰 Amount: <strong>₹{displayAmount}</strong></p>
            </div>

            <p style={{ fontSize: 12, color: "#666", textAlign: "center", marginBottom: 8 }}>After UPI payment:</p>
            <Button onClick={handleIPaid}
              className="w-full rounded-xl font-semibold" style={{ backgroundColor: "#1A1A1A", color: "#fff", height: 52 }}>
              I Have Paid ✅
            </Button>
          </div>

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
