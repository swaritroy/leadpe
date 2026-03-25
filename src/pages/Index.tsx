import { motion } from "framer-motion";
import { ArrowRight, Check, X, Shield, Zap, Smartphone, Lock, Star, ChevronDown, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TRIAL_DAYS, MONTHLY_PRICE } from "@/lib/constants";
import LeadPeLogo from "@/components/LeadPeLogo";
import WhatsAppButton from "@/components/WhatsAppButton";
import Footer from "@/components/Footer";

const businessTypes = [
  { icon: "🏫", name: "Coaching Centre" },
  { icon: "🦷", name: "Doctor / Clinic" },
  { icon: "⚖️", name: "Lawyer / CA" },
  { icon: "💇", name: "Salon / Parlour" },
  { icon: "🏋️", name: "Gym / Fitness" },
  { icon: "🔧", name: "Plumber" },
  { icon: "📸", name: "Photographer" },
  { icon: "🏠", name: "Real Estate" },
  { icon: "🍽️", name: "Restaurant" },
  { icon: "🎓", name: "Dance / Music" },
];

const howItWorks = [
  { number: "1", icon: "📝", title: "Sign Up Free", desc: "Tell us about your business. 2 minutes. Zero tech knowledge." },
  { number: "2", icon: "🤖", title: "We Build Your Website", desc: "Our website builders build your professional website in 48 hours. Starts at ₹800." },
  { number: "3", icon: "💼", title: "Appear on Google", desc: "Your site goes live and appears on Google. Customers in your city find you first." },
  { number: "4", icon: "📥", title: "Get Customers on WhatsApp", desc: "Every inquiry lands on your WhatsApp instantly. You call. You close." },
];

const testimonials = [
  {
    stars: 5,
    text: "Pehli inquiry aayi — ek parent ne Class 10 Maths ke liye pucha. LeadPe ne kaam kiya!",
    name: "Mr. Sanjay Singhania",
    business: "Shiva Study Centre, Vaishali, Bihar",
  },
];

