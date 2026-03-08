import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Rocket, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";
import { sendWhatsApp, getMessage, ADMIN } from "@/lib/whatsappService";

const businessTypes = [
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
];

const pricingPlans = [
  {
    name: "Free Trial",
    price: "₹0",
    period: "",
    desc: "21 days — no credit card",
    featured: false,
    features: [
      "✓ Website built in 48 hours",
      "✓ All leads visible",
      "✓ WhatsApp ping active",
      "✓ Full dashboard access",
    ],
    cta: "Choose Free Trial",
    value: "trial"
  },
  {
    name: "Growth Plan",
    price: "₹299",
    period: "/month",
    desc: "Unlimited leads + WhatsApp ping",
    featured: true,
    badge: "Most Popular",
    features: [
      "✓ Everything in Free Trial",
      "✓ Unlimited leads forever",
      "✓ Instant WhatsApp ping",
      "✓ Custom domain",
      "✓ Weekly Monday report",
    ],
    cta: "Choose Growth",
    value: "growth"
  }
];

const languages = [
  { code: 'english', label: '🇬🇧 English', flag: '🇬🇧' },
  { code: 'hindi', label: '🇮🇳 Hindi', flag: '🇮🇳' },
  { code: 'hinglish', label: '⚡ Hinglish', flag: '⚡' }
];

