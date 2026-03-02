import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Unlock, Zap, CheckCircle2, XCircle, AlertTriangle,
  Rocket, ToggleLeft, ToggleRight, Loader2, ImageIcon, Tag
} from "lucide-react";

interface VettingCheck {
  label: string;
  key: string;
  score: number;
  maxScore: number;
  status: "idle" | "scanning" | "pass" | "fail" | "warning";
}

interface VettingAgentProps {
  performanceScore: number;
  onScoreChange: (score: number) => void;
}

const initialChecks: VettingCheck[] = [
  { label: "SEO — Semantic HTML", key: "seo", score: 0, maxScore: 30, status: "idle" },
  { label: "Mobile Responsiveness", key: "mobile", score: 0, maxScore: 30, status: "idle" },
  { label: "Performance Score", key: "perf", score: 0, maxScore: 40, status: "idle" },
];

const VettingAgent = ({ performanceScore, onScoreChange }: VettingAgentProps) => {
  const [checks, setChecks] = useState<VettingCheck[]>(initialChecks);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [optimizeStatus, setOptimizeStatus] = useState("");

  const runScan = useCallback(() => {
    setIsScanning(true);
    setScanComplete(false);
    setChecks(initialChecks.map(c => ({ ...c, status: "scanning" as const, score: 0 })));

    // Simulate progressive scanning
    const scores = [
      { key: "seo", score: 28, status: "pass" as const },
      { key: "mobile", score: 27, status: "pass" as const },
      { key: "perf", score: autoOptimize ? 38 : 33, status: autoOptimize ? "pass" as const : "warning" as const },
    ];

    scores.forEach((result, i) => {
      setTimeout(() => {
        setChecks(prev => prev.map(c =>
          c.key === result.key
            ? { ...c, score: result.score, status: result.status }
            : c
        ));

        if (i === scores.length - 1) {
          const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
          onScoreChange(totalScore);
          setIsScanning(false);
          setScanComplete(true);
        }
      }, 1200 * (i + 1));
    });
  }, [autoOptimize, onScoreChange]);

  const handleAutoOptimize = () => {
    const newVal = !autoOptimize;
    setAutoOptimize(newVal);
    if (newVal) {
      setOptimizeStatus("Images Compressed & Alt-Tags Injected");
    } else {
      setOptimizeStatus("");
    }
  };

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const isDeployable = totalScore >= 90;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gi-text flex items-center gap-2">
          <Shield size={18} className="text-gi-emerald" />
          Vetting Agent
        </h2>
        <p className="text-sm text-gi-text-muted mt-0.5">Quality gatekeeper — code must pass before deployment</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Deployment Health */}
        <div className="rounded-xl border border-gi-border bg-gi-surface p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gi-text">Deployment Health</h3>
            <button
              onClick={runScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gi-indigo text-gi-text hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "hsl(var(--gi-indigo))" }}
            >
              {isScanning ? (
                <><Loader2 size={14} className="animate-spin" /> Scanning...</>
              ) : (
                <><Zap size={14} /> Scan Code</>
              )}
            </button>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {checks.map((check) => {
              const pct = (check.score / check.maxScore) * 100;
              const barColor =
                check.status === "pass" ? "bg-gi-emerald"
                : check.status === "warning" ? "bg-gi-amber"
                : check.status === "fail" ? "bg-gi-red"
                : "bg-gi-text-muted/30";

              return (
                <div key={check.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gi-text-secondary">{check.label}</span>
                    <span className="text-xs font-mono text-gi-text-muted">
                      {check.status === "scanning" ? "..." : `${check.score}/${check.maxScore}`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gi-bg overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: check.status === "scanning" ? "60%" : `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Score */}
          {scanComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between pt-3 border-t border-gi-border"
            >
              <span className="text-sm font-semibold text-gi-text">Total Score</span>
              <span className={`text-2xl font-black ${isDeployable ? "gi-emerald" : "gi-amber"}`}>
                {totalScore}/100
              </span>
            </motion.div>
          )}
        </div>

        {/* Deploy + Auto-Optimize */}
        <div className="space-y-4">
          {/* Auto-Optimize Toggle */}
          <div className="rounded-xl border border-gi-border bg-gi-surface p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gi-text">Auto-Optimize</h3>
            <button
              onClick={handleAutoOptimize}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-gi-border hover:border-gi-emerald/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ImageIcon size={16} className="text-gi-text-muted" />
                <span className="text-sm text-gi-text-secondary">Compress Images & Inject Alt-Tags</span>
              </div>
              {autoOptimize ? (
                <ToggleRight size={24} className="gi-emerald" />
              ) : (
                <ToggleLeft size={24} className="text-gi-text-muted" />
              )}
            </button>

            <AnimatePresence>
              {optimizeStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gi-emerald-muted"
                >
                  <CheckCircle2 size={14} className="gi-emerald" />
                  <span className="text-xs font-medium gi-emerald">{optimizeStatus}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deploy Button */}
          <div className="rounded-xl border border-gi-border bg-gi-surface p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gi-text">Production Deployment</h3>
            <button
              disabled={!isDeployable}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                isDeployable
                  ? "bg-gi-emerald text-gi-bg hover:opacity-90"
                  : "bg-gi-surface-hover text-gi-text-muted cursor-not-allowed border border-gi-border"
              }`}
            >
              {isDeployable ? (
                <><Unlock size={16} /> Push to Production</>
              ) : (
                <><Lock size={16} /> Locked — Score must be ≥ 90</>
              )}
            </button>

            {!isDeployable && scanComplete && (
              <div className="flex items-center gap-2 text-xs text-gi-text-muted">
                <AlertTriangle size={12} className="gi-amber" />
                <span>Enable Auto-Optimize and re-scan to reach 90+</span>
              </div>
            )}

            {isDeployable && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs gi-emerald"
              >
                <CheckCircle2 size={12} />
                <span>All checks passed — ready for deployment</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VettingAgent;
