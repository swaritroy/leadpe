import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: "919973383902",
          message: `New contact form message:\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || "N/A"}\nMessage: ${form.message}`,
        },
      });
      toast({ title: "Message sent!", description: "We will respond within 24 hours on WhatsApp." });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast({ title: "Failed to send. Try WhatsApp instead.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const h2 = { color: "#1A1A1A", fontFamily: "Syne, sans-serif" };
  const p = { color: "#444", fontFamily: "DM Sans, sans-serif", lineHeight: 1.8 };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FFF7" }}>
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-10" style={h2}>Contact Us</h1>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left — Details */}
            <div className="bg-white rounded-2xl p-8" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h2 className="text-lg font-bold mb-4" style={h2}>Get in Touch</h2>
              <ul className="text-sm space-y-3" style={p}>
                <li><strong>Business Name:</strong> LeadPe</li>
                <li><strong>Founder:</strong> Swarit Roy</li>
                <li><strong>Address:</strong> Hajipur, Vaishali District, Bihar — 844101, India</li>
                <li><strong>Email:</strong> support@leadpe.tech</li>
                <li><strong>WhatsApp:</strong> +91 9973383902</li>
                <li><strong>Support Hours:</strong> Monday to Saturday, 10:00 AM — 7:00 PM IST</li>
              </ul>
            </div>

            {/* Right — Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 space-y-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <Input placeholder="Your Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Phone (optional)" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Textarea placeholder="Your Message *" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <Button type="submit" disabled={sending} className="w-full rounded-xl text-black font-semibold" style={{ backgroundColor: "#00C853" }}>
                {sending ? "Sending..." : "Send Message →"}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