export default function Business() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    city: "",
    whatsappNumber: "",
    ownerName: "",
    plan: "growth",
    language: "english"
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (currentStep === 1) {
      if (!formData.businessName.trim()) newErrors.businessName = "Business name is required";
      if (!formData.businessType.trim()) newErrors.businessType = "Business type is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.whatsappNumber.trim()) newErrors.whatsappNumber = "WhatsApp number is required";
      else if (!/^\d{10}$/.test(formData.whatsappNumber.replace(/\D/g, ""))) newErrors.whatsappNumber = "Enter valid 10-digit number";
      if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    } else if (currentStep === 2) {
      if (!formData.plan) newErrors.plan = "Please choose a plan";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlanSelect = (planValue: string) => {
    setFormData(prev => ({ ...prev, plan: planValue }));
    setErrors(prev => ({ ...prev, plan: "" }));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    
    try {
      const code = "LP-" + Math.floor(100000 + Math.random() * 900000).toString();
      const whatsappDigits = formData.whatsappNumber.replace(/\D/g, "");
      
      // Save to Supabase
      const { error: signupError } = await (supabase as any).from("signups").insert({
        owner_name: formData.ownerName,
        business_name: formData.businessName,
        business_type: formData.businessType,
        city: formData.city,
        whatsapp_number: whatsappDigits,
        trial_code: code,
        plan: formData.plan,
        language: formData.language,
        status: "trial",
        created_at: new Date().toISOString(),
      });
      
      if (signupError) throw signupError;
      
      // Auto-create build request
      const { error: buildRequestError } = await (supabase as any).from("build_requests").insert({
        business_id: code,
        business_name: formData.businessName,
        business_type: formData.businessType,
        city: formData.city,
        owner_name: formData.ownerName,
        owner_whatsapp: whatsappDigits,
        plan_selected: formData.plan,
        preferred_language: formData.language,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      
      if (buildRequestError) throw buildRequestError;
      
      // Send WhatsApp messages
      const signupData = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        city: formData.city,
        whatsapp: whatsappDigits,
        ownerName: formData.ownerName,
        trialCode: code,
        plan: formData.plan
      };
      
      // Send to admin
      await sendWhatsApp(
        ADMIN,
        getMessage('newSignup', 'hinglish', signupData),
        null,
        'newSignup',
        'hinglish'
      );
      
      // Send build request notification to admin
      await sendWhatsApp(
        ADMIN,
        getMessage('buildRequestCreated', 'hinglish', signupData),
        null,
        'buildRequestCreated',
        'hinglish'
      );
      
      // Send welcome message to business owner
      await sendWhatsApp(
        whatsappDigits,
        getMessage('welcomeOwner', formData.language as any, signupData),
        null,
        'welcomeOwner',
        formData.language
      );
      
      setShowSuccess(true);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/client/dashboard", { replace: true });
      }, 3000);
      
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step === currentStep
                  ? "bg-[#00C853] text-white"
                  : step < currentStep
                  ? "bg-[#00C853] text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step < currentStep ? <Check size={16} /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-12 h-1 mx-2 transition-all ${
                  step < currentStep ? "bg-[#00C853]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
          Tell us about your business
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>
            Business Name
            <span className="text-xs block text-gray-500">Apne business ka naam</span>
          </label>
          <Input
            value={formData.businessName}
            onChange={(e) => updateForm("businessName", e.target.value)}
            className={`rounded-xl border h-12 text-[#1A1A1A] ${errors.businessName ? "border-red-500" : "border-[#E0E0E0]"} focus:border-[#00C853]`}
            style={{ backgroundColor: "#FFFFFF" }}
            placeholder="e.g. Shiva Study Centre"
          />
          {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>
            Business Type
            <span className="text-xs block text-gray-500">Aap kya karte hain?</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full rounded-xl text-base px-4 py-3 border outline-none bg-[#FAFAFA] text-left flex items-center justify-between ${errors.businessType ? "border-red-500" : "border-[#E0E0E0]"} focus:border-[#00C853]`}
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "8px", padding: "12px 16px", color: "#1A1A1A" }}
            >
              <span>{formData.businessType || "Choose type"}</span>
              <ChevronDown size={16} className={dropdownOpen ? "rotate-180" : ""} />
            </button>
            
            {dropdownOpen && (
              <div 
                className="absolute z-50 w-full mt-1 rounded-xl border border-[#E0E0E0] bg-white shadow-lg max-h-60 overflow-y-auto"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
              >
                {businessTypes.map((type) => (
                  <div
                    key={type}
                    onClick={() => {
                      updateForm("businessType", type);
                      setDropdownOpen(false);
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-[#F0FFF4] transition-colors"
                    style={{ color: "#1A1A1A" }}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.businessType && <p className="text-xs text-red-500 mt-1">{errors.businessType}</p>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>
            City / Town
            <span className="text-xs block text-gray-500">Kaunse shehar mein?</span>
          </label>
          <Input
            value={formData.city}
            onChange={(e) => updateForm("city", e.target.value)}
            className={`rounded-xl border h-12 text-[#1A1A1A] ${errors.city ? "border-red-500" : "border-[#E0E0E0]"} focus:border-[#00C853]`}
            style={{ backgroundColor: "#FFFFFF" }}
            placeholder="e.g. Vaishali, Bihar"
          />
          {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>
            WhatsApp Number
            <span className="text-xs block text-gray-500">Leads isi number pe aayenge</span>
          </label>
          <Input
            value={formData.whatsappNumber}
            onChange={(e) => updateForm("whatsappNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
            className={`rounded-xl border h-12 ${errors.whatsappNumber ? "border-red-500" : "border-[#E0E0E0]"} focus:border-[#00C853]`}
            style={{ backgroundColor: "#FAFAFA" }}
            placeholder="+91 98765 43210"
            type="tel"
          />
          {errors.whatsappNumber && <p className="text-xs text-red-500 mt-1">{errors.whatsappNumber}</p>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>
            Owner Name
            <span className="text-xs block text-gray-500">Aapka naam</span>
          </label>
          <Input
            value={formData.ownerName}
            onChange={(e) => updateForm("ownerName", e.target.value)}
            className={`rounded-xl border h-12 ${errors.ownerName ? "border-red-500" : "border-[#E0E0E0]"} focus:border-[#00C853]`}
            style={{ backgroundColor: "#FAFAFA" }}
            placeholder="e.g. Sanjay Singhania"
          />
          {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
        </div>
      </div>

      <Button
        onClick={handleNext}
        className="w-full h-12 rounded-xl text-white font-semibold"
        style={{ backgroundColor: "#00C853" }}
      >
        Next →
      </Button>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
          Choose your plan
        </h2>
      </div>

      <div className="space-y-4">
        {pricingPlans.map((plan) => (
          <div
            key={plan.value}
            onClick={() => handlePlanSelect(plan.value)}
            className={`rounded-2xl border p-6 cursor-pointer transition-all ${
              formData.plan === plan.value
                ? "border-[#00C853] bg-[#F0FFF4]"
                : "border-[#E0E0E0] bg-white hover:border-[#00C853]"
            }`}
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          >
            {plan.badge && (
              <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3" 
                style={{ 
                  backgroundColor: plan.featured ? "#00C853" : "rgba(0, 200, 83, 0.1)", 
                  color: plan.featured ? "white" : "#00C853" 
                }}>
                {plan.badge}
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.desc}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: "#00C853" }}>{plan.price}</div>
                <div className="text-sm text-gray-500">{plan.period}</div>
              </div>
            </div>
            
            <ul className="space-y-2 mb-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="text-sm flex items-start gap-2" style={{ color: "#1A1A1A" }}>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button
              className={`w-full h-10 rounded-xl font-semibold ${
                formData.plan === plan.value
                  ? "bg-[#00C853] text-white"
                  : "border border-[#00C853] text-[#00C853] bg-white hover:bg-[#F0FFF4]"
              }`}
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>
      
      {errors.plan && <p className="text-sm text-red-500 text-center">{errors.plan}</p>}

      <div className="flex gap-4">
        <Button
          onClick={handlePrevious}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-[#00C853] text-[#00C853] bg-white hover:bg-[#F0FFF4]"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-12 rounded-xl text-white font-semibold"
          style={{ backgroundColor: "#00C853" }}
        >
          Next →
        </Button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#1A1A1A" }}>
          Almost done! 🎉
        </h2>
      </div>

      <div className="bg-[#F8F9FA] rounded-2xl p-6 space-y-3">
        <h3 className="font-semibold text-center mb-4" style={{ color: "#1A1A1A" }}>Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "#666666" }}>Business:</span>
            <span style={{ color: "#1A1A1A", fontWeight: 500 }}>{formData.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "#666666" }}>Type:</span>
            <span style={{ color: "#1A1A1A", fontWeight: 500 }}>{formData.businessType}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "#666666" }}>City:</span>
            <span style={{ color: "#1A1A1A", fontWeight: 500 }}>{formData.city}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "#666666" }}>Plan:</span>
            <span style={{ color: "#1A1A1A", fontWeight: 500 }}>
              {pricingPlans.find(p => p.value === formData.plan)?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "#666666" }}>WhatsApp:</span>
            <span style={{ color: "#1A1A1A", fontWeight: 500 }}>+91 {formData.whatsappNumber}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-3" style={{ color: "#1A1A1A" }}>
          Preferred language for messages:
        </label>
        <div className="flex gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => updateForm("language", lang.code)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                formData.language === lang.code
                  ? "bg-[#00C853] text-white"
                  : "bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:border-[#00C853]"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handlePrevious}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-[#00C853] text-[#00C853] bg-white hover:bg-[#F0FFF4]"
        >
          ← Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 h-12 rounded-xl text-white font-semibold"
          style={{ backgroundColor: "#00C853" }}
        >
          {loading ? "Processing..." : "Get My Website Free →"}
        </Button>
      </div>
      
      {errors.submit && <p className="text-sm text-red-500 text-center">{errors.submit}</p>}
    </motion.div>
  );

  if (showSuccess) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
        <div className="flex items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" 
              style={{ backgroundColor: "rgba(0, 200, 83, 0.1)" }}>
              <Rocket size={40} style={{ color: "#00C853" }} />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#1A1A1A" }}>Welcome to LeadPe! 🎉</h2>
            <p className="mb-2" style={{ color: "#666666" }}>Your signup is successful.</p>
            <p className="text-sm mb-6" style={{ color: "#666666" }}>Redirecting to your dashboard...</p>
            <div className="w-8 h-8 border-2 border-[#00C853] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      {/* Navbar */}
      <nav className="border-b border-[#E0F2E9]" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <LeadPeLogo theme="light" size="sm" />
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-[#00C853] hover:bg-[#F0FFF4]"
          >
            ← Back to Home
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          >
            {renderProgressBar()}
            
            <AnimatePresence mode="wait">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};


