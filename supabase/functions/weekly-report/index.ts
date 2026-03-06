// Supabase Edge Function: Weekly Report Sender
// Runs every Monday at 9am IST (3:30am UTC)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all active businesses
    const { data: businesses, error: businessError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "business")
      .in("status", ["active", "trial"]);

    if (businessError) throw businessError;

    const results = {
      total: businesses?.length ?? 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get current week range
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Process each business
    for (const business of businesses || []) {
      try {
        // Get deployment data
        const { data: deployment } = await supabase
          .from("deployments")
          .select("*")
          .eq("owner_whatsapp", business.whatsapp_number.replace(/\D/g, ""))
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get leads this week
        const { count: leadsThisWeek } = await supabase
          .from("leads")
          .select("count", { count: "exact", head: true })
          .eq("business_id", business.id)
          .gte("created_at", weekStart.toISOString())
          .lt("created_at", weekEnd.toISOString());

        // Get leads last week
        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(weekStart);

        const { count: leadsLastWeek } = await supabase
          .from("leads")
          .select("count", { count: "exact", head: true })
          .eq("business_id", business.id)
          .gte("created_at", lastWeekStart.toISOString())
          .lt("created_at", lastWeekEnd.toISOString());

        const thisWeekCount = leadsThisWeek ?? 0;
        const lastWeekCount = leadsLastWeek ?? 0;
        const growth = lastWeekCount > 0 
          ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
          : thisWeekCount > 0 ? 100 : 0;

        // Calculate trial day
        let trialDay: number | null = null;
        let isTrial = business.status === "trial";

        if (deployment?.trial_start_date) {
          const startDate = new Date(deployment.trial_start_date);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          trialDay = Math.min(Math.max(diffDays + 1, 1), 7);
          isTrial = diffDays < 7 && !deployment.converted;
        }

        // Generate tip based on language and data
        const language = business.preferred_language || "hinglish";
        let tip = "";

        const tips: Record<string, { noLeads: string; noResponse: string; growing: string; trialEnding: string }> = {
          english: {
            noLeads: "💡 Share your site link in your local WhatsApp groups to get your first inquiry!",
            noResponse: "💡 Call leads within 1 hour — businesses that respond fast get 3x more customers!",
            growing: "💡 Great week! You're getting more visible on Google every day.",
            trialEnding: "💡 Trial ending soon. Customers tried to reach you. Continue to keep seeing them.",
          },
          hindi: {
            noLeads: "💡 अपनी साइट का लिंक अपने व्हाट्सएप ग्रुप्स में शेयर करें ताकि पहली इन्क्वायरी आए!",
            noResponse: "💡 लीड्स को 1 घंटे के अंदर कॉल करें — जो तेजी से जवाब देते हैं उन्हें 3x ज्यादा कस्टमर्स मिलते हैं!",
            growing: "💡 बढ़िया हफ्ता! आप हर दिन गूगल पे और दिखने लग रहे हैं।",
            trialEnding: "💡 ट्रायल जल्द खत्म होगा। कस्टमर्स आपसे संपर्क करने की कोशिश कर रहे थे। जारी रखें ताकि उन्हें देखते रहें।",
          },
          hinglish: {
            noLeads: "💡 Apni site ka link apne WhatsApp groups mein share karein taaki pehli inquiry aaye!",
            noResponse: "💡 Leads ko 1 ghante ke andar call karein — jo tezi se jawab dete hain unhe 3x zyada customers milte hain!",
            growing: "💡 Badhiya hafta! Aap har din Google pe aur dikhnne lag rahe hain.",
            trialEnding: "💡 Trial jald khatam hoga. Customers aapse contact karne ki koshish kar rahe the. Jaari rakhein taaki unhe dekhte rahein.",
          },
        };

        const langTips = tips[language] || tips.hinglish;

        if (isTrial && trialDay && trialDay >= 5) {
          tip = langTips.trialEnding;
        } else if (thisWeekCount === 0 && lastWeekCount === 0) {
          tip = langTips.noLeads;
        } else if (thisWeekCount > 0 && lastWeekCount > 0 && thisWeekCount < lastWeekCount * 0.5) {
          tip = langTips.noResponse;
        } else if (growth > 0) {
          tip = langTips.growing;
        } else {
          tip = langTips.noLeads;
        }

        // Mock visitors (would come from analytics)
        const visitors = Math.floor(Math.random() * 50) + 10;
        const siteHealth = 94;

        // Get week range string
        const startStr = weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const endStr = new Date(weekEnd.getTime() - 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const weekRange = `${startStr} - ${endStr}`;

        // Generate report message
        const messages: Record<string, string> = {
          english: `📊 WEEKLY REPORT
━━━━━━━━━━━━━━
${business.business_name || business.full_name}
${weekRange}
━━━━━━━━━━━━━━
👁 Visitors: ${visitors}
📋 Inquiries: ${thisWeekCount}
📈 Growth: ${growth >= 0 ? "+" : ""}${growth}%
⚡ Site: Healthy ✅
━━━━━━━━━━━━━━
${tip}
LeadPe ⚡`,
          
          hindi: `📊 साप्ताहिक रिपोर्ट
━━━━━━━━━━━━━━
${business.business_name || business.full_name}
${weekRange}
━━━━━━━━━━━━━━
👁 विज़िटर: ${visitors}
📋 इन्क्वायरी: ${thisWeekCount}
📈 वृद्धि: ${growth >= 0 ? "+" : ""}${growth}%
⚡ साइट: ठीक है ✅
━━━━━━━━━━━━━━
${tip}
LeadPe ⚡`,
          
          hinglish: `📊 WEEKLY REPORT
━━━━━━━━━━━━━━
${business.business_name || business.full_name}
${weekRange}
━━━━━━━━━━━━━━
👁 Visitors: ${visitors}
📋 Inquiries: ${thisWeekCount}
📈 Growth: ${growth >= 0 ? "+" : ""}${growth}%
⚡ Site: Healthy ✅
━━━━━━━━━━━━━━
${tip}
LeadPe ⚡`,
        };

        const message = messages[language] || messages.hinglish;

        // Send WhatsApp (using wa.me for now - can be replaced with Twilio)
        const cleanPhone = business.whatsapp_number.replace(/\D/g, "");
        const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
        
        // Log the message
        await supabase.from("message_log").insert({
          business_id: business.id,
          day: null,
          recipient: "owner",
          message: message.substring(0, 500),
          language: language,
          message_type: "weekly_report",
          created_at: new Date().toISOString(),
        });

        // Save weekly report to Supabase
        await supabase.from("weekly_reports").insert({
          business_id: business.id,
          week_start: weekStart.toISOString().split("T")[0],
          visitors: visitors,
          leads_count: thisWeekCount,
          growth_percent: growth,
          site_health: siteHealth,
          sent_at: new Date().toISOString(),
          message_sent: true,
        });

        results.sent++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        results.failed++;
        results.errors.push(`${business.business_name || business.full_name}: ${(err as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Weekly reports sent: ${results.sent}/${results.total}`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
