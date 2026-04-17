import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { WEBSITE_PACKAGES } from "@/lib/packages";
import { ChevronDown, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

export default function Studio() {
  const [sitesPerMonth, setSitesPerMonth] = useState(5);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const avgEarning = 1200;
  const buildingIncome = sitesPerMonth * avgEarning;
  const passivePerSite = 30;
  const totalPassive = sitesPerMonth * 12 * passivePerSite;
  const yearTotal = buildingIncome * 12 + totalPassive;

  const faqs = [
    { q: "Do I need coding skills?", a: "Zero coding needed. If you can use WhatsApp and ChatGPT, you can build websites with LeadPe. We guide you step by step." },
    { q: "When do I get paid?", a: "Within 24 hours of delivery via UPI directly to your account. Plus ₹30 every month per live site. Forever." },
    { q: "How long does one website take?", a: "First time: 4-6 hours. After practice: 2-3 hours. The more you build, the faster you get." },
    { q: "Can I do this part-time?", a: "Yes. Many builders work only on weekends. 5 websites/month = ₹6,000/month part-time." },
    { q: "What if client wants changes?", a: "1 free revision included. We give exact feedback. Our quality check catches issues before delivery." },
    { q: "Which UPI ID do I use?", a: "Any UPI works: PhonePe, Google Pay, Paytm — all accepted. Earnings go directly there." }
  ];

  const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
      <SEO
        title="LeadPe Studio | Build & Earn as a Digital Creator"
        description="Build websites for local Indian businesses with AI. Earn ₹480-₹1,800 per build + ₹30/month passive income per live site. No coding required."
        path="/studio"
      />
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white" style={{ borderBottom: "1px solid #E0E0E0", height: 64 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: font.heading, fontWeight: 700 }} className="text-lg sm:text-xl">
              <span style={{ color: "#1A1A1A" }}>Lead</span><span style={{ color: "#00C853" }}>Pe</span>
            </span>
            <span style={{ color: "#E0E0E0" }}>|</span>
            <span style={{ color: "#00C853", fontWeight: 600 }} className="text-xs sm:text-sm">Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/studio/auth" className="px-3 py-2 rounded-lg text-sm font-medium hidden sm:inline-block" style={{ color: "#1A1A1A" }}>
              Sign In
            </Link>
            <Link to="/studio/auth"
              className="rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#00C853", color: "#fff", padding: "10px 18px", textDecoration: "none" }}>
              Join Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: 96, paddingBottom: 56, textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl mx-auto">
          <span className="inline-block rounded-full text-xs sm:text-sm font-medium" style={{ backgroundColor: "#E8F5E9", color: "#00C853", padding: "6px 14px", marginBottom: 20 }}>
            🇮🇳 Built for Non-Technical Indians
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-6xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 0 }}>
            Build Websites with AI.
            <br />
            <span style={{ textDecoration: "underline", textDecorationColor: "#00C853", textUnderlineOffset: 6, textDecorationThickness: 3 }}>Earn Every Month.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl" style={{ color: "#666", maxWidth: 560, margin: "20px auto 0", lineHeight: 1.6 }}>
            Use ChatGPT + Lovable to build websites for local businesses. No coding. No degree. Just AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7 px-4">
            <Link to="/studio/auth"
              className="w-full sm:w-auto block text-center rounded-xl text-base font-semibold"
              style={{ backgroundColor: "#00C853", color: "#fff", padding: "16px 36px", textDecoration: "none", minHeight: 52 }}>
              Start Earning Free →
            </Link>
            <Link to="/studio/auth"
              className="w-full sm:w-auto block text-center rounded-xl text-sm font-medium"
              style={{ color: "#666", padding: "12px", textDecoration: "none" }}>
              Already a member? Sign In
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-5 text-xs sm:text-sm" style={{ color: "#999" }}>
            <span>✓ Free to join</span>
            <span>✓ No coding</span>
            <span>✓ Earn from day 1</span>
          </div>
        </motion.div>
      </section>

      {/* Stats Strip */}
      <section className="px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0", borderBottom: "1px solid #E0E0E0", padding: "28px 16px" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2">
          {[
            { value: "₹30", label: "/client/mo" },
            { value: "60%", label: "Your share" },
            { value: "48h", label: "Build time" },
            { value: "₹0", label: "To start" }
          ].map((s) =>
            <div key={s.label} className="text-center">
              <div style={{ fontFamily: font.heading, fontWeight: 700, color: "#00C853", lineHeight: 1 }} className="text-3xl sm:text-4xl">{s.value}</div>
              <div style={{ color: "#666", marginTop: 6 }} className="text-xs sm:text-sm">{s.label}</div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#fff", padding: "56px 16px" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 6 }}>How It Works</h2>
          <p className="text-sm sm:text-base" style={{ color: "#666", textAlign: "center", marginBottom: 32 }}>3 simple steps. Earn from day one.</p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              { step: 1, emoji: "🤖", title: "Build with AI", desc: "Paste our prompt in Lovable. Website ready in 2-4 hours.", time: "⏱️ 2-4 hrs" },
              { step: 2, emoji: "📤", title: "Submit Link", desc: "Paste your preview URL. Auto quality checks run instantly.", time: "⏱️ 5 min" },
              { step: 3, emoji: "💰", title: "Earn Forever", desc: "Paid within 24h via UPI. Plus ₹30/month per live site.", time: "💸 Forever" }
            ].map((s) =>
              <motion.div key={s.step} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                style={{ backgroundColor: "#fff", borderRadius: 16, padding: "28px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderTop: "3px solid #00C853", textAlign: "center" }}>
                <span className="inline-block rounded-full text-xs font-semibold" style={{ backgroundColor: "#E8F5E9", color: "#00C853", padding: "4px 12px", marginBottom: 12 }}>Step {s.step}</span>
                <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>{s.emoji}</div>
                <h3 className="text-lg sm:text-xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>{s.title}</h3>
                <p className="text-sm" style={{ color: "#666", lineHeight: 1.6, marginBottom: 12 }}>{s.desc}</p>
                <span className="inline-block rounded-full text-xs font-medium" style={{ backgroundColor: "#F5F5F5", color: "#999", padding: "4px 12px" }}>{s.time}</span>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Earnings Calculator - Simplified */}
      <section style={{ backgroundColor: "#F5FFF7", padding: "40px 16px" }}>
        <div className="max-w-[400px] mx-auto">
          <h2 className="text-xl sm:text-2xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>Your Earnings</h2>
          <p style={{ color: "#666", fontSize: 13, textAlign: "center", marginBottom: 20 }}>Slide to see potential income.</p>

          <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "24px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Websites per month:</p>
            <div className="flex items-baseline justify-center gap-2 mb-3">
              <span style={{ fontFamily: font.heading, fontSize: 36, fontWeight: 700, color: "#00C853", lineHeight: 1 }}>{sitesPerMonth}</span>
              <span style={{ fontSize: 13, color: "#666" }}>sites/month</span>
            </div>
            <input type="range" min={1} max={20} value={sitesPerMonth}
              onChange={(e) => setSitesPerMonth(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer mb-4"
              style={{ accentColor: "#00C853", backgroundColor: "#E8F5E9" }} />

            {/* Simple 2-row grid */}
            <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: "#E0E0E0", borderRadius: 10, overflow: "hidden" }}>
              <div className="bg-white p-3">
                <p style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>This Month</p>
                <p style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#00C853", lineHeight: 1 }}>₹{buildingIncome.toLocaleString()}</p>
              </div>
              <div className="bg-white p-3">
                <p style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>Year 1 Total</p>
                <p style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#00C853", lineHeight: 1 }}>₹{yearTotal.toLocaleString()}+</p>
              </div>
            </div>

            <p style={{ fontSize: 10, color: "#999", textAlign: "center", marginTop: 10 }}>
              Based on Standard package (₹1,500). Your share = ₹1,200
            </p>

            <Link to="/studio/auth" className="block mt-4 text-center rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#00C853", color: "#fff", padding: "14px", textDecoration: "none", minHeight: 48 }}>
              Start Earning Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Packages - Compact */}
      <section style={{ backgroundColor: "#fff", padding: "40px 16px" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>What You Build</h2>
          <p style={{ color: "#666", fontSize: 13, textAlign: "center", marginBottom: 24 }}>Accept any request. Work at your pace.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {WEBSITE_PACKAGES.map((pkg) => {
              const colors: Record<string, string> = { basic: "#999", standard: "#00C853", premium: "#7C3AED", complex: "#FF6B00" };
              const c = colors[pkg.id] || "#00C853";
              return (
                <div key={pkg.id} style={{
                  backgroundColor: "#fff", borderRadius: 12, padding: "16px 12px",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                  borderTop: `3px solid ${c}`,
                }}>
                  <span className="inline-block rounded-full text-[10px] font-bold mb-2" style={{ backgroundColor: `${c}15`, color: c, padding: "2px 8px" }}>
                    {pkg.badge}
                  </span>
                  <div style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: "#1A1A1A", lineHeight: 1 }}>
                    {pkg.priceLabel || `₹${pkg.price.toLocaleString()}`}
                  </div>
                  <p style={{ fontSize: 10, color: "#999", marginTop: 2 }}>one-time</p>
                  <div style={{ height: 1, backgroundColor: "#F0F0F0", margin: "8px 0" }} />
                  <p style={{ fontSize: 10, color: "#666" }}>You Earn:</p>
                  <p style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, color: c, lineHeight: 1, marginTop: 1 }}>
                    ₹{pkg.coderEarning.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 10, color: "#666", marginTop: 2 }}>+ ₹30/mo passive</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section style={{ backgroundColor: "#F5FFF7", padding: "40px 16px" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>Tools You Use</h2>
          <p style={{ color: "#666", fontSize: 13, textAlign: "center", marginBottom: 24 }}>All free. Set up in 10 minutes.</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "🤖", name: "ChatGPT", desc: "Generate content automatically.", free: "Free ✓", url: "https://chatgpt.com" },
              { emoji: "🎨", name: "Lovable", desc: "Build websites visually. No code.", free: "Free tier ✓", url: "https://lovable.dev" }
            ].map((t) =>
              <div key={t.name} style={{ backgroundColor: "#fff", borderRadius: 14, padding: "20px 14px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8, lineHeight: 1 }}>{t.emoji}</div>
                <h3 className="text-sm" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>{t.name}</h3>
                <p style={{ fontSize: 11, color: "#666", marginBottom: 6, lineHeight: 1.5 }}>{t.desc}</p>
                <p style={{ fontSize: 11, color: "#00C853", fontWeight: 600, marginBottom: 8 }}>{t.free}</p>
                <button onClick={() => window.open(t.url, "_blank")}
                  className="w-full rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "#fff", color: "#00C853", border: "1.5px solid #00C853", padding: "8px", cursor: "pointer", minHeight: 36 }}>
                  Open →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: "#fff", padding: "40px 16px" }}>
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-xl sm:text-2xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 24 }}>Common Questions</h2>
          {faqs.map((faq, i) =>
            <div key={i} style={{ borderBottom: "1px solid #E0E0E0" }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between"
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "14px 0", minHeight: 48 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4, paddingRight: 8 }}>{faq.q}</span>
                <ChevronDown size={16} style={{ color: "#666", flexShrink: 0, transform: openFaq === i ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
              </button>
              {openFaq === i &&
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ paddingBottom: 14, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
                  {faq.a}
                </motion.div>
              }
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ backgroundColor: "#1A1A1A", padding: "48px 16px", textAlign: "center" }}>
        <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 10 }}>
          Your First Website<br />Is Waiting. 🚀
        </h2>
        <p style={{ color: "#999", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>Join free. Pick a request today. Start earning tomorrow.</p>
        <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
          <Link to="/studio/auth"
            className="w-full block text-center rounded-xl text-sm font-bold"
            style={{ backgroundColor: "#00C853", color: "#000", padding: "14px", textDecoration: "none", minHeight: 48 }}>
            Join LeadPe Studio Free →
          </Link>
          <Link to="/studio/auth"
            className="text-xs"
            style={{ color: "#999", textDecoration: "none" }}>
            Already a member? Sign In
          </Link>
        </div>
        <p style={{ color: "#444", fontSize: 11, marginTop: 16 }}>Free to join • UPI payments • No commitment</p>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0", padding: "20px 16px" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <span style={{ fontFamily: font.heading, fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: "#1A1A1A" }}>Lead</span><span style={{ color: "#00C853" }}>Pe</span>
            </span>
            <span style={{ color: "#999", fontSize: 11, marginLeft: 4 }}>Studio</span>
            <p style={{ color: "#999", fontSize: 10, marginTop: 2 }}>© 2026 LeadPe. Made in India 🇮🇳</p>
          </div>
          <Link to="/" style={{ color: "#666", fontSize: 11, textDecoration: "none" }}>For Businesses →</Link>
        </div>
      </footer>
    </div>
  );
}
