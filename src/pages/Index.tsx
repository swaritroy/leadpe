import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const businessTypes = [
  { icon: "🏫", name: "Coaching Centre" },
  { icon: "🦷", name: "Doctor / Clinic" },
  { icon: "⚖️", name: "Lawyer / CA" },
  { icon: "💇", name: "Salon / Parlour" },
  { icon: "🏋️", name: "Gym / Fitness" },
  { icon: "🔧", name: "Plumber / Electrician" },
  { icon: "📸", name: "Photographer" },
  { icon: "🏠", name: "Real Estate" },
  { icon: "🍽️", name: "Restaurant" },
  { icon: "🎓", name: "Dance / Music Class" },
];

const howItWorks = [
  {
    icon: "🏗️",
    title: "We Build Your Website",
    desc: "Tell us about your business. Our team builds your professional website in 48 hours. Zero effort from your side.",
  },
  {
    icon: "🔍",
    title: "You Appear on Google",
    desc: "Your site gets optimized for local search automatically. When someone searches for your service in your city — you appear first.",
  },
  {
    icon: "📋",
    title: "Customer Finds & Contacts",
    desc: "Interested customers fill a simple form on your site. Takes them 30 seconds.",
  },
  {
    icon: "🔔",
    title: "WhatsApp Ping — Instantly",
    desc: "Their name and number lands on your WhatsApp the moment they submit. You call. You close. Done.",
  },
];

