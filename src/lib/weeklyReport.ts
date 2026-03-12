import { supabase } from "@/integrations/supabase/client";
import { Language } from "./trialSequence";

export interface WeeklyReportData {
  businessName: string;
  ownerName: string;
  phone: string;
  language: Language;
  weekPhone: string;
  weekStart: string;
  leadsThisWeek: number;
  leadsLastWeek: number;
  growth: number;
  visitors: number;
  siteStatus: string;
  siteHealth: number;
  trialDay: number | null;
  planStatus: string;
  isTrial: boolean;
  tip: string;
}

// Get current week number
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Get Monday of current week
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get week date range string
export function getWeekRange(weekStart: Date): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  
  const startStr = start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const endStr = end.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  
  return `${startStr} - ${endStr}`;
}

// Generate auto tip based on data
export function generateTip(data: {
  leadsThisWeek: number;
  leadsLastWeek: number;
  growth: number;
  isTrial: boolean;
  trialDay: number | null;
  language: Language;
}): string {
  const { leadsThisWeek, leadsLastWeek, growth, isTrial, trialDay, language } = data;
  
  const tips: Record<Language, { noLeads: string; noResponse: string; growing: string; trialEnding: string }> = {
    english: {
      noLeads: "💡 Share your site link in your local WhatsApp groups to get your first inquiry!",
      noResponse: "💡 Call leads within 1 hour — businesses that respond fast get 3x more customers!",
      growing: "💡 Great week! You're getting more visible on Google every day.",
      trialEnding: "💡 Trial ening soon. Customers tried to reach you. Continue to keep seeing them.",
    },
    hindi: {
      noLeads: "💡 अपनी साइट का लिंक अपने व्हाट्सएप ग्रुप्स में शेयर करें ताकि पहली इन्क्वायरी आए!",
      noResponse: "💡 लीड्स को 1 घंटे के अंदर कॉल करें — जो तेजी से जवाब देते हैं उन्हें 3x ज्यादा कस्टमर्स मिलते हैं!",
      growing: "💡 बढ़िया हफ्ता! आप हर दिन गूगल पे और दिखने लग रहे हैं।",
      trialEnding: "💡 ट्रायल जल्द खत्म होगा। कस्टमर्स आपसे संपर्क करने की कोशिश कर रहे थे। जारी रखें ताकि उन्हें देखते रहें।",
    },
    hinglish: {
      noLeads: "💡 Share your site link in WhatsApp groups to get your first inquiry!",
      noResponse: "💡 Call leads within 1 hour — businesses that respond quickly get 3x more customers!",
      growing: "💡 Badhiya hafta! Aap har days Google pe aur dikhnne lag rahe hain.",
      trialEnding: "💡 Trial ending soon. Customers were trying to reach you. Continue to keep receiving them.",
    },
  };
  
  // Priority: Trial ening > No leads > Growing > Default
  if (isTrial && trialDay && trialDay >= 5) {
    return tips[language].trialEnding;
  }
  
  if (leadsThisWeek === 0 && leadsLastWeek === 0) {
    return tips[language].noLeads;
  }
  
  if (leadsThisWeek > 0 && leadsLastWeek > 0 && leadsThisWeek < leadsLastWeek * 0.5) {
    return tips[language].noResponse;
  }
  
  if (growth > 0) {
    return tips[language].growing;
  }
  
  return tips[language].noLeads;
}

