import { motion } from "framer-motion";
import { ArrowRight, Hexagon, Zap, Code2, BarChart3, Rocket, Star, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SynapseLogo from "@/components/SynapseLogo";

const categories = [
  { name: "Plumbers", count: 24, icon: "🔧", color: "from-blue-500/20 to-cyan-500/10" },
  { name: "Dentists", count: 18, icon: "🦷", color: "from-emerald-500/20 to-green-500/10" },
  { name: "Restaurants", count: 31, icon: "🍽️", color: "from-orange-500/20 to-amber-500/10" },
  { name: "Salons", count: 15, icon: "💇", color: "from-pink-500/20 to-rose-500/10" },
  { name: "HVAC", count: 12, icon: "❄️", color: "from-sky-500/20 to-blue-500/10" },
  { name: "Realtors", count: 22, icon: "🏠", color: "from-violet-500/20 to-purple-500/10" },
  { name: "Lawyers", count: 9, icon: "⚖️", color: "from-amber-500/20 to-yellow-500/10" },
  { name: "Gyms", count: 14, icon: "💪", color: "from-red-500/20 to-rose-500/10" },
];

const stats = [
  { label: "Templates", value: "200+", icon: Code2 },
  { label: "Businesses", value: "1,400+", icon: Building2 },
  { label: "Developers", value: "350+", icon: Users },
  { label: "Avg Rating", value: "4.9", icon: Star },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Decorative hexagons */}
        <div className="absolute top-20 left-10 opacity-5 animate-float">
          <Hexagon size={120} className="text-primary" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-5 animate-float" style={{ animationDelay: "2s" }}>
          <Hexagon size={80} className="text-accent" />
        </div>
        <div className="absolute top-1/2 left-1/3 opacity-[0.03]">
          <Hexagon size={200} className="text-primary" />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8">
              <Zap size={14} className="animate-pulse-glow" />
              The AI-Distribution Engine
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              Ship AI Websites
              <br />
              <span className="text-gradient-hero">To Local Businesses</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect AI-powered developers with local businesses that need websites.
              Build with Lovable, Bolt, or v0 — deploy to paying clients instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12 px-8 text-base font-semibold" asChild>
                <Link to="/business">
                  Browse Templates <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold" asChild>
                <Link to="/developer">
                  I'm a Developer <Code2 size={18} className="ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <stat.icon size={24} className="mx-auto mb-2 text-primary" />
                <div className="text-3xl font-black text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse Industry Sets */}
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Browse Industry Sets
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Pre-vetted, AI-built website templates organized by industry. Ready to deploy.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`group relative rounded-xl border bg-gradient-to-br ${cat.color} p-6 cursor-pointer hover:shadow-glow hover:border-primary/30 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="text-lg font-bold text-foreground">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{cat.count} templates</p>
                <ArrowRight size={16} className="absolute top-6 right-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              How It Works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Devs Build", desc: "Create stunning sites with AI builders like Lovable, Bolt, or v0.", icon: Code2 },
              { step: "02", title: "We Vet", desc: "Our AI Gatekeeper scans for SEO, performance, and mobile responsiveness.", icon: BarChart3 },
              { step: "03", title: "Businesses Launch", desc: "Businesses pick a template, customize branding, and go live.", icon: Rocket },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-hero flex items-center justify-center mb-5">
                  <item.icon size={24} className="text-primary-foreground" />
                </div>
                <div className="text-xs font-bold text-primary tracking-widest mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl bg-gradient-hero p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute top-4 right-8 opacity-10">
              <Hexagon size={100} className="text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-primary-foreground mb-4 relative z-10">
              Ready to Scale Your Reach?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto relative z-10">
              Join hundreds of developers already earning from AI-built websites.
            </p>
            <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-bold relative z-10" asChild>
              <Link to="/developer">
                Start Building <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <SynapseLogo size="sm" />
          <p className="text-sm text-muted-foreground">
            © 2026 Synapse Shift. The AI-Distribution Engine.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
