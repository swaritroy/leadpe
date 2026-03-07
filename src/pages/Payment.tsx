import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadPeLogo from "@/components/LeadPeLogo";

const plans: Record<string, { name: string; price: number; features: string[] }> = {
  growth: {
    name: "Growth Plan",
    price: 299,
    features: ["Unlimited leads", "WhatsApp alerts", "Weekly reports", "SEO optimization", "Custom domain"],
  },
  pro: {
    name: "Pro Founding Member",
    price: 999,
    features: ["Everything in Growth", "AI appointment booking", "Google Review automation", "WhatsApp auto-reply", "Priority support", "Monthly strategy call"],
  },
};

export default function Payment() {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get("plan") || "growth";
  const plan = plans[planKey] || plans.growth;
  const gst = Math.round(plan.price * 0.18);
  const total = plan.price + gst;
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    // Razorpay placeholder — will be integrated later
    setTimeout(() => {
      const msg = encodeURIComponent(
        `💳 PAYMENT REQUEST\n━━━━━━━━━━━━\nPlan: ${plan.name}\nAmount: ₹${total} (incl. GST)\n━━━━━━━━━━━━\nPlease confirm activation.\nLeadPe ⚡`
      );
      window.open(`https://wa.me/919973383902?text=${msg}`, "_blank", "noopener,noreferrer");
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <nav className="border-b border-[#E0F2E9] bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft size={18} className="text-[#666]" />
            <LeadPeLogo theme="light" size="sm" />
          </Link>
          <div className="flex items-center gap-1 text-xs text-[#666]">
            <Shield size={14} className="text-[#00C853]" /> Secure Payment
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2 text-center">Complete Your Payment</h1>
          <p className="text-sm text-[#666] text-center mb-8">Activate your {plan.name}</p>

          {/* Plan Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.08)] mb-6">
            <h3 className="font-bold text-lg text-[#1A1A1A] mb-4">{plan.name}</h3>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                  <Check size={14} className="text-[#00C853]" /> {f}
                </li>
              ))}
            </ul>

            <div className="border-t border-[#E0F2E9] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Plan</span>
                <span className="text-[#1A1A1A] font-medium">₹{plan.price}/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">GST (18%)</span>
                <span className="text-[#1A1A1A] font-medium">₹{gst}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-[#E0F2E9]">
                <span className="text-[#1A1A1A]">Total</span>
                <span className="text-[#00C853]">₹{total}/mo</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.08)] mb-6">
            <h3 className="font-semibold text-sm text-[#1A1A1A] mb-4">Payment Method</h3>
            <div className="space-y-3">
              {["UPI (GPay / PhonePe / Paytm)", "Credit / Debit Card", "Net Banking"].map((m, i) => (
                <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${i === 0 ? "border-[#00C853] bg-[#F0FFF4]" : "border-[#E0E0E0] hover:border-[#00C853]"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${i === 0 ? "border-[#00C853]" : "border-[#ccc]"}`}>
                    {i === 0 && <div className="w-2 h-2 rounded-full bg-[#00C853]" />}
                  </div>
                  <span className="text-sm text-[#1A1A1A]">{m}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={handlePay}
            disabled={processing}
            className="w-full h-14 rounded-xl text-white text-lg font-semibold bg-[#00C853] hover:bg-[#00A843] shadow-[0_4px_16px_rgba(0,200,83,0.3)]"
          >
            {processing ? "Processing..." : `Pay ₹${total}`}
          </Button>

          <p className="text-xs text-center text-[#999] mt-4">
            By proceeding, you agree to LeadPe's terms. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
