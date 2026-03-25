import { Link } from "react-router-dom";
import LeadPeLogo from "./LeadPeLogo";

const Footer = () => (
  <footer className="py-12 bg-white border-t" style={{ borderColor: "#E0E0E0" }}>
    <div className="container px-4">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <LeadPeLogo theme="light" size="sm" />
          <span className="text-sm" style={{ color: "#666" }}>India's AI-powered website platform</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm" style={{ color: "#666" }}>
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/services" className="hover:underline">Services</Link>
          <Link to="/contact" className="hover:underline">Contact</Link>
          <Link to="/terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <Link to="/refund" className="hover:underline">Refund Policy</Link>
        </div>
        <div className="text-center text-xs" style={{ color: "#999" }}>
          <p>LeadPe — Hajipur, Bihar, India</p>
          <p>support@leadpe.tech</p>
          <p className="mt-1">© 2026 LeadPe. Made in India 🇮🇳</p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
