import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Refund() {
  const h2 = { color: "#1A1A1A", fontFamily: "Syne, sans-serif" };
  const p = { color: "#444", fontFamily: "DM Sans, sans-serif", lineHeight: 1.8 };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-[680px] mx-auto bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h1 className="text-2xl font-bold mb-2" style={h2}>Refund and Cancellation Policy</h1>
          <p className="text-sm mb-8" style={{ color: "#999" }}>Last updated: March 2026</p>

          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3" style={h2}>1. Website Building Fee</h2>
            <p className="text-sm" style={p}>
              Full refund if demo is not delivered within 48 hours of order placement. No refund after demo is approved and website goes live. Partial refund at our discretion if quality standards are not met.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3" style={h2}>2. Monthly Subscription</h2>
            <p className="text-sm" style={p}>
              Cancel anytime from your account. No refund for current billing period. Your website remains live until the end of the current period. No partial refunds for unused days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={h2}>3. How to Request a Refund</h2>
            <ul className="text-sm space-y-2 list-disc pl-5" style={p}>
              <li>WhatsApp: +91 9973383902</li>
              <li>Email: support@leadpe.tech</li>
              <li>We respond within 24 hours.</li>
              <li>Approved refunds are processed within 5-7 business days to the original payment method.</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
