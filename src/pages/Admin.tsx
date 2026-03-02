import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Layers, Shield, Users, Wallet, ChevronRight } from "lucide-react";
import SynapseLogo from "@/components/SynapseLogo";
import StandardizedShell from "@/components/admin/StandardizedShell";
import VettingAgent from "@/components/admin/VettingAgent";
import LeadLockCRM from "@/components/admin/LeadLockCRM";
import EscrowFlow from "@/components/admin/EscrowFlow";

type Module = "shell" | "vetting" | "crm" | "escrow";

const modules = [
  { key: "shell" as Module, label: "Standardized Shell", icon: Layers, desc: "Global styling engine" },
  { key: "vetting" as Module, label: "Vetting Agent", icon: Shield, desc: "Quality gatekeeper" },
  { key: "crm" as Module, label: "Lead-Lock CRM", icon: Users, desc: "Subscription-gated leads" },
  { key: "escrow" as Module, label: "Escrow Flow", icon: Wallet, desc: "Stripe Connect stepper" },
];

const Admin = () => {
  const [activeModule, setActiveModule] = useState<Module>("shell");
  const [vettingScore, setVettingScore] = useState(0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(222 47% 7%)" }}>
      {/* Top Bar */}
      <div className="border-b" style={{ borderColor: "hsl(220 13% 18%)" }}>
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="hexagon-clip bg-gradient-hero w-7 h-7 flex items-center justify-center">
              <Zap size={12} className="text-gi-text" />
            </div>
            <span className="text-sm font-bold text-gi-text tracking-tight">
              SYNAPSE<span className="text-gradient-hero">SHIFT</span>
            </span>
            <span className="text-xs text-gi-text-muted ml-2 hidden sm:inline">Growth Infrastructure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center">
              <span className="text-[10px] font-bold text-gi-text">AD</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto flex min-h-[calc(100vh-56px)]">
        {/* Sidebar Nav */}
        <nav className="w-60 border-r flex-shrink-0 py-4 px-3 space-y-1 hidden md:block" style={{ borderColor: "hsl(220 13% 18%)" }}>
          <div className="px-3 py-2 mb-3">
            <span className="text-[10px] font-semibold text-gi-text-muted uppercase tracking-widest">Modules</span>
          </div>
          {modules.map((mod) => {
            const isActive = activeModule === mod.key;
            return (
              <button
                key={mod.key}
                onClick={() => setActiveModule(mod.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  isActive
                    ? "bg-gi-surface text-gi-text"
                    : "text-gi-text-muted hover:text-gi-text-secondary hover:bg-gi-surface/50"
                }`}
              >
                <mod.icon size={16} className={isActive ? "text-gi-indigo" : ""} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{mod.label}</div>
                  <div className="text-[10px] text-gi-text-muted truncate">{mod.desc}</div>
                </div>
                {isActive && <ChevronRight size={14} className="text-gi-text-muted" />}
              </button>
            );
          })}

          {/* Score indicator */}
          <div className="mt-6 mx-3 p-3 rounded-lg border" style={{ borderColor: "hsl(220 13% 18%)", backgroundColor: "hsl(220 20% 11%)" }}>
            <div className="text-[10px] text-gi-text-muted uppercase tracking-widest mb-2">Vetting Score</div>
            <div className={`text-2xl font-black ${vettingScore >= 90 ? "gi-emerald" : vettingScore > 0 ? "gi-amber" : "text-gi-text-muted"}`}>
              {vettingScore > 0 ? vettingScore : "—"}<span className="text-sm font-normal text-gi-text-muted">/100</span>
            </div>
          </div>
        </nav>

        {/* Mobile Tabs */}
        <div className="md:hidden w-full border-b px-4 py-2 overflow-x-auto flex gap-1" style={{ borderColor: "hsl(220 13% 18%)" }}>
          {modules.map((mod) => (
            <button
              key={mod.key}
              onClick={() => setActiveModule(mod.key)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeModule === mod.key
                  ? "bg-gi-surface text-gi-text"
                  : "text-gi-text-muted"
              }`}
            >
              {mod.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {activeModule === "shell" && <StandardizedShell />}
            {activeModule === "vetting" && (
              <VettingAgent
                performanceScore={vettingScore}
                onScoreChange={setVettingScore}
              />
            )}
            {activeModule === "crm" && <LeadLockCRM />}
            {activeModule === "escrow" && <EscrowFlow vettingScore={vettingScore} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
