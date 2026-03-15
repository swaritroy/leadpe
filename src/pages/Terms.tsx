import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LeadPeLogo from "@/components/LeadPeLogo";

export default function Terms() {
  const sectionStyle = "mb-8";
  const h2Style = { color: "#1A1A1A", fontFamily: "Syne, sans-serif" };
  const pStyle = { color: "#444", fontFamily: "DM Sans, sans-serif", lineHeight: 1.7 };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b" style={{ borderColor: "#E0F2E9" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><LeadPeLogo theme="light" size="sm" /></Link>
          <Link to="/auth" className="text-sm font-medium" style={{ color: "#00C853" }}>← Back to Login</Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-[680px] mx-auto bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Link to="/auth" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "#666" }}>
            <ArrowLeft size={16} /> Back
          </Link>

          <h1 className="text-2xl font-bold mb-2" style={h2Style}>Terms and Conditions</h1>
          <p className="text-sm mb-8" style={{ color: "#999" }}>Last updated: March 2026</p>

          <div className={sectionStyle}>
            <h2 className="text-lg font-bold mb-3" style={h2Style}>1. Service Description</h2>
            <p className="text-sm" style={pStyle}>
              LeadPe provides website building and distribution services for Indian businesses.
              We connect business owners with skilled website builders ("Vibe Coders") who create
              professional websites optimized for local customer acquisition.
            </p>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-lg font-bold mb-3" style={h2Style}>2. Payment Terms</h2>
            <ul className="text-sm space-y-2 list-disc pl-5" style={pStyle}>
              <li>Website building fee is paid once before delivery.</li>
              <li>Monthly management fee: ₹299/month (Growth Plan).</li>
              <li>GST is included in all prices.</li>
              <li>No refund after website goes live.</li>
              <li>A free demo is provided before any payment is required.</li>
            </ul>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-lg font-bold mb-3" style={h2Style}>3. Builder (Vibe Coder) Terms</h2>
            <ul className="text-sm space-y-2 list-disc pl-5" style={pStyle}>
              <li>LeadPe retains 20% of all building fees as platform commission.</li>
              <li>Builders receive 80% of the building fee within 1 hour of payment confirmation.</li>
              <li>Passive income: ₹30/month per live site, paid on the 1st of each month.</li>
              <li>Builders cannot contact LeadPe clients directly for 12 months after project completion.</li>
              <li>Missed deadlines result in penalties. 3 missed deadlines lead to account suspension.</li>
            </ul>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-lg font-bold mb-3" style={h2Style}>4. Privacy Policy</h2>
            <ul className="text-sm space-y-2 list-disc pl-5" style={pStyle}>
              <li>We collect name, phone number, and business details to provide our services.</li>
              <li>We never sell your data to third parties.</li>
              <li>Customer WhatsApp numbers are stored securely and used only for lead delivery.</li>
              <li>Data is deleted upon account closure request.</li>
            </ul>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-lg font-bold mb-3" style={h2Style}>5. Cancellation Policy</h2>
            <ul className="text-sm space-y-2 list-disc pl-5" style={pStyle}>
              <li>Business owners can cancel anytime from their dashboard.</li>
              <li>Website goes offline after the current billing month ends.</li>
              <li>No partial refunds for unused days within a billing period.</li>
            </ul>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-lg font-bold mb-3" style={h2Style}>6. Limitation of Liability</h2>
            <ul className="text-sm space-y-2 list-disc pl-5" style={pStyle}>
              <li>LeadPe is a platform connecting businesses and builders.</li>
              <li>We are not responsible for specific business outcomes or revenue guarantees.</li>
              <li>Google ranking improvements are not guaranteed.</li>
            </ul>
          </div>

          <div className="border-t pt-6 mt-8" style={{ borderColor: "#E0E0E0" }}>
            <p className="text-xs text-center" style={{ color: "#999", fontFamily: "DM Sans, sans-serif" }}>
              By using LeadPe, you agree to these terms. For questions, contact us on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
