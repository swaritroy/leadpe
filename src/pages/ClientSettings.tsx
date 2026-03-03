import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, DollarSign, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ClientSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    phone: "",
    address: "",
    email: "",
    business_hours: "Mon-Fri 9AM-6PM",
    cleaning: "",
    whitening: "",
    checkup: "",
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (data) {
        setBusinessId(data.id);
        const contact = (data.contact_info as Record<string, string>) ?? {};
        const pricing = (data.service_pricing as Array<{ name: string; price: string }>) ?? [];
        setForm({
          name: data.name ?? "",
          slug: data.slug ?? "",
          phone: contact.phone ?? "",
          address: contact.address ?? "",
          email: contact.email ?? "",
          business_hours: data.business_hours ?? "",
          cleaning: pricing.find(p => p.name === "cleaning")?.price ?? "",
          whitening: pricing.find(p => p.name === "whitening")?.price ?? "",
          checkup: pricing.find(p => p.name === "checkup")?.price ?? "",
        });
      }
      setLoading(false);
    };
    fetchBusiness();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
      contact_info: { phone: form.phone, address: form.address, email: form.email },
      business_hours: form.business_hours,
      service_pricing: [
        { name: "cleaning", label: "Teeth Cleaning", price: form.cleaning },
        { name: "whitening", label: "Whitening", price: form.whitening },
        { name: "checkup", label: "Regular Checkup", price: form.checkup },
      ],
    };

    if (businessId) {
      await supabase.from("businesses").update(payload).eq("id", businessId);
    } else {
      const { data } = await supabase.from("businesses").insert({ ...payload, owner_id: user.id }).select().single();
      if (data) setBusinessId(data.id);
    }

    toast({ title: "Saved!", description: "Your business info has been updated." });
    setSaving(false);
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
      <div className="container max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/client/dashboard"><ArrowLeft size={16} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Business Settings</h1>
            <p className="text-sm text-muted-foreground">Update your info — changes reflect on your live site.</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone size={18} className="text-primary" /> Business Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Business Name</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Bright Smile Dental" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">URL Slug</label>
                  <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="bright-smile-dental" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Address</label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Business Hours</label>
                <Input value={form.business_hours} onChange={e => setForm({ ...form, business_hours: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign size={18} className="text-accent" /> Service Prices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "cleaning" as const, label: "Teeth Cleaning" },
                { key: "whitening" as const, label: "Whitening" },
                { key: "checkup" as const, label: "Regular Checkup" },
              ].map(svc => (
                <div key={svc.key}>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{svc.label}</label>
                  <Input
                    value={form[svc.key]}
                    onChange={e => setForm({ ...form, [svc.key]: e.target.value })}
                    placeholder="$99"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-hero text-primary-foreground border-0 hover:opacity-90 h-12">
            <Save size={16} className="mr-2" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
