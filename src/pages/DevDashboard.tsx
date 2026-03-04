import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Shield, CheckCircle2, XCircle, Rocket, Code2, FileCode, LogOut, Lock, Archive } from "lucide-react";
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
import LeadPeLogo from "@/components/LeadPeLogo";

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
const STATUS_LABELS: Record<string, string> = { draft: "Draft", pending_payment: "Pending Payment", in_progress: "In Progress", vetting: "Vetting", live: "Live" };

const categories = ["Coaching Centre", "Doctor / Clinic", "Lawyer / CA", "Salon", "Gym", "Plumber / Electrician", "Restaurant", "Photographer", "Real Estate", "Other"];

const vettingChecks = [
  { label: "Semantic HTML (H1, H2, H3)", key: "seo" },
  { label: "Image Optimization", key: "img" },
  { label: "Mobile Responsive", key: "mobile" },
  { label: "Lead Capture Form", key: "form" },
  { label: "Page Speed Score > 90", key: "perf" },
  { label: "Alt Tags Present", key: "a11y" },
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
    const hasForm = /<form/i.test(code) || /onSubmit/i.test(code);
    const hasMobile = /md:|lg:|sm:/i.test(code);
    const hasAlt = /alt=/i.test(code);
    const hasImg = /<img/i.test(code);
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

  const checks = showVetting ? runChecks() : [];
  const passedChecks = checks.filter(c => c.pass).length;
  const score = checks.length > 0 ? Math.round((passedChecks / checks.length) * 100) : 0;

  const freezeBuild = async (project: Project) => {
    if (!user || !project.code_content) return;
    setFreezing(project.id);
    try {
      const htmlBundle = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${project.title}</title></head><body>${project.code_content}</body></html>`;
      const blob = new Blob([htmlBundle], { type: "text/html" });
      const path = `${user.id}/${project.id}/index.html`;
      const { error } = await supabase.storage.from("site-builds").upload(path, blob, { upsert: true });
      if (error) throw error;
      toast({ title: "Build frozen!", description: "Static bundle saved." });
    } catch (err: any) {
      toast({ title: "Freeze failed", description: err.message, variant: "destructive" });
    }
    setFreezing(null);
  };

  const deployProject = async (project: Project) => {
    if (project.vetting_score < 90) {
      toast({ title: "Deploy blocked", description: "Vetting score must be ≥ 90.", variant: "destructive" });
      return;
    }
    await supabase.from("projects").update({ status: "live" }).eq("id", project.id);
    setProjects(projects.map(p => p.id === project.id ? { ...p, status: "live" } : p));
    toast({ title: "Deployed! 🚀" });
  };

  const handleSubmit = async () => {
    if (!user || !title || !code) return;
    setSubmitting(true);
    const checksResult = runChecks();
    const passed = checksResult.filter(c => c.pass).length;
    const total = Math.round((passed / checksResult.length) * 100);

    const { data } = await supabase.from("projects").insert({
      dev_id: user.id,
      title,
      category: category || "general",
      code_content: code,
      vetting_score: total,
      seo_score: checksResult.find(c => c.key === "seo")?.pass ? 95 : 60,
      mobile_score: checksResult.find(c => c.key === "mobile")?.pass ? 95 : 55,
      performance_score: checksResult.find(c => c.key === "perf")?.pass ? 95 : 50,
      status: "draft",
    }).select().single();

    if (data) {
      setProjects([data as Project, ...projects]);
      setCode(""); setTitle(""); setCategory(""); setShowVetting(false);
      toast({ title: "Project submitted!", description: `Score: ${total}/100` });
    }
    setSubmitting(false);
  };

  const activeClients = projects.filter(p => p.status === "live").length;
  const totalEarnings = activeClients * 299 * 0.2;

  return (
    <div className="min-h-screen bg-background noise-overlay">
      <div className="mesh-bg" />
      <div className="pt-8 pb-16 relative z-10">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <LeadPeLogo size="sm" />
              <p className="text-muted-foreground text-sm mt-1">LeadPe Studio</p>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut size={14} className="mr-1" /> Logout</Button>
          </div>

          {/* Top Metric */}
          <Card className="border-border rounded-2xl bg-card mb-6">
            <CardContent className="p-8 text-center">
              <div className="text-4xl font-extrabold text-primary font-display">₹{Math.round(totalEarnings).toLocaleString()} 💰</div>
              <p className="text-muted-foreground mt-1">Monthly Earnings</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Active Clients", value: activeClients },
              { label: "Sites Deployed", value: projects.filter(p => p.status === "live").length },
              { label: "Pending Audits", value: projects.filter(p => p.status === "vetting" || p.status === "draft").length },
              { label: "Total Earned", value: `₹${(totalEarnings * 3).toLocaleString()}` },
            ].map(s => (
              <Card key={s.label} className="border-border rounded-2xl">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-extrabold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="bg-card border border-border/50 rounded-xl">
              <TabsTrigger value="upload"><Upload size={14} className="mr-2" /> Deploy New</TabsTrigger>
              <TabsTrigger value="projects"><Code2 size={14} className="mr-2" /> Projects ({projects.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-border rounded-2xl">
                  <CardHeader><CardTitle className="text-lg font-display">Submit Site</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">Site Name</label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Shiva Coaching Centre" className="rounded-xl bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="rounded-xl bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Paste Code</label>
                      <Textarea value={code} onChange={e => setCode(e.target.value)} placeholder="Paste HTML/React code here..." className="min-h-[200px] font-mono text-sm rounded-xl bg-secondary border-border" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setShowVetting(true)} variant="outline" className="flex-1 rounded-xl" disabled={!code}>
                        <Shield size={16} className="mr-2" /> Run Audit
                      </Button>
                      <Button onClick={handleSubmit} disabled={submitting || !title || !code} className="flex-1 rounded-xl bg-primary text-primary-foreground">
                        <Rocket size={16} className="mr-2" /> {submitting ? "Submitting..." : "Submit"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border rounded-2xl">
                  <CardHeader><CardTitle className="text-lg font-display">Vetting Results</CardTitle></CardHeader>
                  <CardContent>
                    {!showVetting ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Shield size={48} className="mb-4 opacity-30" />
                        <p className="text-sm">Run audit to see results</p>
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                        <div className="text-center mb-6">
                          <div className={`text-5xl font-extrabold font-display ${score >= 90 ? "text-primary" : score >= 70 ? "text-yellow-400" : "text-destructive"}`}>{score}</div>
                          <div className="text-sm text-muted-foreground mt-1">{score >= 90 ? "✅ Deploy Ready" : "(Need 90+ to deploy)"}</div>
                          <Progress value={score} className="mt-3 h-2" />
                        </div>
                        <div className="space-y-3">
                          {checks.map(check => (
                            <div key={check.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                              <span className="text-sm">{check.label}</span>
                              {check.pass ? <CheckCircle2 size={18} className="text-primary" /> : <XCircle size={18} className="text-destructive" />}
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
              <Card className="border-border rounded-2xl">
                <CardHeader><CardTitle className="text-lg font-display">Your Projects</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.map(project => (
                      <div key={project.id} className="p-4 rounded-2xl bg-secondary/30 border border-border hover:border-primary/30 transition-colors space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                              <FileCode size={18} className="text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold">{project.title}</div>
                              <div className="text-xs text-muted-foreground">{project.category} · Score: {project.vetting_score}/100</div>
                            </div>
                          </div>
                          <Badge variant={project.status === "live" ? "default" : "secondary"}>
                            {STATUS_LABELS[project.status] ?? project.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {STATUS_FLOW.map((step, i) => (
                            <div key={step} className="flex-1">
                              <div className={`h-1.5 rounded-full ${STATUS_FLOW.indexOf(project.status as any) >= i ? "bg-primary" : "bg-border"}`} />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="text-xs rounded-lg" disabled={freezing === project.id || !project.code_content} onClick={() => freezeBuild(project)}>
                            <Archive size={12} className="mr-1" /> {freezing === project.id ? "Freezing..." : "Freeze Build"}
                          </Button>
                          <Button size="sm" className="text-xs rounded-lg bg-primary text-primary-foreground" disabled={project.vetting_score < 90 || project.status === "live"} onClick={() => deployProject(project)}>
                            {project.vetting_score < 90 ? <><Lock size={12} className="mr-1" /> Need 90+</> : project.status === "live" ? <><CheckCircle2 size={12} className="mr-1" /> Live</> : <><Rocket size={12} className="mr-1" /> Deploy</>}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && <p className="text-center text-muted-foreground py-8">No projects yet. Submit your first site!</p>}
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
