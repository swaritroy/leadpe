import { supabase } from "@/integrations/supabase/client";

export interface CheckResultItem {
  key: string;
  label: string;
  passed: boolean;
  fix: string;
}

export interface QualityReport {
  score: number;
  passed: boolean;
  checks: Record<string, boolean>;
  checkResults: CheckResultItem[];
  issues: string[];
  fixes: string[];
  aiSuggestions: string;
}

export async function checkWebsiteQuality(
  githubUrl: string,
  businessData: { name: string; type: string; city: string }
): Promise<QualityReport> {
  try {
    const { data, error } = await supabase.functions.invoke("quality-check", {
      body: { githubUrl, businessData },
    });

    if (error) {
      console.error("Quality check error:", error);
      // Return a FAILED report, not a passing one
      return getFailedReport("Quality check service unavailable. Please try again.");
    }

    if (data?.error) {
      return getFailedReport(data.error);
    }

    return data as QualityReport;
  } catch (err) {
    console.error("Quality check failed:", err);
    return getFailedReport("Network error during quality check. Check your connection and try again.");
  }
}

/**
 * Returns a FAILED report when the quality check service itself fails.
 * This prevents false "100 score" results that let broken sites through.
 */
function getFailedReport(reason: string): QualityReport {
  const items: CheckResultItem[] = [
    { key: "repo_access", label: "Repository Access", passed: false, fix: "Could not access the repository. Ensure it is PUBLIC on GitHub." },
    { key: "build_check", label: "Build Verification", passed: false, fix: "Could not verify the build. Ensure 'npm run build' passes locally before submitting." },
    { key: "whatsapp_button", label: "WhatsApp Button", passed: false, fix: "Quality check could not run — verify manually." },
    { key: "contact_form", label: "Contact Form", passed: false, fix: "Quality check could not run — verify manually." },
    { key: "seo_title", label: "SEO Title", passed: false, fix: "Quality check could not run — verify manually." },
  ];
  const checks: Record<string, boolean> = {};
  items.forEach(i => { checks[i.key] = false; });
  return {
    score: 0,
    passed: false,
    checks,
    checkResults: items,
    issues: [`❌ Quality check failed: ${reason}`],
    fixes: ["Fix the issue above and try submitting again."],
    aiSuggestions: reason,
  };
}

export function generateFixPrompt(report: QualityReport, businessData: { name: string; type: string; city: string }): string {
  return `Fix these issues in my website:

Business: ${businessData.name}
Type: ${businessData.type}
City: ${businessData.city}

Issues to fix:
${report.issues.join("\n")}

Fixes needed:
${report.fixes.join("\n")}

${report.aiSuggestions ? `AI Suggestions:\n${report.aiSuggestions}` : ""}

Make all fixes. Keep existing design. Mobile friendly.`;
}
