import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X, Shield, Zap, Smartphone, Lock, Star, ChevronDown, User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import LeadPeLogo from "@/components/LeadPeLogo";
import { sendWhatsApp, getMessage, ADMIN } from "@/lib/whatsappService";

const businessTypes = [
  { icon: "🏫", name: "Coaching Centre" },
  { icon: "🦷", name: "Doctor / Clinic" },
  { icon: "⚖️", name: "Lawyer / CA" },
  { icon: "💇", name: "Salon / Parlour" },
  { icon: "🏋️", name: "Gym / Fitness" },
  { icon: "🔧", name: "Plumber" },
  { icon: "📸", name: "Photographer" },
  { icon: "🏠", name: "Real Estate" },
  { icon: "🍽️", name: "Restaurant" },
  { icon: "🎓", name: "Dance / Music" },
];

const howItWorks = [
  {
    number: "1",
    icon: "📝",
    title: "Sign Up Free",
    desc: "Tell us about your business. 2 minutes. Zero tech knowledge.",
  },
  {
    number: "2",
    icon: "🤖",
    title: "We Build Your Website",
    desc: "Our AI-powered vibe coders build your professional website in 48 hours. Under ₹2,000. 10x cheaper than any agency.",
  },
  {
    number: "3",
    icon: "💼",
    title: "Appear on Google",
    desc: "Your site goes live with full SEO. Customers in your city find you first.",
  },
  {
    number: "4",
    icon: "📥",
    title: "Get Customers on WhatsApp",
    desc: "Every inquiry lands on your WhatsApp instantly. You call. You close.",
  },
];

const testimonials = [
  {
    stars: 5,
    text: "Mera coaching centre ka pahela WhatsApp inquiry aaya — ek parent ne apne bache ke liye Class 10 Maths tuition pucha. LeadPe ne kaam kiya!",
    name: "Mr. Sanjay Singhania",
    business: "Shiva Study Centre, Vaishali, Bihar ⭐⭐⭐⭐"
  },
  {
    stars: 0,
    text: "Be our next success story.",
    name: "Coming Soon",
    business: "Join LeadPe today and share your results.",
    cta: "Start Free Trial →"
  },
  {
    stars: 0,
    text: "Your business could be here.",
    name: "Coming Soon", 
    business: "First 10 businesses get personal onboarding support.",
    cta: "Get Started Free →"
  }
];

