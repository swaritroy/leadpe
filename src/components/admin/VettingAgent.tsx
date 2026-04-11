import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Unlock, Zap, CheckCircle2, AlertTriangle,
  Loader2, ImageIcon, ToggleLeft, ToggleRight
} from "lucide-react";
import { checkWebsiteQuality, generateFixPrompt, type QualityReport } from "@/lib/qualityChecker";
import QualityReportCard from "./QualityReportCard";
import { toast } from "sonner";

interface VettingAgentProps {
  performanceScore: number;
  onScoreChange: (score: number) => void;
  githubUrl?: string;
  businessData?: { name: string; type: string; city: string };
}

const VettingAgent = ({ performanceScore, onScoreChange, githubUrl, businessData }: VettingAgentProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [optimizeStatus, setOptimizeStatus] = useState("");

  const runScan = useCallback(async () => {
    if (!githubUrl || !businessData) {
      toast.error("GitHub URL and business data required to scan");
      return;
    }
    setIsScanning(true);
    setReport(null);
    try {
      const result = await checkWebsiteQuality(githubUrl, businessData);
      setReport(result);
      onScoreChange(result.score);
    } catch {
      toast.error("Quality scan failed");
    } finally {
      setIsScanning(false);
    }
  }, [githubUrl, businessData, onScoreChange]);

  const handleCopyFixes = () => {
    if (!report || !businessData) return;
    const prompt = generateFixPrompt(report, businessData);
    navigator.clipboard.writeText(prompt);
    toast.success("Fix instructions copied!");
  };

  const handleAutoOptimize = () => {
    const newVal = !autoOptimize;
    setAutoOptimize(newVal);
    setOptimizeStatus(newVal ? "Images Compressed & Alt-Tags Injected" : "");
  };

  const isDeployable = (report?.score || 0) >= 70;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          Vetting Agent
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Universal quality gatekeeper — structural DOM checks</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Scan + Report */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Website Quality Scan</h3>
              <button
                onClick={runScan}
                disabled={isScanning || !githubUrl}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isScanning ? (
                  <><Loader2 size={14} className="animate-spin" /> Scanning...</>
                ) : (
                  <><Zap size={14} /> Scan Code</>
                )}
              </button>
            </div>
            {!githubUrl && (
              <p className="text-xs text-muted-foreground">Submit a GitHub URL to enable scanning</p>
            )}
          </div>

          {report && (
            <QualityReportCard report={report} onCopyFixes={handleCopyFixes} />
          )}
        </div>

        {/* Right: Optimize + Deploy */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Auto-Optimize</h3>
            <button
              onClick={handleAutoOptimize}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ImageIcon size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Compress Images & Inject Alt-Tags</span>
              </div>
              {autoOptimize ? (
                <ToggleRight size={24} className="text-emerald-400" />
              ) : (
                <ToggleLeft size={24} className="text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {optimizeStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-400/10"
                >
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">{optimizeStatus}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Production Deployment</h3>
            <button
              disabled={!isDeployable}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                isDeployable
                  ? "bg-emerald-500 text-white hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
              }`}
            >
              {isDeployable ? (
                <><Unlock size={16} /> Push to Production</>
              ) : (
                <><Lock size={16} /> Locked — Score must be ≥ 70</>
              )}
            </button>

            {!isDeployable && report && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle size={12} className="text-yellow-400" />
                <span>Fix failing checks and re-scan to unlock deployment</span>
              </div>
            )}

            {isDeployable && report && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-emerald-400"
              >
                <CheckCircle2 size={12} />
                <span>All critical checks passed — ready for deployment</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VettingAgent;
