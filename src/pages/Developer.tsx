import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Shield, CheckCircle2, XCircle, AlertTriangle, Rocket, Code2, FileCode, BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockProjects = [
  { id: 1, name: "Dental Pro Landing", category: "Dentist", score: 92, status: "deployed", earnings: 240 },
  { id: 2, name: "PlumbFix Hero", category: "Plumber", score: 87, status: "vetting", earnings: 0 },
  { id: 3, name: "CutAbove Salon", category: "Salon", score: 78, status: "needs-fix", earnings: 0 },
];

const vettingChecks = [
  { label: "Semantic HTML (H1, H2, H3)", pass: true },
  { label: "Image Optimization", pass: true },
  { label: "Mobile Responsive (md:/lg:)", pass: true },
  { label: "Contact Form Present", pass: false },
  { label: "Page Speed Score > 90", pass: true },
  { label: "Accessibility (alt tags)", pass: false },
];

const Developer = () => {
  const [code, setCode] = useState("");
  const [showVetting, setShowVetting] = useState(false);

  const handleScan = () => {
    setShowVetting(true);
  };

  const passedChecks = vettingChecks.filter((c) => c.pass).length;
  const score = Math.round((passedChecks / vettingChecks.length) * 100);

  return (
    <div className="min-h-screen dark bg-gradient-dark text-foreground">
      <div className="pt-24 pb-16">
        <div className="container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-black tracking-tight mb-2">
              Pilot Dashboard
            </h1>
            <p className="text-muted-foreground">Upload, vet, and deploy your AI-built templates.</p>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Templates", value: "3", icon: FileCode, change: "+1 this week" },
              { label: "Deployed", value: "1", icon: Rocket, change: "Live now" },
              { label: "Avg Score", value: "86", icon: BarChart3, change: "+4 pts" },
              { label: "Earnings", value: "$240", icon: DollarSign, change: "+$80 this month" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon size={18} className="text-primary" />
                      <TrendingUp size={14} className="text-accent" />
                    </div>
                    <div className="text-2xl font-black">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                    <div className="text-xs text-accent mt-1">{stat.change}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="bg-card border border-border/50">
              <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Upload size={14} className="mr-2" /> Upload
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Code2 size={14} className="mr-2" /> Projects
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Code Importer */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Upload size={18} className="text-primary" />
                      Project Importer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Template Name</label>
                      <Input placeholder="e.g., Dental Pro Landing" className="bg-secondary/50 border-border/50" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Category</label>
                      <Select>
                        <SelectTrigger className="bg-secondary/50 border-border/50">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Plumber", "Dentist", "Restaurant", "Salon", "HVAC", "Realtor", "Lawyer", "Gym"].map((cat) => (
                            <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Paste React/Next.js Code</label>
                      <Textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={"// Paste your component code here\nexport default function LandingPage() {\n  return <div>...</div>\n}"}
                        className="min-h-[200px] font-mono text-sm bg-secondary/50 border-border/50"
                      />
                    </div>
                    <Button onClick={handleScan} className="w-full bg-gradient-hero text-primary-foreground border-0 hover:opacity-90">
                      <Shield size={16} className="mr-2" /> Run AI Gatekeeper
                    </Button>
                  </CardContent>
                </Card>

                {/* Vetting Results */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield size={18} className="text-accent" />
                      AI Gatekeeper Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!showVetting ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Shield size={48} className="mb-4 opacity-30" />
                        <p className="text-sm">Upload code and run the scanner to see results</p>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-5"
                      >
                        {/* Score */}
                        <div className="text-center mb-6">
                          <div className="text-5xl font-black text-gradient-hero inline-block">{score}</div>
                          <div className="text-sm text-muted-foreground mt-1">Vetting Score</div>
                          <Progress value={score} className="mt-3 h-2" />
                        </div>

                        {/* Checks */}
                        <div className="space-y-3">
                          {vettingChecks.map((check) => (
                            <div key={check.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                              <span className="text-sm">{check.label}</span>
                              {check.pass ? (
                                <CheckCircle2 size={18} className="text-accent" />
                              ) : (
                                <XCircle size={18} className="text-destructive" />
                              )}
                            </div>
                          ))}
                        </div>

                        <Button className="w-full" variant="outline" disabled={score < 80}>
                          <Rocket size={16} className="mr-2" /> Deploy Template
                        </Button>
                        {score < 80 && (
                          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                            <AlertTriangle size={12} /> Score must be 80+ to deploy
                          </p>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Your Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center">
                            <FileCode size={18} className="text-primary-foreground" />
                          </div>
                          <div>
                            <div className="font-semibold">{project.name}</div>
                            <div className="text-xs text-muted-foreground">{project.category}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold">{project.score}/100</div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                          <Badge
                            variant={project.status === "deployed" ? "default" : project.status === "vetting" ? "secondary" : "destructive"}
                          >
                            {project.status === "deployed" ? "Live" : project.status === "vetting" ? "Vetting" : "Needs Fix"}
                          </Badge>
                        </div>
                      </div>
                    ))}
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

export default Developer;
