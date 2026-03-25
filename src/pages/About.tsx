import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function About() {
  const h2 = { color: "#1A1A1A", fontFamily: "Syne, sans-serif" };
  const p = { color: "#444", fontFamily: "DM Sans, sans-serif", lineHeight: 1.8 };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-[680px] mx-auto bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h1 className="text-2xl font-bold mb-6" style={h2}>About LeadPe</h1>

          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3" style={h2}>Who We Are</h2>
            <p className="text-sm" style={p}>
              LeadPe is India's AI-powered website distribution platform built for local businesses — doctors, CAs, coaching centres, contractors, and professionals. We deliver professional websites in 48 hours, starting at ₹800. Every customer inquiry goes directly to the business owner's WhatsApp.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3" style={h2}>Our Mission</h2>
            <p className="text-sm" style={p}>
              We believe every Indian professional deserves an online presence — regardless of their city, budget, or technical knowledge. We are starting from Bihar and expanding across India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={h2}>Legal Details</h2>
            <ul className="text-sm space-y-1" style={p}>
              <li><strong>Business Name:</strong> LeadPe</li>
              <li><strong>Founder:</strong> Swarit Roy</li>
              <li><strong>Established:</strong> 2026</li>
              <li><strong>Location:</strong> Hajipur, Vaishali, Bihar — 844101</li>
              <li><strong>Website:</strong> leadpe.tech</li>
              <li><strong>Email:</strong> support@leadpe.tech</li>
              <li><strong>WhatsApp:</strong> +91 9973383902</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
