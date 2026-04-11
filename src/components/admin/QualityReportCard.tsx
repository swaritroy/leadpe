import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Shield, FileText } from "lucide-react";
import type { QualityReport, CheckResultItem } from "@/lib/qualityChecker";

interface QualityReportCardProps {
  report: QualityReport;
  onCopyFixes?: () => void;
}

const getBadge = (score: number) => {
  if (score >= 90) return { label: "Excellent", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" };
  if (score >= 70) return { label: "Good", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" };
  if (score >= 50) return { label: "Needs Fix", color: "text-orange-400 bg-orange-400/10 border-orange-400/30" };
  return { label: "Poor", color: "text-red-400 bg-red-400/10 border-red-400/30" };
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
};

const getScoreRingColor = (score: number) => {
  if (score >= 90) return "#34d399";
  if (score >= 70) return "#facc15";
  if (score >= 50) return "#fb923c";
  return "#f87171";
};

const QualityReportCard = ({ report, onCopyFixes }: QualityReportCardProps) => {
  const badge = getBadge(report.score);
  const items = report.checkResults || [];
  const passed = items.filter(c => c.passed);
  const failed = items.filter(c => !c.passed);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (report.score / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Score Header */}
      <div className="flex items-center gap-5 p-5 rounded-xl border border-border/50 bg-card">
        {/* Ring */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none"
              stroke={getScoreRingColor(report.score)}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${getScoreColor(report.score)}`}>{report.score}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">Quality Score</h3>
          <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-1 ${badge.color}`}>
            {badge.label}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {passed.length}/{items.length} checks passed
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield size={14} className="text-primary" />
            Quality Checks
          </h4>
        </div>
        <div className="divide-y divide-border/30">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              {item.passed ? (
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              ) : (
                <XCircle size={16} className="text-red-400 flex-shrink-0" />
              )}
              <span className={`text-sm ${item.passed ? "text-foreground" : "text-red-400 font-medium"}`}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Failed Items + Fixes */}
      {failed.length > 0 && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle size={14} />
            Fix Required ({failed.length})
          </h4>
          <div className="space-y-2">
            {failed.map(item => (
              <div key={item.key} className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3">
                <span className="font-medium text-foreground block mb-1">❌ {item.label}</span>
                <span>{item.fix}</span>
              </div>
            ))}
          </div>
          {onCopyFixes && (
            <button
              onClick={onCopyFixes}
              className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
            >
              <FileText size={12} />
              Copy all fix instructions
            </button>
          )}
        </div>
      )}

      {/* AI Suggestions */}
      {report.aiSuggestions && failed.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">💡 AI Suggestions</h4>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {report.aiSuggestions}
          </p>
        </div>
      )}
    </div>
  );
};

export default QualityReportCard;
