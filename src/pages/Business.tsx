import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, DollarSign, Send, Star, GripVertical, MessageSquare, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "new" | "contacted" | "converted";
  date: string;
}

const initialLeads: Lead[] = [
  { id: 1, name: "Sarah Mitchell", email: "sarah@email.com", phone: "(555) 123-4567", message: "Need a root canal consultation", status: "new", date: "Today" },
  { id: 2, name: "James Cooper", email: "james@email.com", phone: "(555) 987-6543", message: "Looking for teeth whitening options", status: "new", date: "Today" },
  { id: 3, name: "Maria Garcia", email: "maria@email.com", phone: "(555) 456-7890", message: "Annual checkup scheduling", status: "contacted", date: "Yesterday" },
  { id: 4, name: "Tom Wilson", email: "tom@email.com", phone: "(555) 321-0987", message: "Emergency dental visit needed", status: "contacted", date: "Yesterday" },
  { id: 5, name: "Lisa Chen", email: "lisa@email.com", phone: "(555) 654-3210", message: "Orthodontist referral", status: "converted", date: "2 days ago" },
];

const statusColumns = [
  { key: "new" as const, label: "New Leads", color: "bg-primary" },
  { key: "contacted" as const, label: "Contacted", color: "bg-accent" },
  { key: "converted" as const, label: "Converted", color: "bg-emerald-500" },
];

const Business = () => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [businessInfo, setBusinessInfo] = useState({
    phone: "(555) 000-1111",
    address: "123 Main Street, Springfield",
    hours: "Mon-Fri 9AM-6PM",
    cleaning: "$99",
    whitening: "$299",
    checkup: "$149",
  });

  const moveLeadStatus = (leadId: number, newStatus: Lead["status"]) => {
    setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black tracking-tight mb-2">Command Center</h1>
          <p className="text-muted-foreground">Manage leads, update your site, and grow your business.</p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "New Leads", value: leads.filter((l) => l.status === "new").length, color: "text-primary" },
            { label: "Contacted", value: leads.filter((l) => l.status === "contacted").length, color: "text-accent" },
            { label: "Converted", value: leads.filter((l) => l.status === "converted").length, color: "text-emerald-500" },
          ].map((stat) => (
            <Card key={stat.label} className="border">
              <CardContent className="p-4 text-center">
                <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="leads">
              <MessageSquare size={14} className="mr-2" /> Lead Board
            </TabsTrigger>
            <TabsTrigger value="editor">
              <Clock size={14} className="mr-2" /> Site Editor
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star size={14} className="mr-2" /> Reviews
            </TabsTrigger>
          </TabsList>

          {/* Kanban Board */}
          <TabsContent value="leads">
            <div className="grid md:grid-cols-3 gap-4">
              {statusColumns.map((col) => (
                <div key={col.key} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="font-bold text-sm">{col.label}</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {leads.filter((l) => l.status === col.key).length}
                    </Badge>
                  </div>
                  {leads
                    .filter((l) => l.status === col.key)
                    .map((lead) => (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card className="border hover:shadow-md transition-shadow cursor-grab">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User size={14} className="text-primary" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">{lead.name}</div>
                                  <div className="text-xs text-muted-foreground">{lead.date}</div>
                                </div>
                              </div>
                              <GripVertical size={14} className="text-muted-foreground/40" />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{lead.message}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail size={12} /> {lead.email}
                            </div>
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
                                <Button size="sm" variant="outline" className="text-xs h-7 flex-1 text-accent border-accent/30 hover:bg-accent/10">
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
          </TabsContent>

          {/* Site Editor */}
          <TabsContent value="editor">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone size={18} className="text-primary" /> Contact Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone</label>
                    <Input value={businessInfo.phone} onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Address</label>
                    <Input value={businessInfo.address} onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Business Hours</label>
                    <Input value={businessInfo.hours} onChange={(e) => setBusinessInfo({ ...businessInfo, hours: e.target.value })} />
                  </div>
                  <Button className="w-full bg-gradient-hero text-primary-foreground border-0 hover:opacity-90">
                    Save Changes
                  </Button>
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
                  ].map((service) => (
                    <div key={service.key}>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{service.label}</label>
                      <Input
                        value={businessInfo[service.key]}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, [service.key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <Button className="w-full bg-gradient-hero text-primary-foreground border-0 hover:opacity-90">
                    Update Prices
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star size={18} className="text-amber-500" /> Review Requestor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  Send a "Review us on Google" link to your converted customers.
                </p>
                <div className="space-y-3">
                  {leads
                    .filter((l) => l.status === "converted")
                    .map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <User size={14} className="text-amber-500" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{lead.name}</div>
                            <div className="text-xs text-muted-foreground">{lead.email}</div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Send size={12} className="mr-1" /> Send Request
                        </Button>
                      </div>
                    ))}
                  {leads.filter((l) => l.status === "converted").length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No converted leads yet. Move leads through the pipeline first.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Business;
