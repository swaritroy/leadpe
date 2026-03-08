import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { WEBSITE_PACKAGES } from "@/lib/packages";

const purposeOptions = [
  "Business (leads)", "Portfolio", "Restaurant menu",
  "Event / Wedding", "NGO / Trust", "Personal brand",
  "E-commerce", "Other",
];

export default function GetWebsite() {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", whatsapp: "", purpose: "", businessName: "",
    city: "", description: "", referenceSites: "", specialRequirements: "",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const pkg = WEBSITE_PACKAGES.find((p) => p.id === selectedPackage);

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackage(pkgId);
    setShowForm(true);
    setTimeout(() => document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.whatsapp || !form.businessName || !form.city) {
      toast({ title: "Missing fields", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    if (form.whatsapp.replace(/\D/g, "").length !== 10) {
      toast({ title: "Invalid number", description: "Enter 10-digit WhatsApp number", variant: "destructive" });
      return;
    }

    setLoading(true);
    const phone = form.whatsapp.replace(/\D/g, "");

    await (supabase as any).from("build_requests").insert({
      business_name: form.businessName,
      business_type: form.purpose || "other",
      city: form.city,
      owner_name: form.name,
      owner_whatsapp: phone,
      package_id: selectedPackage,
      package_price: pkg?.price || 800,
      coder_earning: pkg?.coderEarning || 640,
      website_purpose: form.purpose,
      reference_sites: form.referenceSites,
      special_requirements: form.specialRequirements || form.description,
      status: "pending",
      deadline: new Date(Date.now() + (pkg?.deliveryDays || 2) * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Notify admin
    const msg = encodeURIComponent(
      `🛒 NEW WEBSITE ORDER\n━━━━━━━━━━━━\nName: ${form.name}\nBusiness: ${form.businessName}\nCity: ${form.city}\nPackage: ${pkg?.name || "Basic"}\nPrice: ₹${pkg?.price || 800}\nWhatsApp: ${phone}\n━━━━━━━━━━━━\nLeadPe ⚡`
    );
    window.open(`https://wa.me/919973383902?text=${msg}`, "_blank", "noopener,noreferrer");

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-10 shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Order Placed!</h1>
          <p className="text-[#666] mb-2">Your website will be ready in <strong>{pkg?.deliveryDays || 2} days</strong>.</p>
          <p className="text-sm text-[#999] mb-6">We'll WhatsApp you with updates.</p>
          <a href={`https://wa.me/919973383902?text=${encodeURIComponent("Hi, I just placed a website order on LeadPe!")}`} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-12 bg-[#00C853] hover:bg-[#00A843] text-white rounded-xl font-semibold">
              <MessageCircle size={18} className="mr-2" /> WhatsApp Support
            </Button>
          </a>
          <Link to="/" className="block mt-4 text-sm text-[#00C853] hover:underline">← Back to Home</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E0F2E9]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><LeadPeLogo theme="light" size="sm" /></Link>
          <Link to="/studio/auth">
            <Button variant="ghost" className="text-sm text-[#666]">I'm a builder →</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-12 text-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#1A1A1A] mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Professional Website
            <br />in 48 Hours. ₹800 Only.
          </h1>
          <p className="text-[#666] max-w-md mx-auto">
            For any purpose. Portfolio, menu, event, NGO, personal brand. Built by AI + humans.
          </p>
        </motion.div>
      </section>

      {/* Packages */}
      <section className="pb-12 px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {WEBSITE_PACKAGES.map((p) => (
            <motion.div key={p.id} whileHover={{ y: -4 }}
              className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all relative ${selectedPackage === p.id ? 'border-[#00C853] shadow-lg' : 'border-[#E0F2E9] hover:border-[#00C853]/40'}`}
              onClick={() => handleSelectPackage(p.id)}>
              {p.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-[#00C853]">Popular</div>
              )}
              <div className="text-xs font-bold px-2 py-1 rounded-full inline-block mb-3 text-white" style={{ backgroundColor: p.color }}>{p.badge}</div>
              <h3 className="font-bold text-[#1A1A1A] mb-1">{p.name}</h3>
              <div className="text-2xl font-extrabold text-[#1A1A1A] mb-1">{p.priceLabel || `₹${p.price.toLocaleString()}`}</div>
              <div className="text-xs text-[#999] mb-3">Ready in {p.deliveryDays} days</div>
              <ul className="space-y-1.5 mb-4">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[#666]"><Check size={12} className="text-[#00C853] mt-0.5 flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button className={`w-full rounded-xl font-semibold ${selectedPackage === p.id ? 'bg-[#00C853] text-white' : 'bg-[#F5FFF7] text-[#00C853] border border-[#00C853]'}`}
                onClick={() => handleSelectPackage(p.id)}>
                {selectedPackage === p.id ? "Selected ✓" : "Order This Package →"}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Order Form */}
      {showForm && (
        <section id="order-form" className="pb-20 px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto bg-white rounded-2xl p-8 shadow-lg border border-[#E0F2E9]">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
              Order {pkg?.name || "Website"}
            </h2>
            <p className="text-sm text-[#999] mb-6">Fill details. We'll start building immediately.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Your Name *</label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)}
                  className="bg-[#FAFAFA] border-[#E0E0E0] h-12 rounded-xl text-[#111]" placeholder="Full name" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] block mb-1">WhatsApp Number *</label>
                <Input type="tel" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="bg-[#FAFAFA] border-[#E0E0E0] h-12 rounded-xl text-[#111]" placeholder="9876543210" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Website Purpose</label>
                <select value={form.purpose} onChange={(e) => update("purpose", e.target.value)}
                  className="w-full h-12 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-[#111] px-3 text-sm">
                  <option value="">Select purpose</option>
                  {purposeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Business / Personal Name *</label>
                <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)}
                  className="bg-[#FAFAFA] border-[#E0E0E0] h-12 rounded-xl text-[#111]" placeholder="Your business or brand name" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] block mb-1">City *</label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)}
                  className="bg-[#FAFAFA] border-[#E0E0E0] h-12 rounded-xl text-[#111]" placeholder="e.g. Patna" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Description</label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                  className="bg-[#FAFAFA] border-[#E0E0E0] rounded-xl text-[#111]" rows={3} placeholder="Tell us what you need" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Reference sites (optional)</label>
                <Input value={form.referenceSites} onChange={(e) => update("referenceSites", e.target.value)}
                  className="bg-[#FAFAFA] border-[#E0E0E0] h-12 rounded-xl text-[#111]" placeholder="Any website you like?" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1A1A1A] block mb-1">Special requirements (optional)</label>
                <Textarea value={form.specialRequirements} onChange={(e) => update("specialRequirements", e.target.value)}
                  className="bg-[#FAFAFA] border-[#E0E0E0] rounded-xl text-[#111]" rows={2} placeholder="Anything specific?" />
              </div>

              <div className="p-4 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#F5FFF7" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Package</span>
                  <span className="font-bold text-[#1A1A1A]">{pkg?.name}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-[#666]">Price</span>
                  <span className="font-bold text-[#00C853]">{pkg?.priceLabel || `₹${pkg?.price.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-[#666]">Delivery</span>
                  <span className="font-bold text-[#1A1A1A]">{pkg?.deliveryDays} days</span>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={loading}
                className="w-full h-14 rounded-xl text-white font-semibold text-lg bg-[#00C853] hover:bg-[#00A843]">
                {loading ? "Placing Order..." : "Place Order →"}
              </Button>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}
