import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Upload, MessageCircle, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { WEBSITE_PACKAGES } from "@/lib/packages";
import { logEvent, ORDER_EVENTS } from "@/lib/evidence";

const businessTypes = [
  "Coaching Centre", "Salon / Parlour", "Doctor / Clinic", "Restaurant / Cafe",
  "Gym / Fitness", "Kirana / Shop", "Event Planner", "Real Estate",
  "NGO / Trust", "Freelancer", "Home Business", "Other",
];

const colorOptions = [
  { id: "green", label: "🟢 Green", value: "#00C853" },
  { id: "blue", label: "🔵 Blue", value: "#2196F3" },
  { id: "purple", label: "🟣 Purple", value: "#7C3AED" },
  { id: "orange", label: "🟠 Orange", value: "#FF6B00" },
  { id: "bw", label: "⚫ B&W", value: "#1A1A1A" },
  { id: "surprise", label: "🌈 Surprise", value: "surprise" },
];

const STEPS = ["Details", "Package", "Assets", "Confirm"];

export default function GetWebsite() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  const [form, setForm] = useState({
    name: "", whatsapp: "", businessName: "", businessType: "",
    city: "", businessSince: "", description: "",
  });
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [domainOption, setDomainOption] = useState("subdomain");
  const [ownDomain, setOwnDomain] = useState("");
  const [customSubdomain, setCustomSubdomain] = useState("");
  const [colorPref, setColorPref] = useState("green");
  const [referenceSite, setReferenceSite] = useState("");
  const [specialReqs, setSpecialReqs] = useState("");

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const pkg = WEBSITE_PACKAGES.find((p) => p.id === selectedPackage)!;
  const domainAddon = domainOption === "buy" ? 999 : 0;
  const totalPrice = (pkg?.price || 800) + domainAddon;

  const canNext = () => {
    if (step === 1) return form.name && form.whatsapp.replace(/\D/g, "").length === 10 && form.businessName && form.city && form.description;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const phone = form.whatsapp.replace(/\D/g, "");

    const subdomainName = customSubdomain.trim() || form.businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const buildRecord = `━━━━━━━━━━━━━━━━━━━━\nLeadPe Build Record\n━━━━━━━━━━━━━━━━━━━━\nCustomer: ${form.name}\nWhatsApp: ${phone} ✅\nBusiness: ${form.businessName}\nType: ${form.businessType}\nCity: ${form.city}\nPackage: ${pkg.name} — ₹${pkg.price}\nDomain: ${domainOption === "subdomain" ? `${subdomainName}.leadpe.online` : domainOption === "own" ? ownDomain : "We'll buy for you"}\nTotal: ₹${totalPrice}\n━━━━━━━━━━━━━━━━━━━━\nWhat you'll receive:\n${pkg.features.map((f) => `✅ ${f}`).join("\n")}\n━━━━━━━━━━━━━━━━━━━━\nTimeline:\nDemo ready: ${new Date(Date.now() + pkg.deliveryDays * 86400000).toLocaleDateString("en-IN")}\nPayment: Only after approval\n━━━━━━━━━━━━━━━━━━━━`;

    const { data, error } = await (supabase as any).from("orders").insert({
      customer_name: form.name,
      customer_whatsapp: phone,
      business_name: form.businessName,
      business_type: form.businessType,
      city: form.city,
      business_since: form.businessSince,
      business_description: form.description,
      package_id: selectedPackage,
      package_price: pkg.price,
      domain_option: domainOption,
      own_domain: domainOption === "subdomain" ? `${subdomainName}.leadpe.online` : domainOption === "own" ? ownDomain : null,
      domain_addon_price: domainAddon,
      total_price: totalPrice,
      color_preference: colorPref,
      reference_site: referenceSite,
      special_requirements: specialReqs,
      status: "pending",
      payment_amount: totalPrice,
      build_record: buildRecord,
    }).select().single();

    if (data) {
      await logEvent(data.order_id, ORDER_EVENTS.ORDER_PLACED, `Package: ${pkg.name}, Total: ₹${totalPrice}`);
      setOrderResult(data);

      // Also create build_request for coder pipeline
      await (supabase as any).from("build_requests").insert({
        business_name: form.businessName,
        business_type: form.businessType,
        city: form.city,
        owner_name: form.name,
        owner_whatsapp: phone,
        package_id: selectedPackage,
        package_price: pkg.price,
        coder_earning: pkg.coderEarning,
        website_purpose: form.businessType,
        special_requirements: specialReqs || form.description,
        reference_sites: referenceSite,
        status: "pending",
        deadline: new Date(Date.now() + pkg.deliveryDays * 86400000).toISOString(),
      });

      // WhatsApp admin
      const msg = encodeURIComponent(`🆕 NEW ORDER\n━━━━━━━━━━━━\nOrder: ${data.order_id}\nCustomer: ${form.name}\nWhatsApp: ${phone}\nBusiness: ${form.businessName}\nType: ${form.businessType}\nCity: ${form.city}\nPackage: ${pkg.name}\nPrice: ₹${totalPrice}\nDomain: ${domainOption}\n━━━━━━━━━━━━\nLeadPe ⚡`);
      window.open(`https://wa.me/919973383902?text=${msg}`, "_blank", "noopener,noreferrer");
    }

    setLoading(false);
    setSubmitted(true);
  };

  // --- SUCCESS PAGE ---
  if (submitted && orderResult) {
    const demoDate = new Date(Date.now() + (pkg?.deliveryDays || 2) * 86400000).toLocaleDateString("en-IN");
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-6xl mb-4">🎉</motion.div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Order Placed!</h1>
          <div className="bg-[#F0FFF4] rounded-xl p-4 text-left mb-4 border border-[#00C853]/30">
            <div className="flex justify-between text-sm mb-1"><span className="text-[#666]">Order ID</span><span className="font-bold text-[#1A1A1A]">{orderResult.order_id}</span></div>
            <div className="flex justify-between text-sm mb-1"><span className="text-[#666]">Business</span><span className="font-bold text-[#1A1A1A]">{orderResult.business_name}</span></div>
            <div className="flex justify-between text-sm mb-1"><span className="text-[#666]">Package</span><span className="font-bold text-[#1A1A1A]">{pkg?.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#666]">Demo expected</span><span className="font-bold text-[#00C853]">{demoDate}</span></div>
          </div>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm border-[#E0E0E0]"
              onClick={() => { navigator.clipboard.writeText(orderResult.build_record || ""); toast({ title: "Copied!" }); }}>
              <Copy size={14} className="mr-1" /> Copy Record
            </Button>
            <Button className="flex-1 h-10 rounded-xl text-sm bg-[#25D366] hover:bg-[#20BD5A] text-white"
              onClick={() => {
                const msg = encodeURIComponent(`${orderResult.build_record}`);
                window.open(`https://wa.me/91${orderResult.customer_whatsapp}?text=${msg}`, "_blank");
              }}>
              <Share2 size={14} className="mr-1" /> Share on WhatsApp
            </Button>
          </div>
          <div className="bg-[#FAFAFA] rounded-xl p-4 text-left text-xs text-[#666] mb-4">
            <p className="font-bold text-[#1A1A1A] mb-2">What happens next?</p>
            <div className="space-y-2">
              <p>1. 📋 We build your demo ({pkg?.deliveryDays} days)</p>
              <p>2. 👀 You review on WhatsApp</p>
              <p>3. ✅ Love it? Pay ₹{totalPrice}</p>
              <p>4. 🚀 Site goes live instantly</p>
            </div>
          </div>
          <Link to="/" className="text-sm text-[#00C853] hover:underline">← Back to Home</Link>
        </motion.div>
      </div>
    );
  }

  // --- WIZARD ---
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E0F2E9] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><LeadPeLogo theme="light" size="sm" /></Link>
          <Link to="/studio/auth"><Button variant="ghost" className="text-sm text-[#666]">I'm a builder →</Button></Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-[600px] mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8 px-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-all ${
                  step > i + 1 ? "bg-[#00C853] text-white" : step === i + 1 ? "bg-[#00C853] text-white shadow-lg shadow-[#00C853]/30" : "bg-[#E0E0E0] text-[#999]"
                }`}>
                  {step > i + 1 ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-[10px] ${step >= i + 1 ? "text-[#1A1A1A] font-medium" : "text-[#999]"}`}>{label}</span>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-[#E0F2E9]">
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Tell us about your business</h2>
                <p className="text-sm text-[#999] mb-6">We'll build exactly what you need.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Your Name *</label>
                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="bg-white border-[#E0E0E0] h-12 rounded-xl" placeholder="Ramesh Gupta" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-1">WhatsApp Number *</label>
                    <Input type="tel" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))} className="bg-white border-[#E0E0E0] h-12 rounded-xl" placeholder="98765 43210" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Business Name *</label>
                    <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="bg-white border-[#E0E0E0] h-12 rounded-xl" placeholder="Ramesh Coaching Centre" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Business Type *</label>
                    <select value={form.businessType} onChange={(e) => update("businessType", e.target.value)} className="w-full h-12 rounded-xl border border-[#E0E0E0] bg-white text-[#111] px-3 text-sm">
                      <option value="">Select type</option>
                      {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-1">City *</label>
                    <Input value={form.city} onChange={(e) => update("city", e.target.value)} className="bg-white border-[#E0E0E0] h-12 rounded-xl" placeholder="Vaishali, Bihar" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Business Since</label>
                    <Input value={form.businessSince} onChange={(e) => update("businessSince", e.target.value)} className="bg-white border-[#E0E0E0] h-12 rounded-xl" placeholder="2018" />
                    <p className="text-[10px] text-[#999] mt-1">Builds trust with customers</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-1">One line about your business *</label>
                    <Input value={form.description} onChange={(e) => update("description", e.target.value)} className="bg-white border-[#E0E0E0] h-12 rounded-xl" placeholder="Best coaching centre for Class 10-12 in Vaishali" />
                  </div>
                  <Button onClick={() => setStep(2)} disabled={!canNext()} className="w-full h-12 rounded-xl bg-[#00C853] hover:bg-[#00A843] text-white font-semibold">
                    Next → <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E0F2E9] mb-4">
                  <h2 className="text-xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Choose Your Package</h2>
                  <p className="text-sm text-[#999] mb-6">All packages include free demo before payment.</p>
                  <div className="space-y-4">
                    {WEBSITE_PACKAGES.map((p) => (
                      <div key={p.id} onClick={() => setSelectedPackage(p.id)}
                        className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${selectedPackage === p.id ? "border-[#00C853] bg-[#F0FFF4]" : "border-[#E0E0E0] hover:border-[#00C853]/40"}`}
                        style={{ borderLeftWidth: "4px", borderLeftColor: p.color }}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white mr-2" style={{ backgroundColor: p.color }}>{p.badge}</span>
                            <span className="font-bold text-[#1A1A1A]">{p.name}</span>
                          </div>
                          <span className="font-extrabold text-[#1A1A1A]">{p.priceLabel || `₹${p.price.toLocaleString()}`}</span>
                        </div>
                        <p className="text-xs text-[#999] mb-2">Demo in {p.deliveryDays} days</p>
                        {p.id === "premium" && <p className="text-xs text-[#7C3AED] font-medium mb-2">₹1,500 now + ₹1,500 on delivery</p>}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {p.features.slice(0, 4).map((f) => <span key={f} className="text-[10px] bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded-full">{f}</span>)}
                          {p.features.length > 4 && <span className="text-[10px] text-[#999]">+{p.features.length - 4} more</span>}
                        </div>
                        <p className="text-[10px] text-[#999]">Best for: {p.bestFor.join(" • ")}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Domain */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E0F2E9] mb-4">
                  <h3 className="font-bold text-[#1A1A1A] mb-3">Add Custom Domain?</h3>
                  <div className="space-y-3">
                    {[
                      { id: "subdomain", label: "Use free subdomain", desc: "Choose your own name", price: "FREE" },
                      { id: "own", label: "I have my own domain", desc: "Point your domain to us", price: "FREE" },
                      { id: "buy", label: "Buy domain for me", desc: "We buy and manage it", price: "+₹999/year" },
                    ].map((d) => (
                      <label key={d.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${domainOption === d.id ? "border-[#00C853] bg-[#F0FFF4]" : "border-[#E0E0E0]"}`}>
                        <input type="radio" name="domain" checked={domainOption === d.id} onChange={() => setDomainOption(d.id)} className="mt-1 accent-[#00C853]" />
                        <div className="flex-1">
                          <div className="flex justify-between"><span className="text-sm font-medium text-[#1A1A1A]">{d.label}</span><span className="text-xs font-bold text-[#00C853]">{d.price}</span></div>
                          <p className="text-xs text-[#999]">{d.desc}</p>
                        </div>
                      </label>
                    ))}
                    {domainOption === "subdomain" && (
                      <div className="mt-2">
                        <label className="text-xs font-medium text-[#1A1A1A] block mb-1">Your subdomain name</label>
                        <div className="flex items-center gap-0">
                          <Input 
                            value={customSubdomain} 
                            onChange={(e) => setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} 
                            className="bg-white border-[#E0E0E0] h-10 rounded-l-xl rounded-r-none border-r-0 flex-1" 
                            placeholder={form.businessName.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbusiness"} 
                          />
                          <span className="h-10 px-3 flex items-center bg-[#F5F5F5] border border-[#E0E0E0] rounded-r-xl text-xs text-[#666] whitespace-nowrap">.leadpe.online</span>
                        </div>
                        <p className="text-[10px] text-[#999] mt-1">Preview: <span className="font-medium text-[#00C853]">{(customSubdomain || form.businessName.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbusiness")}.leadpe.online</span></p>
                      </div>
                    )}
                    {domainOption === "own" && (
                      <Input value={ownDomain} onChange={(e) => setOwnDomain(e.target.value)} className="bg-white border-[#E0E0E0] h-10 rounded-xl mt-2" placeholder="Enter your domain" />
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 rounded-xl border-[#E0E0E0]">
                    <ArrowLeft size={16} className="mr-2" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl bg-[#00C853] hover:bg-[#00A843] text-white font-semibold">
                    Next → <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-[#E0F2E9]">
                <h2 className="text-xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Help us build better</h2>
                <p className="text-sm text-[#999] mb-6">More info = better website. Everything optional — AI fills gaps.</p>
                <div className="space-y-5">
                  {/* Logo */}
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Logo</label>
                    <div className="border-2 border-dashed border-[#E0E0E0] rounded-xl p-6 text-center">
                      <Upload size={24} className="mx-auto text-[#999] mb-2" />
                      <p className="text-sm text-[#666]">Upload your logo</p>
                      <p className="text-xs text-[#999]">PNG, JPG — any size</p>
                    </div>
                    <p className="text-xs text-[#00C853] mt-1">No logo? We'll create a text logo for free ✅</p>
                  </div>

                  {/* Photos */}
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Photos</label>
                    <div className="border-2 border-dashed border-[#E0E0E0] rounded-xl p-6 text-center">
                      <Upload size={24} className="mx-auto text-[#999] mb-2" />
                      <p className="text-sm text-[#666]">Upload business photos</p>
                      <p className="text-xs text-[#999]">Products, team, workspace</p>
                    </div>
                    <p className="text-xs text-[#00C853] mt-1">No photos? We use free professional photos ✅</p>
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Preferred colors?</label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((c) => (
                        <button key={c.id} onClick={() => setColorPref(c.id)}
                          className={`px-3 py-2 rounded-full text-sm transition-all ${colorPref === c.id ? "bg-[#1A1A1A] text-white" : "bg-[#F5F5F5] text-[#666] hover:bg-[#E0E0E0]"}`}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Reference site (optional)</label>
                    <Input value={referenceSite} onChange={(e) => setReferenceSite(e.target.value)} className="bg-white border-[#E0E0E0] h-12 rounded-xl" placeholder="https://example.com" />
                  </div>

                  {/* Special requirements */}
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Special requirements (optional)</label>
                    <Textarea value={specialReqs} onChange={(e) => setSpecialReqs(e.target.value)} className="bg-white border-[#E0E0E0] rounded-xl" rows={3} placeholder="e.g. Add Hindi language, Include fee structure..." />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12 rounded-xl border-[#E0E0E0]">
                      <ArrowLeft size={16} className="mr-2" /> Back
                    </Button>
                    <Button onClick={() => setStep(4)} className="flex-1 h-12 rounded-xl bg-[#00C853] hover:bg-[#00A843] text-white font-semibold">
                      Next → <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E0F2E9] mb-4">
                  <h2 className="text-xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Review Your Order 📋</h2>

                  {/* Summary */}
                  <div className="rounded-xl p-4 mb-4 border-2 border-[#00C853]" style={{ backgroundColor: "#F0FFF4" }}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[#666]">Business</span><span className="font-bold text-[#1A1A1A]">{form.businessName}</span></div>
                      <div className="flex justify-between"><span className="text-[#666]">Type</span><span className="text-[#1A1A1A]">{form.businessType}</span></div>
                      <div className="flex justify-between"><span className="text-[#666]">City</span><span className="text-[#1A1A1A]">{form.city}</span></div>
                      <div className="flex justify-between"><span className="text-[#666]">Package</span><span className="font-bold text-[#1A1A1A]">{pkg?.name}</span></div>
                      <div className="flex justify-between"><span className="text-[#666]">Domain</span><span className="text-[#1A1A1A]">{domainOption === "subdomain" ? "Free subdomain" : domainOption === "own" ? ownDomain : "Buy for me (+₹999)"}</span></div>
                      <div className="border-t border-[#00C853]/20 pt-2 mt-2">
                        <div className="flex justify-between"><span className="text-[#666]">Package</span><span className="text-[#1A1A1A]">₹{pkg?.price.toLocaleString()}</span></div>
                        {domainAddon > 0 && <div className="flex justify-between"><span className="text-[#666]">Domain</span><span className="text-[#1A1A1A]">₹{domainAddon}</span></div>}
                        <div className="flex justify-between font-bold text-base mt-1"><span className="text-[#1A1A1A]">Total</span><span className="text-[#00C853]">₹{totalPrice.toLocaleString()}</span></div>
                      </div>
                    </div>
                    <div className="mt-3 px-3 py-2 rounded-lg bg-[#00C853]/10 text-center">
                      <span className="text-xs font-bold text-[#00C853]">💚 Pay ONLY if you love it</span>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="bg-[#FAFAFA] rounded-xl p-4 mb-4">
                    <p className="font-bold text-sm text-[#1A1A1A] mb-2">How it works</p>
                    <div className="space-y-2 text-xs text-[#666]">
                      <p>1. 📋 We build your demo ({pkg?.deliveryDays} days)</p>
                      <p>2. 👀 You review on WhatsApp</p>
                      <p>3. ✅ Love it? Pay ₹{totalPrice.toLocaleString()}</p>
                      <p>4. 🚀 Site goes live instantly</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-4">
                    <p className="font-bold text-sm text-[#1A1A1A] mb-2">What you get</p>
                    <div className="grid grid-cols-2 gap-1">
                      {pkg?.features.map((f) => (
                        <div key={f} className="flex items-center gap-1 text-xs text-[#666]"><Check size={12} className="text-[#00C853] flex-shrink-0" /> {f}</div>
                      ))}
                    </div>
                  </div>

                  {/* Zero risk */}
                  <div className="bg-[#F0FFF4] rounded-xl p-3 text-center mb-4 border border-[#00C853]/20">
                    <p className="text-sm text-[#1A1A1A]">💚 Zero risk. See before you pay.</p>
                    <p className="text-xs text-[#666]">If you don't like it, you owe us nothing.</p>
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <Button onClick={() => setStep(3)} variant="outline" className="flex-1 h-12 rounded-xl border-[#E0E0E0]">
                    <ArrowLeft size={16} className="mr-2" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-14 rounded-xl bg-[#00C853] hover:bg-[#00A843] text-white font-bold text-base">
                    {loading ? "Placing Order..." : "Place Free Order →"}
                  </Button>
                </div>
                <p className="text-center text-xs text-[#999]">No payment now</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
