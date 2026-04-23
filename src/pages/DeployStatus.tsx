import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Clock, RefreshCw, ArrowLeft } from "lucide-react";

interface BuildRow {
  id: string;
  business_name: string | null;
  github_url: string | null;
  deploy_stage: string | null;
  deploy_url: string | null;
  deploy_error: string | null;
  deploy_hint: string | null;
  deploy_inspector_url: string | null;
  deployment_id: string | null;
  status: string | null;
  submitted_at: string | null;
  demo_deployed_at: string | null;
  live_deployed_at: string | null;
  last_deploy_checked_at: string | null;
  created_at: string | null;
}

const STEPS = [
  { key: "repo_preflight", label: "Repository preflight", desc: "Validate GitHub URL is public + reachable" },
  { key: "vercel_project", label: "Vercel project", desc: "Create or reuse Vercel project" },
  { key: "deployment_start", label: "Deployment started", desc: "Submit build to Vercel" },
  { key: "build_logs", label: "Build & ready", desc: "Vercel finishes build and serves the site" },
];

function stageStatus(row: BuildRow | null, stepKey: string): "done" | "active" | "error" | "pending" {
  if (!row) return "pending";
  const stage = (row.deploy_stage || "").toLowerCase();
  const hasErr = !!row.deploy_error;

  const order = ["repo_preflight", "vercel_project", "deployment_start", "build_logs"];
  const stageMap: Record<string, string> = {
    preflight: "repo_preflight",
    repo: "repo_preflight",
    project: "vercel_project",
    deploying: "deployment_start",
    queued: "deployment_start",
    building: "build_logs",
    ready: "build_logs",
    error: stage,
  };
  const currentKey = stageMap[stage] || stage;
  const stepIdx = order.indexOf(stepKey);
  const curIdx = order.indexOf(currentKey);

  if (row.deploy_url && stepKey === "build_logs") return "done";
  if (hasErr && stepIdx === curIdx) return "error";
  if (curIdx < 0) return stepIdx === 0 ? "active" : "pending";
  if (stepIdx < curIdx) return "done";
  if (stepIdx === curIdx) return hasErr ? "error" : "active";
  return "pending";
}

function fmt(ts: string | null) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function DeployStatus() {
  const { id } = useParams();
  const [row, setRow] = useState<BuildRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!id) return;
    const { data } = await supabase
      .from("build_requests")
      .select("id,business_name,github_url,deploy_stage,deploy_url,deploy_error,deploy_hint,deploy_inspector_url,deployment_id,status,submitted_at,demo_deployed_at,live_deployed_at,last_deploy_checked_at,created_at")
      .eq("id", id)
      .maybeSingle();
    setRow(data as BuildRow | null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [id]);

  async function recheck() {
    if (!row?.deployment_id) return;
    setRefreshing(true);
    try {
      await supabase.functions.invoke("deploy-website", {
        body: { action: "status", data: { deploymentId: row.deployment_id } },
      });
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00C853" }} />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#F5FFF7" }}>
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Build request not found</CardTitle></CardHeader>
          <CardContent>
            <Link to="/dev/dashboard"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to studio</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "#F5FFF7" }}>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link to="/dev/dashboard">
            <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <Button size="sm" onClick={recheck} disabled={refreshing || !row.deployment_id}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />Re-check status
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Deployment status</CardTitle>
            <p className="text-sm text-muted-foreground">{row.business_name || "Untitled"}</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Build ID</span><span className="font-mono text-xs">{row.id.slice(0, 8)}…</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge>{row.status || "—"}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Stage</span><span>{row.deploy_stage || "—"}</span></div>
            <div className="flex justify-between gap-2"><span className="text-muted-foreground">GitHub</span>
              {row.github_url ? <a className="truncate max-w-[60%] text-right" href={row.github_url} target="_blank" rel="noreferrer" style={{ color: "#00C853" }}>{row.github_url}</a> : <span>—</span>}
            </div>
            <div className="flex justify-between gap-2"><span className="text-muted-foreground">Live URL</span>
              {row.deploy_url ? <a href={row.deploy_url} target="_blank" rel="noreferrer" style={{ color: "#00C853" }}>{row.deploy_url}</a> : <span>—</span>}
            </div>
            <div className="flex justify-between gap-2"><span className="text-muted-foreground">Vercel inspector</span>
              {row.deploy_inspector_url ? <a href={row.deploy_inspector_url} target="_blank" rel="noreferrer" style={{ color: "#00C853" }}>Open logs</a> : <span>—</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {STEPS.map((s) => {
              const st = stageStatus(row, s.key);
              const Icon = st === "done" ? CheckCircle2 : st === "error" ? XCircle : st === "active" ? Loader2 : Clock;
              const color = st === "done" ? "#00C853" : st === "error" ? "#DC2626" : st === "active" ? "#2563EB" : "#9CA3AF";
              const ts =
                s.key === "deployment_start" ? row.submitted_at :
                s.key === "build_logs" ? (row.live_deployed_at || row.demo_deployed_at || row.last_deploy_checked_at) :
                s.key === "repo_preflight" ? row.created_at : null;
              return (
                <div key={s.key} className="flex items-start gap-3 p-3 rounded-lg border bg-white">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${st === "active" ? "animate-spin" : ""}`} style={{ color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm">{s.label}</p>
                      <span className="text-xs text-muted-foreground">{fmt(ts)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                    {st === "error" && row.deploy_error && (
                      <p className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}>{row.deploy_error}</p>
                    )}
                    {st === "error" && row.deploy_hint && (
                      <p className="text-xs mt-1 text-muted-foreground">Hint: {row.deploy_hint}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">Auto-refreshing every 5s · Last checked {fmt(row.last_deploy_checked_at)}</p>
      </div>
    </div>
  );
}
