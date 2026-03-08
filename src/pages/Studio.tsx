import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { WEBSITE_PACKAGES } from "@/lib/packages";

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
    { q: "When do I get paid?", a: "Within 24 hours of delivery via UPI directly to your account. Plus ₹30 every month per live client. Forever." },
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
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white" style={{ borderBottom: "1px solid #E0E0E0", height: 64 }}>
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span style={{ fontFamily: font.heading, fontSize: 22, fontWeight: 700 }}>
              <span style={{ color: "#1A1A1A" }}>Lead</span><span style={{ color: "#00C853" }}>Pe</span>
            </span>
            <span style={{ color: "#E0E0E0", fontSize: 20 }}>|</span>
            <span style={{ color: "#00C853", fontSize: 16, fontFamily: font.body, fontWeight: 500 }}>Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/studio/auth" style={{ color: "#666", fontSize: 14, textDecoration: "none" }}>Sign In</Link>
            <Link to="/studio/auth"
              style={{ backgroundColor: "#00C853", color: "#fff", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
              Join Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "110px 24px 80px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span style={{ display: "inline-block", backgroundColor: "#E8F5E9", color: "#00C853", borderRadius: 100, padding: "8px 20px", fontSize: 14, fontWeight: 500, marginBottom: 28 }}>
            🇮🇳 Built for Non-Technical Indians
          </span>

          <h1 className="text-4xl md:text-6xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.1, marginBottom: 0 }}>
            Build Websites with AI.
            <br />
            <span style={{ textDecoration: "underline", textDecorationColor: "#00C853", textUnderlineOffset: 8, textDecorationThickness: 3 }}>Earn Every Month.</span>
          </h1>

          <p style={{ color: "#666", fontSize: 18, maxWidth: 500, margin: "24px auto 0", lineHeight: 1.7 }}>
            Use ChatGPT + Lovable to build websites for local businesses. No coding. No degree. Just AI tools.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link to="/studio/auth"
              style={{ backgroundColor: "#00C853", color: "#fff", borderRadius: 10, padding: "16px 36px", fontSize: 16, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
              Start Earning Free →
            </Link>
            <a href="#how-it-works"
              style={{ backgroundColor: "#fff", color: "#1A1A1A", border: "2px solid #E0E0E0", borderRadius: 10, padding: "14px 36px", fontSize: 16, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
              See How It Works
            </a>
          </div>

          <p style={{ color: "#999", fontSize: 13, marginTop: 24, letterSpacing: 0.3 }}>
            ✓ Free to join &nbsp;&nbsp; ✓ No coding needed &nbsp;&nbsp; ✓ Earn from day 1
          </p>
        </motion.div>
      </section>

      {/* Stats Strip */}
      <section style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0", borderBottom: "1px solid #E0E0E0", padding: "44px 24px" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x" style={{ borderColor: "#E0E0E0" }}>
          {[
            { value: "₹30", label: "Per client per month" },
            { value: "80%", label: "Your earnings share" },
            { value: "48hrs", label: "Average build time" },
            { value: "₹0", label: "Coding skills needed" },
          ].map((s) => (
            <div key={s.label} className="text-center px-4">
              <div style={{ fontFamily: font.heading, fontSize: 44, fontWeight: 700, color: "#00C853", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ backgroundColor: "#fff", padding: "80px 24px" }}>
        <div className="max-w-4xl mx-auto">
          <h2 style={{ fontFamily: font.heading, fontSize: 40, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 8 }}>How It Works</h2>
          <p style={{ color: "#666", fontSize: 16, textAlign: "center", marginBottom: 48 }}>3 simple steps. Earn from day one.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: 1, emoji: "🤖", title: "Build with AI", desc: "We give you a ready prompt. Paste it in ChatGPT. Copy output to Lovable. Professional website ready in 2-4 hours.", time: "⏱️ 2-4 hours" },
              { step: 2, emoji: "📤", title: "Submit to LeadPe", desc: "Submit your GitHub link. We run quality checks and auto deploy your website instantly.", time: "⏱️ 5 minutes" },
              { step: 3, emoji: "💰", title: "Earn Forever", desc: "Get paid within 24 hours via UPI. Plus ₹30 every month per live site. Forever. Passively.", time: "💸 Forever" },
            ].map((s) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                style={{ backgroundColor: "#fff", borderRadius: 16, padding: 36, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderTop: "4px solid #00C853", textAlign: "center" }}>
                <span style={{ display: "inline-block", backgroundColor: "#E8F5E9", color: "#00C853", borderRadius: 100, padding: "4px 16px", fontSize: 12, fontWeight: 600, marginBottom: 20 }}>Step {s.step}</span>
                <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{s.emoji}</div>
                <h3 style={{ fontFamily: font.heading, fontSize: 22, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: "#666", lineHeight: 1.7, marginBottom: 20 }}>{s.desc}</p>
                <span style={{ backgroundColor: "#F5F5F5", color: "#999", borderRadius: 100, padding: "6px 16px", fontSize: 12, fontWeight: 500 }}>{s.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section style={{ backgroundColor: "#F5FFF7", padding: "80px 24px" }}>
        <div className="max-w-[580px] mx-auto">
          <h2 style={{ fontFamily: font.heading, fontSize: 40, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 8 }}>Calculate Your Earnings</h2>
          <p style={{ color: "#666", fontSize: 16, textAlign: "center", marginBottom: 36 }}>Move the slider to see your potential income.</p>

          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: "40px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 15, color: "#666", marginBottom: 8 }}>Websites per month:</p>
            <div style={{ fontFamily: font.heading, fontSize: 52, fontWeight: 700, color: "#00C853", textAlign: "center", marginBottom: 20, lineHeight: 1 }}>
              {sitesPerMonth} <span style={{ fontSize: 20, fontWeight: 500, color: "#666" }}>websites/month</span>
            </div>
            <input type="range" min={1} max={20} value={sitesPerMonth}
              onChange={(e) => setSitesPerMonth(parseInt(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer mb-8"
              style={{ accentColor: "#00C853", backgroundColor: "#E8F5E9" }}
            />

            <div className="grid grid-cols-2" style={{ border: "1px solid #E0E0E0", borderRadius: 12, overflow: "hidden" }}>
              {[
                { label: "This Month", value: `₹${buildingIncome.toLocaleString()}`, color: "#00C853" },
                { label: "After 6 Months (Passive)", value: `₹${after6Months.toLocaleString()}/mo`, color: "#1A1A1A" },
                { label: "After 1 Year (Passive)", value: `₹${after12Months.toLocaleString()}/mo`, color: "#1A1A1A" },
                { label: "Year 1 Total", value: `₹${yearTotal.toLocaleString()}+`, color: "#00C853" },
              ].map((c, i) => (
                <div key={c.label} style={{ padding: 24, borderBottom: i < 2 ? "1px solid #E0E0E0" : undefined, borderRight: i % 2 === 0 ? "1px solid #E0E0E0" : undefined }}>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{c.label}</p>
                  <p style={{ fontFamily: font.heading, fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 20 }}>
              Based on Standard package (₹1,500). Your share = ₹1,200
            </p>

            <Link to="/studio/auth" className="block mt-6"
              style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", borderRadius: 10, padding: "16px", fontSize: 16, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "block" }}>
              Start Earning Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section style={{ backgroundColor: "#fff", padding: "80px 24px" }}>
        <div className="max-w-5xl mx-auto">
          <h2 style={{ fontFamily: font.heading, fontSize: 40, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 8 }}>What You Will Build</h2>
          <p style={{ color: "#666", fontSize: 16, textAlign: "center", marginBottom: 48 }}>Accept any request. Work at your own pace.</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {WEBSITE_PACKAGES.map((pkg) => {
              const pc = pkgColors[pkg.id];
              const isFeatured = pkg.id === "standard";
              return (
                <div key={pkg.id} style={{
                  backgroundColor: "#fff", borderRadius: 12, padding: 24,
                  boxShadow: isFeatured ? "0 8px 30px rgba(0,200,83,0.12)" : "0 2px 12px rgba(0,0,0,0.06)",
                  borderTop: `4px solid ${pc.border}`,
                  border: isFeatured ? "2px solid #00C853" : undefined,
                  borderTopWidth: 4,
                }}>
                  <span style={{ display: "inline-block", backgroundColor: pc.badgeBg, color: pc.badge, borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
                    {pkg.badge}{isFeatured ? " ⭐" : ""}
                  </span>
                  <div style={{ fontFamily: font.heading, fontSize: 32, fontWeight: 700, color: "#1A1A1A", lineHeight: 1 }}>
                    {pkg.priceLabel || `₹${pkg.price.toLocaleString()}`}
                  </div>
                  <p style={{ fontSize: 12, color: "#999", marginBottom: 8, marginTop: 4 }}>one-time</p>
                  <div style={{ height: 1, backgroundColor: "#E0E0E0", margin: "12px 0" }} />
                  <p style={{ fontSize: 12, color: "#666" }}>You Earn:</p>
                  <p style={{ fontFamily: font.heading, fontSize: 22, fontWeight: 700, color: pc.earn, lineHeight: 1, marginTop: 2 }}>
                    ₹{pkg.coderEarning.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 16, marginTop: 4 }}>+ ₹30/month passive</p>
                  <div className="space-y-1.5 mb-4">
                    {pkg.features.slice(0, 5).map((f) => (
                      <div key={f} className="flex items-start gap-1.5" style={{ fontSize: 13, color: "#666", lineHeight: 1.4 }}>
                        <span style={{ color: "#00C853", fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>Best For:</p>
                  <div className="flex flex-wrap gap-1">
                    {pkg.bestFor.map((b) => (
                      <span key={b} style={{ backgroundColor: "#F5F5F5", color: "#666", borderRadius: 100, padding: "2px 8px", fontSize: 10 }}>{b}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section style={{ backgroundColor: "#F5FFF7", padding: "80px 24px" }}>
        <div className="max-w-4xl mx-auto">
          <h2 style={{ fontFamily: font.heading, fontSize: 40, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 8 }}>Tools You Will Use</h2>
          <p style={{ color: "#666", fontSize: 16, textAlign: "center", marginBottom: 48 }}>All free. Set up in 10 minutes.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "🤖", name: "ChatGPT", desc: "Generate website content and copy automatically.", free: "Free ✓", url: "https://chatgpt.com" },
              { emoji: "🎨", name: "Lovable", desc: "Build the actual website visually. No coding needed.", free: "Free tier available ✓", url: "https://lovable.dev" },
              { emoji: "📁", name: "GitHub", desc: "Save and submit your website to LeadPe.", free: "Free ✓", url: "https://github.com" },
            ].map((t) => (
              <div key={t.name} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{t.emoji}</div>
                <h3 style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>{t.name}</h3>
                <p style={{ fontSize: 15, color: "#666", marginBottom: 12, lineHeight: 1.6 }}>{t.desc}</p>
                <p style={{ fontSize: 14, color: "#00C853", fontWeight: 600, marginBottom: 16 }}>{t.free}</p>
                <button onClick={() => window.open(t.url, "_blank")}
                  style={{ backgroundColor: "#fff", color: "#00C853", border: "2px solid #00C853", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Open {t.name} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: "#fff", padding: "80px 24px" }}>
        <div className="max-w-[680px] mx-auto">
          <h2 style={{ fontFamily: font.heading, fontSize: 40, fontWeight: 700, color: "#1A1A1A", textAlign: "center", marginBottom: 48 }}>Common Questions</h2>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid #E0E0E0" }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between"
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "20px 0" }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4, paddingRight: 16 }}>{faq.q}</span>
                <span style={{ color: "#666", fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ paddingBottom: 20, fontSize: 15, color: "#666", lineHeight: 1.7 }}>
                  {faq.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ backgroundColor: "#1A1A1A", padding: "80px 24px", textAlign: "center" }}>
        <h2 className="text-4xl md:text-5xl" style={{ fontFamily: font.heading, fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 16 }}>
          Your First Website<br />Is Waiting. 🚀
        </h2>
        <p style={{ color: "#999", fontSize: 18, marginBottom: 36, lineHeight: 1.6 }}>Join free. Pick a request today. Start earning tomorrow.</p>
        <Link to="/studio/auth"
          style={{ display: "inline-block", backgroundColor: "#00C853", color: "#000", borderRadius: 10, padding: "18px 48px", fontSize: 18, fontWeight: 700, textDecoration: "none" }}>
          Join LeadPe Studio Free →
        </Link>
        <p style={{ color: "#444", fontSize: 13, marginTop: 20 }}>Free to join • UPI payments • No commitment</p>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0", padding: "32px 24px" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <span style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700 }}>
              <span style={{ color: "#1A1A1A" }}>Lead</span><span style={{ color: "#00C853" }}>Pe</span>
            </span>
            <span style={{ color: "#999", fontSize: 14, marginLeft: 8 }}>Studio</span>
            <p style={{ color: "#999", fontSize: 13, marginTop: 4 }}>© 2026 LeadPe. Made in India 🇮🇳</p>
          </div>
          <Link to="/" style={{ color: "#666", fontSize: 13, textDecoration: "none" }}>For Businesses →</Link>
        </div>
      </footer>
    </div>
  );
}
