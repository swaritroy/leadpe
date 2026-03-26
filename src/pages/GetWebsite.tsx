import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Share2, Copy, ChevronDown, ChevronUp, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";
import { WEBSITE_PACKAGES } from "@/lib/packages";
import { logEvent, ORDER_EVENTS } from "@/lib/evidence";

const businessTypes = [
  "Doctor / Clinic", "CA / Lawyer / CS", "Coaching Institute", "Contractor / Plumber",
  "Photographer / Videographer", "Architect", "Gym / Fitness Trainer", "Digital Agency",
  "Salon / Parlour", "Restaurant / Cafe", "Individual Consultant", "Other",
];

const STEPS = ["Business", "Package", "Details", "Done"];

const COLOR_OPTIONS = [
  { label: "Green", value: "#00C853" },
  { label: "Blue", value: "#2563EB" },
  { label: "Purple", value: "#7C3AED" },
  { label: "Orange", value: "#EA580C" },
  { label: "Black", value: "#1A1A1A" },
  { label: "Surprise", value: "rainbow" },
];

export default function GetWebsite() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderResult, setOrderResult] = useState<Record<string, string> | null>(null);

  // Step 1: Business
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");

  // Step 2: Package
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  // Step 3: Assets
  const [colorPref, setColorPref] = useState("#00C853");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [oneLineDesc, setOneLineDesc] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const name = profile?.full_name || "";
  const email = profile?.email || "";

  useEffect(() => {
    if (profile) {
      if (profile.whatsapp_number) setWhatsapp(profile.whatsapp_number);
      if (profile.city) setCity(profile.city);
      if (profile.business_name) setBusinessName(profile.business_name);
      if (profile.business_type) setBusinessType(profile.business_type);
    }
  }, [profile]);

  const pkg = WEBSITE_PACKAGES.find((p) => p.id === selectedPackage)!;

  const canNext = useCallback(() => {
    const phone = whatsapp.replace(/\D/g, "");
    return phone.length === 10 && businessName.trim() && businessType.trim() && city.trim();
  }, [whatsapp, businessName, businessType, city]);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }, []);

  const handlePhotosChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  }, []);

  const removePhoto = useCallback((idx: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const customerName = profile?.full_name || name || businessName;
      const customerWhatsapp = whatsapp.replace(/\D/g, "");

      // Upload images to Supabase Storage
      let logoUrl: string | null = null;
      const photoUrls: string[] = [];

      if (logoFile && user) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/logo/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("business-assets")
          .upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("business-assets").getPublicUrl(path);
          logoUrl = urlData.publicUrl;
        }
      }

      if (photoFiles.length > 0 && user) {
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i];
          const ext = file.name.split(".").pop();
          const path = `${user.id}/photos/photo-${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("business-assets")
            .upload(path, file, { upsert: true });
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("business-assets").getPublicUrl(path);
            photoUrls.push(urlData.publicUrl);
          }
        }
      }

      // 1. Insert order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName,
          customer_whatsapp: customerWhatsapp,
          business_name: businessName,
          business_type: businessType,
          city: city,
          package_id: selectedPackage,
          package_price: pkg.price,
          total_price: pkg.price,
          color_preference: colorPref,
          special_requirements: additionalDetails || null,
          logo_url: logoUrl,
          photos_urls: photoUrls.length > 0 ? photoUrls : null,
          status: "pending",
          payment_status: "pending",
        })
        .select("id, order_id")
        .single();

      if (orderError) throw orderError;

      // 2. Generate lead widget HTML
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const leadWidgetHtml = `<!-- LeadPe Lead Capture Widget -->
<div id="leadpe-widget">
  <div style="background:#fff;border:2px solid #00C853;border-radius:16px;padding:24px;max-width:400px;margin:20px auto;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,200,83,0.15)">
    <h3 style="color:#1A1A1A;margin:0 0 8px;font-size:20px">Get Free Consultation 📞</h3>
    <p style="color:#666;margin:0 0 20px;font-size:14px">Leave your details. We'll call you back!</p>
    <input id="lp-name" type="text" placeholder="Your Name" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:12px;box-sizing:border-box"/>
    <input id="lp-phone" type="tel" placeholder="WhatsApp Number" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:12px;box-sizing:border-box"/>
    <input id="lp-interest" type="text" placeholder="What are you looking for?" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:16px;box-sizing:border-box"/>
    <button onclick="submitLeadPeLead()" style="width:100%;background:#00C853;color:white;border:none;border-radius:10px;padding:14px;font-size:16px;font-weight:bold;cursor:pointer">Get Callback 📲</button>
    <p style="text-align:center;margin:12px 0 0;font-size:11px;color:#999">Powered by LeadPe 🌱</p>
  </div>
