import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";

const vettingChecks = [
  "Lighthouse Score 90+",
  "Meta title and description",
  "Alt tags on all images",
  "Mobile responsive",
  "Form with lead capture",
  "WhatsApp button present",
  "Page speed optimized",
  "Images compressed",
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const Developer = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState([10]);
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", sampleLink: "", tools: "", capacity: "" });

  const earnings = clients[0] * 299 * 0.2;

  const handleApply = () => {
    if (!form.name || !form.whatsapp || !form.email) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    toast({ title: "Application submitted! 🎉", description: "We'll review and WhatsApp you within 24 hours." });
    setForm({ name: "", whatsapp: "", email: "", sampleLink: "", tools: "", capacity: "" });
  };

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <div className="mesh-bg" />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="container relative z-10 text-center max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">LeadPe Studio</span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mt-3 mb-4 font-display">
              Build Sites.<br />Deploy Fast.<br />Earn Monthly.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Use ChatGPT or Lovable to build. LeadPe handles the rest — hosting, clients, payments, support.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-border/30">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-extrabold text-center mb-12 font-display">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { step: "1", title: "Generate site using ChatGPT + Lovable", desc: "No coding degree needed. Just paste and build." },
              { step: "2", title: "Submit to Vetting Agent", desc: "Automated audit checks performance, SEO, mobile. Score 90+ required." },
              { step: "3", title: "Deploy to LeadPe network", desc: "One click deploy. We handle hosting." },
              { step: "4", title: "Earn recurring commission", desc: "Every month client pays — you earn. Passive income." },
            ].map((item, i) => (
              <motion.div key={item.step} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="flex gap-4 p-5 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-16 border-t border-border/30">
        <div className="container max-w-lg text-center">
          <h2 className="text-2xl font-extrabold mb-8 font-display">Earnings Calculator</h2>
          <Card className="border-border bg-card rounded-2xl">
            <CardContent className="p-8">
              <p className="text-sm text-muted-foreground mb-4">Number of clients: <span className="text-foreground font-bold">{clients[0]}</span></p>
              <Slider value={clients} onValueChange={setClients} min={1} max={50} step={1} className="mb-8" />
              <div className="text-5xl font-extrabold text-primary font-display">₹{Math.round(earnings).toLocaleString()}</div>
              <p className="text-sm text-muted-foreground mt-2">per month passive earnings</p>
              <p className="text-xs text-muted-foreground mt-4">{clients[0]} clients × ₹299 × 20% commission</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Vetting Agent */}
      <section className="py-16 border-t border-border/30">
        <div className="container max-w-lg">
          <h2 className="text-2xl font-extrabold text-center mb-8 font-display">The Quality Guarantee</h2>
          <Card className="border-border bg-card rounded-2xl">
            <CardContent className="p-8 space-y-3">
              {vettingChecks.map(check => (
                <div key={check} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                  <Check size={16} className="text-primary shrink-0" />
                  <span className="text-sm text-foreground">{check}</span>
                </div>
              ))}
              <div className="pt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-destructive" /> Below 85: Deploy blocked</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500" /> 85-89: Warning shown</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary" /> 90+: Deploy unlocked 🟢</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Signup Form */}
      <section id="developer-signup" className="py-16 border-t border-border/30 scroll-mt-24 md:scroll-mt-32">
        <div className="container max-w-lg">
          <h2 className="text-2xl font-extrabold text-center mb-8 font-display">Apply to LeadPe Studio</h2>
          <Card className="border-border bg-card rounded-2xl">
            <CardContent className="p-8 space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Full Name *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">WhatsApp Number *</label>
                <Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+91 98765 43210" className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Email *</label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Sample Site Link</label>
                <Input value={form.sampleLink} onChange={e => setForm({ ...form, sampleLink: e.target.value })} placeholder="GitHub / Lovable / live URL" className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Tools You Use</label>
                <Select value={form.tools} onValueChange={v => setForm({ ...form, tools: v })}>
                  <SelectTrigger className="rounded-xl bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["ChatGPT", "Lovable", "Cursor", "Bolt", "Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Sites per month capacity</label>
                <Input value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 5" className="rounded-xl bg-secondary border-border" />
              </div>
              <Button onClick={handleApply} className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                Apply to LeadPe Studio <ArrowRight size={16} className="ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">We review within 24 hours and WhatsApp you back.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container text-center">
          <LeadPeLogo size="sm" />
          <p className="text-xs text-muted-foreground mt-2">© 2026 LeadPe. Made in India 🇮🇳</p>
        </div>
      </footer>
    </div>
  );
};

export default Developer;
