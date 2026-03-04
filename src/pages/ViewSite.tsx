import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Business {
  id: string;
  name: string;
  slug: string;
  subscription_active: boolean;
  theme_json: { primary: string; secondary: string; font: string };
  contact_info: { phone: string; address: string; email: string };
  business_hours: string;
  service_pricing: Array<{ name: string; label: string; price: string }>;
}

const ViewSite = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!slug) return;
      const { data } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle();
      if (data) {
        setBusiness({
          ...data,
          theme_json: (data.theme_json as Business["theme_json"]) ?? { primary: "#00E676", secondary: "#10b981", font: "DM Sans" },
          contact_info: (data.contact_info as Business["contact_info"]) ?? { phone: "", address: "", email: "" },
          service_pricing: (data.service_pricing as Business["service_pricing"]) ?? [],
        });
      } else setNotFound(true);
      setLoading(false);
    };
    fetchBusiness();
  }, [slug]);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !leadForm.name.trim()) return;
    await supabase.from("leads").insert({
      business_id: business.id,
      customer_name: leadForm.name.trim(),
      customer_email: leadForm.email.trim() || null,
      phone: leadForm.phone.trim() || null,
      message: leadForm.message.trim() || null,
    });
    setSubmitted(true);
    toast({ title: "Message sent!", description: "We'll get back to you soon." });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (notFound) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center"><h1 className="text-4xl font-extrabold mb-2 font-display">404</h1><p className="text-muted-foreground">Business not found</p></div></div>;
  if (!business) return null;

  const isSuspended = !business.subscription_active;

  return (
    <div className="min-h-screen bg-background">
      {isSuspended && (
        <div className="bg-destructive text-destructive-foreground px-4 py-3 text-center text-sm font-semibold flex items-center justify-center gap-2">
          <AlertTriangle size={16} />
          Site Suspended — Business subscription inactive. Contact support.
        </div>
      )}

      <nav className="px-6 py-4 flex items-center justify-between bg-primary" style={{ opacity: isSuspended ? 0.6 : 1 }}>
        <span className="text-lg font-bold text-primary-foreground">{business.name}</span>
        <div className="flex gap-6 text-sm text-primary-foreground/80">
          <a href="#services">Services</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <div style={{ opacity: isSuspended ? 0.5 : 1, pointerEvents: isSuspended ? "none" : "auto" }}>
        <section className="px-6 py-16 md:py-24 text-center bg-primary/5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-primary font-display">Welcome to {business.name}</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6">Your trusted local professionals. Contact us today.</p>
            <Button size="lg" className="bg-primary text-primary-foreground rounded-xl" asChild><a href="#contact">Get in Touch</a></Button>
          </motion.div>
        </section>

        <section className="grid grid-cols-3 border-y border-border">
          {[
            { icon: Phone, label: business.contact_info.phone || "Call us" },
            { icon: MapPin, label: business.contact_info.address || "Visit us" },
            { icon: Clock, label: business.business_hours },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="p-4 text-center border-r border-border last:border-r-0">
              <Icon size={18} className="mx-auto mb-1 text-primary" />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </section>

        {business.service_pricing.length > 0 && (
          <section id="services" className="py-16">
            <div className="container max-w-3xl">
              <h2 className="text-2xl font-extrabold text-center mb-8 font-display">Our Services</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {business.service_pricing.map(svc => (
                  <div key={svc.name} className="rounded-2xl border border-border bg-card p-6 text-center">
                    <h3 className="font-bold mb-2">{svc.label}</h3>
                    <div className="text-2xl font-extrabold text-primary">{svc.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="contact" className="py-16">
          <div className="container max-w-lg">
            <h2 className="text-2xl font-extrabold text-center mb-8 font-display">Contact Us</h2>
            {submitted ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Thank You!</h3>
                <p className="text-muted-foreground">We'll get back to you shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-4">
                <Input required placeholder="Your Name" value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} className="rounded-xl" />
                <Input type="email" placeholder="Email" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} className="rounded-xl" />
                <Input placeholder="Phone Number" value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} className="rounded-xl" />
                <Textarea placeholder="How can we help?" value={leadForm.message} onChange={e => setLeadForm({ ...leadForm, message: e.target.value })} className="rounded-xl" />
                <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-xl">
                  <Send size={16} className="mr-2" /> Send Message
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {business.name}. Powered by LeadPe ⚡
      </footer>
    </div>
  );
};

export default ViewSite;