const pricingPlans = [
  {
    name: "Free Trial",
    price: "₹0",
    period: "",
    desc: "21 days free • No credit card needed",
    featured: false,
    features: [
      { text: "Website built in 48 hours", included: true },
      { text: "All leads visible", included: true },
      { text: "WhatsApp ping active", included: true },
      { text: "Full dashboard access", included: true },
      { text: "SEO optimization", included: true },
      { text: "Google Maps setup", included: true },
      { text: "Cancel anytime", included: true },
    ],
    cta: "Start Free →",
    outlined: true,
    note: "After 21 days — upgrade to keep receiving leads",
    link: "/business",
  },
  {
    name: "Growth",
    price: "₹299",
    period: "/month",
    desc: "GST included • Cancel anytime",
    featured: true,
    badge: "Most Popular",
    features: [
      { text: "Everything in Free Trial", included: true },
      { text: "Unlimited leads forever", included: true },
      { text: "Instant WhatsApp ping", included: true },
      { text: "Custom domain", included: true },
      { text: "Weekly Monday report", included: true },
      { text: "Google Maps setup", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Get Growth Plan →",
    outlined: false,
    roi: "1 customer = ₹1,500+ • LeadPe = ₹299/mo",
    link: "/payment?plan=growth&amount=299",
  },
];

// Comparison table data
const comparisonData = {
  headers: ["", "LeadPe", "Agency", "Fiverr", "DIY"],
  rows: [
    { label: "Website Cost", values: ["₹500-2K", "₹20K+", "₹5K+", "₹0"] },
    { label: "Monthly", values: ["₹299", "₹5K+", "₹0", "₹2K+"] },
    { label: "Delivery", values: ["48hrs", "2-4wks", "1-2wks", "Months"] },
    { label: "Leads", values: ["✅", "❌", "❌", "❌"] },
    { label: "WhatsApp Ping", values: ["✅", "❌", "❌", "❌"] },
    { label: "SEO", values: ["✅", "Maybe", "Basic", "❌"] },
    { label: "Support", values: ["✅", "Paid", "None", "❌"] },
  ],
};

const stats = [
  { value: "🚀", label: "Launching 2026" },
  { value: "48 hours", label: "Website live time" },
  { value: "₹2,000", label: "Max website cost" },  
  { value: "₹299", label: "Monthly management" },
  { value: "0%", label: "Hidden charges" }
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const scrollToSignup = () => {
  window.location.href = '/business';
};

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Fetch profile
        const { data: profileData } = await (supabase.from("profiles") as any)
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData);
      }
    };
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setShowDropdown(false);
  };

  const [bizForm, setBizForm] = useState({
    businessName: "",
    businessType: "",
    city: "",
    whatsappNumber: "",
    ownerName: "",
  });
  const [bizErrors, setBizErrors] = useState<{ [key: string]: string }>({});
  const [trialCode, setTrialCode] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.relative')) {
        setDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [dropdownOpen]);

  const updateBizForm = (key: keyof typeof bizForm, value: string) => {
    setBizForm((prev) => ({ ...prev, [key]: value }));
    setBizErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateStep = () => {
    const errors: { [key: string]: string } = {};
    if (!bizForm.businessName.trim()) errors.businessName = "This field is required";
    if (!bizForm.businessType.trim()) errors.businessType = "This field is required";
    if (!bizForm.city.trim()) errors.city = "This field is required";
    if (!bizForm.ownerName.trim()) errors.ownerName = "This field is required";

    const digitsOnly = bizForm.whatsappNumber.replace(/\D/g, "");
    if (!digitsOnly) {
      errors.whatsappNumber = "This field is required";
    } else if (!/^\d{10}$/.test(digitsOnly)) {
      errors.whatsappNumber = "Enter valid 10-digit number";
    }

    setBizErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveSignupToSupabase = async (code: string, attempt = 1) => {
    const createdAt = new Date();
    const whatsappDigits = bizForm.whatsappNumber.replace(/\D/g, "");

    try {
      const { error } = await (supabase as any).from("signups").insert({
        owner_name: bizForm.ownerName,
        business_name: bizForm.businessName,
        business_type: bizForm.businessType,
        city: bizForm.city,
        whatsapp_number: whatsappDigits,
        trial_code: code,
        status: "trial",
        created_at: createdAt.toISOString(),
      });

      if (error) throw error;

      // Send WhatsApp messages using the new service
      const signupData = {
        businessName: bizForm.businessName,
        businessType: bizForm.businessType,
        city: bizForm.city,
        whatsapp: whatsappDigits,
        ownerName: bizForm.ownerName,
        trialCode: code
      };

      // Send to admin
      await sendWhatsApp(
        ADMIN,
        getMessage('newSignup', 'hinglish', signupData),
        null,
        'newSignup',
        'hinglish'
      );

      // Send welcome message to business owner
      await sendWhatsApp(
        whatsappDigits,
        getMessage('welcomeOwner', 'hinglish', signupData),
        null,
        'welcomeOwner',
        'hinglish'
      );

    } catch (err) {
      console.error("Supabase signup save failed", err);
      if (attempt < 2) {
        setTimeout(() => {
          void saveSignupToSupabase(code, attempt + 1);
        }, 3000);
      }
    }
  };

  // Auto-login after signup
  const autoLoginAfterSignup = async () => {
    const phoneDigits = bizForm.whatsappNumber.replace(/\D/g, "");
    const email = `${phoneDigits}@leadpe.business`;
    const password = phoneDigits; // Use phone as default password
    
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.session) {
      // Success - redirect to dashboard
      navigate("/client/dashboard", { replace: true });
    }
  };

  const handleStartTrial = async () => {
    const code = "LP-" + Math.floor(100000 + Math.random() * 900000).toString();
    setTrialCode(code);
    await saveSignupToSupabase(code);
    setShowSuccess(true);
    
    // Try auto-login after 2 seconds (give time for Supabase to process)
    setTimeout(() => {
      void autoLoginAfterSignup();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SECTION 1 — NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E8F5E9] sticky top-0">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <LeadPeLogo theme="light" size="sm" />
          <div className="flex items-center gap-4">
            {user ? (
              // LOGGED IN STATE
              <>
                <Link 
                  to="/client/dashboard" 
                  className="h-9 px-4 rounded-xl text-sm font-semibold text-white bg-[#00C853] hover:bg-[#00A843] shadow-[0_2px_8px_rgba(0,200,83,0.3)] flex items-center"
                >
                  Dashboard <ArrowRight size={14} className="ml-1" />
                </Link>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-9 h-9 rounded-full bg-[#00C853] text-white font-semibold text-sm flex items-center justify-center hover:bg-[#00A843] transition-colors"
                  >
                    {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-xl border border-[#E8F5E9] shadow-[0_4px_24px_rgba(0,0,0,0.08)] py-2 z-50">
                      <Link 
                        to="/client/dashboard" 
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#F0FFF4] transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <LayoutDashboard size={16} className="text-[#00C853]" />
                        My Dashboard
                      </Link>
                      <Link 
                        to="/client/dashboard" 
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#F0FFF4] transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Settings size={16} className="text-[#00C853]" />
                        Settings
                      </Link>
                      <div className="border-t border-[#E8F5E9] my-1" />
                      <button 
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // NOT LOGGED IN STATE
              <>
                <Link to="/auth" className="text-sm text-[#666666] hover:text-[#1A1A1A] transition-colors hidden sm:block">
                  Sign In
                </Link>
                <Button
                  onClick={scrollToSignup}
                  className="h-9 px-4 rounded-xl text-sm font-semibold text-white bg-[#00C853] hover:bg-[#00A843] shadow-[0_2px_8px_rgba(0,200,83,0.3)]"
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* SECTION 2 — HERO */}
      <section 
        className="min-h-[90vh] flex items-center justify-center pt-20 pb-16"
        style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F0FFF4 100%)" }}
      >
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Trust Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-[#E8F5E9] text-[#00A843]">
              <span>🇮🇳</span> Built for Indian Businesses
            </span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.15] mb-6 text-[#1A1A1A]">
              Professional Website.
              <br />
              Under ₹2,000.
              <br />
              Customers on WhatsApp.
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[#666666] mb-8 max-w-2xl mx-auto leading-relaxed">
              We connect you with AI-powered builders who create your website in 48 hours — cheaper than any agency or freelancer. Then every customer inquiry lands on your WhatsApp. 🔔
            </p>

            {/* CTA Button */}
            <Button
              onClick={scrollToSignup}
              className="h-14 px-8 rounded-xl text-lg font-semibold text-white mb-8 bg-[#00C853] hover:bg-[#00A843] shadow-[0_4px_16px_rgba(0,200,83,0.3)] hover:shadow-[0_6px_20px_rgba(0,200,83,0.4)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Free Trial <ArrowRight className="ml-2" size={20} />
            </Button>

            {/* Trust Row */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-[#666666]">
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-[#00C853]" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#00C853]" />
                Live in 48 hours
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-[#00C853]" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone size={14} className="text-[#00C853]" />
                WhatsApp support
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — SOCIAL PROOF */}
      <section className="py-16 bg-white">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-white rounded-2xl p-6 border border-[#E8F5E9] shadow-[0_2px_16px_rgba(0,200,83,0.08)] hover:shadow-[0_4px_24px_rgba(0,200,83,0.12)] transition-all duration-300"
              >
                {/* Stars */}
                {testimonial.stars > 0 && (
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.stars)].map((_, j) => (
                      <Star key={j} size={16} className="fill-[#FFB800] text-[#FFB800]" />
                    ))}
                  </div>
                )}
                {/* Quote */}
                <p className="text-[#1A1A1A] mb-4 leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
                {/* Author */}
                <div className="text-sm">
                  <p className="font-semibold text-[#1A1A1A]">— {testimonial.name}</p>
                  <p className="text-[#666666]">{testimonial.business}</p>
                </div>
                {/* CTA Button */}
                {testimonial.cta && (
                  <Button
                    onClick={scrollToSignup}
                    className="w-full mt-4 h-10 rounded-xl text-sm font-semibold bg-[#00C853] text-white hover:bg-[#00A843] shadow-[0_2px_8px_rgba(0,200,83,0.3)]"
                  >
                    {testimonial.cta}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-[#F8F9FA]">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[#1A1A1A]">How LeadPe Works</h2>
            <p className="text-[#666666]">Simple. Fast. Works.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howItWorks.map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 border border-[#E8F5E9] shadow-[0_2px_16px_rgba(0,200,83,0.08)] hover:shadow-[0_8px_32px_rgba(0,200,83,0.12)] hover:-translate-y-1 transition-all duration-300"
              >
                {/* Number Badge */}
                <div className="w-10 h-10 rounded-full bg-[#00C853] text-white flex items-center justify-center font-bold text-sm mb-4">
                  {item.number}
                </div>
                {/* Icon */}
                <div className="text-3xl mb-3">{item.icon}</div>
                {/* Title */}
                <h3 className="font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
                {/* Desc */}
                <p className="text-sm text-[#666666] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHATSAPP MOCKUP */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#1A1A1A]">
                Your Phone Buzzes.
                <br />
                You Get the Customer.
              </h2>
              <p className="text-[#666666] leading-relaxed mb-6">
                Real-time WhatsApp notifications for every new inquiry. 24/7.
              </p>

              {/* Trust Box */}
              <div className="bg-[#F0FFF4] rounded-xl p-4 border border-[#E8F5E9]">
                <div className="flex items-start gap-3">
                  <Smartphone className="text-[#00C853] mt-0.5" size={20} />
                  <div className="text-sm text-[#1A1A1A]">
                    <p className="font-medium">Works on any WhatsApp</p>
                    <p className="text-[#666666]">No app download needed • No tech knowledge required</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="hidden md:flex justify-center"
            >
              <div className="animate-float">
                {/* Phone Frame */}
                <div className="w-72 bg-white rounded-[32px] border-4 border-[#E8F5E9] p-3 shadow-[0_8px_32px_rgba(0,200,83,0.15)]">
                  {/* Screen */}
                  <div className="bg-[#F8F9FA] rounded-[24px] overflow-hidden">
                    {/* WhatsApp Header */}
                    <div className="bg-[#00C853] text-white px-4 py-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Smartphone size={16} />
                      </div>
                      <span className="font-medium text-sm">WhatsApp</span>
                    </div>
                    {/* Notification */}
                    <div className="p-4">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E8F5E9]">
                        <div className="font-bold text-[#00C853] text-sm mb-3 flex items-center gap-1">
                          <span>🔔</span> NEW INQUIRY — LeadPe
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#666666]">Name:</span>
                            <span className="text-[#1A1A1A] font-medium">Priya Sharma</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#666666]">Interest:</span>
                            <span className="text-[#1A1A1A]">Class 10 Maths</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#666666]">Number:</span>
                            <span className="text-[#00C853] font-medium">98XXXXXX</span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-[#E8F5E9] flex justify-between">
                            <span className="text-[#666666] text-xs">Just now</span>
                            <span className="text-[#00C853] text-xs font-medium">Call Now →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — WHO IS IT FOR */}
      <section className="py-20 bg-[#F0FFF4]">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[#1A1A1A]">
              Every Local Business.
              <br />
              Every City.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {businessTypes.map((bt, i) => (
              <motion.div
                key={bt.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white rounded-2xl p-5 text-center border border-[#E8F5E9] hover:border-[#00C853] hover:shadow-[0_4px_16px_rgba(0,200,83,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className="text-3xl mb-2">{bt.icon}</div>
                <div className="text-sm font-medium text-[#1A1A1A]">{bt.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — STATS */}
      <section className="py-16 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-[#00C853]">
                  {s.value}
                </div>
                <div className="text-sm text-[#666666] mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 — PRICING */}
      <section id="pricing" className="py-20 bg-[#F8F9FA]">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[#1A1A1A]">Simple, Honest Pricing</h2>
            <p className="text-[#666666]">Website building + Monthly management. No hidden fees.</p>
          </motion.div>

          {/* Two Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`relative rounded-2xl p-6 bg-white ${
                  plan.featured 
                    ? "border-2 border-[#00C853] shadow-[0_4px_24px_rgba(0,200,83,0.15)]" 
                    : "border border-[#E0E0E0] shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-[#00C853] text-white">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-[#1A1A1A]">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-4xl font-bold text-[#1A1A1A]">{plan.price}</span>
                  <span className="text-[#666666] text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-[#666666] mb-6">{plan.desc}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check size={14} className="text-[#00C853]" />
                      ) : (
                        <X size={14} className="text-[#E0E0E0]" />
                      )}
                      <span className={f.included ? "text-[#1A1A1A]" : "text-[#999999] line-through"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => {
                    const link = (plan as any).link;
                    if (link) navigate(link);
                    else scrollToSignup();
                  }}
                  className={`w-full rounded-xl h-11 font-semibold ${
                    plan.outlined 
                      ? "border border-[#00C853] text-[#00C853] bg-transparent hover:bg-[#F0FFF4]" 
                      : "bg-[#00C853] text-white hover:bg-[#00A843] shadow-[0_4px_16px_rgba(0,200,83,0.3)]"
                  }`}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h3 className="text-center text-lg font-semibold mb-6 text-[#1A1A1A]">LeadPe vs Others</h3>
            <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E0E0E0]">
                    {comparisonData.headers.map((header, i) => (
                      <th 
                        key={i} 
                        className={`py-4 px-4 text-sm font-semibold text-left ${
                          i === 1 ? "bg-[#F0FFF4] text-[#00C853]" : "text-[#666666]"
                        } ${i === 0 ? "w-24" : ""}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-[#F0F0F0] last:border-0">
                      <td className="py-3 px-4 text-sm font-medium text-[#1A1A1A]">{row.label}</td>
                      {row.values.map((value, colIndex) => (
                        <td 
                          key={colIndex} 
                          className={`py-3 px-4 text-sm ${
                            colIndex === 0 
                              ? "bg-[#F0FFF4] font-semibold text-[#00C853]" 
                              : "text-[#666666]"
                          }`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 9 — LAUNCH OFFER */}
      <section className="py-16 bg-gradient-to-r from-[#00C853] to-[#00A843]">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <span className="text-white text-sm font-medium">🔥 LAUNCH OFFER — First 30 days only</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              "Founding Member" Badge
            </h2>
            <p className="text-xl text-white/90 mb-6">
              Get ₹999 Pro plan with your website FREE
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-bold mb-4 text-white">What You Get:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-white/90">
                  <Check size={20} className="text-white flex-shrink-0 mt-1" />
                  <span>Get your website FREE (worth ₹500-2000)</span>
                </li>
                <li className="flex items-start gap-3 text-white/90">
                  <Check size={20} className="text-white flex-shrink-0 mt-1" />
                  <span>Priority onboarding with our team</span>
                </li>
                <li className="flex items-start gap-3 text-white/90">
                  <Check size={20} className="text-white flex-shrink-0 mt-1" />
                  <span>Direct WhatsApp with founder</span>
                </li>
                <li className="flex items-start gap-3 text-white/90">
                  <Check size={20} className="text-white flex-shrink-0 mt-1" />
                  <span>Lock in ₹999 forever (price goes up later)</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                  <span className="text-2xl font-bold text-white">50</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Limited Spots</h3>
                <p className="text-white/90 mb-6">
                  First 50 businesses only
                </p>
                <Button
                  onClick={scrollToSignup}
                  className="w-full h-12 rounded-xl bg-white text-[#00C853] font-semibold hover:bg-white/90 transition-all duration-300"
                >
                  Claim Your Spot Now
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 10 — SIGNUP FORM */}
      <section id="business-signup" className="py-20 bg-white">
        <div className="container px-4 max-w-md mx-auto">
          <div className="bg-[#F0FFF4] rounded-3xl p-8 md:p-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[#1A1A1A]">Start Free Today</h2>
              <p className="text-[#666666]">No card. No commitment.</p>
            </motion.div>

            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,200,83,0.08)]">
              <AnimatePresence mode="wait">
                {!showSuccess ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Business Name</label>
                      <Input
                        value={bizForm.businessName}
                        onChange={(e) => updateBizForm("businessName", e.target.value)}
                        className={`rounded-xl border h-12 text-base ${bizErrors.businessName ? "border-red-500" : "border-[#E8F5E9]"} focus:border-[#00C853] focus:ring-[#00C853]`}
                        style={{ backgroundColor: "#FAFAFA" }}
                        placeholder="e.g. Perfect Coaching Centre"
                      />
                      {bizErrors.businessName && <p className="text-xs text-red-500 mt-1">{bizErrors.businessName}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Business Type</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className={`w-full rounded-xl text-base px-4 py-3 border outline-none bg-[#FAFAFA] text-left flex items-center justify-between ${bizErrors.businessType ? "border-red-500" : "border-[#E8F5E9]"} focus:border-[#00C853]`}
                          style={{ backgroundColor: "#FFFFFF", border: "1px solid #D0D0D0", borderRadius: "8px", padding: "12px 16px", color: "#1A1A1A" }}
                        >
                          <span>{bizForm.businessType || "Select type"}</span>
                          <span style={{ fontSize: "12px" }}>▼</span>
                        </button>
                        
                        {dropdownOpen && (
                          <div 
                            className="absolute z-50"
                            style={{ 
                              backgroundColor: "#FFFFFF", 
                              border: "1px solid #E0E0E0", 
                              borderRadius: "8px", 
                              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", 
                              maxHeight: "280px", 
                              overflowY: "scroll", 
                              position: "absolute", 
                              zIndex: "9999", 
                              width: "100%",
                              top: "100%",
                              left: "0"
                            }}
                          >
                            {[
                              "Coaching Centre",
                              "Doctor / Clinic", 
                              "Lawyer / CA",
                              "Salon / Parlour",
                              "Gym / Fitness",
                              "Plumber / Electrician",
                              "Photographer",
                              "Real Estate",
                              "Restaurant",
                              "Dance / Music Class",
                              "Other"
                            ].map((option) => (
                              <div
                                key={option}
                                onClick={() => {
                                  updateBizForm("businessType", option);
                                  setDropdownOpen(false);
                                }}
                                style={{ 
                                  padding: "14px 16px", 
                                  color: "#1A1A1A", 
                                  fontSize: "15px", 
                                  cursor: "pointer",
                                  borderBottom: bizForm.businessType === option ? "1px solid #F5F5F5" : "none"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#F0FFF4";
                                  e.currentTarget.style.color = "#00C853";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = bizForm.businessType === option ? "#E8F5E9" : "#FFFFFF";
                                  e.currentTarget.style.color = "#1A1A1A";
                                }}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {bizErrors.businessType && <p className="text-xs text-red-500 mt-1">{bizErrors.businessType}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">City</label>
                      <Input
                        value={bizForm.city}
                        onChange={(e) => updateBizForm("city", e.target.value)}
                        className={`rounded-xl border h-12 text-base ${bizErrors.city ? "border-red-500" : "border-[#E8F5E9]"} focus:border-[#00C853]`}
                        style={{ backgroundColor: "#FFFFFF" }}
                        placeholder="e.g. Mumbai"
                      />
                      {bizErrors.city && <p className="text-xs text-red-500 mt-1">{bizErrors.city}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">WhatsApp Number (10 digits)</label>
                      <Input
                        value={bizForm.whatsappNumber}
                        onChange={(e) => updateBizForm("whatsappNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={`rounded-xl border h-12 text-base ${bizErrors.whatsappNumber ? "border-red-500" : "border-[#E8F5E9]"} focus:border-[#00C853]`}
                        style={{ backgroundColor: "#FFFFFF" }}
                        placeholder="e.g. 9876543210"
                        type="tel"
                      />
                      {bizErrors.whatsappNumber && <p className="text-xs text-red-500 mt-1">{bizErrors.whatsappNumber}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-1.5 text-[#1A1A1A]">Owner Name</label>
                      <Input
                        value={bizForm.ownerName}
                        onChange={(e) => updateBizForm("ownerName", e.target.value)}
                        className={`rounded-xl border h-12 text-base ${bizErrors.ownerName ? "border-red-500" : "border-[#E8F5E9]"} focus:border-[#00C853]`}
                        style={{ backgroundColor: "#FFFFFF" }}
                        placeholder="Your full name"
                      />
                      {bizErrors.ownerName && <p className="text-xs text-red-500 mt-1">{bizErrors.ownerName}</p>}
                    </div>

                    <Button
                      onClick={() => { if (validateStep()) handleStartTrial(); }}
                      className="w-full h-14 rounded-xl text-white font-semibold text-lg bg-[#00C853] hover:bg-[#00A843] shadow-[0_4px_16px_rgba(0,200,83,0.3)] hover:shadow-[0_6px_20px_rgba(0,200,83,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Get My Website Free <ArrowRight size={18} className="ml-2" />
                    </Button>

                    {/* Already have account */}
                    <div className="text-center pt-2">
                      <p className="text-xs text-[#666666]">
                        Already have an account?{" "}
                        <Link to="/auth" className="text-[#00C853] font-medium hover:text-[#00A843]">
                          Sign In →
                        </Link>
                      </p>
                    </div>

                    {/* Trust below form */}
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                        <Shield size={12} className="text-[#00C853]" />
                        <span>Your data is safe with us</span>
                      </div>
                      <p className="text-xs text-[#999999]">We never share your WhatsApp number</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center py-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#00C853]">
                        <Check className="text-white" size={32} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-[#1A1A1A]">Welcome to LeadPe! 🎉</h3>
                      <p className="text-sm text-[#666666] mb-4">
                        Your trial code:{" "}
                        <span className="font-mono font-semibold text-[#00C853]">{trialCode}</span>
                      </p>
                      <p className="text-sm text-[#666666]">
                        Our team will WhatsApp you within 2 hours.
                      </p>
                      <p className="text-sm text-[#00C853] font-medium mt-2">
                        Redirecting to your dashboard...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 — FOOTER */}
      <footer className="bg-white border-t border-[#E8F5E9] py-12">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            {/* Left */}
            <div>
              <LeadPeLogo theme="light" size="md" />
              <p className="text-sm text-[#666666] mt-2">
                Naya Customer, Seedha Aapke Phone Pe 🔔
              </p>
            </div>

            {/* Middle */}
            <div className="flex flex-wrap gap-6 text-sm text-[#666666]">
              <a href="#how-it-works" className="hover:text-[#00C853] transition-colors">How it Works</a>
              <a href="#pricing" className="hover:text-[#00C853] transition-colors">Pricing</a>
              <a href="mailto:hello@leadpe.online" className="hover:text-[#00C853] transition-colors">Contact</a>
              <Link to="/privacy" className="hover:text-[#00C853] transition-colors">Privacy</Link>
            </div>

            {/* Right */}
            <div className="text-sm text-[#666666]">
              <p className="flex items-center gap-2 mb-1">
                <Smartphone size={14} className="text-[#00C853]" />
                +91 99733 83902
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#00C853]">@</span>
                hello@leadpe.online
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E8F5E9]">
            <div className="text-xs text-[#999999]">
              © 2026 LeadPe. Made in India 🇮🇳
            </div>
            <Link to="/studio" className="text-xs text-[#666666] hover:text-[#00C853] transition-colors">
              For web builders → studio.leadpe.online
            </Link>
          </div>
        </div>
      </footer>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

