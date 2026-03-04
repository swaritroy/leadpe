import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const businessTypes = [
  { icon: "🏫", name: "Coaching Centre", desc: "Naye students" },
  { icon: "🦷", name: "Doctor / Dentist", desc: "Online appointments" },
  { icon: "⚖️", name: "Lawyer / CA", desc: "Client inquiries" },
  { icon: "💇", name: "Salon / Parlour", desc: "Booking fill karo" },
  { icon: "🏋️", name: "Gym / Fitness", desc: "Members badhao" },
  { icon: "🔧", name: "Plumber / AC Repair", desc: "Emergency calls" },
  { icon: "📸", name: "Photographer", desc: "Bookings chahiye" },
  { icon: "🏠", name: "Real Estate", desc: "Free leads" },
  { icon: "🍽️", name: "Restaurant", desc: "Table bookings" },
  { icon: "🎓", name: "Dance / Music Class", desc: "Demo bookings" },
];

const stats = [
  { value: "63M+", label: "Indian MSMEs Waiting" },
  { value: "48hrs", label: "Site Live Hone Mein" },
  { value: "90+", label: "Lighthouse Score Guaranteed" },
  { value: "₹0", label: "7 Din Trial Cost" },
];

const pricingPlans = [
  {
    name: "Basic",
    price: "₹0",
    period: "/mo",
    desc: "7 days free. No card needed.",
    featured: false,
    features: [
      { text: "Professional website live", included: true },
      { text: "Google-ready SEO", included: true },
      { text: "Mobile optimized", included: true },
      { text: "5 leads per month visible", included: true },
      { text: "Subdomain (name.leadpe.online)", included: true },
      { text: "WhatsApp ping", included: false },
      { text: "Full lead dashboard", included: false },
    ],
    cta: "Start Free",
  },
  {
    name: "Growth",
    price: "₹299",
    period: "/mo",
    desc: "Everything to get customers calling.",
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
    cta: "Get Started — 7 Days Free",
  },
  {
    name: "Pro",
    price: "₹499",
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
      { text: "White-glove onboarding", included: true },
    ],
    cta: "Try Pro",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const Index = () => {
  const [whatsapp, setWhatsapp] = useState("");
  const [bizStep, setBizStep] = useState(1);
  const [bizForm, setBizForm] = useState({
    businessName: "",
    businessType: "",
    city: "",
    whatsappNumber: "",
    ownerName: "",
    description: "",
    workingHours: "",
    startingPrice: "",
    specialOffer: "",
  });
  const [bizErrors, setBizErrors] = useState<{ [key: string]: string }>({});
  const [trialCode, setTrialCode] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const updateBizForm = (key: keyof typeof bizForm, value: string) => {
    setBizForm(prev => ({ ...prev, [key]: value }));
    setBizErrors(prev => ({ ...prev, [key]: "" }));
  };

  const validateStep1 = () => {
    const errors: { [key: string]: string } = {};
    if (!bizForm.businessName.trim()) errors.businessName = "Yeh field zaroori hai";
    if (!bizForm.businessType.trim()) errors.businessType = "Yeh field zaroori hai";
    if (!bizForm.city.trim()) errors.city = "Yeh field zaroori hai";
    if (!bizForm.ownerName.trim()) errors.ownerName = "Yeh field zaroori hai";

    const digitsOnly = bizForm.whatsappNumber.replace(/\D/g, "");
    if (!digitsOnly) {
      errors.whatsappNumber = "Yeh field zaroori hai";
    } else if (!/^\d{10}$/.test(digitsOnly)) {
      errors.whatsappNumber = "Valid WhatsApp number daalo";
    }

    setBizErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: { [key: string]: string } = {};
    if (!bizForm.description.trim()) {
      errors.description = "This field is required";
    }
    setBizErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const saveSignupToSupabase = async (code: string, attempt = 1) => {
    const createdAt = new Date();
    const whatsappDigits = bizForm.whatsappNumber.replace(/\D/g, "");

    try {
      const { error } = await supabase.from("signups").insert({
        owner_name: bizForm.ownerName,
        business_name: bizForm.businessName,
        business_type: bizForm.businessType,
        city: bizForm.city,
        whatsapp_number: whatsappDigits,
        description: bizForm.description,
        working_hours: bizForm.workingHours,
        price: bizForm.startingPrice,
        special_offer: bizForm.specialOffer,
        trial_code: code,
        status: "trial",
        created_at: createdAt.toISOString(),
      } as any);

      if (error) {
        throw error;
      }

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
      // Log only, never show technical errors
      // eslint-disable-next-line no-console
      console.error("Supabase signup save failed", err);
      if (attempt < 2) {
        setTimeout(() => {
          void saveSignupToSupabase(code, attempt + 1);
        }, 3000);
      }
    }
  };

  const handleStartTrial = () => {
    const code =
      trialCode || "LP-" + Math.floor(100000 + Math.random() * 900000).toString();
    setTrialCode(code);
    void saveSignupToSupabase(code);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <div className="mesh-bg" />

      {/* Hero — Role Selection */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4 font-display">
              Who are you today?
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              LeadPe works for two kinds of people. Pick your path.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            {/* Business Card */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-8 hover:border-primary/40 hover:shadow-glow transition-all duration-300">
              <div className="text-4xl mb-4">🏪</div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">For Business Owners</span>
              <h2 className="text-2xl font-extrabold mt-2 mb-3 font-display">I Want More Customers</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Professional website 48 ghante mein live. Har naya customer seedha aapke WhatsApp pe.
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                {["No tech knowledge needed", "WhatsApp lead ping on every inquiry", "Google-ready from day one", "7 days completely free"].map(p => (
                  <li key={p} className="flex items-center gap-2 text-foreground"><Check size={14} className="text-primary shrink-0" />{p}</li>
                ))}
              </ul>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12 text-base font-semibold" asChild>
                <a href="#business-signup">Start Free Trial <ArrowRight size={16} className="ml-2" /></a>
              </Button>
            </motion.div>

            {/* Developer Card */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-8 hover:border-primary/40 hover:shadow-glow transition-all duration-300">
              <div className="text-4xl mb-4">⚡</div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">For Builders</span>
              <h2 className="text-2xl font-extrabold mt-2 mb-3 font-display">I Want to Build & Earn</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Use ChatGPT + Lovable to build sites. Deploy on LeadPe. Earn monthly recurring commission.
              </p>
              <ul className="space-y-2 mb-6 text-sm">
                {["Zero coding degree needed", "Automated quality vetting agent", "Earn commission every month", "We handle hosting and support"].map(p => (
                  <li key={p} className="flex items-center gap-2 text-foreground"><Check size={14} className="text-primary shrink-0" />{p}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full rounded-xl h-12 text-base font-semibold border-primary/30 hover:bg-primary/10" asChild>
                <a href="#dev-signup">Join LeadPe Studio <ArrowRight size={16} className="ml-2" /></a>
              </Button>
            </motion.div>
          </div>

          {/* Trust Row */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {["No credit card required", "Setup in 48 hours", "Hindi and English support", "Cancel anytime"].map(t => (
              <span key={t} className="flex items-center gap-1.5"><Check size={14} className="text-primary" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-t border-border/30">
        <div className="container">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-extrabold text-center mb-16 font-display">
            How It Works
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            <div className="space-y-8">
              {[
                { step: "1", title: "Your site goes live on Google", desc: "Every local search shows your business first." },
                { step: "2", title: "Customer finds you and fills form", desc: "Name, number, what they need — captured automatically." },
                { step: "3", title: "Your WhatsApp pings instantly", desc: "Their number on your phone. You call. You close." },
                { step: "4", title: "Every Monday report arrives", desc: "Visitors, leads, growth — plain English on WhatsApp." },
              ].map((item, i) => (
                <motion.div key={item.step} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* WhatsApp Mockup */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex justify-center">
              <div className="relative animate-float">
                <div className="w-72 rounded-3xl border-2 border-border bg-card p-4 shadow-glow-lg">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Phone size={14} className="text-primary" />
                    </div>
                    <span className="font-bold text-sm">LeadPe Alerts</span>
                    <div className="ml-auto relative">
                      <div className="w-5 h-5 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-white animate-pulse">1</div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-secondary p-4 space-y-2 text-sm">
                    <div className="font-bold text-primary">🔔 NEW INQUIRY!</div>
                    <div className="space-y-1 text-foreground">
                      <div><span className="text-muted-foreground">Name:</span> Priya Sharma</div>
                      <div><span className="text-muted-foreground">Interest:</span> Class 10 Maths</div>
                      <div><span className="text-muted-foreground">Number:</span> 98XXXXXX ← Call Now</div>
                      <div><span className="text-muted-foreground">Found via:</span> Google Search ✅</div>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2">Today 9:14 PM</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Who */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-extrabold text-center mb-4 font-display">
            Every Local Business. Every City.
          </motion.h2>
          <p className="text-center text-muted-foreground mb-12">LeadPe works for all types of local businesses across India.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {businessTypes.map((bt, i) => (
              <motion.div key={bt.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="rounded-2xl border border-border bg-card p-5 text-center hover:border-primary/40 hover:shadow-glow hover:-translate-y-1 transition-all duration-300 cursor-default">
                <div className="text-3xl mb-2">{bt.icon}</div>
                <div className="text-sm font-semibold text-foreground">{bt.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{bt.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-primary font-display">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-extrabold text-center mb-4 font-display">
            Simple, Transparent Pricing
          </motion.h2>
          <p className="text-center text-muted-foreground mb-12">Start free. Upgrade when you're ready.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div key={plan.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className={`relative rounded-2xl border p-8 ${plan.featured ? "border-primary shadow-glow bg-card" : "border-border bg-card"}`}>
                {plan.badge && (
                  <span className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
                )}
                <h3 className="text-lg font-bold font-display">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-4xl font-extrabold font-display">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map(f => (
                    <li key={f.text} className="flex items-center gap-2 text-sm">
                      {f.included ? <Check size={14} className="text-primary shrink-0" /> : <X size={14} className="text-muted-foreground/50 shrink-0" />}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground/50 line-through"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full rounded-xl h-11 font-semibold ${plan.featured ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow" : "bg-secondary text-foreground hover:bg-secondary/80"}`} asChild>
                  <Link to="/business">{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Signup Wizard */}
      <section
        id="business-signup"
        className="py-20 border-t border-border/30"
        style={{ backgroundColor: "#080C09" }}
      >
        <div className="container max-w-lg mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2 text-xs font-medium text-muted-foreground">
              <span>Step {bizStep} of 3</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#101810] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#00E676] transition-all duration-300"
                style={{ width: `${(bizStep / 3) * 100}%` }}
              />
            </div>
          </div>

          <div
            className="rounded-2xl border border-border"
            style={{ backgroundColor: "#101810" }}
          >
            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {!showSuccess && (
                  <motion.div
                    key={bizStep}
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {bizStep === 1 && (
                      <div className="space-y-5">
                        <h2 className="text-2xl font-extrabold font-display text-foreground">
                          Pehle apne business ke baare mein batao
                        </h2>

                        {/* Business Name */}
                        <div>
                          <label className="text-sm font-medium block mb-1">
                            Business Name
                          </label>
                          <span className="text-xs text-muted-foreground block mb-2">
                            Apni dukaan ya centre ka naam
                          </span>
                          <Input
                            value={bizForm.businessName}
                            onChange={e =>
                              updateBizForm("businessName", e.target.value)
                            }
                            className={`rounded-xl bg-secondary border ${
                              bizErrors.businessName
                                ? "border-red-500"
                                : "border-border"
                            }`}
                            placeholder="e.g. Shiva Study Centre"
                          />
                          {bizErrors.businessName && (
                            <p className="text-xs text-red-500 mt-1">
                              {bizErrors.businessName}
                            </p>
                          )}
                        </div>

                        {/* Business Type */}
                        <div>
                          <label className="text-sm font-medium block mb-1">
                            Business Type
                          </label>
                          <span className="text-xs text-muted-foreground block mb-2">
                            Aap kya karte hain?
                          </span>
                          <select
                            value={bizForm.businessType}
                            onChange={e =>
                              updateBizForm("businessType", e.target.value)
                            }
                            className={`w-full rounded-xl bg-secondary text-sm px-3 py-2 border outline-none ${
                              bizErrors.businessType
                                ? "border-red-500"
                                : "border-border"
                            }`}
                          >
                            <option value="">Select type</option>
                            <option value="Coaching Centre">
                              Coaching Centre
                            </option>
                            <option value="Doctor/Clinic">Doctor/Clinic</option>
                            <option value="Lawyer/CA">Lawyer/CA</option>
                            <option value="Salon/Parlour">
                              Salon/Parlour
                            </option>
                            <option value="Gym/Fitness">Gym/Fitness</option>
                            <option value="Plumber/Electrician">
                              Plumber/Electrician
                            </option>
                            <option value="Restaurant/Dhaba">
                              Restaurant/Dhaba
                            </option>
                            <option value="Photographer">Photographer</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Other">Other</option>
                          </select>
                          {bizErrors.businessType && (
                            <p className="text-xs text-red-500 mt-1">
                              {bizErrors.businessType}
                            </p>
                          )}
                        </div>

                        {/* City */}
                        <div>
                          <label className="text-sm font-medium block mb-1">
                            City or Town
                          </label>
                          <span className="text-xs text-muted-foreground block mb-2">
                            Aap kahan hain?
                          </span>
                          <Input
                            value={bizForm.city}
                            onChange={e => updateBizForm("city", e.target.value)}
                            className={`rounded-xl bg-secondary border ${
                              bizErrors.city ? "border-red-500" : "border-border"
                            }`}
                            placeholder="e.g. Vaishali, Bihar"
                          />
                          {bizErrors.city && (
                            <p className="text-xs text-red-500 mt-1">
                              {bizErrors.city}
                            </p>
                          )}
                        </div>

                        {/* WhatsApp */}
                        <div>
                          <label className="text-sm font-medium block mb-1">
                            WhatsApp Number (10 digits)
                          </label>
                          <span className="text-xs text-muted-foreground block mb-2">
                            Jahan leads aayenge
                          </span>
                          <Input
                            value={bizForm.whatsappNumber}
                            onChange={e =>
                              updateBizForm("whatsappNumber", e.target.value)
                            }
                            className={`rounded-xl bg-secondary border ${
                              bizErrors.whatsappNumber
                                ? "border-red-500"
                                : "border-border"
                            }`}
                            placeholder="e.g. 9876543210"
                          />
                          {bizErrors.whatsappNumber && (
                            <p className="text-xs text-red-500 mt-1">
                              {bizErrors.whatsappNumber}
                            </p>
                          )}
                        </div>

                        {/* Owner Name */}
                        <div>
                          <label className="text-sm font-medium block mb-1">
                            Owner Name
                          </label>
                          <span className="text-xs text-muted-foreground block mb-2">
                            Aapka naam
                          </span>
                          <Input
                            value={bizForm.ownerName}
                            onChange={e =>
                              updateBizForm("ownerName", e.target.value)
                            }
                            className={`rounded-xl bg-secondary border ${
                              bizErrors.ownerName
                                ? "border-red-500"
                                : "border-border"
                            }`}
                            placeholder="e.g. Rajesh Kumar"
                          />
                          {bizErrors.ownerName && (
                            <p className="text-xs text-red-500 mt-1">
                              {bizErrors.ownerName}
                            </p>
                          )}
                        </div>

                        <Button
                          className="w-full h-12 mt-2 rounded-xl text-black font-semibold"
                          style={{ backgroundColor: "#00E676" }}
                          onClick={() => {
                            if (validateStep1()) setBizStep(2);
                          }}
                        >
                          Next Step &#8594;
                        </Button>
                      </div>
                    )}

                    {bizStep === 2 && (
                      <div className="space-y-5">
                        <h2 className="text-2xl font-extrabold font-display text-foreground">
                          Ab batao customers ko kya milega
                        </h2>

                        {/* Description */}
                        <div>
                          <label className="text-sm font-medium block mb-1">
                            Short Description
                          </label>
                          <span className="text-xs text-muted-foreground block mb-2">
                            2-3 lines mein batao aap kya offer karte ho
                          </span>
                          <textarea
                            value={bizForm.description}
                            onChange={e =>
                              updateBizForm("description", e.target.value)
                            }
                            className={`w-full min-h-[96px] rounded-xl bg-secondary text-sm px-3 py-2 border outline-none resize-none ${
                              bizErrors.description
                                ? "border-red-500"
                                : "border-border"
                            }`}
                            placeholder={
                              "e.g. Class 9-12 ke liye maths aur science tuition.\nExpert teacher, small batches."
                            }
                          />
                          {bizErrors.description && (
                            <p className="text-xs text-red-500 mt-1">
                              {bizErrors.description}
                            </p>
                          )}
                        </div>

                        {/* Working Hours */}
                        <div>
                          <label className="text-sm font-medium block mb-1">
                            Working Hours
                          </label>
                          <span className="text-xs text-muted-foreground block mb-2">
                            Aap kab available hote ho?
                          </span>
                          <Input
                            value={bizForm.workingHours}
                            onChange={e =>
                              updateBizForm("workingHours", e.target.value)
                            }
                            className="rounded-xl bg-secondary border border-border"
                            placeholder="e.g. Mon-Sat, 8am to 6pm"
                          />
                        </div>

                        {/* Starting Price */}
                        <div>
                          <label className="text-sm font-medium block mb-1">
                            Starting Price
                          </label>
                          <span className="text-xs text-muted-foreground block mb-2">
                            Approximately kitna charge karte ho? (optional)
                          </span>
                          <Input
                            value={bizForm.startingPrice}
                            onChange={e =>
                              updateBizForm("startingPrice", e.target.value)
                            }
                            className="rounded-xl bg-secondary border border-border"
                            placeholder="e.g. ₹1500/month"
                          />
                        </div>

                        {/* Special Offer */}
                        <div>
                          <label className="text-sm font-medium block mb-1">
                            Special Offer for New Customers
                          </label>
                          <span className="text-xs text-muted-foreground block mb-2">
                            Koi offer hai naye customers ke liye? (optional)
                          </span>
                          <Input
                            value={bizForm.specialOffer}
                            onChange={e =>
                              updateBizForm("specialOffer", e.target.value)
                            }
                            className="rounded-xl bg-secondary border border-border"
                            placeholder="e.g. Pehli class bilkul free"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            className="text-sm text-muted-foreground"
                            onClick={() => setBizStep(1)}
                          >
                            &#8592; Back
                          </button>
                          <Button
                            className="flex-1 h-12 rounded-xl text-black font-semibold"
                            style={{ backgroundColor: "#00E676" }}
                            onClick={() => {
                              if (validateStep2()) setBizStep(3);
                            }}
                          >
                            Next Step &#8594;
                          </Button>
                        </div>
                      </div>
                    )}

                    {bizStep === 3 && (
                      <div className="space-y-5">
                        <h2 className="text-2xl font-extrabold font-display text-foreground">
                          Final check, phir trial start
                        </h2>

                        {/* Summary Card */}
                        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-2 text-sm">
                          <div className="text-lg font-extrabold font-display text-[#00E676]">
                            {bizForm.businessName || "Your Business"}
                          </div>
                          <div className="text-muted-foreground">
                            {bizForm.businessType || "Business type"} •{" "}
                            {bizForm.city || "City"}
                          </div>
                          <div className="text-muted-foreground">
                            WhatsApp:{" "}
                            {bizForm.whatsappNumber || "WhatsApp number"}
                          </div>
                          {bizForm.description && (
                            <p className="text-foreground mt-2 line-clamp-3">
                              {bizForm.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-foreground">
                            You&apos;re ready to go live! 🎉
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Your 7-day free trial starts the moment you click
                            below. No credit card needed.
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            className="text-sm text-muted-foreground"
                            onClick={() => setBizStep(2)}
                          >
                            &#8592; Back
                          </button>
                          <Button
                            className="flex-1 h-12 rounded-xl text-black font-semibold"
                            style={{ backgroundColor: "#00E676" }}
                            onClick={handleStartTrial}
                          >
                            🚀 Start My 7-Day Free Trial
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {showSuccess && (
                  <motion.div
                    key="success"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 text-center"
                  >
                    <div className="flex justify-center mb-2">
                      <div className="w-16 h-16 rounded-full border-4 border-[#00E676]/30 flex items-center justify-center animate-pulse">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "#00E676" }}
                        >
                          <span className="text-black text-2xl">✓</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-extrabold font-display text-foreground">
                        Welcome to LeadPe! 🎉
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Your business is going online.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Naya Customer, Seedha Aapke Phone Pe 🔔
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-secondary/40 p-4 text-left space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Your Trial Code
                          </div>
                          <div className="text-xl font-mono font-semibold text-[#00E676] mt-1">
                            {trialCode}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-[#00E676]/40 text-xs text-foreground"
                          onClick={() => {
                            if (!trialCode) return;
                            void navigator.clipboard.writeText(trialCode);
                            // Simple inline feedback
                            const el = document.getElementById("trial-copy-feedback");
                            if (el) {
                              el.textContent = "Copied! ✓";
                            }
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <p
                        id="trial-copy-feedback"
                        className="text-xs text-muted-foreground"
                      >
                        Save this code. Our team will WhatsApp you within 2 hours
                        to complete your website setup.
                      </p>
                    </div>

                    <Button
                      className="w-full h-12 rounded-xl text-black font-semibold"
                      style={{ backgroundColor: "#00E676" }}
                      asChild
                    >
                      <a
                        href={
                          "https://wa.me/?text=" +
                          encodeURIComponent(
                            "I just joined LeadPe and getting my business online! 🚀 Check it out: leadpe.online\nNaya Customer, Seedha Aapke Phone Pe 🔔"
                          )
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        Share on WhatsApp &#8594;
                      </a>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Signup Placeholder */}
      <section id="dev-signup" className="py-20 border-t border-border/30">
        <div className="container max-w-lg text-center">
          <h2 className="text-2xl font-extrabold mb-3 font-display">Developer Signup Coming Soon</h2>
          <p className="text-muted-foreground">Soon you&apos;ll be able to apply to LeadPe Studio right here.</p>
        </div>
      </section>

      {/* Free Trial CTA */}
      <section className="py-20 border-t border-border/30">
        <div className="container max-w-lg text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-extrabold mb-3 font-display">Apna Free Trial Aaj Shuru Karo</h2>
            <p className="text-muted-foreground mb-8">Koi credit card nahi. Koi commitment nahi.</p>
            <div className="flex gap-2">
              <Input
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="WhatsApp number"
                className="h-12 rounded-xl bg-card border-border"
              />
              <Button className="h-12 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold whitespace-nowrap">
                🚀 Free Start
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>✅ 7 din free</span>
              <span>✅ Koi card nahi</span>
              <span>✅ Hindi support</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <LeadPeLogo size="sm" />
              <p className="text-sm text-muted-foreground mt-1">Naya Customer, Seedha Aapke Phone Pe 🔔</p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <a href="/#how-it-works" className="hover:text-foreground">How it Works</a>
              <a href="/#pricing" className="hover:text-foreground">Pricing</a>
              <Link to="/developer" className="hover:text-foreground">For Developers</Link>
            </div>
          </div>
          <div className="text-center mt-8 text-xs text-muted-foreground">
            © 2026 LeadPe. Made in India 🇮🇳
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
