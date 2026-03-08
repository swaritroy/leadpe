import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Lock, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logEvent, ORDER_EVENTS } from "@/lib/evidence";
import LeadPeLogo from "@/components/LeadPeLogo";
import { ADMIN_WHATSAPP, UPI_ID, RAZORPAY_KEY_ID } from "@/lib/constants";

// Load Razorpay script
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
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const orderId = searchParams.get("order");
  const plan = searchParams.get("plan") || "growth";
  const amount = parseInt(searchParams.get("amount") || "299");
  const [showPending, setShowPending] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  const isOrderPayment = !!orderId;

  useEffect(() => {
    if (orderId) {
      (supabase as any).from("orders").select("*").eq("order_id", orderId).single().then(({ data }: any) => {
        if (data) setOrder(data);
      });
    }
  }, [orderId]);

  // Poll for activation every 30s when pending
  useEffect(() => {
    if (!showPending || !user) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from("profiles").select("status").eq("user_id", user.id).single();
      if (data?.status === "active") {
        clearInterval(interval);
        setShowPending(false);
        setShowCelebration(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [showPending, user]);

  const displayAmount = isOrderPayment ? (order?.total_price || amount) : amount;
  const gstAmount = Math.round(displayAmount * 0.18);
  const displayTitle = isOrderPayment ? `Website Order ${orderId}` : "LeadPe Growth Plan";
  const displayDesc = isOrderPayment ? `${order?.business_name || ""} — ${order?.package_id || ""} package` : "Monthly Management";

  const handleRazorpayPay = useCallback(async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast({ title: "Failed to load payment gateway", variant: "destructive" });
        setPaying(false);
        return;
      }

      // 1. Create Razorpay order via edge function
      const { data: orderData, error } = await supabase.functions.invoke("razorpay", {
        body: {
          action: "create_order",
          amount: displayAmount,
          receipt: isOrderPayment ? orderId : `plan_${plan}`,
          notes: {
            type: isOrderPayment ? "order" : "plan",
            plan: isOrderPayment ? order?.package_id : plan,
            business: isOrderPayment ? order?.business_name : "Growth Plan",
          },
        },
      });

      if (error || !orderData?.order_id) {
        toast({ title: "Could not create payment order", description: error?.message || "Try again", variant: "destructive" });
        setPaying(false);
        return;
      }

      // 2. Insert pending payment record
      const { data: paymentRecord } = await (supabase as any).from("payments").insert({
        business_id: user?.id || null,
        business_name: isOrderPayment ? order?.business_name : "Growth Plan",
        amount: displayAmount,
        gst: gstAmount,
        total: displayAmount,
        plan: isOrderPayment ? order?.package_id : plan,
        method: "razorpay",
        status: "pending",
        gateway_order_id: orderData.order_id,
      }).select("id").single();

      // 3. Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "LeadPe",
        description: displayTitle,
        order_id: orderData.order_id,
        prefill: {
          name: user?.user_metadata?.full_name || order?.customer_name || "",
          contact: user?.user_metadata?.whatsapp_number || order?.customer_whatsapp || "",
          email: user?.email || "",
        },
        theme: { color: "#00C853" },
        handler: async (response: any) => {
          // 4. Verify payment via edge function
          const { data: verifyData, error: verifyErr } = await supabase.functions.invoke("razorpay", {
            body: {
              action: "verify_payment",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_db_id: paymentRecord?.id,
              order_db_id: isOrderPayment ? order?.id : null,
              is_order_payment: isOrderPayment,
              user_id: user?.id,
              plan,
            },
          });

          if (verifyErr || !verifyData?.verified) {
            toast({ title: "Payment verification failed", description: "Contact support on WhatsApp", variant: "destructive" });
            setPaying(false);
            return;
          }

          if (isOrderPayment && orderId) {
            await logEvent(orderId, ORDER_EVENTS.PAYMENT_RECEIVED, `₹${displayAmount} via Razorpay`);
          }

          toast({ title: "Payment successful! ✅" });
          if (isOrderPayment) {
            setShowPending(true);
          } else {
            setShowCelebration(true);
          }
          setPaying(false);
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast({ title: "Payment error", description: e.message, variant: "destructive" });
      setPaying(false);
    }
  }, [displayAmount, isOrderPayment, orderId, order, plan, user, gstAmount, toast, displayTitle]);

  const handleUpiPay = () => {
    window.open(
      `upi://pay?pa=${UPI_ID}&pn=LeadPe&am=${displayAmount}&cu=INR&tn=LeadPe+${isOrderPayment ? orderId : "Growth+Plan"}`,
      "_blank"
    );
  };

  const handleIPaid = async () => {
    const phone = isOrderPayment ? order?.customer_whatsapp : (user?.user_metadata?.whatsapp_number || "");
    const msg = isOrderPayment
      ? `💰 PAYMENT DONE\nOrder: ${orderId}\nAmount: ₹${displayAmount}\nBusiness: ${order?.business_name}\nCustomer: ${order?.customer_name}\nPhone: ${phone}`
      : `Hi LeadPe! I paid ₹${displayAmount} for Growth Plan. My WhatsApp: ${phone}. Please activate my account.`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");

    if (isOrderPayment && order) {
      await (supabase as any).from("orders").update({
        payment_status: "paid",
        payment_received_at: new Date().toISOString(),
        status: "paid",
      }).eq("id", order.id);
      await logEvent(orderId!, ORDER_EVENTS.PAYMENT_RECEIVED, `₹${displayAmount}`);
    }

    await (supabase as any).from("payments").insert({
      business_id: user?.id || null,
      business_name: isOrderPayment ? order?.business_name : "Growth Plan",
      amount: displayAmount,
      gst: gstAmount,
      total: displayAmount,
      plan: isOrderPayment ? order?.package_id : plan,
      method: "upi",
      status: "pending",
    });

    setShowPending(true);
  };

  // Celebration screen
  if (showCelebration) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="text-7xl mb-6">🎉</motion.div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>
            {isOrderPayment ? "Payment Successful! 🚀" : "Plan Activated! 🚀"}
          </h2>
          <p className="text-sm mb-2" style={{ color: "#666" }}>
            {isOrderPayment ? "Your website will go live within 2 hours!" : "Your Growth Plan is now active."}
          </p>
          <p className="text-sm mb-8" style={{ color: "#666" }}>
            {isOrderPayment ? "We'll WhatsApp you the link." : "All leads are now unlocked. Start growing!"}
          </p>
          <Link to={isOrderPayment ? "/" : "/client/dashboard"}>
            <Button className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
              {isOrderPayment ? "Back to Home →" : "Go to Dashboard →"}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (showPending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F0FFF4", border: "2px solid #00C853" }}>
            <Clock size={28} style={{ color: "#00C853" }} />
          </motion.div>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>
            {isOrderPayment ? "Payment Confirmed! 🎉" : "Activating your plan..."}
          </h2>
          <p className="text-sm mb-2" style={{ color: "#666" }}>
            {isOrderPayment
              ? "Your website will go live within 2 hours. We'll WhatsApp you the link!"
              : "We will activate within 15 minutes and WhatsApp you."}
          </p>
          <p className="text-xs mb-6" style={{ color: "#999" }}>This page auto-checks every 30 seconds ⏱️</p>
          <Link to={isOrderPayment ? "/" : "/client/dashboard"}>
            <Button className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
              {isOrderPayment ? "Back to Home →" : "Go to Dashboard →"}
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
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* ORDER SUMMARY */}
          <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: "#F0FFF4", border: "1px solid #00C853" }}>
            <h2 className="font-bold text-lg mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>{displayTitle}</h2>
            <p className="text-sm mb-2" style={{ color: "#666" }}>{displayDesc}</p>
            <p className="text-3xl font-bold mb-1" style={{ color: "#00C853", fontFamily: "Syne" }}>₹{displayAmount.toLocaleString()}</p>
            <p className="text-xs" style={{ color: "#999" }}>
              {!isOrderPayment && <>Incl. GST (₹{gstAmount}) • Cancel anytime</>}
              {isOrderPayment && "One-time payment • Pay only after seeing demo"}
            </p>
          </div>

          {/* WHAT YOU GET */}
          <div className="bg-white rounded-xl p-5 mb-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "#1A1A1A" }}>What you get</h3>
            <ul className="space-y-2">
              {(isOrderPayment && order
                ? [`${order.package_id} website`, "Mobile friendly", "WhatsApp button", "SEO optimized", "Lead capture form"]
                : ["Unlimited leads", "Instant WhatsApp ping", "Custom domain", "Weekly report", "Priority support"]
              ).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#1A1A1A" }}>
                  <Check size={14} style={{ color: "#00C853" }} /> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* RAZORPAY PAYMENT - PRIMARY */}
          <div className="bg-white rounded-xl p-5 mb-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <h3 className="font-bold text-lg mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>Pay Online</h3>
            <p className="text-xs mb-4" style={{ color: "#999" }}>UPI • Cards • Net Banking • Wallets</p>
            <Button
              onClick={handleRazorpayPay}
              disabled={paying}
              className="w-full h-[52px] rounded-xl text-white font-semibold text-base"
              style={{ backgroundColor: "#00C853" }}
            >
              <CreditCard size={16} className="mr-2" />
              {paying ? "Processing..." : `Pay ₹${displayAmount.toLocaleString()} →`}
            </Button>
          </div>

          {/* UPI FALLBACK */}
          <div className="bg-white rounded-xl p-5 mb-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
              <span className="text-xs" style={{ color: "#999" }}>OR pay manually via UPI</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#E0E0E0" }} />
            </div>

            <Button onClick={handleUpiPay} variant="outline" className="w-full h-11 rounded-xl font-medium mb-3" style={{ borderColor: "#E0E0E0" }}>
              <Lock size={14} className="mr-2" /> Open UPI App
            </Button>

            <div className="rounded-xl p-3" style={{ backgroundColor: "#F9F9F9" }}>
              <p className="text-xs" style={{ color: "#666" }}>📱 UPI ID: {UPI_ID}</p>
              <p className="text-xs" style={{ color: "#666" }}>💰 Amount: ₹{displayAmount.toLocaleString()}</p>
            </div>

            <p className="text-xs text-center mt-3 mb-2" style={{ color: "#666" }}>After manual UPI payment:</p>
            <Button onClick={handleIPaid} variant="outline" className="w-full h-10 rounded-xl text-sm" style={{ borderColor: "#00C853", color: "#00C853" }}>
              I Have Paid ✅
            </Button>
          </div>

          {/* TRUST BADGES */}
          <div className="flex flex-wrap justify-center gap-3 text-xs" style={{ color: "#666" }}>
            {["🔒 Safe & Secure", "↩️ Cancel anytime", "💬 WhatsApp support", "🇮🇳 Made in India"].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F0F0F0" }}>{t}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
