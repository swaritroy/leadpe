import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { WEBSITE_PACKAGES } from "@/lib/packages";
import { ChevronDown, ArrowRight } from "lucide-react";

export default function Studio() {
  const [sitesPerMonth, setSitesPerMonth] = useState(5);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const avgEarning = 1200;
  const buildingIncome = sitesPerMonth * avgEarning;
  const after6Months = sitesPerMonth * 6 * 30;
  const after12Months = sitesPerMonth * 12 * 30;
  const yearTotal = buildingIncome * 12 + (sitesPerMonth * 30 * 78);

  const faqs = [
    { q: "Do I need coding skills?", a: "Zero coding needed. If you can use WhatsApp and ChatGPT, you can build websites with LeadPe. We guide you step by step." },
    { q: "When do I get paid?", a: "Within 24 hours of delivery via UPI directly to your account. Plus ₹30 every month per live site. Forever." },
    { q: "How long does one website take?", a: "First time: 4-6 hours. After practice: 2-3 hours. The more you build, the faster you get." },
    { q: "Can I do this part-time?", a: "Yes. Many builders work only on weekends. 5 websites/month = ₹6,000/month part-time." },
    { q: "What if client wants changes?", a: "1 free revision included. We give exact feedback. Our quality check catches issues before delivery." },
    { q: "Which UPI ID do I use?", a: "Any UPI works: PhonePe, Google Pay, Paytm — all accepted. Earnings go directly there." },
  ];

  const pkgColors: Record<string, { border: string; badge: string; badgeBg: string; earn: string }> = {
    basic: { border: "#999", badge: "#999", badgeBg: "#F5F5F5", earn: "#00C853" },
    standard: { border: "#00C853", badge: "#fff", badgeBg: "#00C853", earn: "#00C853" },
    premium: { border: "#7C3AED", badge: "#7C3AED", badgeBg: "#F3E8FF", earn: "#7C3AED" },
    complex: { border: "#FF6B00", badge: "#FF6B00", badgeBg: "#FFF0E6", earn: "#FF6B00" },
  };

  const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7", fontFamily: font.body }}>
      {/* Navbar - Mobile Optimized */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white" style={{ borderBottom: "1px solid #E0E0E0", height: 60 }}>
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700 }}>
              <span style={{ color: "#1A1A1A" }}>Lead</span><span style={{ color: "#00C853" }}>Pe</span>
            </span>
            <span style={{ color: "#E0E0E0", fontSize: 18 }}>|</span>
            <span style={{ color: "#00C853", fontSize: 14, fontFamily: font.body, fontWeight: 600 }}>Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/studio/auth" className="px-3 py-2 rounded-lg text-sm font-medium" style={{ color: "#1A1A1A" }}>
              Sign In
            </Link>
            <Link to="/studio/auth"
              className="rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#00C853", color: "#fff", padding: "10px 18px", textDecoration: "none", display: "inline-block" }}>
              Join Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Mobile First */}
      <section style={{ padding: "84px 16px 60px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-block rounded-full text-xs font-medium" style={{ backgroundColor: "#E8F5E9", color: "#00C853", padding: "8px 16px", marginBottom: 24 }}>
            🇮🇳 Built for Non-Technical Indians
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-6xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 0 }}>
            Build Websites with AI.
            <br />
            <span style={{ textDecoration: "underline", textDecorationColor: "#00C853", textUnderlineOffset: 6, textDecorationThickness: 3 }}>Earn Every Month.</span>
          </h1>

          <p className="text-base sm:text-lg" style={{ color: "#666", maxWidth: 460, margin: "20px auto 0", lineHeight: 1.7 }}>
            Use ChatGPT + Lovable to build websites for local businesses. No coding. No degree. Just AI tools.
          </p>

          <div className="flex flex-col items-center gap-3 mt-7 px-4">
            <Link to="/studio/auth"
              className="w-full sm:w-auto block text-center rounded-xl text-base font-semibold"
              style={{ backgroundColor: "#00C853", color: "#fff", padding: "16px 36px", textDecoration: "none", minHeight: 52 }}>
              Start Earning Free →
            </Link>
            <Link to="/studio/auth"
              className="w-full sm:w-auto block text-center rounded-xl text-base font-semibold"
              style={{ backgroundColor: "#fff", color: "#1A1A1A", border: "2px solid #E0E0E0", padding: "14px 36px", textDecoration: "none", minHeight: 52 }}>
              Already a member? Sign In
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-5" style={{ color: "#999", fontSize: 13 }}>
            <span>✓ Free to join</span>
            <span>✓ No coding</span>
            <span>✓ Earn from day 1</span>
          </div>
        </motion.div>
      </section>

      {/* Stats Strip */}
      <section style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0", borderBottom: "1px solid #E0E0E0", padding: "36px 16px" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0 md:divide-x" style={{ borderColor: "#E0E0E0" }}>
          {[
            { value: "₹30", label: "Per client/month" },
            { value: "80%", label: "Your share" },
            { value: "48hrs", label: "Build time" },
            { value: "₹0", label: "Skills needed" },
          ].map((s) => (
            <div key={s.label} className="text-center px-2 md:px-4">
              <div style={{ fontFamily: font.heading, fontSize: 36, fontWeight: 700, color: "#00C853", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ backgroundColor: "#fff", padding: "60px 16px" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 8 }}>How It Works</h2>
          <p style={{ color: "#666", fontSize: 15, textAlign: "center", marginBottom: 40 }}>3 simple steps. Earn from day one.</p>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: 1, emoji: "🤖", title: "Build with AI", desc: "We give you a ready prompt. Paste it in Lovable. Professional website ready in 2-4 hours. Zero coding.", time: "⏱️ 2-4 hours" },
              { step: 2, emoji: "📤", title: "Submit to LeadPe", desc: "Paste your Lovable preview URL. We run quality checks automatically. That's it!", time: "⏱️ 5 minutes" },
              { step: 3, emoji: "💰", title: "Earn Forever", desc: "Get paid within 24 hours via UPI. Plus ₹30 every month per live site. Forever. Passively.", time: "💸 Forever" },
            ].map((s) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                style={{ backgroundColor: "#fff", borderRadius: 16, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderTop: "4px solid #00C853", textAlign: "center" }}>
                <span className="inline-block rounded-full text-xs font-semibold" style={{ backgroundColor: "#E8F5E9", color: "#00C853", padding: "4px 14px", marginBottom: 16 }}>Step {s.step}</span>
                <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>{s.emoji}</div>
                <h3 className="text-lg sm:text-xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 16 }}>{s.desc}</p>
                <span className="inline-block rounded-full text-xs font-medium" style={{ backgroundColor: "#F5F5F5", color: "#999", padding: "6px 14px" }}>{s.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section style={{ backgroundColor: "#F5FFF7", padding: "60px 16px" }}>
        <div className="max-w-[540px] mx-auto">
          <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 8 }}>Your Earnings</h2>
          <p style={{ color: "#666", fontSize: 15, textAlign: "center", marginBottom: 28 }}>Slide to see your potential income.</p>

          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: "32px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Websites per month:</p>
            <div style={{ fontFamily: font.heading, fontSize: 44, fontWeight: 700, color: "#00C853", textAlign: "center", marginBottom: 16, lineHeight: 1 }}>
              {sitesPerMonth} <span style={{ fontSize: 16, fontWeight: 500, color: "#666" }}>sites/month</span>
            </div>
            <input type="range" min={1} max={20} value={sitesPerMonth}
              onChange={(e) => setSitesPerMonth(parseInt(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer mb-6"
              style={{ accentColor: "#00C853", backgroundColor: "#E8F5E9" }}
            />

            <div className="grid grid-cols-2" style={{ border: "1px solid #E0E0E0", borderRadius: 12, overflow: "hidden" }}>
              {[
                { label: "This Month", value: `₹${buildingIncome.toLocaleString()}`, color: "#00C853" },
                { label: "After 6 Months", value: `₹${after6Months.toLocaleString()}/mo`, color: "#1A1A1A" },
                { label: "After 1 Year", value: `₹${after12Months.toLocaleString()}/mo`, color: "#1A1A1A" },
                { label: "Year 1 Total", value: `₹${yearTotal.toLocaleString()}+`, color: "#00C853" },
              ].map((c, i) => (
                <div key={c.label} style={{ padding: "16px 12px", borderBottom: i < 2 ? "1px solid #E0E0E0" : undefined, borderRight: i % 2 === 0 ? "1px solid #E0E0E0" : undefined }}>
                  <p style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{c.label}</p>
                  <p style={{ fontFamily: font.heading, fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: "#999", textAlign: "center", marginTop: 16 }}>
              Based on Standard package (₹1,500). Your share = ₹1,200
            </p>

            <Link to="/studio/auth" className="block mt-5 text-center rounded-xl text-base font-semibold"
              style={{ backgroundColor: "#00C853", color: "#fff", padding: "16px", textDecoration: "none", minHeight: 52 }}>
              Start Earning Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section style={{ backgroundColor: "#fff", padding: "60px 16px" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 8 }}>What You Build</h2>
          <p style={{ color: "#666", fontSize: 15, textAlign: "center", marginBottom: 36 }}>Accept any request. Work at your pace.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WEBSITE_PACKAGES.map((pkg) => {
              const pc = pkgColors[pkg.id];
              const isFeatured = pkg.id === "standard";
              return (
                <div key={pkg.id} style={{
                  backgroundColor: "#fff", borderRadius: 14, padding: "24px 20px",
                  boxShadow: isFeatured ? "0 8px 30px rgba(0,200,83,0.12)" : "0 2px 12px rgba(0,0,0,0.06)",
                  borderTop: `4px solid ${pc.border}`,
                  border: isFeatured ? "2px solid #00C853" : undefined,
                  borderTopWidth: 4,
                }}>
                  <span className="inline-block rounded-full text-xs font-bold" style={{ backgroundColor: pc.badgeBg, color: pc.badge, padding: "4px 12px", marginBottom: 12 }}>
                    {pkg.badge}{isFeatured ? " ⭐" : ""}
                  </span>
                  <div style={{ fontFamily: font.heading, fontSize: 28, fontWeight: 700, color: "#1A1A1A", lineHeight: 1 }}>
                    {pkg.priceLabel || `₹${pkg.price.toLocaleString()}`}
                  </div>
                  <p style={{ fontSize: 12, color: "#999", marginBottom: 8, marginTop: 4 }}>one-time</p>
                  <div style={{ height: 1, backgroundColor: "#E0E0E0", margin: "10px 0" }} />
                  <p style={{ fontSize: 12, color: "#666" }}>You Earn:</p>
                  <p style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: pc.earn, lineHeight: 1, marginTop: 2 }}>
                    ₹{pkg.coderEarning.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 14, marginTop: 4 }}>+ ₹30/month passive</p>
                  <div className="space-y-1.5 mb-4">
                    {pkg.features.slice(0, 4).map((f) => (
                      <div key={f} className="flex items-start gap-1.5" style={{ fontSize: 13, color: "#666", lineHeight: 1.4 }}>
                        <span style={{ color: "#00C853", fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pkg.bestFor.map((b) => (
                      <span key={b} className="rounded-full text-xs" style={{ backgroundColor: "#F5F5F5", color: "#666", padding: "2px 8px", fontSize: 10 }}>{b}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section style={{ backgroundColor: "#F5FFF7", padding: "60px 16px" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 8 }}>Tools You Use</h2>
          <p style={{ color: "#666", fontSize: 15, textAlign: "center", marginBottom: 36 }}>All free. Set up in 10 minutes.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { emoji: "🤖", name: "ChatGPT", desc: "Generate website content and copy automatically.", free: "Free ✓", url: "https://chatgpt.com" },
              { emoji: "🎨", name: "Lovable", desc: "Build the actual website visually. No coding needed. Hosts it for you.", free: "Free tier available ✓", url: "https://lovable.dev" },
            ].map((t) => (
              <div key={t.name} style={{ backgroundColor: "#fff", borderRadius: 16, padding: "24px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>{t.emoji}</div>
                <h3 className="text-lg" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>{t.name}</h3>
                <p style={{ fontSize: 14, color: "#666", marginBottom: 10, lineHeight: 1.6 }}>{t.desc}</p>
                <p style={{ fontSize: 14, color: "#00C853", fontWeight: 600, marginBottom: 14 }}>{t.free}</p>
                <button onClick={() => window.open(t.url, "_blank")}
                  className="w-full rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: "#fff", color: "#00C853", border: "2px solid #00C853", padding: "12px 24px", cursor: "pointer", minHeight: 44 }}>
                  Open {t.name} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: "#fff", padding: "60px 16px" }}>
        <div className="max-w-[680px] mx-auto">
          <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 36 }}>Common Questions</h2>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid #E0E0E0" }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between"
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "18px 0", minHeight: 56 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4, paddingRight: 12 }}>{faq.q}</span>
                <ChevronDown size={20} style={{ color: "#666", flexShrink: 0, transform: openFaq === i ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
              </button>
              {openFaq === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ paddingBottom: 18, fontSize: 14, color: "#666", lineHeight: 1.7 }}>
                  {faq.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ backgroundColor: "#1A1A1A", padding: "60px 16px", textAlign: "center" }}>
        <h2 className="text-3xl sm:text-4xl md:text-5xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 14 }}>
          Your First Website<br />Is Waiting. 🚀
        </h2>
        <p style={{ color: "#999", fontSize: 16, marginBottom: 28, lineHeight: 1.6 }}>Join free. Pick a request today. Start earning tomorrow.</p>
        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
          <Link to="/studio/auth"
            className="w-full block text-center rounded-xl text-base font-bold"
            style={{ backgroundColor: "#00C853", color: "#000", padding: "18px 48px", textDecoration: "none", minHeight: 56 }}>
            Join LeadPe Studio Free →
          </Link>
          <Link to="/studio/auth"
            className="w-full block text-center rounded-xl text-sm font-medium"
            style={{ color: "#999", padding: "12px", textDecoration: "none" }}>
            Already a member? Sign In
          </Link>
        </div>
        <p style={{ color: "#444", fontSize: 12, marginTop: 20 }}>Free to join • UPI payments • No commitment</p>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0", padding: "28px 16px" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <span style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700 }}>
              <span style={{ color: "#1A1A1A" }}>Lead</span><span style={{ color: "#00C853" }}>Pe</span>
            </span>
            <span style={{ color: "#999", fontSize: 13, marginLeft: 6 }}>Studio</span>
            <p style={{ color: "#999", fontSize: 12, marginTop: 4 }}>© 2026 LeadPe. Made in India 🇮🇳</p>
          </div>
          <Link to="/" style={{ color: "#666", fontSize: 13, textDecoration: "none" }}>For Businesses →</Link>
        </div>
      </footer>
    </div>
  );
}
