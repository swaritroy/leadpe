import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, User, Mail, Star, LogOut, Bot, Bell, Calendar, Phone, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import LeadPeLogo from "@/components/LeadPeLogo";

interface Lead {
  id: string;
  customer_name: string;
  customer_email: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  value: number | null;
  source: string | null;
  created_at: string;
}

interface Business {
  id: string;
  name: string;
  subscription_active: boolean;
  addon_chatbot: boolean;
  addon_sms: boolean;
  addon_whatsapp: boolean;
  addon_booking: boolean;
}

const statusColumns = [
  { key: "new", label: "New 🔔", color: "bg-primary" },
  { key: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { key: "converted", label: "Won ✅", color: "bg-emerald-500" },
  { key: "lost", label: "Lost", color: "bg-destructive" },
];

const addons = [
  { key: "addon_whatsapp" as const, label: "WhatsApp Auto-Reply", price: "₹199/mo", icon: Phone, description: "Auto-reply to every inquiry instantly" },
  { key: "addon_booking" as const, label: "AI Appointment Booking", price: "₹499/mo", icon: Calendar, description: "Let customers book directly" },
  { key: "addon_chatbot" as const, label: "Google Review Automator", price: "₹199/mo", icon: Bot, description: "Auto-send review requests after conversion" },
  { key: "addon_sms" as const, label: "WhatsApp Blast", price: "₹99/blast", icon: Bell, description: "Message all past leads at once" },
];

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, subscription_active, addon_chatbot, addon_sms, addon_whatsapp, addon_booking")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (biz) {
        setBusiness(biz as Business);
        const { data: leadData } = await supabase
          .from("leads")
          .select("*")
          .eq("business_id", biz.id)
          .order("created_at", { ascending: false });
        setLeads((leadData as Lead[]) ?? []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const moveLeadStatus = async (leadId: string, newStatus: string) => {
    await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const toggleAddon = async (key: keyof Business, value: boolean) => {
    if (!business) return;
    await supabase.from("businesses").update({ [key]: value }).eq("id", business.id);
    setBusiness({ ...business, [key]: value });
    toast({ title: value ? "Add-on enabled!" : "Add-on disabled" });
  };

  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === "converted").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isLocked = business && !business.subscription_active;

  return (
    <div className="min-h-screen bg-background noise-overlay pt-8 pb-16">
      <div className="mesh-bg" />
      <div className="container relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <LeadPeLogo size="sm" />
            <p className="text-muted-foreground text-sm mt-1">
              {business?.name || "Your Business"} • <Badge variant="outline" className="text-xs">Growth Plan</Badge>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link to="/client/settings">Settings</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={14} className="mr-1" /> Logout
            </Button>
          </div>
        </div>

        {!business ? (
          <Card className="border border-border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground mb-4">You haven't set up your business yet.</p>
            <Button className="bg-primary text-primary-foreground rounded-xl" asChild>
              <Link to="/business">Start Free Trial</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Hero Metric */}
            <Card className="border-border rounded-2xl bg-card">
              <CardContent className="p-8 text-center">
                <div className="text-5xl font-extrabold text-primary font-display">{totalLeads} 🔔</div>
                <p className="text-muted-foreground mt-2">This Month's Leads</p>
              </CardContent>
            </Card>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Visitors", value: "—", icon: TrendingUp },
                { label: "Leads", value: totalLeads.toString(), icon: MessageSquare },
                { label: "Conversion", value: `${conversionRate}%`, icon: Star },
                { label: "Won", value: convertedLeads.toString(), icon: Star },
              ].map(s => (
                <Card key={s.label} className="border-border rounded-2xl">
                  <CardContent className="p-4 text-center">
                    <s.icon size={18} className="mx-auto mb-1 text-primary" />
                    <div className="text-2xl font-extrabold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add-ons */}
            <Card className="border-border rounded-2xl">
              <CardHeader><CardTitle className="text-lg font-display">Power-Ups</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {addons.map(addon => {
                    const Icon = addon.icon;
                    const isActive = business[addon.key];
                    return (
                      <div key={addon.key} className={`flex items-center justify-between p-4 rounded-2xl border ${isActive ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? "bg-primary/20" : "bg-secondary"}`}>
                            <Icon size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{addon.label}</div>
                            <div className="text-xs text-muted-foreground">{addon.description}</div>
                            <div className="text-xs font-bold text-primary mt-0.5">{addon.price}</div>
                          </div>
                        </div>
                        <Switch checked={isActive} onCheckedChange={v => toggleAddon(addon.key, v)} disabled={isLocked as boolean} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Lead Kanban with Kill-Switch */}
            <div className="relative">
              {isLocked && (
                <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/60 rounded-2xl flex items-center justify-center">
                  <Card className="border-primary/30 bg-card shadow-glow max-w-sm rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <Lock size={40} className="mx-auto mb-4 text-primary" />
                      <h3 className="text-xl font-extrabold mb-2 font-display">
                        Renew plan to see your {totalLeads} pending customers 🔒
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">Your subscription is inactive.</p>
                      <Button className="w-full bg-primary text-primary-foreground rounded-xl">
                        Renew Now — ₹299/mo
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Mobile: cards, Desktop: columns */}
              <div className="grid md:grid-cols-4 gap-4">
                {statusColumns.map(col => (
                  <div key={col.key} className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <h3 className="font-bold text-sm">{col.label}</h3>
                      <Badge variant="secondary" className="ml-auto text-xs rounded-lg">
                        {leads.filter(l => l.status === col.key).length}
                      </Badge>
                    </div>
                    {leads.filter(l => l.status === col.key).map(lead => (
                      <motion.div key={lead.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <Card className="border-border rounded-2xl hover:shadow-glow transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User size={14} className="text-primary" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">{lead.customer_name}</div>
                                  <div className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </div>
                            {lead.message && <p className="text-xs text-muted-foreground">{lead.message}</p>}
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-xs text-primary font-semibold">
                                <Phone size={12} /> {lead.phone} — Call Now
                              </a>
                            )}
                            <div className="flex gap-2">
                              {col.key === "new" && (
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1 rounded-lg" onClick={() => moveLeadStatus(lead.id, "contacted")}>
                                  Mark Contacted
                                </Button>
                              )}
                              {col.key === "contacted" && (
                                <>
                                  <Button size="sm" className="text-xs h-7 flex-1 rounded-lg bg-primary text-primary-foreground" onClick={() => moveLeadStatus(lead.id, "converted")}>Won</Button>
                                  <Button size="sm" variant="outline" className="text-xs h-7 flex-1 rounded-lg" onClick={() => moveLeadStatus(lead.id, "lost")}>Lost</Button>
                                </>
                              )}
                              {col.key === "converted" && (
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1 rounded-lg">
                                  <Star size={12} className="mr-1" /> Request Review
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
