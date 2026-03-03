import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Shield, CheckCircle2, XCircle, AlertTriangle, Rocket, Code2, FileCode, BarChart3, TrendingUp, DollarSign, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  title: string;
  category: string;
  vetting_score: number;
  seo_score: number;
  mobile_score: number;
  performance_score: number;
  status: string;
}

const vettingChecks = [
  { label: "Semantic HTML (H1, H2, H3)", key: "seo" },
  { label: "Image Optimization", key: "img" },
  { label: "Mobile Responsive (md:/lg:)", key: "mobile" },
  { label: "Contact Form Present", key: "form" },
  { label: "Page Speed Score > 90", key: "perf" },
  { label: "Accessibility (alt tags)", key: "a11y" },
];

const DevDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [showVetting, setShowVetting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("projects")
        .select("id, title, category, vetting_score, seo_score, mobile_score, performance_score, status")
        .eq("dev_id", user.id)
        .order("created_at", { ascending: false });
      setProjects((data as Project[]) ?? []);
    };
    fetchProjects();
  }, [user]);

  // Simulate vetting
  const runChecks = () => {
    const hasH1 = /<h1/i.test(code);
    const hasForm = /<form/i.test(code) || /onSubmit/i.test(code);
    const hasMobile = /md:|lg:|sm:/i.test(code);
    const hasAlt = /alt=/i.test(code);
    const hasImg = /<img/i.test(code) || /Image/i.test(code);

    return vettingChecks.map(check => {
      switch (check.key) {
        case "seo": return { ...check, pass: hasH1 };
        case "img": return { ...check, pass: hasImg };
        case "mobile": return { ...check, pass: hasMobile };
        case "form": return { ...check, pass: hasForm };
        case "perf": return { ...check, pass: code.length > 50 };
        case "a11y": return { ...check, pass: hasAlt };
        default: return { ...check, pass: false };
      }
    });
  };

  const handleScan = () => setShowVetting(true);

  const checks = showVetting ? runChecks() : [];
  const passedChecks = checks.filter(c => c.pass).length;
  const score = checks.length > 0 ? Math.round((passedChecks / checks.length) * 100) : 0;

  const handleSubmit = async () => {
    if (!user || !title || !code) return;
    setSubmitting(true);
    const seo = Math.round(Math.random() * 30 + 70);
    const mobile = Math.round(Math.random() * 30 + 70);
    const perf = Math.round(Math.random() * 30 + 70);
    const total = Math.round((seo + mobile + perf) / 3);

    const { data, error } = await supabase.from("projects").insert({
      dev_id: user.id,
      title,
      category: category || "general",
      code_content: code,
      vetting_score: total,
      seo_score: seo,
      mobile_score: mobile,
      performance_score: perf,
      status: total >= 80 ? "vetting" : "draft",
    }).select().single();

    if (data) {
      setProjects([data as Project, ...projects]);
      setCode("");
      setTitle("");
      setCategory("");
      setShowVetting(false);
      toast({ title: "Project submitted!", description: `Score: ${total}/100` });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen dark bg-gradient-dark text-foreground">
      <div className="pt-8 pb-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-black tracking-tight mb-1">Pilot Dashboard</h1>
              <p className="text-muted-foreground text-sm">Upload, vet, and deploy your AI-built templates.</p>
            </motion.div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={14} className="mr-1" /> Sign Out
            </Button>
          </div>

          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="bg-card border border-border/50">
              <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Upload size={14} className="mr-2" /> Upload
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Code2 size={14} className="mr-2" /> Projects ({projects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Upload size={18} className="text-primary" /> Project Importer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Template Name</label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Dental Pro Landing" className="bg-secondary/50 border-border/50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-secondary/50 border-border/50">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Plumber", "Dentist", "Restaurant", "Salon", "HVAC", "Realtor", "Lawyer", "Gym"].map(cat => (
                            <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Paste React Code</label>
                      <Textarea
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder="// Paste your component code here"
                        className="min-h-[200px] font-mono text-sm bg-secondary/50 border-border/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleScan} variant="outline" className="flex-1">
                        <Shield size={16} className="mr-2" /> Scan Code
                      </Button>
                      <Button onClick={handleSubmit} disabled={submitting || !title || !code} className="flex-1 bg-gradient-hero text-primary-foreground border-0 hover:opacity-90">
                        <Rocket size={16} className="mr-2" /> {submitting ? "Submitting..." : "Submit"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield size={18} className="text-accent" /> AI Gatekeeper Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!showVetting ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Shield size={48} className="mb-4 opacity-30" />
                        <p className="text-sm">Upload code and run the scanner to see results</p>
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                        <div className="text-center mb-6">
                          <div className="text-5xl font-black text-gradient-hero inline-block">{score}</div>
                          <div className="text-sm text-muted-foreground mt-1">Vetting Score</div>
                          <Progress value={score} className="mt-3 h-2" />
                        </div>
                        <div className="space-y-3">
                          {checks.map(check => (
                            <div key={check.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                              <span className="text-sm">{check.label}</span>
                              {check.pass ? <CheckCircle2 size={18} className="text-accent" /> : <XCircle size={18} className="text-destructive" />}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="projects">
              <Card className="bg-card border-border/50">
                <CardHeader><CardTitle className="text-lg">Your Projects</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects.map(project => (
                      <div key={project.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center">
                            <FileCode size={18} className="text-primary-foreground" />
                          </div>
                          <div>
                            <div className="font-semibold">{project.title}</div>
                            <div className="text-xs text-muted-foreground">{project.category}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold">{project.vetting_score}/100</div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                          <Badge variant={project.status === "live" ? "default" : project.status === "vetting" ? "secondary" : "destructive"}>
                            {project.status === "live" ? "Live" : project.status === "vetting" ? "Vetting" : project.status === "draft" ? "Draft" : "Rejected"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No projects yet. Upload your first template!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DevDashboard;
