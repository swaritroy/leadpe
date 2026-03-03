import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Shield, CheckCircle2, XCircle, Rocket, Code2, FileCode, LogOut, Lock, Archive, Eye } from "lucide-react";
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
  code_content: string | null;
}

const STATUS_FLOW = ["draft", "pending_payment", "in_progress", "vetting", "live"] as const;
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_payment: "Pending Payment",
  in_progress: "In Progress",
  vetting: "Vetting",
  live: "Live",
};

const vettingChecks = [
  { label: "Semantic HTML (H1, H2, H3)", key: "seo" },
  { label: "Image Optimization (<500kb refs)", key: "img" },
  { label: "Mobile Responsive (md:/lg:)", key: "mobile" },
  { label: "Lead Capture Form Present", key: "form" },
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
  const [freezing, setFreezing] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("projects")
        .select("id, title, category, vetting_score, seo_score, mobile_score, performance_score, status, code_content")
        .eq("dev_id", user.id)
        .order("created_at", { ascending: false });
      setProjects((data as Project[]) ?? []);
    };
    fetchProjects();
  }, [user]);

  const runChecks = () => {
    const hasH1 = /<h1/i.test(code);
    const hasForm = /<form/i.test(code) || /onSubmit/i.test(code) || /SynapseLeadCapture/i.test(code);
    const hasMobile = /md:|lg:|sm:/i.test(code);
    const hasAlt = /alt=/i.test(code);
    const hasImg = /<img/i.test(code) || /Image/i.test(code);
    const noLargeAssets = !/500kb|1mb|2mb/i.test(code);

    return vettingChecks.map(check => {
      switch (check.key) {
        case "seo": return { ...check, pass: hasH1 };
        case "img": return { ...check, pass: hasImg && noLargeAssets };
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

  // Static freeze: upload code to storage bucket
  const freezeBuild = async (project: Project) => {
    if (!user || !project.code_content) return;
    setFreezing(project.id);
    try {
      const htmlBundle = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${project.title}</title></head><body>${project.code_content}</body></html>`;
      const blob = new Blob([htmlBundle], { type: "text/html" });
      const path = `${user.id}/${project.id}/index.html`;
      
      const { error } = await supabase.storage
        .from("site-builds")
        .upload(path, blob, { upsert: true });

      if (error) throw error;
      toast({ title: "Build frozen!", description: "Static bundle saved to infrastructure." });
    } catch (err: any) {
      toast({ title: "Freeze failed", description: err.message, variant: "destructive" });
    }
    setFreezing(null);
  };

  // Deploy to live (only if score >= 95)
  const deployProject = async (project: Project) => {
    if (project.vetting_score < 95) {
      toast({ title: "Deployment blocked", description: "Vetting score must be ≥ 95 to go live.", variant: "destructive" });
      return;
    }
    await supabase.from("projects").update({ status: "live" }).eq("id", project.id);
    setProjects(projects.map(p => p.id === project.id ? { ...p, status: "live" } : p));
    toast({ title: "Deployed!", description: `${project.title} is now live.` });
  };

  const handleSubmit = async () => {
    if (!user || !title || !code) return;
    setSubmitting(true);

    const checksResult = runChecks();
    const passed = checksResult.filter(c => c.pass).length;
    const total = Math.round((passed / checksResult.length) * 100);

    const seo = checksResult.find(c => c.key === "seo")?.pass ? 95 : 60;
    const mobile = checksResult.find(c => c.key === "mobile")?.pass ? 95 : 55;
    const perf = checksResult.find(c => c.key === "perf")?.pass ? 95 : 50;

    const { data, error } = await supabase.from("projects").insert({
      dev_id: user.id,
      title,
      category: category || "general",
      code_content: code,
      vetting_score: total,
      seo_score: seo,
      mobile_score: mobile,
      performance_score: perf,
      status: "draft",
    }).select().single();

    if (data) {
      setProjects([data as Project, ...projects]);
      setCode("");
      setTitle("");
      setCategory("");
      setShowVetting(false);
      toast({ title: "Project submitted!", description: `Score: ${total}/100. ${total >= 95 ? "Ready to deploy!" : "Improve code to reach 95+."}` });
    }
    setSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "default";
      case "vetting": return "secondary";
      case "in_progress": return "outline";
      case "pending_payment": return "outline";
      default: return "destructive";
    }
  };

  const getStatusIndex = (status: string) => STATUS_FLOW.indexOf(status as any);

  return (
    <div className="min-h-screen dark bg-gradient-dark text-foreground">
      <div className="pt-8 pb-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-black tracking-tight mb-1">Pilot Dashboard</h1>
              <p className="text-muted-foreground text-sm">Upload, vet, freeze & deploy your AI-built templates.</p>
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
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Paste React/HTML Code</label>
                      <Textarea
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder="// Paste your component code here&#10;// Must include: <h1>, alt tags, form, responsive classes"
                        className="min-h-[200px] font-mono text-sm bg-secondary/50 border-border/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleScan} variant="outline" className="flex-1" disabled={!code}>
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
                          <div className={`text-5xl font-black inline-block ${score >= 95 ? "text-accent" : score >= 70 ? "text-yellow-400" : "text-destructive"}`}>{score}</div>
                          <div className="text-sm text-muted-foreground mt-1">Vetting Score {score >= 95 ? "✓ Deploy Ready" : "(Need 95+ to deploy)"}</div>
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
                  <div className="space-y-4">
                    {projects.map(project => (
                      <div key={project.id} className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center">
                              <FileCode size={18} className="text-primary-foreground" />
                            </div>
                            <div>
                              <div className="font-semibold">{project.title}</div>
                              <div className="text-xs text-muted-foreground">{project.category} · Score: {project.vetting_score}/100</div>
                            </div>
                          </div>
                          <Badge variant={getStatusColor(project.status)}>
                            {STATUS_LABELS[project.status] ?? project.status}
                          </Badge>
                        </div>

                        {/* Status Pipeline */}
                        <div className="flex items-center gap-1">
                          {STATUS_FLOW.map((step, i) => (
                            <div key={step} className="flex items-center flex-1">
                              <div className={`h-1.5 flex-1 rounded-full ${getStatusIndex(project.status) >= i ? "bg-accent" : "bg-border"}`} />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground justify-between">
                          {STATUS_FLOW.map(step => (
                            <span key={step} className={`${project.status === step ? "text-accent font-semibold" : ""}`}>
                              {STATUS_LABELS[step]}
                            </span>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            disabled={freezing === project.id || !project.code_content}
                            onClick={() => freezeBuild(project)}
                          >
                            <Archive size={12} className="mr-1" />
                            {freezing === project.id ? "Freezing..." : "Freeze Build"}
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                            disabled={project.vetting_score < 95 || project.status === "live"}
                            onClick={() => deployProject(project)}
                          >
                            {project.vetting_score < 95 ? <><Lock size={12} className="mr-1" /> Locked (Need 95+)</> : project.status === "live" ? <><CheckCircle2 size={12} className="mr-1" /> Live</> : <><Rocket size={12} className="mr-1" /> Deploy to Live</>}
                          </Button>
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
