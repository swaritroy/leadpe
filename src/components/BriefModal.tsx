import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, ExternalLink, Loader2, CheckCircle, XCircle, Shield, AlertCircle, ClipboardCopy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkWebsiteQuality, generateFixPrompt, QualityReport } from "@/lib/qualityChecker";
import { deployWebsite } from "@/lib/deployService";
import { updateCoderEarnings } from "@/lib/earningsCalc";
import { generateLeadWidgetCode } from "@/lib/leadWidget";

const font = { heaing: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface BriefModalProps {
  request: any;
  profile: any;
  userId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function BriefModal({ request, profile, userId, onClose, onRefresh }: BriefModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"prompt" | "info" | "submit">("prompt");
  const [prompt, setPrompt] = useState("");
  const [promptLoaing, setPromptLoaing] = useState(true);
  const [copied, setCopied] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [qualityChecking, setQualityChecking] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [widgetCopied, setWidgetCopied] = useState(false);

  // Generate AI prompt on mount
  useEffect(() => {
    generatePrompt();
  }, [request.id]);

  const generatePrompt = async () => {
    setPromptLoaing(true);
    try {
      // 1. Check if ai_prompt already exists in the database
      const { data: existingRequest, error: fetchError } = await (supabase as any)
        .from("build_requests")
        .select("ai_prompt")
        .eq("id", request.id)
        .maybeSingle();

      if (existingRequest?.ai_prompt) {
        setPrompt(existingRequest.ai_prompt);
        setPromptLoaing(false);
        return;
      }

      // 2. Fetch SEO and generate new prompt
      const { data: seoData } = await (supabase as any).from("business_seo")
        .select("*").eq("business_id", request.business_id || request.id).maybeSingle();

      const { data, error } = await supabase.functions.invoke("generate-seo", {
        body: {
          type: "prompt",
          data: {
            name: request.business_name,
            type: request.business_type,
            city: request.city,
            ownerName: request.owner_name,
            whatsapp: request.owner_whatsapp?.replace(/\D/g, ""),
            colorPreference: (request as any).color_preference || "green",
            stylePreference: (request as any).style_preference || "modern",
            specialRequirements: request.special_requirements || "",
            businessId: request.business_id || request.id,
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
            supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            seo: seoData || {},
          },
        },
      });

      let generatedPrompt = "";
      if (error || data?.error || !data?.result) {
        console.error("Prompt generation error:", error || data?.error);
        generatedPrompt = getFallbackPrompt();
      } else {
        generatedPrompt = data.result;
      }
      
      setPrompt(generatedPrompt);

      // 3. Save to database for next time
      await (supabase as any).from("build_requests")
        .update({ ai_prompt: generatedPrompt })
        .eq("id", request.id);

    } catch (e) {
      console.error("Prompt error:", e);
      setPrompt(getFallbackPrompt());
    }
    setPromptLoaing(false);
  };

  const getFallbackPrompt = () => {
    return `Build a professional website for a real Indian local business.
Use React + Tailwind CSS. Mobile-first. Fast loading. Beautiful.

BUSINESS:
Name: ${request.business_name}
Type: ${request.business_type}
City: ${request.city}, India
Owner: ${request.owner_name}
WhatsApp: +91${request.owner_whatsapp}
Color: ${(request as any).color_preference || "green"}
Style: ${(request as any).style_preference || "modern"}

PAGES TO BUILD:

HOME PAGE:
- Hero: "Best ${request.business_type} in ${request.city}"
- Big green WhatsApp button → wa.me/91${request.owner_whatsapp}
- 4 service cards for ${request.business_type}
- About section
- Contact section with WhatsApp

DESIGN:
Primary: #00C853 (or chosen color)
Mobile-first, 44px+ buttons, 16px radius

SEO:
<title>${request.business_name} - Best ${request.business_type} in ${request.city}</title>
<meta name="description" content="Best ${request.business_type} in ${request.city}. Contact ${request.business_name} on WhatsApp.">

DEMO MODE:
Check VITE_LEADPE_MODE env var. If "demo": show orange bar "Preview Only", disable contact buttons.

LEAD WIDGET (REQUIRED):
Add lead capture form with name, phone, interest. Submit to Supabase.
business_id: "${request.business_id || request.id}"

After building: Connect GitHub in Lovable → Copy repo URL → Submit in LeadPe.`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast({ title: "Copied! ✓" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitGithub = async () => {
    // Validate GitHub URL format
    const isValidGithub = githubUrl.includes("github.com") && githubUrl.split("/").filter(Boolean).length >= 2;
    if (!isValidGithub) {
      toast({ title: "Invalid URL", description: "Enter a valid GitHub URL. Example: github.com/username/repo-name", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setQualityChecking(true);
    setQualityReport(null);

    try {
      const report = await checkWebsiteQuality(githubUrl, {
        name: request.business_name,
        type: request.business_type,
        city: request.city,
      });
      setQualityReport(report);
      setQualityChecking(false);

      await (supabase as any).from("quality_reports").insert({
        build_request_id: request.id,
        score: report.score, passed: report.passed,
        checks: report.checks, issues: report.issues,
        fixes: report.fixes, ai_suggestions: report.aiSuggestions,
      });

      if (!report.passed) {
        toast({ title: `⚠️ Score: ${report.score}/100`, description: "Fix issues and resubmit.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      toast({ title: "✅ Quality passed!", description: `Score: ${report.score}/100 — Deploying...` });

      await (supabase as any).from("build_requests").update({
        status: "review", github_url: githubUrl, submitted_at: new Date().toISOString(),
      }).eq("id", request.id);

      const deployResult = await deployWebsite({
        id: request.id,
        businessName: request.business_name,
        businessType: request.business_type,
        city: request.city,
        githubUrl,
        trialCode: "",
      });

      if (deployResult.success && deployResult.deployUrl) {
        await (supabase as any).from("build_requests").update({
          status: "demo_ready",
          deploy_url: deployResult.deployUrl,
          deployed_at: new Date().toISOString(),
          github_url: githubUrl,
        }).eq("id", request.id);

        const coderEarn = request.coder_earning || 640;
        await updateCoderEarnings(userId, { id: request.id, coder_earning: coderEarn, business_name: request.business_name });

        window.open(`https://wa.me/91${request.owner_whatsapp?.replace(/\D/g, "")}?text=${encodeURIComponent(`🎉 Your website preview is ready!\n🌐 ${deployResult.deployUrl}\nLogin to your LeadPe dashboard to review it!\nLeadPe 🌱`)}`, "_blank");
        window.open(`https://wa.me/919973383902?text=${encodeURIComponent(`✅ DEPLOYED\nBusiness: ${request.business_name}\nURL: ${deployResult.deployUrl}\nScore: ${report.score}/100\nCoder: ${profile?.full_name}\nLeadPe ⚡`)}`, "_blank");

        toast({ title: "🚀 Deployed!", description: `${deployResult.deployUrl} — ₹${coderEarn} earned!` });
      } else {
        toast({ title: "⚠️ Auto deploy failed", description: deployResult.error || "Admin will deploy.", variant: "destructive" });
      }

      onClose();
      onRefresh();
    } catch (e) {
      console.error("Submit error:", e);
      toast({ title: "Error", description: "Failed to submit", variant: "destructive" });
    } finally {
      setSubmitting(false);
      setQualityChecking(false);
    }
  };

  const tabs = [
    { id: "prompt" as const, label: "📋 Prompt" },
    { id: "info" as const, label: "ℹ️ Info" },
    { id: "submit" as const, label: "✅ Submit" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[720px] sm:rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 border-b" style={{ height: 56, borderColor: "#F0F0F0" }}>
          <div>
            <span style={{ fontFamily: font.heaing, fontSize: 20, fontWeight: 700 }}>Build Brief</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 14, color: "#666" }}>{request.business_name}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TAB BAR */}
        <div className="flex border-b" style={{ borderColor: "#F0F0F0" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 text-center py-3"
              style={{
                fontFamily: font.body, fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "#00C853" : "#666",
                borderBottom: activeTab === tab.id ? "2px solid #00C853" : "2px solid transparent",
                background: "none", cursor: "pointer",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-y-auto">
          {/* ═══ PROMPT TAB ═══ */}
          {activeTab === "prompt" && (
            <div className="p-4">
              <p className="text-center mb-3" style={{ fontSize: 12, color: "#00C853" }}>
                Copy → Lovable → Build → GitHub → Submit
              </p>

              {promptLoaing ? (
                <div className="rounded-xl p-8 text-center" style={{ backgroundColor: "#F8F9FA", border: "1px solid #E0E0E0" }}>
                  <Loader2 size={24} className="animate-spin mx-auto mb-3" style={{ color: "#00C853" }} />
                  <p style={{ fontSize: 14, color: "#666" }}>Generating AI prompt...</p>
                  <div className="space-y-2 mt-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-4 rounded animate-pulse mx-auto" style={{ backgroundColor: "#E0E0E0", width: `${80 - i * 10}%` }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl" style={{ backgroundColor: "#F8F9FA", border: "1px solid #E0E0E0", padding: 16, maxHeight: 380, overflowY: "auto" }}>
                  <pre style={{ fontFamily: font.body, fontSize: 13, color: "#1A1A1A", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {prompt}
                  </pre>
                </div>
              )}

              <button onClick={handleCopy} disabled={promptLoaing}
                style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 12, minHeight: 52 }}>
                {copied ? "Copied! ✓" : "Copy Complete Prompt 📋"}
              </button>

              <div className="mt-4">
                <p style={{ fontFamily: font.body, fontSize: 13, color: "#666", marginBottom: 8, textAlign: "center" }}>
                  Choose your build tool:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => window.open("https://lovable.dev", "_blank")}
                    style={{ width: "100%", backgroundColor: "#fff", color: "#00C853", border: "2px solid #00C853", borderRadius: 12, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Open Lovable →
                  </button>
                  <button onClick={() => window.open("https://bolt.new", "_blank")}
                    style={{ width: "100%", backgroundColor: "#fff", color: "#00C853", border: "2px solid #00C853", borderRadius: 12, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Open Bolt →
                  </button>
                  <button onClick={() => window.open("https://emergentmind.com", "_blank")}
                    style={{ width: "100%", backgroundColor: "#fff", color: "#00C853", border: "2px solid #00C853", borderRadius: 12, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Open Emergent →
                  </button>
                  <button onClick={() => window.open("https://replit.com", "_blank")}
                    style={{ width: "100%", backgroundColor: "#fff", color: "#00C853", border: "2px solid #00C853", borderRadius: 12, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Open Replit →
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                {["1️⃣ Copy prompt", "2️⃣ Open Lovable", "3️⃣ Paste in Lovable chat", "4️⃣ Build website", "5️⃣ Connect GitHub in Lovable", "6️⃣ Copy GitHub URL", "7️⃣ Go to Submit tab →"].map(s => (
                  <p key={s} style={{ fontSize: 13, color: "#666" }}>{s}</p>
                ))}
              </div>
            </div>
          )}

          {/* ═══ INFO TAB ═══ */}
          {activeTab === "info" && (
            <div className="p-4 space-y-3">
              <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FA" }}>
                <p style={{ fontFamily: font.heaing, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{request.business_name}</p>
                <p style={{ fontSize: 13, color: "#666" }}>{request.business_type} • {request.city}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span style={{ fontSize: 13, color: "#666" }}>WhatsApp: +91{request.owner_whatsapp}</span>
                  <button onClick={() => { navigator.clipboard.writeText(request.owner_whatsapp); toast({ title: "Copied!" }); }}
                    style={{ fontSize: 12, color: "#00C853", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    Copy
                  </button>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FA" }}>
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ fontSize: 13, color: "#666" }}>Color:</span>
                  <div className="w-5 h-5 rounded-full" style={{
                    backgroundColor: (request as any).color_preference === "blue" ? "#2196F3" :
                      (request as any).color_preference === "orange" ? "#FF6B35" :
                        (request as any).color_preference === "dark" ? "#1A1A1A" : "#00C853"
                  }} />
                  <span style={{ fontSize: 13, color: "#1A1A1A" }}>{(request as any).color_preference || "green"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 13, color: "#666" }}>Style:</span>
                  <span style={{ fontSize: 13, color: "#1A1A1A" }}>{(request as any).style_preference || "modern"}</span>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FA" }}>
                <span style={{ fontSize: 13, color: "#666" }}>Logo:</span>
                <span style={{ fontSize: 13, color: "#1A1A1A", marginLeft: 8 }}>
                  {(request as any).logo_url ? "Uploaded" : "Text logo"}
                </span>
              </div>

              {request.special_requirements && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#F0F0F0" }}>
                  <p style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Requirements:</p>
                  <p style={{ fontSize: 13, color: "#1A1A1A" }}>{request.special_requirements}</p>
                </div>
              )}

              {/* GitHub Requirements Checklist */}
              <div className="rounded-xl p-4" style={{ backgroundColor: "#EFF6FF", border: "1px solid #93C5FD" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 8 }}>📦 GitHub Requirements</p>
                <div className="space-y-2">
                  {[
                    "Repository must be PUBLIC",
                    "Built with React + Vite",
                    'Has package.json with "build": "vite build" script',
                    "No build errors locally",
                    "LeadPe widget code included",
                    'Branch name must be "main"',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle size={14} style={{ color: "#3B82F6", marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#1E3A5F" }}>{item}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>
                  ⚠️ Private repos will cause deployment errors.
                </p>
              </div>

              {/* Lead Widget */}
              <div className="rounded-xl p-4" style={{ backgroundColor: "#FFF3E0", border: "1px solid #FF9800" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#E65100", marginBottom: 8 }}>⚠️ Lead Widget (REQUIRED)</p>
                <div className="rounded-lg p-3 text-xs font-mono max-h-32 overflow-y-auto" style={{ backgroundColor: "#F1F3F5", border: "1px solid #E0E0E0" }}>
                  <pre className="whitespace-pre-wrap break-all">{generateLeadWidgetCode({
                    id: request.business_id || request.id,
                    name: request.business_name,
                    whatsapp: request.owner_whatsapp,
                  })}</pre>
                </div>
                <button onClick={() => {
                  navigator.clipboard.writeText(generateLeadWidgetCode({
                    id: request.business_id || request.id,
                    name: request.business_name,
                    whatsapp: request.owner_whatsapp,
                  }));
                  setWidgetCopied(true);
                  setTimeout(() => setWidgetCopied(false), 2000);
                  toast({ title: "✅ Widget copied!" });
                }}
                  style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8, minHeight: 40 }}>
                  {widgetCopied ? "Copied! ✅" : "Copy Widget Code 📋"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ SUBMIT TAB ═══ */}
          {activeTab === "submit" && (
            <div className="p-4">
              <h3 style={{ fontFamily: font.heaing, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
                Submit Your Website
              </h3>

              <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "#FFF8E1" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#F57F17", marginBottom: 8 }}>How to get GitHub URL:</p>
                {[
                  "1. In Lovable: click GitHub icon (top right)",
                  "2. Connect your GitHub account (one time)",
                  `3. Create repo named: ${request.business_name?.toLowerCase().replace(/\s+/g, "-")}-website`,
                  "4. Copy URL: github.com/you/reponame",
                ].map(s => (
                  <p key={s} style={{ fontSize: 13, color: "#666", lineHeight: 1.8 }}>{s}</p>
                ))}
              </div>

              <label style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", display: "block", marginBottom: 6 }}>
                GitHub Repository URL
              </label>
              <input value={githubUrl}
                onChange={(e) => { setGithubUrl(e.target.value); setQualityReport(null); }}
                placeholder="github.com/username/reponame"
                style={{
                  width: "100%", height: 52, border: "2px solid #E0E0E0", borderRadius: 12,
                  padding: "0 16px", fontSize: 15, outline: "none", marginBottom: 12,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00C853")}
                onBlur={(e) => (e.target.style.borderColor = "#E0E0E0")}
              />

              {/* Deployment Progress Steps */}
              {(qualityChecking || submitting) && (
                <div className="rounded-xl p-4 mb-3 space-y-3" style={{ backgroundColor: "#F0FFF4", border: "1px solid #00C853" }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} style={{ color: "#00C853" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>✅ GitHub URL received</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {qualityChecking ? (
                      <Loader2 size={16} className="animate-spin" style={{ color: "#00C853" }} />
                    ) : qualityReport ? (
                      <CheckCircle size={16} style={{ color: "#00C853" }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span style={{ fontSize: 13, fontWeight: qualityChecking ? 600 : 400, color: "#1A1A1A" }}>
                      {qualityChecking ? "⏳ Running quality check..." : qualityReport ? "✅ Quality check passed" : "Quality check"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {submitting && !qualityChecking && qualityReport?.passed ? (
                      <Loader2 size={16} className="animate-spin" style={{ color: "#00C853" }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span style={{ fontSize: 13, fontWeight: submitting && !qualityChecking ? 600 : 400, color: "#1A1A1A" }}>
                      {submitting && !qualityChecking && qualityReport?.passed ? "⏳ Deploying to Vercel..." : "Deploy to Vercel"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span style={{ fontSize: 13, color: "#999" }}>Website is live!</span>
                  </div>
                </div>
              )}

              {qualityReport && !qualityChecking && (
                <div className="rounded-xl p-4 mb-3" style={{
                  backgroundColor: qualityReport.passed ? "#F0FFF4" : "#FFF3E0",
                  border: `2px solid ${qualityReport.passed ? "#00C853" : "#FF6D00"}`,
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {qualityReport.passed ? <CheckCircle size={20} style={{ color: "#00C853" }} /> : <AlertCircle size={20} style={{ color: "#FF6D00" }} />}
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{qualityReport.score}/100</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${qualityReport.passed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {qualityReport.passed ? "✅ Passed" : "⚠️ Needs Fixes"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {Object.entries(qualityReport.checks).map(([key, passed]) => (
                      <div key={key} className="flex items-center gap-1 text-xs">
                        {passed ? <CheckCircle size={12} style={{ color: "#00C853" }} /> : <XCircle size={12} style={{ color: "#ef4444" }} />}
                        <span>{key.replace(/^has/, "").replace(/([A-Z])/g, " $1").trim()}</span>
                      </div>
                    ))}
                  </div>
                  {!qualityReport.passed && qualityReport.issues.length > 0 && (
                    <>
                      {qualityReport.issues.map((issue, i) => (
                        <p key={i} className="text-xs mb-1" style={{ color: "#ef4444" }}>{issue}</p>
                      ))}
                      <button onClick={() => {
                        const p = generateFixPrompt(qualityReport, { name: request.business_name, type: request.business_type, city: request.city });
                        navigator.clipboard.writeText(p);
                        toast({ title: "Fix prompt copied!" });
                      }}
                        style={{ width: "100%", backgroundColor: "#fff", color: "#FF6D00", border: "1px solid #FF6D00", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                        Copy Fix Instructions →
                      </button>
                    </>
                  )}
                </div>
              )}

              <button onClick={handleSubmitGithub}
                disabled={submitting || qualityChecking || !githubUrl.includes("github.com")}
                style={{
                  width: "100%", backgroundColor: githubUrl.includes("github.com") ? "#00C853" : "#E0E0E0",
                  color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600,
                  cursor: githubUrl.includes("github.com") ? "pointer" : "not-allowed", minHeight: 52,
                  opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? (qualityChecking ? "Checking quality..." : "Deploying...") : "Submit for Review →"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
