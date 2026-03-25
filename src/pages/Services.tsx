import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const packages = [
  {
    title: "Basic Website",
    price: "₹800",
    delivery: "48 hours",
    best: "Individual professionals, Small consultants, Home businesses",
    features: ["5 pages", "Mobile friendly", "WhatsApp button", "Contact form", "Google Maps", "Basic SEO"],
  },
  {
    title: "Standard Website",
    price: "₹1,500",
    delivery: "72 hours",
    best: "Doctors, CAs, Coaching centres",
    features: ["All Basic features", "Photo gallery", "Testimonials section", "AI-written content", "Full SEO"],
    popular: true,
  },
  {
    title: "Premium Website",
    price: "₹3,000",
    delivery: "5 days",
    best: "Agencies, Restaurants, Gyms",
    features: ["All Standard features", "Online booking system", "WhatsApp chatbot", "Blog section", "Advanced animations"],
  },
  {
    title: "Monthly Management",
    price: "₹299/month",
    delivery: "Ongoing",
    best: "All businesses with a live website",
    features: ["Website hosting", "Maintenance", "Customer inquiries on WhatsApp", "Monthly performance report", "Priority support"],
  },
];

export default function Services() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-2" style={{ color: "#1A1A1A" }}>Our Services & Pricing</h1>
          <p className="text-center text-sm mb-10" style={{ color: "#666" }}>All prices in INR. GST included.</p>

          <div className="grid md:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.title} className="bg-white rounded-2xl p-6 relative" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: pkg.popular ? "2px solid #00C853" : "1px solid #E0E0E0" }}>
                {pkg.popular && (
                  <span className="absolute -top-3 left-6 text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: "#00C853" }}>Most Popular</span>
                )}
                <h3 className="text-lg font-bold mb-1" style={{ color: "#1A1A1A" }}>{pkg.title}</h3>
                <p className="text-2xl font-bold mb-1" style={{ color: "#00C853" }}>{pkg.price}</p>
                <p className="text-xs mb-1" style={{ color: "#999" }}>Delivery: {pkg.delivery}</p>
                <p className="text-xs mb-4" style={{ color: "#666" }}>Best for: {pkg.best}</p>
                <ul className="space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="text-sm flex items-start gap-2" style={{ color: "#444" }}>
                      <span style={{ color: "#00C853" }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-sm mt-8" style={{ color: "#666" }}>
            Free 21-day trial included with every website. No card needed to start.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
