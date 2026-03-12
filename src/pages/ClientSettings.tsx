import { useState, useEffect } from "react";
import { Phone, Save, ArrowLeft } from "lucide-react";
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
    name: "", slug: "", phone: "", address: "", email: "",
    business_hours: "Mon-Sat 9AM-7PM",
    service1: "", service2: "", service3: "",
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) return;
      const { data } = await supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle();
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
          service1: pricing[0]?.price ?? "",
          service2: pricing[1]?.price ?? "",
          service3: pricing[2]?.price ?? "",
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
        { name: "service1", label: "Service 1", price: form.service1 },
        { name: "service2", label: "Service 2", price: form.service2 },
        { name: "service3", label: "Service 3", price: form.service3 },
      ].filter(s => s.price),
    };

    if (businessId) {
      await supabase.from("businesses").update(payload).eq("id", businessId);
    } else {
      const { data } = await supabase.from("businesses").insert({ ...payload, owner_id: user.id }).select().single();
      if (data) setBusinessId(data.id);
    }
    toast({ title: "Saved!", description: "Changes saved successfully." });
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background noise-overlay pt-8 pb-16">
      <div className="mesh-bg" />
      <div className="container max-w-3xl relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link to="/client/dashboard"><ArrowLeft size={16} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold font-display">Business Settings</h1>
            <p className="text-sm text-muted-foreground">Update your info here — it will show on your live site</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="border-border rounded-2xl">
            <CardHeader><CardTitle className="text-lg font-display flex items-center gap-2"><Phone size={18} className="text-primary" /> Business Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Business Name</label>
                <span className="text-xs text-muted-foreground block mb-2">Apne business ka naam</span>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Subdomain</label>
                <span className="text-xs text-muted-foreground block mb-2">Your website address — {form.slug || "yourname"}.leadpe.online</span>
                <div className="flex items-center gap-0">
                  <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="rounded-l-xl rounded-r-none border-r-0 bg-secondary border-border flex-1" placeholder="yourbusiness" />
                  <span className="h-10 px-3 flex items-center bg-muted border border-border rounded-r-xl text-xs text-muted-foreground whitespace-nowrap">.leadpe.online</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Phone</label>
                <span className="text-xs text-muted-foreground block mb-2">Customer isi number pe call karenge</span>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Address</label>
                <span className="text-xs text-muted-foreground block mb-2">Your address</span>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Business Hours</label>
                <span className="text-xs text-muted-foreground block mb-2">Kab available ho?</span>
                <Input value={form.business_hours} onChange={e => setForm({ ...form, business_hours: e.target.value })} className="rounded-xl bg-secondary border-border" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border rounded-2xl">
            <CardHeader><CardTitle className="text-lg font-display">Service Prices</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {["service1", "service2", "service3"].map((key, i) => (
                <div key={key}>
                  <label className="text-sm font-medium block mb-1">Service {i + 1} Price</label>
                  <span className="text-xs text-muted-foreground block mb-2">e.g. ₹500</span>
                  <Input value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="rounded-xl bg-secondary border-border" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground rounded-xl h-12 font-semibold">
            <Save size={16} className="mr-2" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