const pricingPlans = [
  {
    name: "Basic",
    price: "₹0",
    period: "/mo",
    desc: "7 days free. No card needed.",
    featured: false,
    features: [
      { text: "Professional website", included: true },
      { text: "Google-ready SEO", included: true },
      { text: "Mobile optimized", included: true },
      { text: "5 leads visible/month", included: true },
      { text: "leadpe.online subdomain", included: true },
      { text: "WhatsApp ping", included: false },
      { text: "Full dashboard", included: false },
    ],
    cta: "Start Free",
    outlined: true,
  },
  {
    name: "Growth",
    price: "₹299",
    period: "/mo",
    desc: "Everything to get customers.",
    featured: true,
    badge: "Most Popular",
    features: [
      { text: "Everything in Basic", included: true },
      { text: "WhatsApp lead ping 🔔", included: true },
      { text: "Unlimited leads", included: true },
      { text: "Full lead dashboard", included: true },
      { text: "Custom domain", included: true },
      { text: "Weekly WhatsApp report", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Free Trial",
    outlined: false,
  },
  {
    name: "Pro",
    price: "₹859",
    period: "/mo",
    desc: "Growth on autopilot.",
    featured: false,
    features: [
      { text: "Everything in Growth", included: true },
      { text: "AI appointment booking", included: true },
      { text: "Google Review Automator", included: true },
      { text: "WhatsApp auto-reply bot", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Monthly strategy call", included: true },
    ],
    cta: "Try Pro",
    outlined: true,
  },
];

const stats = [
  { value: "63M+", label: "Indian MSMEs" },
  { value: "48hrs", label: "Website Live" },
  { value: "90+", label: "Google Score" },
  { value: "₹0", label: "To Start" },
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
  document.getElementById("business-signup")?.scrollIntoView({ behavior: "smooth" });
};

export default function Index() {
  const [bizForm, setBizForm] = useState({
    businessName: "",
    businessType: "",
    city: "",
    whatsappNumber: "",
    ownerName: "",
  });
  const [bizErrors, setBizErrors] = useState<{ [key: string]: string }>({});
  const [trialCode, setTrialCode] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const updateBizForm = (key: keyof typeof bizForm, value: string) => {
    setBizForm((prev) => ({ ...prev, [key]: value }));
    setBizErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateStep = () => {
    const errors: { [key: string]: string } = {};
    if (!bizForm.businessName.trim()) errors.businessName = "This field is required";
    if (!bizForm.businessType.trim()) errors.businessType = "This field is required";
    if (!bizForm.city.trim()) errors.city = "This field is required";
    if (!bizForm.ownerName.trim()) errors.ownerName = "This field is required";

    const digitsOnly = bizForm.whatsappNumber.replace(/\D/g, "");
    if (!digitsOnly) {
      errors.whatsappNumber = "This field is required";
    } else if (!/^\d{10}$/.test(digitsOnly)) {
      errors.whatsappNumber = "Enter valid 10-digit number";
    }

    setBizErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveSignupToSupabase = async (code: string, attempt = 1) => {
    const createdAt = new Date();
    const whatsappDigits = bizForm.whatsappNumber.replace(/\D/g, "");

    try {
      const { error } = await (supabase as any).from("signups").insert({
        owner_name: bizForm.ownerName,
        business_name: bizForm.businessName,
        business_type: bizForm.businessType,
        city: bizForm.city,
        whatsapp_number: whatsappDigits,
        trial_code: code,
        status: "trial",
        created_at: createdAt.toISOString(),
      });

      if (error) throw error;

      const ts = createdAt.toLocaleString();
      const message = [
        "🔔 NEW SIGNUP — LeadPe",
        "━━━━━━━━━━━━━━",
        `Owner: ${bizForm.ownerName}`,
        `Business: ${bizForm.businessName}`,
        `Type: ${bizForm.businessType}`,
        `City: ${bizForm.city}`,
        `WhatsApp: ${whatsappDigits}`,
        `Code: ${code}`,
        `Time: ${ts}`,
        "━━━━━━━━━━━━━━",
        "LeadPe ⚡ leadpe.online",
      ].join("%0A");

      window.open(
        `https://wa.me/919973383902?text=${message}`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      console.error("Supabase signup save failed", err);
      if (attempt < 2) {
        setTimeout(() => {
          void saveSignupToSupabase(code, attempt + 1);
        }, 3000);
      }
    }
  };

  const handleStartTrial = () => {
    const code = "LP-" + Math.floor(100000 + Math.random() * 900000).toString();
    setTrialCode(code);
    void saveSignupToSupabase(code);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080C09" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30" style={{ backgroundColor: "rgba(8, 12, 9, 0.95)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <LeadPeLogo size="sm" />
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Button
              onClick={scrollToSignup}
              className="h-9 px-4 rounded-lg text-sm font-semibold text-black"
              style={{ backgroundColor: "#00E676" }}
            >
              Get Started Free
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
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ backgroundColor: "rgba(0, 230, 118, 0.1)", color: "#00E676" }}>
              🇮🇳 Built for Indian Businesses
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 font-display">
              Get New Customers
              <br />
              on WhatsApp.
              <br />
              Every Day.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              Your professional website live in 48 hours. Every new customer inquiry lands straight on your WhatsApp. No tech knowledge needed.
            </p>
            <Button
              onClick={scrollToSignup}
              className="h-14 px-8 rounded-xl text-lg font-semibold text-black mb-8"
              style={{ backgroundColor: "#00E676" }}
            >
              Start Free — 7 Days <ArrowRight className="ml-2" size={20} />
            </Button>

            {/* Trust Row */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
              {[
                "No credit card required",
                "Website live in 48 hours",
                "Cancel anytime",
                "Hindi & English support",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check size={14} style={{ color: "#00E676" }} />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-t border-border/20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-display">How LeadPe Works</h2>
            <p className="text-muted-foreground">Four simple steps to more customers.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howItWorks.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl border border-border p-6 text-center hover:border-[#00E676]/40 transition-all duration-300"
                style={{ backgroundColor: "#101810" }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Demo */}
      <section className="py-20 border-t border-border/20">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-display">
                Your Phone Rings.
                <br />
                You Get the Customer.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                While you focus on your work — LeadPe quietly finds customers for you. 24 hours a day. 7 days a week.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="animate-float">
                <div
                  className="w-80 rounded-3xl border-2 p-5 shadow-lg"
                  style={{ backgroundColor: "#101810", borderColor: "rgba(0, 230, 118, 0.3)", boxShadow: "0 0 30px rgba(0, 230, 118, 0.15)" }}
                >
                  <div className="font-bold mb-3" style={{ color: "#00E676" }}>
                    🔔 NEW INQUIRY — LeadPe
                  </div>
                  <div className="border-t border-border/50 pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="text-foreground">Priya Sharma</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest:</span>
                      <span className="text-foreground">Class 10 Maths</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Number:</span>
                      <span className="text-foreground" style={{ color: "#00E676" }}>98XXXXXX ← Call Now</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Found via:</span>
                      <span className="text-foreground">Google Search ✅</span>
                    </div>
                    <div className="border-t border-border/50 pt-2 mt-2">
                      <span className="text-xs text-muted-foreground">Today 9:14 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Who */}
      <section className="py-20 border-t border-border/20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-display">
              Every Local Business.
              <br />
              Every City.
            </h2>
            <p className="text-muted-foreground">If you serve local customers — LeadPe is built for you.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {businessTypes.map((bt, i) => (
              <motion.div
                key={bt.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl border border-border p-5 text-center hover:border-[#00E676]/40 hover:-translate-y-1 transition-all duration-300 cursor-default"
                style={{ backgroundColor: "#101810" }}
              >
                <div className="text-3xl mb-2">{bt.icon}</div>
                <div className="text-sm font-semibold text-foreground">{bt.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-border/20">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-extrabold font-display" style={{ color: "#00E676" }}>
                  {s.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-t border-border/20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 font-display">Simple, Honest Pricing</h2>
            <p className="text-muted-foreground">One new customer covers your entire monthly plan.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`relative rounded-2xl border p-6 ${plan.featured ? "border-[#00E676]/50" : "border-border"}`}
                style={{ backgroundColor: "#101810" }}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: "#00E676", color: "#000" }}
                  >
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold font-display">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-4xl font-extrabold font-display">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check size={14} style={{ color: "#00E676" }} />
                      ) : (
                        <X size={14} className="text-muted-foreground/50" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground/50 line-through"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={scrollToSignup}
                  className={`w-full rounded-xl h-11 font-semibold ${plan.outlined ? "border border-border bg-transparent hover:bg-secondary" : "text-black"}`}
                  style={!plan.outlined ? { backgroundColor: "#00E676" } : {}}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup */}
      <section id="business-signup" className="py-20 border-t border-border/20">
        <div className="container px-4 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-extrabold font-display mb-3">Start Your Free Trial</h2>
            <p className="text-muted-foreground">No credit card. No commitment. Cancel anytime.</p>
          </motion.div>

          <div
            className="rounded-2xl border border-border p-6 sm:p-8"
            style={{ backgroundColor: "#101810" }}
          >
            <AnimatePresence mode="wait">
              {!showSuccess ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium block mb-1">Business Name</label>
                    <Input
                      value={bizForm.businessName}
                      onChange={(e) => updateBizForm("businessName", e.target.value)}
                      className={`rounded-xl border ${bizErrors.businessName ? "border-red-500" : "border-border"}`}
                      style={{ backgroundColor: "#080C09" }}
                      placeholder="e.g. Perfect Coaching Centre"
                    />
                    {bizErrors.businessName && <p className="text-xs text-red-500 mt-1">{bizErrors.businessName}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Business Type</label>
                    <select
                      value={bizForm.businessType}
                      onChange={(e) => updateBizForm("businessType", e.target.value)}
                      className={`w-full rounded-xl text-sm px-3 py-2 border outline-none bg-transparent ${bizErrors.businessType ? "border-red-500" : "border-border"}`}
                      style={{ backgroundColor: "#080C09" }}
                    >
                      <option value="">Select type</option>
                      {businessTypes.map((bt) => (
                        <option key={bt.name} value={bt.name}>{bt.name}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    {bizErrors.businessType && <p className="text-xs text-red-500 mt-1">{bizErrors.businessType}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">City</label>
                    <Input
                      value={bizForm.city}
                      onChange={(e) => updateBizForm("city", e.target.value)}
                      className={`rounded-xl border ${bizErrors.city ? "border-red-500" : "border-border"}`}
                      style={{ backgroundColor: "#080C09" }}
                      placeholder="e.g. Mumbai"
                    />
                    {bizErrors.city && <p className="text-xs text-red-500 mt-1">{bizErrors.city}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">WhatsApp Number (10 digits)</label>
                    <Input
                      value={bizForm.whatsappNumber}
                      onChange={(e) => updateBizForm("whatsappNumber", e.target.value)}
                      className={`rounded-xl border ${bizErrors.whatsappNumber ? "border-red-500" : "border-border"}`}
                      style={{ backgroundColor: "#080C09" }}
                      placeholder="e.g. 9876543210"
                    />
                    {bizErrors.whatsappNumber && <p className="text-xs text-red-500 mt-1">{bizErrors.whatsappNumber}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Owner Name</label>
                    <Input
                      value={bizForm.ownerName}
                      onChange={(e) => updateBizForm("ownerName", e.target.value)}
                      className={`rounded-xl border ${bizErrors.ownerName ? "border-red-500" : "border-border"}`}
                      style={{ backgroundColor: "#080C09" }}
                      placeholder="Your full name"
                    />
                    {bizErrors.ownerName && <p className="text-xs text-red-500 mt-1">{bizErrors.ownerName}</p>}
                  </div>

                  <Button
                    onClick={() => { if (validateStep()) handleStartTrial(); }}
                    className="w-full h-12 rounded-xl text-black font-semibold"
                    style={{ backgroundColor: "#00E676" }}
                  >
                    Get My Website Free <ArrowRight size={18} className="ml-2" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Our team will WhatsApp you within 2 hours to get started.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#00E676" }}>
                      <Check className="text-black" size={32} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">You are all set!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your trial code:{" "}
                      <span className="font-mono font-semibold" style={{ color: "#00E676" }}>{trialCode}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We will WhatsApp you within 2 hours to complete your website setup.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-10">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <LeadPeLogo size="sm" />
              <p className="text-sm text-muted-foreground mt-2">
                Naya Customer, Seedha Aapke Phone Pe 🔔
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border/20">
            <div className="text-xs text-muted-foreground">
              © 2026 LeadPe. Made in India 🇮🇳
            </div>
            <Link to="/studio" className="text-xs hover:underline" style={{ color: "#3D5C40" }}>
              Are you a web builder? Join LeadPe Studio →
            </Link>
          </div>
        </div>
      </footer>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
