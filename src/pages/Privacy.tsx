import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Privacy() {
  const h2 = { color: "#1A1A1A", fontFamily: "Syne, sans-serif" };
  const p = { color: "#444", fontFamily: "DM Sans, sans-serif", lineHeight: 1.8 };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-[680px] mx-auto bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h1 className="text-2xl font-bold mb-2" style={h2}>Privacy Policy</h1>
          <p className="text-sm mb-8" style={{ color: "#999" }}>Last updated: March 2026</p>

          {[
            { title: "1. Information We Collect", text: "We collect your full name, WhatsApp number, business name, type, and city when you sign up. Payment information is processed securely by Cashfree and never stored on our servers." },
            { title: "2. How We Use Your Information", text: "We use your information to build and deliver your website, send customer inquiries to your WhatsApp, process payments, and send service notifications." },
            { title: "3. Data Sharing", text: "Your WhatsApp number is shared with our website builders only for delivery purposes. We never sell your data to third parties. Payment data is handled entirely by Cashfree Payments India." },
            { title: "4. Your Rights", text: "You can request deletion of your data, update your information anytime from your account settings, or cancel your subscription at any time." },
          ].map((s) => (
            <section key={s.title} className="mb-8">
              <h2 className="text-lg font-bold mb-3" style={h2}>{s.title}</h2>
              <p className="text-sm" style={p}>{s.text}</p>
            </section>
          ))}

          <section>
            <h2 className="text-lg font-bold mb-3" style={h2}>5. Contact</h2>
            <ul className="text-sm space-y-1" style={p}>
              <li>Email: support@leadpe.tech</li>
              <li>WhatsApp: +91 9973383902</li>
              <li>Address: Hajipur, Vaishali, Bihar — 844101</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
