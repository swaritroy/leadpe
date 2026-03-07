import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import LeadPeLogo from "@/components/LeadPeLogo";

const aiTools = ["ChatGPT", "Lovable", "Cursor", "GitHub Copilot", "Other"];
const capacityOptions = ["1-2", "3-5", "6-10", "10+"];

const howYouEarn = [
  {
    icon: "🤖",
    title: "Build with AI",
    desc: "Use ChatGPT to write a prompt. Paste into Lovable. Professional website ready in minutes. Zero coding needed.",
  },
  {
    icon: "📤",
    title: "Import to LeadPe",
    desc: "Export your site to GitHub. Paste the link in LeadPe Studio. Our system checks and fixes quality automatically.",
  },
  {
    icon: "🚀",
    title: "We Deploy Everything",
    desc: "One click. Site goes live on Vercel automatically. Business gets their subdomain. You do nothing technical.",
  },
  {
    icon: "💰",
    title: "Earn Every Month",
    desc: "Earn 80% of building fee upfront. Plus ₹30/mo passive for every active client. Forever.",
  },
];

const youDoItems = [
  "Build site with AI tools",
  "Export to GitHub",
  "Paste URL to LeadPe",
  "Fill business details",
  "Click deploy",
  "Collect your payment",
];

const weHandleItems = [
  "Vercel hosting",
  "SEO optimization",
  "WhatsApp lead system",
  "Client billing ₹299/mo",
  "Customer support",
  "Site maintenance",
  "Weekly reports",
  "Churn management",
];

const autoFixedItems = [
  "Missing image descriptions",
  "Unoptimized images",
  "Missing SEO tags",
  "Missing WhatsApp button",
  "Missing contact form tags",
];

const hardBlockItems = [
  "No lead capture form",
  "Score below 75",
  "Site completely offline",
];

