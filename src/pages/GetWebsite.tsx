import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { WEBSITE_PACKAGES } from "@/lib/packages";
import { logEvent, ORDER_EVENTS } from "@/lib/evidence";

const businessTypes = [
  "Doctor / Clinic", "CA / Lawyer / CS", "Coaching Institute", "Contractor / Plumber",
  "Photographer / Videographer", "Architect", "Gym / Fitness Trainer", "Digital Agency",
  "Salon / Parlour", "Restaurant / Cafe", "Individual Consultant", "Other",
];

const STEPS = ["Business", "Package"];

export default function GetWebsite() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  // Form state
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("standard");

  // Auto-filled from profile
  const name = profile?.full_name || "";
  const email = profile?.email || "";

  // Auto-fill editable fields from profile on mount
  useEffect(() => {
    if (profile) {
      if (profile.whatsapp_number) setWhatsapp(profile.whatsapp_number);
      if (profile.city) setCity(profile.city);
      if (profile.business_name) setBusinessName(profile.business_name);
      if (profile.business_type) setBusinessType(profile.business_type);
    }
  }, [profile]);

  const pkg = WEBSITE_PACKAGES.find((p) => p.id === selectedPackage)!;

  const canNext = () => {
    const phone = whatsapp.replace(/\D/g, "");
    return phone.length === 10 && businessName.trim() && businessType.trim() && city.trim();
  };

  const handleSubmit = async () => {
    setLoading(true);
    const phone = whatsapp.replace(/\D/g, "");
    const subdomainName = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const buildRecord = `━━━━━━━━━━━━━━━━━━━━\nLeadPe Build Record\n━━━━━━━━━━━━━━━━━━━━\nCustomer: ${name}\nWhatsApp: ${phone}\nBusiness: ${businessName}\nType: ${businessType}\nCity: ${city}\nPackage: ${pkg.name} — ₹${pkg.price}\nDomain: ${subdomainName}.leadpe.online (Free)\nTotal: ₹${pkg.price}\n━━━━━━━━━━━━━━━━━━━━`;

    // Step 1: Update profile with business details
    if (user) {
      await supabase.from("profiles").update({
        whatsapp_number: phone,
        business_name: businessName,
        business_type: businessType,
        city,
        website_status: "pending",
      } as any).eq("user_id", user.id);
    }

    // Step 2: Insert order
    const { data, error } = await (supabase as any).from("orders").insert({
      customer_name: name,
      customer_whatsapp: phone,
      business_name: businessName,
      business_type: businessType,
      city,
      package_id: selectedPackage,
      package_price: pkg.price,
      domain_option: "subdomain",
      own_domain: `${subdomainName}.leadpe.online`,
      domain_addon_price: 0,
      total_price: pkg.price,
      color_preference: "green",
      status: "pending",
      payment_amount: pkg.price,
      build_record: buildRecord,
    }).select().single();

    if (data) {
      await logEvent(data.order_id, ORDER_EVENTS.ORDER_PLACED, `Package: ${pkg.name}, Total: ₹${pkg.price}`);
      setOrderResult(data);

      // Step 3: Create build_request
      await (supabase as any).from("build_requests").insert({
        business_id: user?.id || null,
        business_name: businessName,
        business_type: businessType,
        city,
        owner_name: name,
        owner_whatsapp: phone,
        package_id: selectedPackage,
        package_price: pkg.price,
        coder_earning: pkg.coderEarning,
        website_purpose: businessType,
        status: "pending",
        deadline: new Date(Date.now() + pkg.deliveryDays * 86400000).toISOString(),
      });

      // Step 4: WhatsApp admin
      const msg = encodeURIComponent(`🆕 NEW ORDER\n━━━━━━━━━━━━\nOrder: ${data.order_id}\nCustomer: ${name}\nWhatsApp: ${phone}\nBusiness: ${businessName}\nType: ${businessType}\nCity: ${city}\nPackage: ${pkg.name}\nPrice: ₹${pkg.price}\n━━━━━━━━━━━━\nLeadPe ⚡`);
      window.open(`https://wa.me/919973383902?text=${msg}`, "_blank", "noopener,noreferrer");
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  };

  // --- SUCCESS / INVOICE PAGE ---
  if (submitted && orderResult) {
    const demoDate = new Date(Date.now() + (pkg?.deliveryDays || 2) * 86400000).toLocaleDateString("en-IN");
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-6xl mb-4 text-center">🎉</motion.div>
          <h1 className="text-2xl font-extrabold text-center mb-2" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Order Placed!</h1>

          <div className="rounded-xl p-4 text-left mb-4 border-2" style={{ backgroundColor: "#F0FFF4", borderColor: "#00C853" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>📋 Order Details</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span style={{ color: "#666" }}>Order ID</span><span className="font-bold" style={{ color: "#1A1A1A" }}>{orderResult.order_id}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Business</span><span className="font-bold" style={{ color: "#1A1A1A" }}>{orderResult.business_name}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Package</span><span className="font-bold" style={{ color: "#1A1A1A" }}>{pkg?.name}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Domain</span><span className="font-bold" style={{ color: "#00C853" }}>{orderResult.own_domain}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Demo by</span><span className="font-bold" style={{ color: "#00C853" }}>{demoDate}</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between" style={{ borderColor: "#00C85330" }}>
                <span className="font-bold" style={{ color: "#1A1A1A" }}>Total</span>
                <span className="font-bold text-lg" style={{ color: "#00C853" }}>₹{pkg.price.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-3 px-3 py-2 rounded-lg text-center" style={{ backgroundColor: "#00C85318" }}>
              <span className="text-xs font-bold" style={{ color: "#00C853" }}>💚 Pay ONLY after you see the demo</span>
            </div>
          </div>

          <div className="rounded-xl p-4 text-left text-xs mb-4" style={{ backgroundColor: "#FAFAFA", color: "#666" }}>
            <p className="font-bold text-sm mb-2" style={{ color: "#1A1A1A" }}>What happens next?</p>
            <div className="space-y-2">
              <p>1. 📋 We build your demo ({pkg?.deliveryDays} days)</p>
              <p>2. 👀 You review on your dashboard</p>
              <p>3. ✅ Love it? Pay ₹{pkg.price.toLocaleString()}</p>
              <p>4. 🚀 Site goes live instantly</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm" style={{ borderColor: "#E0E0E0" }}
              onClick={() => { navigator.clipboard.writeText(orderResult.build_record || ""); toast({ title: "Copied!" }); }}>
              <Copy size={14} className="mr-1" /> Copy Record
            </Button>
            <Button className="flex-1 h-10 rounded-xl text-sm text-white" style={{ backgroundColor: "#25D366" }}
              onClick={() => {
                const msg = encodeURIComponent(`${orderResult.build_record}`);
                window.open(`https://wa.me/91${orderResult.customer_whatsapp}?text=${msg}`, "_blank");
              }}>
              <Share2 size={14} className="mr-1" /> Share
            </Button>
          </div>

          <Button onClick={() => navigate("/client/dashboard", { replace: true })} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
            Continue to Dashboard →
          </Button>
        </motion.div>
      </div>
    );
  }

  // --- 2-STEP WIZARD ---
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm" style={{ borderColor: "#E0F2E9" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><LeadPeLogo theme="light" size="sm" /></Link>
          <Link to="/studio/auth"><Button variant="ghost" className="text-sm" style={{ color: "#666" }}>I'm a builder →</Button></Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-[520px] mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1 ? "text-white" : step === i + 1 ? "text-white shadow-lg" : "text-[#999]"
                }`} style={{ backgroundColor: step >= i + 1 ? "#00C853" : "#E0E0E0" }}>
                  {step > i + 1 ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-sm ${step >= i + 1 ? "text-[#1A1A1A] font-medium" : "text-[#999]"}`}>{label}</span>
                {i < STEPS.length - 1 && <div className="w-8 h-0.5 mx-1" style={{ backgroundColor: step > i + 1 ? "#00C853" : "#E0E0E0" }} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1 — Business Details */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                className="bg-white rounded-2xl p-6 shadow-lg" style={{ border: "1px solid #E0F2E9" }}>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Your Business</h2>
                <p className="text-sm mb-6" style={{ color: "#999" }}>Tell us what you do.</p>
                <div className="space-y-4">
                  {/* Auto-filled read-only fields */}
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Your Name</label>
                    <Input value={name} readOnly className="h-12 rounded-xl cursor-not-allowed" style={{ backgroundColor: "#F5F5F5", border: "1px solid #E0E0E0" }} />
                    <p className="text-[10px] mt-1" style={{ color: "#999" }}>From your Google account.</p>
                  </div>
                  {email && !email.endsWith("@leadpe.com") && (
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Email</label>
                    <Input value={email} readOnly className="h-12 rounded-xl cursor-not-allowed" style={{ backgroundColor: "#F5F5F5", border: "1px solid #E0E0E0" }} />
                  </div>
                  )}

                  {/* Editable fields */}
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>WhatsApp Number *</label>
                    <Input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="h-12 rounded-xl bg-white"
                      style={{ border: "1px solid #E0E0E0" }}
                      placeholder="98765 43210"
                    />
                    <p className="text-[10px] mt-1" style={{ color: "#999" }}>All customer inquiries come here</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Business Name *</label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-12 rounded-xl bg-white"
                      style={{ border: "1px solid #E0E0E0" }}
                      placeholder="Ramesh Coaching Centre"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Business Type *</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full h-12 rounded-xl bg-white text-sm px-3"
                      style={{ border: "1px solid #E0E0E0", color: "#111" }}
                    >
                      <option value="">Select type</option>
                      {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>City *</label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-12 rounded-xl bg-white"
                      style={{ border: "1px solid #E0E0E0" }}
                      placeholder="Vaishali, Bihar"
                    />
                  </div>

                  <Button onClick={() => setStep(2)} disabled={!canNext()} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
                    Next — Choose Package → <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Package Selection */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4" style={{ border: "1px solid #E0F2E9" }}>
                  <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Choose Your Package</h2>
                  <p className="text-sm mb-6" style={{ color: "#999" }}>Free demo before any payment.</p>
                  <div className="space-y-3">
                    {WEBSITE_PACKAGES.filter(p => p.id !== "complex").map((p) => (
                      <div key={p.id} onClick={() => setSelectedPackage(p.id)}
                        className="rounded-xl p-4 cursor-pointer transition-all"
                        style={{
                          border: selectedPackage === p.id ? "2px solid #00C853" : "2px solid #E0E0E0",
                          backgroundColor: selectedPackage === p.id ? "#F0FFF4" : "#fff",
                          borderLeftWidth: 4, borderLeftColor: p.color,
                        }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: p.color }}>{p.badge}</span>
                            <span className="font-bold" style={{ color: "#1A1A1A" }}>{p.name}</span>
                          </div>
                          <span className="font-extrabold" style={{ color: "#1A1A1A" }}>₹{p.price.toLocaleString()}</span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: "#999" }}>Demo in {p.deliveryDays} days</p>
                        <div className="flex flex-wrap gap-1">
                          {p.features.slice(0, 3).map((f) => (
                            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5F5F5", color: "#666" }}>{f}</span>
                          ))}
                        </div>
                        <p className="text-[10px] mt-2" style={{ color: "#999" }}>Best for: {p.bestFor.join(" • ")}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 rounded-xl" style={{ borderColor: "#E0E0E0" }}>
                    <ArrowLeft size={16} className="mr-2" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-14 rounded-xl text-white font-bold text-base" style={{ backgroundColor: "#00C853" }}>
                    {loading ? "Placing Order..." : "Place Free Order →"}
                  </Button>
                </div>
                <p className="text-center text-xs" style={{ color: "#999" }}>No payment now. Free subdomain included.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}