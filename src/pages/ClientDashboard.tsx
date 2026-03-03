import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, User, Mail, Star, LogOut, Bot, Bell, Calendar, Phone, TrendingUp, DollarSign, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  { key: "new", label: "New Leads", color: "bg-primary" },
  { key: "contacted", label: "Contacted", color: "bg-accent" },
  { key: "converted", label: "Won", color: "bg-emerald-500" },
  { key: "lost", label: "Lost", color: "bg-destructive" },
];

const addons = [
  { key: "addon_chatbot" as const, label: "AI Chatbot", price: "$10/mo", icon: Bot, description: "Auto-respond to visitor questions 24/7" },
  { key: "addon_sms" as const, label: "SMS Notifications", price: "$5/mo", icon: Bell, description: "Instant SMS alerts when new leads arrive" },
  { key: "addon_whatsapp" as const, label: "WhatsApp Bridge", price: "$8/mo", icon: Phone, description: "Forward leads to WhatsApp instantly" },
  { key: "addon_booking" as const, label: "Smart Booking", price: "$15/mo", icon: Calendar, description: "Inject booking calendar into your site" },
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
    toast({ title: value ? "Add-on enabled!" : "Add-on disabled", description: `${key.replace("addon_", "").replace("_", " ")} has been ${value ? "activated" : "deactivated"}.` });
  };

  // ROI calculation
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === "converted").length;
  const totalValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
  const investmentCost = 2000; // ₹2000 starter
  const roi = investmentCost > 0 ? Math.round(((totalValue - investmentCost) / investmentCost) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isLocked = business && !business.subscription_active;

  return (
    <div className="min-h-screen bg-background pt-8 pb-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">Command Center</h1>
            <p className="text-muted-foreground text-sm">
              {business?.name ? `${business.name} — ` : ""}Manage leads, add-ons & grow.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/client/settings">Settings</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={14} className="mr-1" /> Sign Out
            </Button>
          </div>
        </div>

        {!business ? (
          <Card className="border p-8 text-center">
            <p className="text-muted-foreground mb-4">You haven't set up a business yet.</p>
            <Button asChild><Link to="/client/settings">Create Your Business</Link></Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* ROI Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border">
                <CardContent className="p-4 text-center">
                  <TrendingUp size={20} className="mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-black text-primary">{totalLeads}</div>
                  <div className="text-xs text-muted-foreground">Total Leads</div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="p-4 text-center">
                  <Star size={20} className="mx-auto mb-1 text-emerald-500" />
                  <div className="text-2xl font-black text-emerald-500">{convertedLeads}</div>
                  <div className="text-xs text-muted-foreground">Won</div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="p-4 text-center">
                  <DollarSign size={20} className="mx-auto mb-1 text-accent" />
                  <div className="text-2xl font-black text-accent">₹{totalValue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Pipeline Value</div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="p-4 text-center">
                  <TrendingUp size={20} className="mx-auto mb-1 text-emerald-500" />
                  <div className={`text-2xl font-black ${roi > 0 ? "text-emerald-500" : "text-destructive"}`}>{roi}%</div>
                  <div className="text-xs text-muted-foreground">ROI</div>
                </CardContent>
              </Card>
            </div>

            {/* Power-Up Add-ons */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-lg">Power-Up Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {addons.map(addon => {
                    const Icon = addon.icon;
                    const isActive = business[addon.key];
                    return (
                      <div key={addon.key} className={`flex items-center justify-between p-4 rounded-xl border ${isActive ? "border-accent/50 bg-accent/5" : "border-border"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-accent/20" : "bg-muted"}`}>
                            <Icon size={18} className={isActive ? "text-accent" : "text-muted-foreground"} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{addon.label}</div>
                            <div className="text-xs text-muted-foreground">{addon.description}</div>
                            <div className="text-xs font-bold text-accent mt-0.5">{addon.price}</div>
                          </div>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={(v) => toggleAddon(addon.key, v)}
                          disabled={isLocked as boolean}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Lead Kanban — with Kill-Switch */}
            <div className="relative">
              {isLocked && (
                <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/60 rounded-2xl flex items-center justify-center">
                  <Card className="border-destructive/50 bg-card shadow-xl max-w-sm">
                    <CardContent className="p-8 text-center">
                      <Lock size={40} className="mx-auto mb-4 text-destructive" />
                      <h3 className="text-xl font-black mb-2">Lead Access Suspended</h3>
                      <p className="text-sm text-muted-foreground mb-4">Your subscription is inactive. Pay the $49 maintenance fee to unlock your leads and add-ons.</p>
                      <Button className="w-full bg-gradient-hero text-primary-foreground border-0">
                        Reactivate Subscription
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid md:grid-cols-4 gap-4">
                {statusColumns.map(col => (
                  <div key={col.key} className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <h3 className="font-bold text-sm">{col.label}</h3>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {leads.filter(l => l.status === col.key).length}
                      </Badge>
                    </div>
                    {leads.filter(l => l.status === col.key).map(lead => (
                      <motion.div key={lead.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <Card className="border hover:shadow-md transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User size={14} className="text-primary" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">{lead.customer_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(lead.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              {lead.value ? <Badge variant="outline" className="text-xs">₹{lead.value}</Badge> : null}
                            </div>
                            {lead.message && (
                              <p className="text-xs text-muted-foreground leading-relaxed">{lead.message}</p>
                            )}
                            {lead.customer_email && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail size={12} /> {lead.customer_email}
                              </div>
                            )}
                            <div className="flex gap-2">
                              {col.key === "new" && (
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveLeadStatus(lead.id, "contacted")}>
                                  Mark Contacted
                                </Button>
                              )}
                              {col.key === "contacted" && (
                                <>
                                  <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveLeadStatus(lead.id, "converted")}>
                                    Won
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-xs h-7 flex-1 text-destructive" onClick={() => moveLeadStatus(lead.id, "lost")}>
                                    Lost
                                  </Button>
                                </>
                              )}
                              {col.key === "converted" && (
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1">
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
