import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { WEBSITE_PACKAGES, MONTHLY_MANAGEMENT } from "@/lib/packages";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function Studio() {
  const [sitesPerMonth, setSitesPerMonth] = useState(5);

  const avgEarning = 1200;
  const buildingIncome = sitesPerMonth * avgEarning;
  const after6Months = sitesPerMonth * 6 * 30;
  const after12Months = sitesPerMonth * 12 * 30;
  const yearTotal = buildingIncome * 12 + (sitesPerMonth * 30 * 78); // rough sum of growing passive

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E0F2E9]" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LeadPeLogo theme="light" size="sm" />
            <span className="text-sm text-[#999]">Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/studio/auth">
              <Button variant="ghost" className="text-sm text-[#666]">Sign In</Button>
            </Link>
            <Link to="/studio/auth">
              <Button className="h-9 px-4 rounded-lg text-sm font-semibold text-white bg-[#00C853] hover:bg-[#00A843]">
                Join Studio <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — Dark */}
      <section className="pt-16" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="container mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6 text-white bg-[#00C853]">
              💰 Non-technical builders welcome
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6" style={{ fontFamily: "Syne, sans-serif" }}>
              Build Websites with AI.
              <br />
              Earn Every Month.
            </h1>
            <p className="text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: "#999" }}>
              Use ChatGPT + Lovable to build.
              LeadPe distributes to businesses.
              You earn ₹640–₹4,000 per site + ₹30/month passive forever.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-10 text-white">
              {[
                { value: "₹30/mo", label: "Per client passive" },
                { value: "80%", label: "Your share" },
                { value: "48hrs", label: "Average build time" },
                { value: "0", label: "Coding skills needed" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-extrabold" style={{ color: "#00C853" }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: "#888" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <Link to="/studio/auth">
              <Button className="h-14 px-10 rounded-xl text-lg font-semibold text-white bg-[#00C853] hover:bg-[#00A843]">
                Start Earning → 
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-20" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="container mx-auto px-4 max-w-xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-6 text-center" style={{ fontFamily: "Syne, sans-serif" }}>
              Calculate Your Earnings 🧮
            </h2>

            <div className="mb-6">
              <label className="text-sm font-medium text-[#666] mb-2 block">
                How many sites per month? <span className="font-bold text-[#00C853]">{sitesPerMonth}</span>
              </label>
              <input type="range" min={1} max={20} value={sitesPerMonth}
                onChange={(e) => setSitesPerMonth(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: "#00C853", backgroundColor: "#E0F2E9" }}
              />
              <div className="flex justify-between text-xs text-[#999] mt-1"><span>1</span><span>20</span></div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: "#F5FFF7" }}>
                <span className="text-sm text-[#666]">Building income</span>
                <span className="font-bold text-[#1A1A1A]">{sitesPerMonth} × ₹{avgEarning.toLocaleString()} = ₹{buildingIncome.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: "#F5FFF7" }}>
                <span className="text-sm text-[#666]">After 6 months passive</span>
                <span className="font-bold text-[#1A1A1A]">{sitesPerMonth * 6} sites × ₹30 = ₹{after6Months.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: "#F5FFF7" }}>
                <span className="text-sm text-[#666]">After 1 year passive</span>
                <span className="font-bold text-[#1A1A1A]">{sitesPerMonth * 12} sites × ₹30 = ₹{after12Months.toLocaleString()}/mo</span>
              </div>
            </div>

            <div className="text-center p-4 rounded-xl border-2" style={{ borderColor: "#00C853", backgroundColor: "rgba(0,200,83,0.05)" }}>
              <div className="text-sm text-[#666] mb-1">Total Year 1 Estimate</div>
              <div className="text-3xl font-extrabold" style={{ color: "#00C853", fontFamily: "Syne, sans-serif" }}>
                ₹{yearTotal.toLocaleString()}+
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center mb-12 text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: "📝", title: "Client requests website", desc: "Business signs up on LeadPe. You get the request." },
              { icon: "🤖", title: "Build with AI", desc: "Use ChatGPT + Lovable. No coding needed. 2-4 hours work." },
              { icon: "🚀", title: "LeadPe auto deploys", desc: "Submit GitHub link. We deploy automatically." },
              { icon: "💰", title: "Earn forever", desc: "₹640-₹4,000 upfront. ₹30/month passive. Always." },
            ].map((step, i) => (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="text-center p-6 rounded-2xl border border-[#E0F2E9]">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="font-bold text-[#1A1A1A] mb-2">{step.title}</h3>
                <p className="text-sm text-[#666]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Website Packages */}
      <section className="py-20" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center mb-4 text-[#1A1A1A]" style={{ fontFamily: "Syne, sans-serif" }}>
            What You'll Build
          </h2>
          <p className="text-center text-[#666] mb-12">4 website tiers. Pick your earning level.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {WEBSITE_PACKAGES.map((pkg, i) => (
              <motion.div key={pkg.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className={`bg-white rounded-2xl p-6 border-2 relative ${pkg.recommended ? 'border-[#00C853] shadow-lg' : 'border-[#E0F2E9]'}`}>
                {pkg.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-[#00C853]">
                    Most Popular
                  </div>
                )}
                <div className="text-xs font-bold px-2 py-1 rounded-full inline-block mb-3 text-white" style={{ backgroundColor: pkg.color }}>
                  {pkg.badge}
                </div>
                <h3 className="font-bold text-lg text-[#1A1A1A] mb-1">{pkg.name}</h3>
                <div className="text-2xl font-extrabold text-[#1A1A1A] mb-1">
                  {pkg.priceLabel || `₹${pkg.price.toLocaleString()}`}
                </div>
                <div className="text-sm font-semibold mb-4" style={{ color: "#00C853" }}>
                  You earn: ₹{pkg.coderEarning.toLocaleString()}
                </div>
                <div className="text-xs text-[#999] mb-3">Delivery: {pkg.deliveryDays} days</div>
                <ul className="space-y-2 mb-4">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#666]">
                      <Check size={12} className="text-[#00C853] mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-1">
                  {pkg.bestFor.map((b) => (
                    <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F0F0F0] text-[#666]">{b}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Ready to Start Earning?
          </h2>
          <p className="text-[#999] mb-8">First build request waiting for you.</p>
          <Link to="/studio/auth">
            <Button className="h-14 px-10 rounded-xl text-lg font-semibold text-white bg-[#00C853] hover:bg-[#00A843]">
              Join LeadPe Studio →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
