import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, CheckCircle, XCircle, AlertCircle, ImageIcon, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkWebsiteQuality, generateFixPrompt, QualityReport } from "@/lib/qualityChecker";
import { deployWebsite } from "@/lib/deployService";
import { updateCoderEarnings } from "@/lib/earningsCalc";
import { generateLeadWidgetCode } from "@/lib/leadWidget";
import { notifyAdmin } from "@/lib/notify";

const font = { heading: "Syne, sans-serif", body: "'DM Sans', sans-serif" };

interface BriefModalProps {
  request: any;
  profile: any;
  userId: string;
  onClose: () => void;
  onRefresh: () => void;
}

type ErrorType = "private_repo" | "invalid_url" | "empty_repo" | "no_build" | "build_failed" | "network" | "timeout" | "quality_failed" | "domain_taken" | null;

interface DeployError {
  type: ErrorType;
  message: string;
  detail?: string;
}

function getErrorCard(err: DeployError, onRetry: () => void) {
  const configs: Record<string, { icon: string; title: string; steps?: string[]; retryLabel?: string }> = {
    private_repo: {
      icon: "🔒", title: "Repository is private",
      steps: ["Go to your GitHub repo", "Settings → scroll to bottom", "Change visibility to Public", "Come back and submit again"],
      retryLabel: "I made it public — Try again →",
    },
    invalid_url: {
      icon: "🔗", title: "Invalid GitHub URL",
      steps: ["Enter a valid GitHub repository URL", "Example: github.com/yourname/business-website", "NOT: github.com (just the homepage)"],
    },
    empty_repo: {
      icon: "📭", title: "Repository is empty",
      steps: ["Your GitHub repo has no files", "Push your website code first", "Then submit the URL"],
    },
    no_build: {
      icon: "⚙️", title: "Build setup missing",
      steps: ["Your project needs a package.json with a build command", "If using plain HTML: just needs index.html at root"],
    },
    build_failed: {
      icon: "🔴", title: "Build failed",
      steps: ["Your website has code errors", "Fix the errors and push again"],
      retryLabel: "I fixed it — Try again →",
    },
    network: {
      icon: "📡", title: "Connection error",
      steps: ["Check your internet connection and try again"],
      retryLabel: "Retry →",
    },
    timeout: {
      icon: "⏳", title: "Taking longer than expected",
      steps: ["Deployment is still running", "Check back in 5 minutes", "If still not done, contact admin"],
    },
    quality_failed: {
      icon: "📊", title: "Quality check failed",
      steps: ["Fix the issues listed below and resubmit"],
      retryLabel: "I fixed it — Try again →",
    },
    domain_taken: {
      icon: "🌐", title: "Website address taken",
      steps: ["Go back and choose a different website address"],
    },
  };

  const cfg = configs[err.type || "network"] || configs.network;

  return (
    <div className="rounded-xl p-4 mb-3" style={{ backgroundColor: "#FEF2F2", border: "2px solid #EF4444" }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 24 }}>{cfg.icon}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#DC2626" }}>❌ {cfg.title}</span>
      </div>
      {err.detail && <p style={{ fontSize: 13, color: "#991B1B", marginBottom: 8 }}>{err.detail}</p>}
      {cfg.steps && (
        <div className="space-y-1 mb-3">
          {cfg.steps.map((s, i) => (
            <p key={i} style={{ fontSize: 13, color: "#7F1D1D" }}>{i + 1}. {s}</p>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {cfg.retryLabel && (
          <button onClick={onRetry} style={{ flex: 1, backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>
            {cfg.retryLabel}
          </button>
        )}
        <button onClick={() => window.open("https://wa.me/919973383902?text=Help%20with%20deployment%20error", "_blank")}
          style={{ flex: cfg.retryLabel ? 0 : 1, backgroundColor: "#fff", color: "#666", border: "1px solid #E0E0E0", borderRadius: 10, padding: "12px", fontSize: 13, cursor: "pointer", minHeight: 44, whiteSpace: "nowrap" }}>
          Contact Support
        </button>
      </div>
    </div>
  );
}

export default function BriefModal({ request, profile, userId, onClose, onRefresh }: BriefModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"prompt" | "info" | "submit">("prompt");
  const [prompt, setPrompt] = useState("");
  const [promptLoading, setPromptLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [qualityChecking, setQualityChecking] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [widgetCopied, setWidgetCopied] = useState(false);
  const [deployError, setDeployError] = useState<DeployError | null>(null);

  useEffect(() => {
    generatePrompt();
  }, [request.id]);

  const generatePrompt = async () => {
    setPromptLoading(true);
    try {
      const { data: existingRequest } = await (supabase as any)
        .from("build_requests").select("ai_prompt").eq("id", request.id).maybeSingle();

      if (existingRequest?.ai_prompt) {
        setPrompt(existingRequest.ai_prompt);
        setPromptLoading(false);
        return;
      }

      // Fetch order data for logo/photos and SEO data in parallel
      const [seoResult, orderResult] = await Promise.all([
        (supabase as any).from("business_seo")
          .select("*").eq("business_id", request.business_id || request.id).maybeSingle(),
        (supabase as any).from("orders")
          .select("logo_url, photos_urls, color_preference, reference_site, business_description, business_since")
          .eq("business_name", request.business_name)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const seoData = seoResult?.data || {};
      const orderData = orderResult?.data || {};

      const { data, error } = await supabase.functions.invoke("ai-generate", {
        body: {
          type: "build_prompt",
          data: {
            business_name: request.business_name,
            business_type: request.business_type,
            city: request.city,
            owner_name: request.owner_name,
            whatsapp_number: request.owner_whatsapp?.replace(/\D/g, ""),
            color_preference: orderData.color_preference || (request as any).color_preference || "green",
            special_requirements: request.special_requirements || "",
            reference_sites: request.reference_sites || orderData.reference_site || "",
            one_line_description: orderData.business_description || "",
            package_id: request.package_id || "standard",
            businessId: request.business_id || request.id,
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
            supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            logo_url: orderData.logo_url || "",
            photos_urls: orderData.photos_urls?.length > 0 ? orderData.photos_urls.join("\n") : "",
            seo: seoData,
          },
        },
      });

      let generatedPrompt = "";
      if (error || data?.error || !data?.result) {
        generatedPrompt = getFallbackPrompt();
      } else {
        generatedPrompt = data.result;
      }
      setPrompt(generatedPrompt);

      await (supabase as any).from("build_requests").update({ ai_prompt: generatedPrompt }).eq("id", request.id);
    } catch {
      setPrompt(getFallbackPrompt());
    }
    setPromptLoading(false);
  };

  const getFallbackPrompt = () => {
    const widgetCode = generateLeadWidgetCode({
      id: request.business_id || request.id, name: request.business_name, whatsapp: request.owner_whatsapp,
    });

    const logoSection = (request as any).logo_url
      ? `\n════ LOGO ════\nUSE THIS LOGO: ${(request as any).logo_url}\nPlace in navbar prominently.\n`
      : "\n════ LOGO ════\nNo logo — create text logo using business name.\n";

    const photosSection = (request as any).photos_urls?.length > 0
      ? `\n════ BUSINESS PHOTOS ════\nUSE THESE ACTUAL PHOTOS:\n${(request as any).photos_urls.join("\n")}\nUse in hero and gallery. Do NOT use stock photos.\n`
      : "";

    return `Build a professional website for a real Indian local business.
Use React + Vite + Tailwind CSS. Mobile-first. Fast loading. Beautiful.

═══════════════════════════════════════════
BUSINESS DETAILS
═══════════════════════════════════════════
Name: ${request.business_name}
Type: ${request.business_type}
City: ${request.city}, India
Owner: ${request.owner_name}
WhatsApp: +91${request.owner_whatsapp}
Color: ${(request as any).color_preference || "green"}
${logoSection}${photosSection}
═══════════════════════════════════════════
HOME PAGE
═══════════════════════════════════════════
- Hero: "Best ${request.business_type} in ${request.city}"
- Big green WhatsApp button → wa.me/91${request.owner_whatsapp}
- 4-6 service cards specific to ${request.business_type}
- About section with owner name
- Testimonials from ${request.city} customers
- Contact section with WhatsApp

═══════════════════════════════════════════
FLOATING WHATSAPP BUTTON
═══════════════════════════════════════════
Fixed bottom-right, green #25D366, pulse animation, z-index 9999
Links to: https://wa.me/91${request.owner_whatsapp}

═══════════════════════════════════════════
SEO
═══════════════════════════════════════════
<title>${request.business_name} - Best ${request.business_type} in ${request.city}</title>
LocalBusiness schema JSON-LD

═══════════════════════════════════════════
DEMO MODE
═══════════════════════════════════════════
Check VITE_LEADPE_MODE env var.
If "demo": show orange bar "⚠️ This is a preview", disable contact buttons.

═══════════════════════════════════════════
⚠️ LEADPE LEAD CAPTURE WIDGET — CRITICAL ⚠️
═══════════════════════════════════════════
Embed this EXACT code in the contact section:

${widgetCode}

═══════════════════════════════════════════
VIRAL FOOTER (REQUIRED)
═══════════════════════════════════════════
At the very bottom of every page footer:
"Built with LeadPe 🌱 — Get your free website at leadpe.online"
Font size: 12px, Color: #999999
"leadpe.online" must be a clickable link to https://leadpe.online (new tab)

═══════════════════════════════════════════
FOOTER
═══════════════════════════════════════════
Business info, quick links, "Powered by LeadPe 🌱"

═══════════════════════════════════════════
AFTER BUILDING
═══════════════════════════════════════════
Connect GitHub → PUBLIC repo → Branch "main" → Submit in LeadPe Studio.`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast({ title: "Copied! ✓" });
    setTimeout(() => setCopied(false), 2000);
  };

  const detectErrorType = (error: string): DeployError => {
    const e = error.toLowerCase();
    if (e.includes("not found") || e.includes("403") || e.includes("private")) return { type: "private_repo", message: error };
    if (e.includes("empty") || e.includes("no files")) return { type: "empty_repo", message: error };
    if (e.includes("package.json") || e.includes("build script") || e.includes("no build")) return { type: "no_build", message: error };
    if (e.includes("build fail") || e.includes("compilation") || e.includes("syntax")) return { type: "build_failed", message: error, detail: error };
    if (e.includes("timeout") || e.includes("timed out")) return { type: "timeout", message: error };
    if (e.includes("network") || e.includes("fetch") || e.includes("ECONNREFUSED")) return { type: "network", message: error };
    if (e.includes("domain") || e.includes("taken") || e.includes("already")) return { type: "domain_taken", message: error };
    return { type: "build_failed", message: error, detail: error };
  };

  const validateGithubUrl = (url: string): DeployError | null => {
    if (!url) return { type: "invalid_url", message: "URL is empty" };
    const cleaned = url.replace(/https?:\/\//, "").replace(/\/$/, "");
    if (!cleaned.includes("github.com")) return { type: "invalid_url", message: "Not a GitHub URL" };
    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length < 3) return { type: "invalid_url", message: "Missing username or repo name" };
    return null;
  };

  const handleSubmitGithub = async () => {
    setDeployError(null);
    const urlError = validateGithubUrl(githubUrl);
    if (urlError) {
      setDeployError(urlError);
      return;
    }

    setSubmitting(true);
    setQualityChecking(true);
    setQualityReport(null);

    try {
      const report = await checkWebsiteQuality(githubUrl, {
        name: request.business_name, type: request.business_type, city: request.city,
      });
      setQualityReport(report);
      setQualityChecking(false);

      await (supabase as any).from("quality_reports").insert({
        build_request_id: request.id, score: report.score, passed: report.passed,
        checks: report.checks, issues: report.issues, fixes: report.fixes, ai_suggestions: report.aiSuggestions,
      });

      if (!report.passed) {
        setDeployError({ type: "quality_failed", message: `Score: ${report.score}/100`, detail: report.issues.join("\n") });
        setSubmitting(false);
        return;
      }

      toast({ title: "✅ Quality passed!", description: `Score: ${report.score}/100 — Deploying...` });

      await (supabase as any).from("build_requests").update({
        status: "review", github_url: githubUrl, submitted_at: new Date().toISOString(),
      }).eq("id", request.id);

      // Deploy with timeout
      const deployPromise = deployWebsite({
        id: request.id, businessName: request.business_name, businessType: request.business_type,
        city: request.city, githubUrl, trialCode: "",
      });
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Deployment timeout")), 180000));

      const deployResult = await Promise.race([deployPromise, timeoutPromise]).catch((err) => {
        return { success: false, error: err.message || "Deployment failed", deployUrl: null };
      }) as any;

      if (deployResult.success && deployResult.deployUrl) {
        await (supabase as any).from("build_requests").update({
          status: "demo_ready", deploy_url: deployResult.deployUrl, deployed_at: new Date().toISOString(), github_url: githubUrl,
        }).eq("id", request.id);

        const coderEarn = request.coder_earning || Math.round((request.package_price || 800) * 0.60);
        await updateCoderEarnings(userId, { id: request.id, coder_earning: coderEarn, business_name: request.business_name });

        // Admin alert via Twilio + queue "demo ready" client message in Outbox (await for reliability)
        try {
          await notifyAdmin(
            "demo_ready",
            {
              business_name: request.business_name,
              demo_url: deployResult.deployUrl,
              coder: profile?.full_name,
            },
            {
              to: request.owner_whatsapp,
              message: `🎉 Your website preview is ready!\n\n${request.business_name}\n🔗 ${deployResult.deployUrl}\n\nLogin to your LeadPe dashboard to review.\nLeadPe 🌱`,
              type: "demo_ready",
              client_name: request.owner_name,
              business_id: request.business_id,
            }
          );
        } catch (e) { console.log("notifyAdmin failed:", e); }

        toast({ title: "🚀 Deployed!", description: `${deployResult.deployUrl} — ₹${coderEarn} earned!` });
        onClose();
        onRefresh();
      } else {
        setDeployError(detectErrorType(deployResult.error || "Deployment failed"));
      }
    } catch (e: any) {
      console.error("Submit error:", e);
      if (e.message?.includes("timeout")) {
        setDeployError({ type: "timeout", message: "Deployment timed out" });
      } else if (e.message?.includes("fetch") || e.message?.includes("network")) {
        setDeployError({ type: "network", message: e.message });
      } else {
        setDeployError(detectErrorType(e.message || "Unknown error"));
      }
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
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }}
        className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[720px] sm:rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 border-b" style={{ height: 56, borderColor: "#F0F0F0" }}>
          <span style={{ fontFamily: font.heading, fontSize: 20, fontWeight: 700 }}>Build Brief</span>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 14, color: "#666" }}>{request.business_name}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
          </div>
        </div>

        {/* TAB BAR */}
        <div className="flex border-b" style={{ borderColor: "#F0F0F0" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 text-center py-3"
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

              {promptLoading ? (
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

              <button onClick={handleCopy} disabled={promptLoading}
                style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 12, minHeight: 52 }}>
                {copied ? "Copied! ✓" : "Copy Complete Prompt 📋"}
              </button>

              <div className="mt-4">
                <p style={{ fontFamily: font.body, fontSize: 13, color: "#666", marginBottom: 8, textAlign: "center" }}>Choose your build tool:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ name: "Lovable", url: "https://lovable.dev" }, { name: "Bolt", url: "https://bolt.new" }, { name: "Emergent", url: "https://emergentmind.com" }, { name: "Replit", url: "https://replit.com" }].map(t => (
                    <button key={t.name} onClick={() => window.open(t.url, "_blank")}
                      style={{ width: "100%", backgroundColor: "#fff", color: "#00C853", border: "2px solid #00C853", borderRadius: 12, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                      Open {t.name} →
                    </button>
                  ))}
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
                <p style={{ fontFamily: font.heading, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{request.business_name}</p>
                <p style={{ fontSize: 13, color: "#666" }}>{request.business_type} • {request.city}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span style={{ fontSize: 13, color: "#666" }}>WhatsApp: +91{request.owner_whatsapp}</span>
                  <button onClick={() => { navigator.clipboard.writeText(request.owner_whatsapp); toast({ title: "Copied!" }); }}
                    style={{ fontSize: 12, color: "#00C853", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Copy</button>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FA" }}>
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ fontSize: 13, color: "#666" }}>Color:</span>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: (request as any).color_preference || "#00C853" }} />
                  <span style={{ fontSize: 13, color: "#1A1A1A" }}>{(request as any).color_preference || "green"}</span>
                </div>
              </div>

              {/* Logo Section */}
              <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FA" }}>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon size={16} style={{ color: "#666" }} />
                  <span style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>Business Logo</span>
                </div>
                {(request as any).logo_url ? (
                  <div>
                    <img src={(request as any).logo_url} alt="Business Logo"
                      className="max-h-24 rounded-lg border" style={{ borderColor: "#E0E0E0", objectFit: "contain" }} />
                    <p className="text-xs mt-1 font-medium" style={{ color: "#00C853" }}>✅ Use this logo on the website</p>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: "#999" }}>No logo — create text logo</span>
                )}
              </div>

              {/* Photos Section */}
              {(request as any).photos_urls && (request as any).photos_urls.length > 0 ? (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F9FA" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon size={16} style={{ color: "#666" }} />
                    <span style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>Business Photos ({(request as any).photos_urls.length})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(request as any).photos_urls.map((url: string, i: number) => (
                      <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-full h-20 object-cover rounded-lg border" style={{ borderColor: "#E0E0E0" }} />
                    ))}
                  </div>
                  <p className="text-xs mt-2 font-medium" style={{ color: "#00C853" }}>✅ Use these actual photos — not stock images</p>
                </div>
              ) : !(request as any).logo_url ? (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#FFF8E1", border: "1px solid #FFD54F" }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} style={{ color: "#F57F17" }} />
                    <span style={{ fontSize: 13, color: "#F57F17", fontWeight: 600 }}>⚠️ No images provided</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Use relevant stock photos for this business type</p>
                </div>
              ) : null}

              {request.special_requirements && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#F0F0F0" }}>
                  <p style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>Requirements:</p>
                  <p style={{ fontSize: 13, color: "#1A1A1A" }}>{request.special_requirements}</p>
                </div>
              )}

              {/* GitHub Requirements */}
              <div className="rounded-xl p-4" style={{ backgroundColor: "#EFF6FF", border: "1px solid #93C5FD" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", marginBottom: 8 }}>📦 GitHub Requirements</p>
                <div className="space-y-2">
                  {["Repository must be PUBLIC", "Built with React + Vite", 'Has package.json with "build": "vite build"', "No build errors locally", "LeadPe widget code included", 'Branch name must be "main"', 'Footer has "Built with LeadPe 🌱" credit'].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle size={14} style={{ color: "#3B82F6", marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#1E3A5F" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lead Widget */}
              <div className="rounded-xl p-4" style={{ backgroundColor: "#FFF3E0", border: "1px solid #FF9800" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#E65100", marginBottom: 8 }}>⚠️ Lead Widget (REQUIRED)</p>
                <div className="rounded-lg p-3 text-xs font-mono max-h-32 overflow-y-auto" style={{ backgroundColor: "#F1F3F5", border: "1px solid #E0E0E0" }}>
                  <pre className="whitespace-pre-wrap break-all">{generateLeadWidgetCode({
                    id: request.business_id || request.id, name: request.business_name, whatsapp: request.owner_whatsapp,
                  })}</pre>
                </div>
                <button onClick={() => {
                  navigator.clipboard.writeText(generateLeadWidgetCode({
                    id: request.business_id || request.id, name: request.business_name, whatsapp: request.owner_whatsapp,
                  }));
                  setWidgetCopied(true);
                  setTimeout(() => setWidgetCopied(false), 2000);
                  toast({ title: "✅ Widget copied!" });
                }}
                  style={{ width: "100%", backgroundColor: "#00C853", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8, minHeight: 44 }}>
                  {widgetCopied ? "Copied! ✅" : "Copy Widget Code 📋"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ SUBMIT TAB ═══ */}
          {activeTab === "submit" && (
            <div className="p-4">
              <h3 style={{ fontFamily: font.heading, fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>Submit Your Website</h3>

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

              <label style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", display: "block", marginBottom: 6 }}>GitHub Repository URL</label>
              <input value={githubUrl}
                onChange={(e) => { setGithubUrl(e.target.value); setQualityReport(null); setDeployError(null); }}
                placeholder="github.com/username/reponame"
                style={{ width: "100%", height: 52, border: "2px solid #E0E0E0", borderRadius: 12, padding: "0 16px", fontSize: 15, outline: "none", marginBottom: 12 }}
                onFocus={(e) => (e.target.style.borderColor = "#00C853")}
                onBlur={(e) => (e.target.style.borderColor = "#E0E0E0")}
              />

              {/* Error Card */}
              {deployError && getErrorCard(deployError, () => { setDeployError(null); handleSubmitGithub(); })}

              {/* Deployment Progress */}
              {(qualityChecking || submitting) && !deployError && (
                <div className="rounded-xl p-4 mb-3 space-y-3" style={{ backgroundColor: "#F0FFF4", border: "1px solid #00C853" }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} style={{ color: "#00C853" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>✅ GitHub URL received</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {qualityChecking ? <Loader2 size={16} className="animate-spin" style={{ color: "#00C853" }} /> :
                      qualityReport ? <CheckCircle size={16} style={{ color: "#00C853" }} /> :
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                    <span style={{ fontSize: 13, fontWeight: qualityChecking ? 600 : 400, color: "#1A1A1A" }}>
                      {qualityChecking ? "⏳ Running quality check..." : qualityReport ? "✅ Quality check passed" : "Quality check"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {submitting && !qualityChecking && qualityReport?.passed ? <Loader2 size={16} className="animate-spin" style={{ color: "#00C853" }} /> :
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                    <span style={{ fontSize: 13, fontWeight: submitting && !qualityChecking ? 600 : 400, color: "#1A1A1A" }}>
                      {submitting && !qualityChecking && qualityReport?.passed ? "⏳ Deploying to Vercel..." : "Deploy to Vercel"}
                    </span>
                  </div>
                </div>
              )}

              {/* Quality Report */}
              {qualityReport && !qualityChecking && !deployError && (
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