const earningsTiers = [
  {
    name: "Starter",
    clients: "1-5 clients",
    buildingFee: "80% yours",
    passive: "₹150/mo max",
  },
  {
    name: "Builder",
    clients: "6-15 clients",
    buildingFee: "80% yours",
    passive: "₹150-450/mo",
  },
  {
    name: "Pro",
    clients: "16-30 clients",
    buildingFee: "80% yours",
    passive: "₹480-900/mo",
  },
  {
    name: "Elite",
    clients: "30+ clients",
    buildingFee: "80% yours",
    passive: "₹900+/mo",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const scrollToSignup = () => {
  document.getElementById("studio-signup")?.scrollIntoView({ behavior: "smooth" });
};

export default function Studio() {
  const [clientCount, setClientCount] = useState(5);
  const [form, setForm] = useState({
    fullName: "",
    whatsappNumber: "",
    email: "",
    tools: [] as string[],
    sampleUrl: "",
    capacity: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const monthlyPassive = clientCount * 30;
  const annualPassive = monthlyPassive * 12;

  const updateForm = (key: keyof typeof form, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleTool = (tool: string) => {
    const current = form.tools;
    const updated = current.includes(tool)
      ? current.filter((t) => t !== tool)
      : [...current, tool];
    updateForm("tools", updated);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.fullName.trim()) newErrors.fullName = "Required";
    if (!form.email.trim()) {
      newErrors.email = "Required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email";
    }
    
    const digitsOnly = form.whatsappNumber.replace(/\D/g, "");
    if (!digitsOnly) {
      newErrors.whatsappNumber = "Required";
    } else if (!/^\d{10}$/.test(digitsOnly)) {
      newErrors.whatsappNumber = "10 digits required";
    }
    
    if (form.tools.length === 0) newErrors.tools = "Select at least one tool";
    if (!form.capacity) newErrors.capacity = "Select capacity";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveSignup = async (attempt = 1) => {
    const whatsappDigits = form.whatsappNumber.replace(/\D/g, "");

    try {
      const { error } = await (supabase as any).from("studio_applications").insert({
        name: form.fullName,
        whatsapp: whatsappDigits,
        email: form.email,
        tools: form.tools.join(", "),
        sample_url: form.sampleUrl,
        capacity: form.capacity,
        status: "active",
        created_at: new Date().toISOString(),
      } as any);

      if (error) throw error;

      const message = [
        "⚡ NEW STUDIO SIGNUP",
        "━━━━━━━━━━━━━",
        `Name: ${form.fullName}`,
        `WhatsApp: ${whatsappDigits}`,
        `Tools: ${form.tools.join(", ")}`,
        `Capacity: ${form.capacity}`,
        "━━━━━━━━━━━━━",
        "LeadPe Studio ⚡",
      ].join("%0A");

      window.open(
        `https://wa.me/919973383902?text=${message}`,
        "_blank",
        "noopener,noreferrer"
      );

      setShowSuccess(true);
    } catch (err) {
      console.error("Save failed:", err);
      if (attempt < 2) {
        setTimeout(() => saveSignup(attempt + 1), 3000);
      }
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      void saveSignup();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LeadPeLogo theme="light" size="sm" />
            <span className="font-bold text-xl" style={{ color: "#00C853" }}>Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-you-earn" className="hidden md:block text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors">
              How it Works
            </a>
            <Button
              onClick={scrollToSignup}
              className="h-9 px-4 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: "#00C853" }}
            >
              Start Earning <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center pt-16 pb-20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ backgroundColor: "rgba(0, 200, 83, 0.1)", color: "#00C853" }}>
              ⚡ For AI Builders & Vibe Coders
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 font-display" style={{ color: "#1A1A1A" }}>
              Build Websites with AI.
              <br />
              Sell on LeadPe.
              <br />
              Earn Every Month.
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: "#666666" }}>
              No coding degree needed. Use ChatGPT + Lovable to build. LeadPe connects you to businesses and handles everything else. You just build and earn.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="px-4 py-2 rounded-full text-sm font-semibold border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
                ₹0 to join
              </span>
              <span className="px-4 py-2 rounded-full text-sm font-semibold border" style={{ backgroundColor: "rgba(0, 200, 83, 0.1)", borderColor: "#00C853", color: "#00C853" }}>
                Earn ₹30/mo per client
              </span>
            </div>

            <Button
              onClick={scrollToSignup}
              className="h-14 px-8 rounded-xl text-lg font-semibold text-white mb-8"
              style={{ backgroundColor: "#00C853" }}
            >
              Start Earning — Join Free <ArrowRight className="ml-2" size={20} />
            </Button>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm" style={{ color: "#666666" }}>
              {[
                "Free to join",
                "No approval needed",
                "Build with AI tools",
                "Earn passively",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check size={14} style={{ color: "#00C853" }} />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How You Earn */}
      <section id="how-you-earn" className="py-20 border-t border-border/20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-display">How You Earn on LeadPe</h2>
            <p className="text-muted-foreground">Four simple steps to monthly passive income.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howYouEarn.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl border border-[#E0F2E9] p-6 text-center hover:border-[#00E676]/40 transition-all duration-300"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-20 border-t border-border/20">
        <div className="container px-4 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-display">Calculate Your Income</h2>
            <p className="text-muted-foreground">See your potential monthly passive earnings.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-[#E0F2E9] p-8"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <div className="mb-8">
              <label className="text-sm font-medium mb-3 block">Active Clients: <span className="font-bold" style={{ color: "#00E676" }}>{clientCount}</span></label>
              <input
                type="range"
                min={1}
                max={50}
                value={clientCount}
                onChange={(e) => setClientCount(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ backgroundColor: "#1a1f1a", accentColor: "#00E676" }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>1</span>
                <span>50</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center p-4 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="text-3xl font-extrabold font-display" style={{ color: "#00E676" }}>₹{monthlyPassive.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Monthly Passive</div>
              </div>
              <div className="text-center p-4 rounded-xl border border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="text-3xl font-extrabold font-display" style={{ color: "#00E676" }}>₹{annualPassive.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Annual Passive</div>
              </div>
            </div>

            <div className="rounded-xl p-4 border" style={{ backgroundColor: "rgba(0, 230, 118, 0.05)", borderColor: "rgba(0, 230, 118, 0.3)" }}>
              <p className="text-sm text-center">
                Example: <strong>{clientCount} active clients</strong> = <strong style={{ color: "#00E676" }}>₹{monthlyPassive}/month</strong> doing nothing. While you sleep. 💰
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Handle */}
      <section className="py-20 border-t border-border/20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-display">
              You Build.
              <br />
              We Handle Everything Else.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-[#E0F2E9] p-6"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <h3 className="font-bold text-lg mb-4" style={{ color: "#00E676" }}>YOU DO:</h3>
              <ul className="space-y-3">
                {youDoItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check size={14} style={{ color: "#00C853" }} />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-[#E0F2E9] p-6"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <h3 className="font-bold text-lg mb-4" style={{ color: "#00E676" }}>WE HANDLE:</h3>
              <ul className="space-y-3">
                {weHandleItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check size={14} style={{ color: "#00C853" }} />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quality System */}
      <section className="py-20 border-t border-border/20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12 max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-display">
              The LeadPe
              <br />
              Quality System
            </h2>
            <p className="text-muted-foreground">
              We automatically fix most issues before deployment. You rarely need to do anything extra.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-[#E0F2E9] p-6"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <h3 className="font-bold mb-4">🔧 We Fix Automatically:</h3>
              <ul className="space-y-2">
                {autoFixedItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} style={{ color: "#00C853" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-[#E0F2E9] p-6"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <h3 className="font-bold mb-4">🚫 Only Blocked If:</h3>
              <ul className="space-y-2">
                {hardBlockItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X size={14} className="text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <span className="inline-block px-4 py-2 rounded-full text-sm" style={{ backgroundColor: "rgba(0, 200, 83, 0.1)", color: "#00C853" }}>
              90% of sites pass automatically. We silently fix the rest.
            </span>
          </motion.div>
        </div>
      </section>

      {/* Earnings Tiers */}
      <section className="py-20 border-t border-border/20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold font-display mb-3" style={{ color: "#1A1A1A" }}>Earn More as You Grow</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {earningsTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl border border-[#E0F2E9] p-5 text-center"
                style={{ backgroundColor: "#FFFFFF", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
              >
                <h3 className="font-bold text-lg mb-2" style={{ color: "#00C853" }}>{tier.name}</h3>
                <p className="text-sm mb-3" style={{ color: "#666666" }}>{tier.clients}</p>
                <div className="space-y-1 text-sm">
                  <p>Building fee: <span style={{ color: "#1A1A1A" }}>{tier.buildingFee}</span></p>
                  <p>Passive: <span style={{ color: "#1A1A1A" }}>{tier.passive}</span></p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8 max-w-md mx-auto">
            Every active client pays you ₹30/mo forever. When they quit — it stops. So keep them happy.
          </p>
        </div>
      </section>

      {/* Signup Form */}
      <section id="studio-signup" className="py-20 border-t border-border/20">
        <div className="container px-4 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-extrabold font-display mb-3" style={{ color: "#1A1A1A" }}>Join LeadPe Studio</h2>
            <p style={{ color: "#666666" }}>Free. Instant. No approval needed.</p>
          </motion.div>

          <div className="rounded-2xl border border-[#E0F2E9] p-6 sm:p-8" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <AnimatePresence mode="wait">
              {!showSuccess ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium block mb-1">Full Name</label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => updateForm("fullName", e.target.value)}
                      className={`rounded-xl border ${errors.fullName ? "border-red-500" : "border-[#E0E0E0]"}`}
                      style={{ backgroundColor: "#FAFAFA" }}
                      placeholder="Your name"
                    />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">WhatsApp Number</label>
                    <Input
                      value={form.whatsappNumber}
                      onChange={(e) => updateForm("whatsappNumber", e.target.value)}
                      className={`rounded-xl border ${errors.whatsappNumber ? "border-red-500" : "border-[#E0E0E0]"}`}
                      style={{ backgroundColor: "#FAFAFA" }}
                      placeholder="10 digit number"
                    />
                    {errors.whatsappNumber && <p className="text-xs text-red-500 mt-1">{errors.whatsappNumber}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Email Address</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      className={`rounded-xl border ${errors.email ? "border-red-500" : "border-[#E0E0E0]"}`}
                      style={{ backgroundColor: "#FAFAFA" }}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Which AI tools do you use?</label>
                    <div className="flex flex-wrap gap-2">
                      {aiTools.map((tool) => (
                        <button
                          key={tool}
                          onClick={() => toggleTool(tool)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                            form.tools.includes(tool)
                              ? "text-black"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          style={form.tools.includes(tool) ? { backgroundColor: "#00E676", borderColor: "#00E676" } : { borderColor: "#333" }}
                        >
                          {tool}
                        </button>
                      ))}
                    </div>
                    {errors.tools && <p className="text-xs text-red-500 mt-1">{errors.tools}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Sample site URL (optional)</label>
                    <Input
                      value={form.sampleUrl}
                      onChange={(e) => updateForm("sampleUrl", e.target.value)}
                      className="rounded-xl border border-[#E0E0E0]"
                      style={{ backgroundColor: "#FAFAFA" }}
                      placeholder="Share a site you have built before"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">How many sites per month?</label>
                    <select
                      value={form.capacity}
                      onChange={(e) => updateForm("capacity", e.target.value)}
                      className={`w-full rounded-xl text-sm px-3 py-2 border outline-none bg-transparent ${errors.capacity ? "border-red-500" : "border-[#E0E0E0]"}`}
                      style={{ backgroundColor: "#FAFAFA" }}
                    >
                      <option value="">Select</option>
                      {capacityOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full h-12 rounded-xl text-black font-semibold"
                    style={{ backgroundColor: "#00E676" }}
                  >
                    Join LeadPe Studio — Free <ArrowRight size={18} className="ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#00E676" }}>
                      <Check className="text-black" size={32} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Welcome to LeadPe Studio! 🎉</h3>
                    <p className="text-sm text-muted-foreground">
                      You can now start building and earning.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                      We will WhatsApp you next steps within 2 hours.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E0F2E9] py-10" style={{ backgroundColor: "#F0FFF4" }}>
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <LeadPeLogo theme="light" size="sm" />
                <span className="font-bold text-xl" style={{ color: "#00C853" }}>Studio</span>
              </div>
              <p className="text-sm mt-2" style={{ color: "#666666" }}>Build. Deploy. Earn.</p>
            </div>
            <div className="flex gap-6 text-sm" style={{ color: "#666666" }}>
              <a href="#how-you-earn" className="hover:text-[#1A1A1A] transition-colors">How it Works</a>
              <a href="#studio-signup" className="hover:text-[#1A1A1A] transition-colors">Commission Structure</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E0F2E9]">
            <div className="text-xs" style={{ color: "#666666" }}>
              © 2026 LeadPe Studio
            </div>
            <Link to="/" className="text-xs hover:underline" style={{ color: "#00C853" }}>
              For Businesses → leadpe.online
            </Link>
          </div>
          <div className="text-center mt-4">
            <a href="mailto:hello@leadpe.online" className="text-xs hover:text-[#1A1A1A] transition-colors" style={{ color: "#666666" }}>
              Support: hello@leadpe.online
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
