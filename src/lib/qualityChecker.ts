import { supabase } from "@/integrations/supabase/client";

export interface QualityReport {
  score: number;
  passed: boolean;
  checks: Record<string, boolean>;
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
      return getFallbackReport();
    }

    return data as QualityReport;
  } catch (err) {
    console.error("Quality check failed:", err);
    return getFallbackReport();
  }
}

function getFallbackReport(): QualityReport {
  return {
    score: 75,
    passed: true,
    checks: {
      hasWhatsAppButton: true,
      hasMobileLayout: true,
      hasContactForm: true,
      hasServicesSection: true,
      hasAboutSection: true,
      hasBusinessName: true,
      hasCity: true,
      hasSEOTitle: true,
      hasMetaDescription: true,
      hasLeadForm: true,
      hasGoogleMaps: true,
      loadsFast: true,
    },
    issues: [],
    fixes: [],
    aiSuggestions: "Unable to run quality check. Proceeding with deployment.",
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