</div>
<script>
async function submitLeadPeLead(){var n=document.getElementById('lp-name').value;var p=document.getElementById('lp-phone').value;var i=document.getElementById('lp-interest').value;if(!n||!p){alert('Please fill name and phone');return}var btn=document.querySelector('#leadpe-widget button');btn.textContent='Sending...';btn.disabled=true;try{var res=await fetch('${supabaseUrl}/rest/v1/leads',{method:'POST',headers:{'Content-Type':'application/json','apikey':'${supabaseKey}','Authorization':'Bearer ${supabaseKey}','Prefer':'return=minimal'},body:JSON.stringify({business_id:'${user?.id}',customer_name:n,phone:p.replace(/\\D/g,''),message:i,source:'website',status:'new'})});if(res.ok){document.getElementById('leadpe-widget').innerHTML='<div style="text-align:center;padding:40px 20px;background:#F0FFF4;border-radius:16px;border:2px solid #00C853"><div style="font-size:48px">✅</div><h3 style="color:#1A1A1A">Request Received!</h3><p style="color:#666">We will call you back within 2 hours.</p></div>'}else{btn.textContent='Get Callback 📲';btn.disabled=false;alert('Error. Please try again.')}}catch(e){btn.textContent='Get Callback 📲';btn.disabled=false;alert('Error. Please try again.')}}
</script>`;

      // 3. Generate AI build prompt with image URLs
      let aiPrompt = "";
      try {
        const { data: aiData } = await supabase.functions.invoke("ai-generate", {
          body: {
            type: "build_prompt",
            data: {
              business_name: businessName,
              business_type: businessType,
              city: city,
              whatsapp_number: customerWhatsapp,
              owner_name: customerName,
              one_line_description: oneLineDesc,
              color_preference: colorPref === "rainbow" ? "Surprise me with a vibrant palette" : colorPref,
              special_requirements: additionalDetails || "",
              package_name: pkg.name,
              package_features: pkg.features.join(", "),
              lead_widget_html: leadWidgetHtml,
              logo_url: logoUrl || "",
              photos_urls: photoUrls.join(", "),
            },
          },
        });
        aiPrompt = aiData?.result || "";
      } catch {
        console.log("AI prompt generation failed, using fallback");
      }

      if (!aiPrompt) {
        aiPrompt = `Build a professional ${businessType} website for ${businessName} in ${city}.\nWhatsApp: ${customerWhatsapp}\nColor: ${colorPref}\nPackage: ${pkg.name} (${pkg.features.join(", ")})\n${oneLineDesc ? `Tagline: ${oneLineDesc}` : ""}\n${additionalDetails ? `Requirements: ${additionalDetails}` : ""}\n${logoUrl ? `\nLOGO: ${logoUrl}` : ""}\n${photoUrls.length > 0 ? `\nPHOTOS: ${photoUrls.join(", ")}` : ""}\n\nMUST include LeadPe lead widget in contact section.\nMobile-first, SEO optimized for ${city}.`;
      }

      // 4. Insert build request
      const { error: brError } = await supabase.from("build_requests").insert({
        business_id: user?.id || null,
        business_name: businessName,
        business_type: businessType,
        city: city,
        owner_name: customerName,
        owner_whatsapp: customerWhatsapp,
        package_id: selectedPackage,
        package_price: pkg.price,
        coder_earning: pkg.coderEarning,
        ai_prompt: aiPrompt,
        special_requirements: additionalDetails || null,
        status: "pending",
      });

      if (brError) throw brError;

      // 5. Create businesses row (required for leads RLS)
      if (user) {
        const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        await supabase.from("businesses").upsert({
          id: user.id,
          owner_id: user.id,
          name: businessName,
          slug: slug || "biz-" + Date.now(),
          business_type: businessType,
          city: city,
          whatsapp_number: customerWhatsapp,
          owner_name: customerName,
          description: oneLineDesc || "",
        }, { onConflict: "id" });
      }

      // 6. Update profile
      if (user) {
        await supabase
          .from("profiles")
          .update({
            website_status: "pending",
            business_name: businessName,
            business_type: businessType,
            city: city,
            whatsapp_number: customerWhatsapp,
          })
          .eq("user_id", user.id);
      }

      // 7. Navigate to dashboard
      navigate("/client/dashboard", { replace: true });
    } catch (err: unknown) {
      console.error("Order error:", err);
      toast({
        title: "Something went wrong. Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- SUCCESS PAGE ---
  if (submitted && orderResult) {
    const demoDate = new Date(Date.now() + (pkg?.deliveryDays || 2) * 86400000).toLocaleDateString("en-IN");
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F5FFF7" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-6xl mb-4 text-center">🎉</motion.div>
          <h1 className="text-2xl font-extrabold text-center mb-2" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Order Placed!</h1>

          <div className="rounded-xl p-4 text-left mb-4 border-2" style={{ backgroundColor: "#F0FFF4", borderColor: "#00C853" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>📋 Order Details</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span style={{ color: "#666" }}>Order ID</span><span className="font-bold" style={{ color: "#1A1A1A" }}>{orderResult.order_id}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Business</span><span className="font-bold" style={{ color: "#1A1A1A" }}>{orderResult.business_name}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Package</span><span className="font-bold" style={{ color: "#1A1A1A" }}>{pkg?.name}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Domain</span><span className="font-bold" style={{ color: "#00C853" }}>{orderResult.own_domain}</span></div>
              <div className="flex justify-between"><span style={{ color: "#666" }}>Demo by</span><span className="font-bold" style={{ color: "#00C853" }}>{demoDate}</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between" style={{ borderColor: "#00C85330" }}>
                <span className="font-bold" style={{ color: "#1A1A1A" }}>Total</span>
                <span className="font-bold text-lg" style={{ color: "#00C853" }}>₹{pkg.price.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-3 px-3 py-2 rounded-lg text-center" style={{ backgroundColor: "#00C85318" }}>
              <span className="text-xs font-bold" style={{ color: "#00C853" }}>💚 Pay ONLY after you see the demo</span>
            </div>
          </div>

          <div className="rounded-xl p-4 text-left text-xs mb-4" style={{ backgroundColor: "#FAFAFA", color: "#666" }}>
            <p className="font-bold text-sm mb-2" style={{ color: "#1A1A1A" }}>What happens next?</p>
            <div className="space-y-2">
              <p>1. 📋 We build your demo ({pkg?.deliveryDays} days)</p>
              <p>2. 👀 You review on your dashboard</p>
              <p>3. ✅ Love it? Pay ₹{pkg.price.toLocaleString()}</p>
              <p>4. 🚀 Site goes live instantly</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm" style={{ borderColor: "#E0E0E0" }}
              onClick={() => { navigator.clipboard.writeText(orderResult.build_record || ""); toast({ title: "Copied!" }); }}>
              <Copy size={14} className="mr-1" /> Copy Record
            </Button>
            <Button className="flex-1 h-10 rounded-xl text-sm text-white" style={{ backgroundColor: "#25D366" }}
              onClick={() => {
                const msg = encodeURIComponent(`${orderResult.build_record}`);
                window.open(`https://wa.me/91${orderResult.customer_whatsapp}?text=${msg}`, "_blank");
              }}>
              <Share2 size={14} className="mr-1" /> Share
            </Button>
          </div>

          <Button onClick={() => navigate("/client/dashboard", { replace: true })} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
            Continue to Dashboard →
          </Button>
        </motion.div>
      </div>
    );
  }

  // --- 4-STEP WIZARD ---
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm" style={{ borderColor: "#E0F2E9" }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><LeadPeLogo theme="light" size="sm" /></Link>
          <Link to="/studio/auth"><Button variant="ghost" className="text-sm" style={{ color: "#666" }}>I'm a builder →</Button></Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-[520px] mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > i + 1 ? "text-white" : step === i + 1 ? "text-white shadow-lg" : "text-[#999]"
                }`} style={{ backgroundColor: step >= i + 1 ? "#00C853" : "#E0E0E0" }}>
                  {step > i + 1 ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-xs ${step >= i + 1 ? "text-[#1A1A1A] font-medium" : "text-[#999]"}`}>{label}</span>
                {i < STEPS.length - 1 && <div className="w-6 h-0.5 mx-0.5" style={{ backgroundColor: step > i + 1 ? "#00C853" : "#E0E0E0" }} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1 — Business Details */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                className="bg-white rounded-2xl p-6 shadow-lg" style={{ border: "1px solid #E0F2E9" }}>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Your Business</h2>
                <p className="text-sm mb-6" style={{ color: "#999" }}>Tell us what you do.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Your Name</label>
                    <Input value={name} readOnly className="h-12 rounded-xl cursor-not-allowed" style={{ backgroundColor: "#F5F5F5", border: "1px solid #E0E0E0" }} />
                    <p className="text-[10px] mt-1" style={{ color: "#999" }}>From your account.</p>
                  </div>
                  {email && !email.endsWith("@leadpe.com") && (
                    <div>
                      <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Email</label>
                      <Input value={email} readOnly className="h-12 rounded-xl cursor-not-allowed" style={{ backgroundColor: "#F5F5F5", border: "1px solid #E0E0E0" }} />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>WhatsApp Number *</label>
                    <Input type="tel" value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="h-12 rounded-xl bg-white" style={{ border: "1px solid #E0E0E0" }} placeholder="98765 43210" />
                    <p className="text-[10px] mt-1" style={{ color: "#999" }}>All customer inquiries come here</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Business Name *</label>
                    <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                      className="h-12 rounded-xl bg-white" style={{ border: "1px solid #E0E0E0" }} placeholder="Ramesh Coaching Centre" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Business Type *</label>
                    <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full h-12 rounded-xl bg-white text-sm px-3" style={{ border: "1px solid #E0E0E0", color: "#111" }}>
                      <option value="">Select type</option>
                      {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>City *</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)}
                      className="h-12 rounded-xl bg-white" style={{ border: "1px solid #E0E0E0" }} placeholder="Vaishali, Bihar" />
                  </div>
                  <Button onClick={() => setStep(2)} disabled={!canNext()} className="w-full h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
                    Next — Choose Package → <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Package Selection */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4" style={{ border: "1px solid #E0F2E9" }}>
                  <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Choose Your Package</h2>
                  <p className="text-sm mb-6" style={{ color: "#999" }}>Free demo before any payment.</p>
                  <div className="space-y-3">
                    {WEBSITE_PACKAGES.filter(p => p.id !== "complex").map((p) => (
                      <div key={p.id} className="rounded-xl overflow-hidden transition-all"
                        style={{ border: selectedPackage === p.id ? "2px solid #00C853" : "2px solid #E0E0E0", backgroundColor: selectedPackage === p.id ? "#F0FFF4" : "#fff" }}>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: p.color }}>{p.badge}</span>
                              <span className="font-bold" style={{ color: "#1A1A1A" }}>{p.name}</span>
                            </div>
                            <span className="font-extrabold text-lg" style={{ color: "#1A1A1A" }}>₹{p.price.toLocaleString()}</span>
                          </div>
                          <p className="text-xs mb-3" style={{ color: "#999" }}>Demo in {p.deliveryDays} days</p>
                          <ul className="space-y-1 mb-3">
                            {p.features.slice(0, 3).map((f) => (
                              <li key={f} className="text-xs flex items-center gap-1.5" style={{ color: "#444" }}>
                                <Check size={12} style={{ color: "#00C853" }} /> {f}
                              </li>
                            ))}
                          </ul>

                          {/* Expandable details */}
                          {expandedPkg === p.id && (
                            <div className="mb-3 pt-2 border-t" style={{ borderColor: "#E0E0E0" }}>
                              <ul className="space-y-1">
                                {p.features.slice(3).map((f) => (
                                  <li key={f} className="text-xs flex items-center gap-1.5" style={{ color: "#444" }}>
                                    <Check size={12} style={{ color: "#00C853" }} /> {f}
                                  </li>
                                ))}
                              </ul>
                              <p className="text-[10px] mt-2" style={{ color: "#999" }}>Best for: {p.bestFor.join(" • ")}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <button onClick={() => setExpandedPkg(expandedPkg === p.id ? null : p.id)}
                              className="text-xs font-medium flex items-center gap-1" style={{ color: "#666" }}>
                              {expandedPkg === p.id ? <><ChevronUp size={14} /> Less</> : <><ChevronDown size={14} /> Details</>}
                            </button>
                            <button onClick={() => setSelectedPackage(p.id)}
                              className="text-sm font-bold px-4 py-1.5 rounded-lg transition-all"
                              style={{
                                backgroundColor: selectedPackage === p.id ? "#00A843" : "#00C853",
                                color: "#fff",
                              }}>
                              {selectedPackage === p.id ? "Selected ✓" : "Select →"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 rounded-xl" style={{ borderColor: "#E0E0E0" }}>
                    <ArrowLeft size={16} className="mr-2" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!selectedPackage} className="flex-1 h-12 rounded-xl text-white font-semibold" style={{ backgroundColor: "#00C853" }}>
                    Next → <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Assets & Details */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4" style={{ border: "1px solid #E0F2E9" }}>
                  <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1A1A", fontFamily: "Syne, sans-serif" }}>Help Us Build Better</h2>
                  <p className="text-sm mb-6" style={{ color: "#999" }}>Everything here is optional. Our team fills gaps automatically.</p>

                  <div className="space-y-5">
                    {/* Logo */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Your Logo</label>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                      {logoPreview ? (
                        <div className="flex items-center gap-3">
                          <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded-lg border" style={{ borderColor: "#E0E0E0" }} />
                          <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="text-xs" style={{ color: "#ef4444" }}>Remove</button>
                        </div>
                      ) : (
                        <button onClick={() => logoInputRef.current?.click()}
                          className="w-full h-20 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-sm transition-colors hover:border-[#00C853]"
                          style={{ borderColor: "#E0E0E0", color: "#999" }}>
                          <Upload size={16} /> Click to upload logo
                        </button>
                      )}
                      <p className="text-[10px] mt-1" style={{ color: "#999" }}>No logo? We create one free ✓</p>
                    </div>

                    {/* Photos */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5" style={{ color: "#1A1A1A" }}>Business Photos</label>
                      <input ref={photosInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />
                      {photoPreviews.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-2">
                          {photoPreviews.map((src, i) => (
                            <div key={i} className="relative">
                              <img src={src} alt="" className="w-16 h-16 object-cover rounded-lg border" style={{ borderColor: "#E0E0E0" }} />
                              <button onClick={() => removePhoto(i)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border flex items-center justify-center" style={{ borderColor: "#E0E0E0" }}>
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => photosInputRef.current?.click()}
                        className="w-full h-16 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-sm transition-colors hover:border-[#00C853]"
                        style={{ borderColor: "#E0E0E0", color: "#999" }}>
                        <Upload size={16} /> Add photos
                      </button>
                      <p className="text-[10px] mt-1" style={{ color: "#999" }}>No photos? We use professional stock photos free ✓</p>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="text-sm font-medium block mb-2" style={{ color: "#1A1A1A" }}>Preferred Color</label>
                      <div className="flex gap-2 flex-wrap">
                        {COLOR_OPTIONS.map((c) => (
                          <button key={c.value} onClick={() => setColorPref(c.value)}
                            className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all"
                            style={{
                              background: c.value === "rainbow" ? "linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9B59B6)" : c.value,
                              borderColor: colorPref === c.value ? "#1A1A1A" : "transparent",
                              boxShadow: colorPref === c.value ? "0 0 0 2px #fff, 0 0 0 4px #1A1A1A" : "none",
                            }}
                            title={c.label}>
                            {colorPref === c.value && <Check size={16} className="text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* One line description */}
                    <div>
                      <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>One line about your business</label>
                      <Input value={oneLineDesc} onChange={(e) => setOneLineDesc(e.target.value)}
                        className="h-12 rounded-xl bg-white" style={{ border: "1px solid #E0E0E0" }}
                        placeholder="e.g. Best dermatologist in Patna with 15 years experience" />
                      <p className="text-[10px] mt-1" style={{ color: "#999" }}>This appears on Google and WhatsApp</p>
                    </div>

                    {/* Additional details */}
                    <div>
                      <label className="text-sm font-medium block mb-1" style={{ color: "#1A1A1A" }}>Anything else to include?</label>
                      <textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)}
                        className="w-full rounded-xl bg-white text-sm p-3 resize-none" rows={4}
                        style={{ border: "1px solid #E0E0E0", fontFamily: "DM Sans, sans-serif" }}
                        placeholder={"e.g. Add fee structure,\nInclude team members,\nAdd Hindi language option,\nMy working hours are 9am-6pm..."} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mb-2">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12 rounded-xl" style={{ borderColor: "#E0E0E0" }}>
                    <ArrowLeft size={16} className="mr-2" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-14 rounded-xl text-white font-bold text-base" style={{ backgroundColor: "#00C853" }}>
                    {loading ? "Placing Order..." : "Place Free Order →"}
                  </Button>
                </div>
                <button onClick={handleSubmit} disabled={loading} className="w-full text-center text-sm py-2" style={{ color: "#999" }}>
                  Skip, build with basics →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
