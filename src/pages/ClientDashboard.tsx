import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, User, Mail, GripVertical, Star, Send, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

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

const statusColumns = [
  { key: "new", label: "New Leads", color: "bg-primary" },
  { key: "contacted", label: "Contacted", color: "bg-accent" },
  { key: "converted", label: "Converted", color: "bg-emerald-500" },
];

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      // Get user's business
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (biz) {
        setBusinessId(biz.id);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 pb-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">Command Center</h1>
            <p className="text-muted-foreground text-sm">Manage your leads and grow your business.</p>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statusColumns.map(col => (
            <Card key={col.key} className="border">
              <CardContent className="p-4 text-center">
                <div className={`text-3xl font-black ${col.key === "new" ? "text-primary" : col.key === "contacted" ? "text-accent" : "text-emerald-500"}`}>
                  {leads.filter(l => l.status === col.key).length}
                </div>
                <div className="text-sm text-muted-foreground">{col.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!businessId ? (
          <Card className="border p-8 text-center">
            <p className="text-muted-foreground mb-4">You haven't set up a business yet.</p>
            <Button asChild>
              <Link to="/client/settings">Create Your Business</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
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
                          <GripVertical size={14} className="text-muted-foreground/40" />
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
                            <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveLeadStatus(lead.id, "converted")}>
                              Mark Converted
                            </Button>
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
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
