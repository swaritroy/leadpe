import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import LeadPeLogo from "@/components/LeadPeLogo";

const businessTypeOptions = [
  "Coaching Centre", "Doctor / Clinic", "Lawyer / CA", "Salon / Parlour",
  "Gym / Fitness", "Plumber / Electrician", "Restaurant", "Photographer",
  "Real Estate", "Dance / Music Class", "Other",
];

const Business = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    city: "",
    whatsappNumber: "",
    ownerName: "",
    description: "",
    timing: "",
    startingPrice: "",
    specialOffer: "",
    referralCode: "",
  });

  const updateForm = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    const slug = form.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const { error } = await supabase.from("businesses").insert({
      owner_id: user.id,
      name: form.businessName,
      slug,
      business_type: form.businessType,
      city: form.city,
      whatsapp_number: form.whatsappNumber,
      owner_name: form.ownerName,
      description: form.description,
      timing: form.timing,
      starting_price: form.startingPrice,
      special_offer: form.specialOffer,
      referral_code: form.referralCode,
      trial_active: true,
      trial_start_date: new Date().toISOString(),
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🎉 Trial started!", description: "Our team will WhatsApp you within 2 hours." });
      navigate("/client/dashboard");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background noise-overlay flex items-center justify-center py-12 px-4">
      <div className="mesh-bg" />
      <div id="business-signup" className="w-full max-w-lg relative z-10 scroll-mt-24 md:scroll-mt-32">
        <div className="text-center mb-8">
          <LeadPeLogo size="md" />
          <div className="flex items-center justify-center gap-2 mt-6 mb-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all ${s === step ? "w-12 bg-primary" : s < step ? "w-8 bg-primary/40" : "w-8 bg-border"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 3</p>
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          {step === 1 && (
            <Card className="border-border bg-card rounded-2xl">
              <CardContent className="p-8 space-y-5">
                <h2 className="text-2xl font-extrabold font-display">Tell us about your business</h2>
                <div>
                  <label className="text-sm font-medium block mb-1">Business Name</label>
                  <span className="text-xs text-muted-foreground block mb-2">Apne business ka naam</span>
                  <Input value={form.businessName} onChange={e => updateForm("businessName", e.target.value)} placeholder="e.g. Shiva Study Centre" className="rounded-xl bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Business Type</label>
                  <span className="text-xs text-muted-foreground block mb-2">Aap kya karte hain?</span>
                  <Select value={form.businessType} onValueChange={v => updateForm("businessType", v)}>
                    <SelectTrigger className="rounded-xl bg-secondary border-border"><SelectValue placeholder="Choose type" /></SelectTrigger>
                    <SelectContent>
                      {businessTypeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">City / Town</label>
                  <span className="text-xs text-muted-foreground block mb-2">Kaunse shehar mein?</span>
                  <Input value={form.city} onChange={e => updateForm("city", e.target.value)} placeholder="e.g. Vaishali, Bihar" className="rounded-xl bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">WhatsApp Number</label>
                  <span className="text-xs text-muted-foreground block mb-2">Leads isi number pe aayenge</span>
                  <Input value={form.whatsappNumber} onChange={e => updateForm("whatsappNumber", e.target.value)} placeholder="+91 98765 43210" className="rounded-xl bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Owner Name</label>
                  <span className="text-xs text-muted-foreground block mb-2">Aapka naam</span>
                  <Input value={form.ownerName} onChange={e => updateForm("ownerName", e.target.value)} placeholder="e.g. Rajesh Kumar" className="rounded-xl bg-secondary border-border" />
                </div>
                <Button onClick={() => setStep(2)} disabled={!form.businessName || !form.businessType || !form.whatsappNumber}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                  Next Step <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-border bg-card rounded-2xl">
              <CardContent className="p-8 space-y-5">
                <h2 className="text-2xl font-extrabold font-display">What do you offer customers?</h2>
                <div>
                  <label className="text-sm font-medium block mb-1">Short Description</label>
                  <span className="text-xs text-muted-foreground block mb-2">e.g. Class 9-12 maths and science tuition</span>
                  <Textarea value={form.description} onChange={e => updateForm("description", e.target.value)} placeholder="2-3 lines about your service" className="rounded-xl bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Timing / Hours</label>
                  <span className="text-xs text-muted-foreground block mb-2">Kab available ho?</span>
                  <Input value={form.timing} onChange={e => updateForm("timing", e.target.value)} placeholder="Mon-Sat 9AM-7PM" className="rounded-xl bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Starting Price (optional)</label>
                  <span className="text-xs text-muted-foreground block mb-2">e.g. ₹1500/month</span>
                  <Input value={form.startingPrice} onChange={e => updateForm("startingPrice", e.target.value)} placeholder="₹1500/month" className="rounded-xl bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Special Offer for New Customers</label>
                  <span className="text-xs text-muted-foreground block mb-2">e.g. First class free</span>
                  <Input value={form.specialOffer} onChange={e => updateForm("specialOffer", e.target.value)} placeholder="First class free!" className="rounded-xl bg-secondary border-border" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                    <ArrowLeft size={16} className="mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                    Next Step <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-border bg-card rounded-2xl">
              <CardContent className="p-8 space-y-5">
                <h2 className="text-2xl font-extrabold font-display">You're almost live! 🎉</h2>
                <div className="rounded-xl bg-secondary p-5 space-y-2 text-sm">
                  <div className="font-bold text-foreground text-lg">{form.businessName || "Your Business"}</div>
                  <div className="text-muted-foreground">{form.businessType} • {form.city}</div>
                  {form.description && <p className="text-foreground">{form.description}</p>}
                  {form.timing && <div className="text-muted-foreground">⏰ {form.timing}</div>}
                  {form.startingPrice && <div className="text-primary font-semibold">Starting at {form.startingPrice}</div>}
                  {form.specialOffer && <div className="text-primary">🎁 {form.specialOffer}</div>}
                  <div className="text-muted-foreground">📱 {form.whatsappNumber}</div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Have a referral code?</label>
                  <Input value={form.referralCode} onChange={e => updateForm("referralCode", e.target.value)} placeholder="Enter code (optional)" className="rounded-xl bg-secondary border-border" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                    <ArrowLeft size={16} className="mr-1" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-glow">
                    <Rocket size={16} className="mr-2" /> {submitting ? "Starting..." : "🚀 Start My 7-Day Free Trial"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Our team will WhatsApp you within 2 hours to complete setup.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Business;