const comparisonData = {
  headers: ["", "LeadPe", "Agency", "Fiverr", "DIY"],
  rows: [
    { label: "Website Cost", values: ["₹800-4K", "₹20K+", "₹5K+", "₹0"] },
    { label: "Monthly", values: ["₹299", "₹5K+", "₹0", "₹2K+"] },
    { label: "Delivery", values: ["48 hours", "2-4 weeks", "1-2 weeks", "Months"] },
    { label: "Customers", values: ["✅", "❌", "❌", "❌"] },
    { label: "WhatsApp Alert", values: ["✅", "❌", "❌", "❌"] },
    { label: "Appear on Google", values: ["✅ Full", "Maybe", "Basic", "❌"] },
    { label: "Support", values: ["✅ Always", "Paid", "None", "❌"] },
  ],
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const } }),
};

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await (supabase.from("profiles") as any).select("*").eq("user_id", session.user.id).maybeSingle();
        setProfile(data);
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setShowDropdown(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <LeadPeLogo theme="light" size="md" />
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/client/dashboard" className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center" style={{ backgroundColor: "#00C853" }}>
                  Dashboard <ArrowRight size={14} className="ml-1" />
                </Link>
                <div className="relative">
                  <button onClick={() => setShowDropdown(!showDropdown)} className="w-9 h-9 rounded-full text-white font-semibold text-sm flex items-center justify-center" style={{ backgroundColor: "#00C853" }}>
                    {profile?.full_name?.[0]?.toUpperCase() || "U"}
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 top-11 w-48 bg-white rounded-xl border shadow-lg py-2 z-50" style={{ borderColor: "#E0E0E0" }}>
                      <Link to="/client/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#F0FFF4]" style={{ color: "#1A1A1A" }} onClick={() => setShowDropdown(false)}>
                        <LayoutDashboard size={16} style={{ color: "#00C853" }} /> Dashboard
                      </Link>
                      <div className="border-t my-1" style={{ borderColor: "#E0E0E0" }} />
                      <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Sign In</Link>
                <Button onClick={() => navigate("/business")} className="h-9 px-4 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#00C853" }}>
                  Start Free →
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-[85vh] flex items-center justify-center pt-16 pb-12" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="container px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: "#E8F5E9", color: "#00C853" }}>
              🇮🇳 Built for Indian Businesses
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leaing-[1.15] mb-6" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>
              Professional Website.<br />Starts at ₹800.<br />Customers on WhatsApp.
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto leaing-relaxed" style={{ color: "#666666" }}>
              We build your website in 48 hours. Every customer inquiry comes directly to your WhatsApp. 🔔
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
              <Button onClick={() => navigate("/business")} className="h-14 px-8 rounded-xl text-lg font-semibold text-white hover:-translate-y-0.5 transition-all w-full sm:w-auto" style={{ backgroundColor: "#00C853", boxShadow: "0 4px 16px rgba(0,200,83,0.3)" }}>
                Start Free — {TRIAL_DAYS} Days → <ArrowRight className="ml-2" size={20} />
              </Button>
              <Button onClick={() => navigate("/auth")} variant="outline" className="h-14 px-8 rounded-xl text-lg font-semibold hover:-translate-y-0.5 transition-all w-full sm:w-auto" style={{ color: "#1A1A1A", borderColor: "#E0E0E0" }}>
                Already a member? Sign In
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm" style={{ color: "#666666" }}>
              {[
                { icon: Lock, text: "No credit card" },
                { icon: Zap, text: "Website in 48 hours" },
                { icon: Check, text: "Cancel anytime" },
                { icon: Smartphone, text: "WhatsApp support" },
              ].map((t) => (
                <span key={t.text} className="flex items-center gap-1.5">
                  <t.icon size={14} style={{ color: "#00C853" }} /> {t.text}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { value: "48 Hours", label: "Website live time" },
              { value: "₹800", label: "Starts at" },
              { value: `₹${MONTHLY_PRICE}`, label: "per month" },
            ].map((s, i) => (
              <motion.div key={s.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="text-3xl md:text-4xl font-bold" style={{ color: "#00C853" }}>{s.value}</div>
                <div className="text-sm mt-1" style={{ color: "#666666" }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border" style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                {t.stars > 0 && <div className="flex gap-1 mb-4">{[...Array(t.stars)].map((_, j) => <Star key={j} size={16} className="fill-[#FFB800] text-[#FFB800]" />)}</div>}
                <p className="mb-4 leaing-relaxed" style={{ color: "#1A1A1A" }}>&ldquo;{t.text}&rdquo;</p>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>— {t.name}</p>
                <p className="text-sm" style={{ color: "#666666" }}>{t.business}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#1A1A1A" }}>How LeadPe Works</h2>
            <p style={{ color: "#666666" }}>Simple. Fast. Works.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howItWorks.map((item, i) => (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="bg-white rounded-2xl p-6 border hover:-translate-y-1 transition-all" style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm mb-4" style={{ backgroundColor: "#00C853" }}>{item.number}</div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: "#1A1A1A" }}>{item.title}</h3>
                <p className="text-sm leaing-relaxed" style={{ color: "#666666" }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP MOCKUP */}
      <section className="py-20" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#1A1A1A" }}>Your Phone Buzzes.<br />You Get the Customer.</h2>
              <p className="mb-6 leaing-relaxed" style={{ color: "#666666" }}>Real-time WhatsApp notifications for every new inquiry. 24/7.</p>
              <div className="rounded-xl p-4 border" style={{ backgroundColor: "#F0FFF4", borderColor: "#E0E0E0" }}>
                <div className="flex items-start gap-3">
                  <Smartphone style={{ color: "#00C853" }} size={20} className="mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium" style={{ color: "#1A1A1A" }}>Works on any WhatsApp</p>
                    <p style={{ color: "#666666" }}>No app download • No tech knowledge</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="hidden md:flex justify-center">
              <div className="w-72 bg-white rounded-[32px] border-4 p-3" style={{ borderColor: "#E0E0E0", boxShadow: "0 8px 32px rgba(0,200,83,0.15)" }}>
                <div className="rounded-[24px] overflow-hidden" style={{ backgroundColor: "#F8F9FA" }}>
                  <div className="text-white px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "#00C853" }}>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Smartphone size={16} /></div>
                    <span className="font-medium text-sm">WhatsApp</span>
                  </div>
                  <div className="p-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border" style={{ borderColor: "#E0E0E0" }}>
                      <div className="font-bold text-sm mb-3 flex items-center gap-1" style={{ color: "#00C853" }}>🔔 NEW INQUIRY — LeadPe</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span style={{ color: "#666666" }}>Name:</span><span className="font-medium" style={{ color: "#1A1A1A" }}>Priya Sharma</span></div>
                        <div className="flex justify-between"><span style={{ color: "#666666" }}>Interest:</span><span style={{ color: "#1A1A1A" }}>Class 10 Maths</span></div>
                        <div className="flex justify-between"><span style={{ color: "#666666" }}>Phone:</span><span className="font-medium" style={{ color: "#00C853" }}>98XXXXXX</span></div>
                        <div className="pt-2 mt-2 border-t flex justify-between" style={{ borderColor: "#E0E0E0" }}>
                          <span className="text-xs" style={{ color: "#666666" }}>Just now</span>
                          <span className="text-xs font-medium" style={{ color: "#00C853" }}>Call Now →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#1A1A1A" }}>Every Local Business. Every City.</h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {businessTypes.map((bt, i) => (
              <motion.div key={bt.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="bg-white rounded-2xl p-5 text-center border hover:border-[#00C853] hover:-translate-y-1 transition-all cursor-default" style={{ borderColor: "#E0E0E0" }}>
                <div className="text-3xl mb-2">{bt.icon}</div>
                <div className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{bt.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="container px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: "#1A1A1A" }}>Simple, Honest Pricing</h2>
            <p style={{ color: "#666666" }}>Try free for {TRIAL_DAYS} days. No credit card needed.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-start mb-8">
            {/* FREE TRIAL */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              whileHover={{ y: -8, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-2xl p-8 bg-white border cursor-pointer" style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ backgroundColor: "#F0F0F0", color: "#666666" }}>Try Free</span>
              <div className="mb-1"><span className="text-5xl font-bold" style={{ color: "#1A1A1A", fontFamily: "Syne" }}>₹0</span></div>
              <p className="text-sm mb-1" style={{ color: "#1A1A1A" }}>{TRIAL_DAYS} days free</p>
              <p className="text-xs mb-6" style={{ color: "#999999" }}>No credit card needed</p>
              <ul className="space-y-2.5 mb-6">
                {["Website built in 48 hours", "All customers visible", "WhatsApp alert active", "Full account", "Appear on Google + Google Maps", "Cancel anytime"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#1A1A1A" }}><Check size={14} style={{ color: "#00C853" }} /> {f}</li>
                ))}
              </ul>
              <p className="text-xs mb-6" style={{ color: "#999999" }}>After {TRIAL_DAYS} days — continue to keep customers</p>
              <Button onClick={() => navigate("/business")} className="w-full h-12 rounded-xl text-sm font-semibold border bg-white hover:bg-[#F0FFF4]" style={{ borderColor: "#00C853", color: "#00C853" }}>
                Start Free →
              </Button>
            </motion.div>

            {/* GROWTH */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              whileHover={{ y: -8, boxShadow: "0 24px 80px rgba(0,200,83,0.25)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-2xl p-8 relative border-2 cursor-pointer" style={{ backgroundColor: "#FFFFFF", borderColor: "#00C853", marginTop: "-16px", boxShadow: "0 20px 60px rgba(0,200,83,0.15)" }}>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-4" style={{ backgroundColor: "#00C853" }}>Most Popular</span>
              <div className="mb-1">
                <span className="text-5xl font-bold" style={{ fontFamily: "Syne", color: "#1A1A1A" }}>₹{MONTHLY_PRICE}</span>
                <span className="text-base ml-1" style={{ color: "#666666" }}>/month</span>
              </div>
              <p className="text-xs mb-1" style={{ color: "#666666" }}>GST included</p>
              <p className="text-xs mb-6" style={{ color: "#666666" }}>Cancel anytime</p>
              <ul className="space-y-2.5 mb-4">
                {["Everything in Free Trial", "Unlimited customers forever", "Instant WhatsApp alert 🔔", "Custom domain", "Weekly Monday report", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#1A1A1A" }}><Check size={14} style={{ color: "#00C853" }} /> {f}</li>
                ))}
              </ul>
              <p className="text-xs mb-6" style={{ color: "#00C853" }}>1 customer = ₹1,500+ • LeadPe = ₹{MONTHLY_PRICE}/mo</p>
              <Button onClick={() => navigate(`/payment?plan=growth&amount=${MONTHLY_PRICE}`)} className="w-full h-12 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#00C853" }}>
                Get Growth Plan →
              </Button>
            </motion.div>
          </div>

          <p className="text-center text-sm" style={{ color: "#666666" }}>
            Start with{" "}
            <Link to="/business" className="underline" style={{ color: "#00C853" }}>free trial first →</Link>
          </p>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-16 bg-white">
        <div className="container px-4">
          <h3 className="text-center text-2xl font-bold mb-8" style={{ color: "#1A1A1A" }}>Why LeadPe?</h3>
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E0E0E0", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#E0E0E0" }}>
                    {comparisonData.headers.map((h, i) => (
                      <th key={i} className={`py-4 px-4 text-sm font-semibold text-left ${i === 0 ? "w-28" : ""}`}
                        style={i === 1 ? { backgroundColor: "#00C853", color: "white" } : { color: "#666666" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.rows.map((row, ri) => (
                    <tr key={ri} className="border-b last:border-0" style={{ borderColor: "#F0F0F0" }}>
                      <td className="py-3 px-4 text-sm font-medium" style={{ color: "#1A1A1A" }}>{row.label}</td>
                      {row.values.map((v, ci) => (
                        <td key={ci} className="py-3 px-4 text-sm"
                          style={ci === 0 ? { backgroundColor: "#F0FFF4", color: "#00C853", fontWeight: 600 } : { color: "#666666" }}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* VIBE CODER BAR */}
      <section className="py-10 md:py-12" style={{ backgroundColor: "#1A1A1A", padding: "40px 32px" }}>
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm mb-2" style={{ color: "#999999" }}>Are you a web developer or AI builder?</p>
              <h3 className="text-xl md:text-2xl font-bold text-white leaing-snug">
                Join LeadPe Studio.<br />Build sites. Earn every month.
              </h3>
            </div>
            <Link to="/studio" className="w-full md:w-auto px-8 py-4 rounded-xl text-white font-semibold text-center" style={{ backgroundColor: "#00C853" }}>
              Join as Vibe Coder →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
