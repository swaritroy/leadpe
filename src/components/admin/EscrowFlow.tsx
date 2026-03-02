import { motion } from "framer-motion";
import {
  Wallet, Shield, Banknote, CheckCircle2, Clock,
  Lock, ArrowRight, ChevronRight
} from "lucide-react";

interface EscrowFlowProps {
  vettingScore: number;
}

const steps = [
  { key: "deposit", label: "Deposit Held", desc: "Client funds secured in escrow", icon: Wallet },
  { key: "vetting", label: "Vetting Approved", desc: "Code passes quality gatekeeper", icon: Shield },
  { key: "released", label: "Funds Released", desc: "Payment sent to developer", icon: Banknote },
];

const EscrowFlow = ({ vettingScore }: EscrowFlowProps) => {
  const vettingPassed = vettingScore >= 90;

  // Determine step statuses
  const getStepStatus = (index: number) => {
    if (index === 0) return "complete"; // Deposit always held
    if (index === 1) return vettingPassed ? "complete" : "pending";
    if (index === 2) return vettingPassed ? "complete" : "locked";
    return "pending";
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gi-text flex items-center gap-2">
          <Wallet size={18} className="text-gi-amber" />
          Stripe Connect Escrow
        </h2>
        <p className="text-sm text-gi-text-muted mt-0.5">Funds flow controlled by vetting score</p>
      </div>

      {/* Stepper */}
      <div className="rounded-xl border border-gi-border bg-gi-surface p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, i) => {
            const status = getStepStatus(i);
            const isComplete = status === "complete";
            const isLocked = status === "locked";

            return (
              <div key={step.key} className="flex items-center flex-1">
                {/* Step Node */}
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 border transition-colors ${
                      isComplete
                        ? "bg-gi-emerald border-gi-emerald/30"
                        : isLocked
                        ? "bg-gi-red-muted border-gi-red/30"
                        : "bg-gi-amber-muted border-gi-amber/30"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 size={20} className="text-gi-bg" />
                    ) : isLocked ? (
                      <Lock size={20} className="gi-red" />
                    ) : (
                      <Clock size={20} className="gi-amber" />
                    )}
                  </motion.div>

                  <span className={`text-sm font-semibold text-center ${
                    isComplete ? "gi-emerald" : isLocked ? "gi-red" : "gi-amber"
                  }`}>
                    {step.label}
                  </span>
                  <span className="text-xs text-gi-text-muted text-center mt-1 max-w-[140px]">{step.desc}</span>
                </div>

                {/* Connector Line */}
                {i < steps.length - 1 && (
                  <div className="flex-shrink-0 mx-2 mb-10">
                    <div className={`w-16 h-0.5 ${
                      getStepStatus(i + 1) === "complete" ? "bg-gi-emerald" : "bg-gi-border"
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Message */}
        <div className={`rounded-lg p-4 flex items-center gap-3 ${
          vettingPassed ? "bg-gi-emerald-muted" : "bg-gi-amber-muted"
        }`}>
          {vettingPassed ? (
            <>
              <CheckCircle2 size={18} className="gi-emerald flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold gi-emerald">All Clear — Funds Released</span>
                <p className="text-xs text-gi-text-muted mt-0.5">Vetting score of {vettingScore}/100 meets the 90+ threshold</p>
              </div>
            </>
          ) : (
            <>
              <Clock size={18} className="gi-amber flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold gi-amber">Funds Held — Awaiting Vetting</span>
                <p className="text-xs text-gi-text-muted mt-0.5">
                  {vettingScore > 0
                    ? `Current score: ${vettingScore}/100. Needs 90+ to release funds.`
                    : "Run the Vetting Agent scan to unlock this step."
                  }
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Simulated Stripe Info */}
      <div className="rounded-xl border border-gi-border bg-gi-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gi-text">Escrow Details</h3>
          <span className="text-xs font-mono text-gi-text-muted px-2 py-1 rounded-md bg-gi-bg">via Stripe Connect</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Escrow Amount", value: "$499.00", accent: "text-gi-text" },
            { label: "Platform Fee", value: "$49.90", accent: "text-gi-text-secondary" },
            { label: "Developer Payout", value: "$449.10", accent: "gi-emerald" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg bg-gi-bg border border-gi-border-subtle">
              <div className="text-xs text-gi-text-muted mb-1">{item.label}</div>
              <div className={`text-lg font-bold ${item.accent}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EscrowFlow;
