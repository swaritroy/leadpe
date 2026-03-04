import { motion } from "framer-motion";
import { ArrowRight, Check, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { useState } from "react";

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
                <Link to="/business">Start Free Trial <ArrowRight size={16} className="ml-2" /></Link>
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
                <Link to="/developer">Join LeadPe Studio <ArrowRight size={16} className="ml-2" /></Link>
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