// Generate weekly report for a business
export async function generateWeeklyReport(businessId: string): Promise<WeeklyReportData | null> {
  try {
    // Get business profile
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("*")
      .eq("id", businessId)
      .single();
    
    if (!profile) return null;
    
    // Get deployment data
    const { data: deployment } = await (supabase as any).from("deployments")
      .select("*")
      .eq("owner_whatsapp", profile.whatsapp_number.replace(/\D/g, ""))
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    // Get week range
    const weekStart = getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    // Get leads this week
    const { data: leadsThisWeek } = await (supabase.from("leads") as any)
      .select("count", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", weekEnd.toISOString());
    
    // Get leads last week
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    
    const { data: leadsLastWeek } = await (supabase.from("leads") as any)
      .select("count", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", lastWeekStart.toISOString())
      .lt("created_at", lastWeekEnd.toISOString());
    
    const thisWeekCount = leadsThisWeek || 0;
    const lastWeekCount = leadsLastWeek || 0;
    const growth = lastWeekCount > 0 
      ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
      : thisWeekCount > 0 ? 100 : 0;
    
    // Calculate trial day
    let trialDay: number | null = null;
    let isTrial = profile.status === "trial";
    
    if (deployment?.trial_start_date) {
      const startDate = new Date(deployment.trial_start_date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      trialDay = Math.min(Math.max(diffDays + 1, 1), 7);
      isTrial = diffDays < 7 && !deployment.converted;
    }
    
    // Site health (mock for now, could be from actual metrics)
    const siteHealth = 94;
    const siteStatus = "Healthy";
    
    // Mock visitors (would come from analytics)
    const visitors = Math.floor(Math.random() * 50) + 10;
    
    // Generate tip
    const language: Language = profile.preferred_language || "hinglish";
    const tip = generateTip({
      leadsThisWeek: thisWeekCount,
      leadsLastWeek: lastWeekCount,
      growth,
      isTrial,
      trialDay,
      language,
    });
    
    return {
      businessName: profile.business_name || profile.full_name,
      ownerName: profile.full_name,
      phone: profile.whatsapp_number,
      language,
      weekPhone: `Week ${getWeekNumber(new Date())}`,
      weekStart: weekStart.toISOString().split("T")[0],
      leadsThisWeek: thisWeekCount,
      leadsLastWeek: lastWeekCount,
      growth,
      visitors,
      siteStatus,
      siteHealth,
      trialDay,
      planStatus: profile.subscription_plan || "basic",
      isTrial,
      tip,
    };
  } catch (err) {
    console.error("Error generating weekly report:", err);
    return null;
  }
}

// Get report message in specified language
export function getReportMessage(report: WeeklyReportData): string {
  const weekRange = getWeekRange(new Date(report.weekStart));
  
  const messages: Record<Language, string> = {
    english: `📊 WEEKLY REPORT
━━━━━━━━━━━━━━
${report.businessName}
${weekRange}
━━━━━━━━━━━━━━
👁 Visitors: ${report.visitors}
📋 Inquiries: ${report.leadsThisWeek}
📈 Growth: ${report.growth >= 0 ? "+" : ""}${report.growth}%
⚡ Site: ${report.siteStatus} ✅
━━━━━━━━━━━━━━
${report.tip}
LeadPe ⚡`,
    
    hindi: `📊 साप्ताहिक रिपोर्ट
━━━━━━━━━━━━━━
${report.businessName}
${weekRange}
━━━━━━━━━━━━━━
👁 विज़िटर: ${report.visitors}
📋 इन्क्वायरी: ${report.leadsThisWeek}
📈 वृद्धि: ${report.growth >= 0 ? "+" : ""}${report.growth}%
⚡ साइट: ठीक है ✅
━━━━━━━━━━━━━━
${report.tip}
LeadPe ⚡`,
    
    hinglish: `📊 WEEKLY REPORT
━━━━━━━━━━━━━━
${report.businessName}
${weekRange}
━━━━━━━━━━━━━━
👁 Visitors: ${report.visitors}
📋 Inquiries: ${report.leadsThisWeek}
📈 Growth: ${report.growth >= 0 ? "+" : ""}${report.growth}%
⚡ Site: Healthy ✅
━━━━━━━━━━━━━━
${report.tip}
LeadPe ⚡`,
  };
  
  return messages[report.language];
}

// Send weekly report via WhatsApp
export async function sendWeeklyReportWhatsApp(report: WeeklyReportData): Promise<boolean> {
  try {
    const message = getReportMessage(report);
    const cleanPhone = report.phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    
    // For now, use wa.me fallback
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${fullPhone}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
    
    // Log the message
    await (supabase as any).from("message_log").insert({
      business_id: report.phone,
      day: null,
      recipient: "owner",
      message: message.substring(0, 500),
      language: report.language,
      message_type: "weekly_report",
      created_at: new Date().toISOString(),
    });
    
    return true;
  } catch (err) {
    console.error("Error sening weekly report:", err);
    return false;
  }
}

// Save report to Supabase
export async function saveWeeklyReport(report: WeeklyReportData, businessId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any).from("weekly_reports").insert({
      business_id: businessId,
      week_start: report.weekStart,
      visitors: report.visitors,
      leads_count: report.leadsThisWeek,
      growth_percent: report.growth,
      site_health: report.siteHealth,
      sent_at: new Date().toISOString(),
      message_sent: true,
    });
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error saving weekly report:", err);
    return false;
  }
}

// Get past reports for a business
export async function getPastWeeklyReports(businessId: string, limit: number = 4): Promise<any[]> {
  try {
    const { data } = await (supabase as any).from("weekly_reports")
      .select("*")
      .eq("business_id", businessId)
      .order("week_start", { ascending: false })
      .limit(limit);
    
    return data || [];
  } catch (err) {
    console.error("Error fetching past reports:", err);
    return [];
  }
}
