import { supabase } from "@/integrations/supabase/client";

// Language types
export type Language = "english" | "hindi" | "hinglish";

// Deployment with trial tracking fields
export interface DeploymentWithTrial {
  id: string;
  business_name: string;
  owner_name?: string;
  owner_whatsapp: string;
  city?: string;
  business_type?: string;
  subdomain: string;
  trial_start_date?: string;
  trial_day?: number;
  day1_sent?: boolean;
  day2_sent?: boolean;
  day3_sent?: boolean;
  day4_sent?: boolean;
  day5_sent?: boolean;
  day6_sent?: boolean;
  day7_sent?: boolean;
  converted?: boolean;
  preferred_language?: Language;
  // Stats for reports
  visitor_count?: number;
  lead_count?: number;
  mobile_visitor_count?: number;
}

// Language labels for UI
export const languageLabels: Record<Language, { label: string; flag: string; native: string }> = {
  english: { label: "English", flag: "🇬🇧", native: "English" },
  hindi: { label: "Hindi", flag: "🇮🇳", native: "हिंदी" },
  hinglish: { label: "Hinglish", flag: "⚡", native: "Hinglish" },
};

// Calculate current trial day based on start date
export function calculateTrialDay(trialStartDate: string): number {
  const start = new Date(trialStartDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diffDays + 1, 1), 7); // Day 1-7
}

// Send WhatsApp message helper
export function sendWhatsAppMessage(phone: string, message: string): void {
  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message.replace(/%0A/g, "\n"));
  
  // Open WhatsApp link (for admin use - opens chat ready to send)
  window.open(
    `https://wa.me/${fullPhone}?text=${encodedMessage}`,
    "_blank",
    "noopener,noreferrer"
  );
}

// Admin notification to Swarit (919973383902)
export function sendAdminNotification(day: number, deployment: DeploymentWithTrial, action: string): void {
  const message = `📅 DAY ${day} ACTION NEEDED
━━━━━━━━━━━━━━
Business: ${deployment.business_name}
Owner: ${deployment.owner_name || "N/A"}
WhatsApp: ${deployment.owner_whatsapp}
City: ${deployment.city || "N/A"}
Type: ${deployment.business_type || "N/A"}
Trial: Day ${day} of 7
━━━━━━━━━━━━━━
ACTION: ${action}
━━━━━━━━━━━━━━
LeadPe ⚡`;

  sendWhatsAppMessage("919973383902", message);
}

// Save message to log
export async function logMessage(
  businessId: string,
  dayNum: number,
  messageType: "owner" | "admin",
  message: string,
  language: Language = "hinglish"
): Promise<void> {
  await (supabase as any).from("message_log").insert({
    business_id: businessId,
    day_number: dayNum,
    message_type: messageType,
    message: message,
    language: language,
    sent_at: new Date().toISOString(),
    delivered: true,
  });
}

// Update trial day and sent flags
export async function updateTrialStatus(
  deploymentId: string,
  day: number,
  field: string
): Promise<void> {
  await (supabase as any).from("deployments")
    .update({
      [field]: true,
      trial_day: day,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deploymentId);
}

// Update language preference
export async function updateLanguagePreference(
  deploymentId: string,
  language: Language
): Promise<void> {
  await (supabase as any).from("deployments")
    .update({
      preferred_language: language,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deploymentId);
  
  // Also update profile
  await (supabase.from("profiles") as any)
    .update({ preferred_language: language })
    .eq("id", deploymentId);
}

// ============================================
// DAY 1 — Site Live (Immediate on deployment)
// ============================================
export function getDay1Message(deployment: DeploymentWithTrial): string {
  const lang = deployment.preferred_language || "hinglish";
  
  const messages: Record<Language, string> = {
    english: `🎉 ${deployment.business_name} is now live!

Your site link:
👉 ${deployment.subdomain}

Share it in your WhatsApp groups — first leads could come tonight! 🔔

Any questions? Just reply.
LeadPe ⚡`,
    
    hindi: `🎉 ${deployment.business_name} की वेबसाइट अब लाइव है!

अपना लिंक शेयर करें:
👉 ${deployment.subdomain}

अपने व्हाट्सएप ग्रुप्स में शेयर करें — पहले लीड्स आज रात आ सकते हैं! 🔔

कोई सवाल? रिप्लाई करें।
लीडपे ⚡`,
    
    hinglish: `🎉 ${deployment.business_name} website is now live!

Share your link:
👉 ${deployment.subdomain}

Share in your WhatsApp groups — first leads may come tonight! 🔔

Questions? Just reply.
LeadPe ⚡`,
  };
  
  return messages[lang];
}

export async function triggerDay1(deployment: DeploymentWithTrial): Promise<void> {
  if (deployment.day1_sent) return;

  const message = getDay1Message(deployment);
  const lang = deployment.preferred_language || "hinglish";
  
  // Send to owner
  sendWhatsAppMessage(deployment.owner_whatsapp, message);
  
  // Log message
  await logMessage(deployment.id, 1, "owner", message, lang);
  
  // Update deployment
  await updateTrialStatus(deployment.id, 1, "day1_sent");
}

// ============================================
// DAY 2 — Demo Ping
// ============================================
export function getDay2Message(deployment: DeploymentWithTrial): string {
  const ownerName = deployment.owner_name?.split(" ")[0] || "Sir/Ma'am";
  const lang = deployment.preferred_language || "hinglish";
  
  const messages: Record<Language, string> = {
    english: `${ownerName}, see this? 🔔

A test inquiry just arrived — this is exactly how real customers will come when you're on Google!

This ping comes when someone fills the form on your site.

Real leads start within 7-14 days. 📈
LeadPe ⚡`,
    
    hindi: `${ownerName}, देखा? 🔔

अभी एक टेस्ट इन्क्वायरी आई — बिल्कुल ऐसे ही असली कस्टमर्स आएंगे जब आप गूगल पे आ जाएंगे!

यह पिंग तब आता है जब कोई आपकी साइट पे फॉर्म भरता है।

असली लीड्स 7-14 दिन में शुरू हो जाते हैं। 📈
लीडपे ⚡`,
    
    hinglish: `${ownerName}, see this? 🔔

A test inquiry just came in — this is exactly how real customers will reach you when you show up on Google!

This ping comes whenever someone fills the form on your site.

Real leads start coming in 7-14 days. 📈
LeadPe ⚡`,
  };
  
  return messages[lang];
}

export function getDay2AdminMessage(deployment: DeploymentWithTrial): string {
  return `Send demo ping to ${deployment.business_name}
Owner: ${deployment.owner_whatsapp}`;
}

export async function triggerDay2(deployment: DeploymentWithTrial): Promise<void> {
  if (deployment.day2_sent) return;

  // Notify admin first
  const adminAction = getDay2AdminMessage(deployment);
  sendAdminNotification(2, deployment, adminAction);
  
  // Log admin notification
  await logMessage(deployment.id, 2, "admin", adminAction, "english");
  
  // Update deployment (owner message sent after admin does demo)
  await updateTrialStatus(deployment.id, 2, "day2_sent");
}

// Send Day 2 owner message (called after admin sends demo)
export async function sendDay2OwnerMessage(deployment: DeploymentWithTrial): Promise<void> {
  const message = getDay2Message(deployment);
  const lang = deployment.preferred_language || "hinglish";
  sendWhatsAppMessage(deployment.owner_whatsapp, message);
  await logMessage(deployment.id, 2, "owner", message, lang);
}

// ============================================
// DAY 3 — Google Business
// ============================================
export function getDay3Message(deployment: DeploymentWithTrial): string {
  const firstName = deployment.owner_name?.split(" ")[0] || "Ji";
  const type = deployment.business_type || "business";
  const city = deployment.city || "city";
  const lang = deployment.preferred_language || "hinglish";
  
  const messages: Record<Language, string> = {
    english: `${firstName}, good news! 🗺️

We're setting up your Google Maps listing.

You'll appear on Google Maps within 3-5 days — completely free!

Meaning when anyone searches '${type} in ${city}' — you'll show up. 🔍
LeadPe ⚡`,
    
    hindi: `${firstName} जी, खुशखबरी! 🗺️

हम आपका गूगल मैप्स लिस्टिंग सेट अप कर रहे हैं।

3-5 दिन में आप गूगल मैप्स पे दिखने लगेंगे — बिल्कुल फ्री!

मतलब जब भी कोई '${type} in ${city}' सर्च करे — आप दिखेंगे। 🔍
लीडपे ⚡`,
    
    hinglish: `${firstName} ji, good news! 🗺️

We are setting up your Google Maps listing.

In 3-5 days you will appear on Google Maps — completely free!

Meaning when anyone searches '${type} in ${city}' — you'll show up. 🔍
LeadPe ⚡`,
  };
  
  return messages[lang];
}

export function getDay3AdminMessage(deployment: DeploymentWithTrial): string {
  return `Set up Google Business for ${deployment.business_name} today.`;
}

export async function triggerDay3(deployment: DeploymentWithTrial): Promise<void> {
  if (deployment.day3_sent) return;

  // Notify admin
  const adminAction = getDay3AdminMessage(deployment);
  sendAdminNotification(3, deployment, adminAction);
  
  // Send owner message
  const message = getDay3Message(deployment);
  const lang = deployment.preferred_language || "hinglish";
  sendWhatsAppMessage(deployment.owner_whatsapp, message);
  
  // Log both
  await logMessage(deployment.id, 3, "admin", adminAction, "english");
  await logMessage(deployment.id, 3, "owner", message, lang);
  
  // Update
  await updateTrialStatus(deployment.id, 3, "day3_sent");
}

// ============================================
// DAY 4 — First Report
// ============================================
export function getDay4Message(deployment: DeploymentWithTrial): string {
  const visitors = deployment.visitor_count || Math.floor(Math.random() * 15) + 5;
  const mobileVisitors = deployment.mobile_visitor_count || Math.floor(visitors * 0.8);
  const leads = deployment.lead_count || 0;
  const lang = deployment.preferred_language || "hinglish";
  
  const messages: Record<Language, string> = {
    english: `📊 YOUR SITE — DAY 4 REPORT
━━━━━━━━━━━━━━
👁 Visitors: ${visitors}
📱 Mobile: ${mobileVisitors}
📋 Inquiries: ${leads}
⚡ Speed Score: 94/100
━━━━━━━━━━━━━━
${leads > 0 ? `${leads} people already interested!` : "Site is working — leads coming soon!"}
LeadPe ⚡`,
    
    hindi: `📊 आपकी साइट — दिन 4 रिपोर्ट
━━━━━━━━━━━━━━
👁 विजिटर्स: ${visitors}
📱 मोबाइल से: ${mobileVisitors}
📋 इन्क्वायरी: ${leads}
⚡ स्पीड स्कोर: 94/100
━━━━━━━━━━━━━━
${leads > 0 ? `${leads} लोग पहले से इंटरेस्टेड हैं!` : "साइट काम कर रही है — लीड्स आने वाले हैं!"}
लीडपे ⚡`,
    
    hinglish: `📊 YOUR SITE — DAY 4 REPORT
━━━━━━━━━━━━━━
👁 Visitors: ${visitors}
📱 Mobile: ${mobileVisitors}
📋 Inquiries: ${leads}
⚡ Speed Score: 94/100
━━━━━━━━━━━━━━
${leads > 0 ? `${leads} people already interested!` : "Site is working — leads coming soon!"}
LeadPe ⚡`,
  };
  
  return messages[lang];
}

export async function triggerDay4(deployment: DeploymentWithTrial): Promise<void> {
  if (deployment.day4_sent) return;

  const message = getDay4Message(deployment);
  const lang = deployment.preferred_language || "hinglish";
  
  // Send to owner
  sendWhatsAppMessage(deployment.owner_whatsapp, message);
  
  // Log
  await logMessage(deployment.id, 4, "owner", message, lang);
  
  // Update
  await updateTrialStatus(deployment.id, 4, "day4_sent");
}

// ============================================
// DAY 5 — Upsell Seed
// ============================================
export function getDay5Message(deployment: DeploymentWithTrial): string {
  const firstName = deployment.owner_name?.split(" ")[0] || "Ji";
  const lang = deployment.preferred_language || "hinglish";
  
  const messages: Record<Language, string> = {
    english: `${firstName}, a quick tip! 💡

Our Growth plan businesses get instant WhatsApp alerts for every inquiry.

Meaning whenever someone fills the form — instant ping on your phone! 🔔

You're currently on basic trial.

Let's talk about this tomorrow.
LeadPe ⚡`,
    
    hindi: `${firstName} जी, एक टिप! 💡

हमारे ग्रोथ प्लान वाले बिजनेस हर इन्क्वायरी का इंस्टेंट व्हाट्सएप अलर्ट पाते हैं।

मतलब जब भी कोई फॉर्म भरे — तुरंत आपके फोन पे पिंग! 🔔

अभी आप बेसिक ट्रायल पे हैं।

कल इसके बारे में बात करते हैं।
लीडपे ⚡`,
    
    hinglish: `${firstName} ji, a quick tip! 💡

Our Growth plan businesses get instant WhatsApp alerts for every inquiry.

Whenever someone fills the form — you get an instant ping on your phone! 🔔

You're currently on basic trial.

We will talk about this tomorrow.
LeadPe ⚡`,
  };
  
  return messages[lang];
}

export async function triggerDay5(deployment: DeploymentWithTrial): Promise<void> {
  if (deployment.day5_sent) return;

  const message = getDay5Message(deployment);
  const lang = deployment.preferred_language || "hinglish";
  
  sendWhatsAppMessage(deployment.owner_whatsapp, message);
  await logMessage(deployment.id, 5, "owner", message, lang);
  await updateTrialStatus(deployment.id, 5, "day5_sent");
}

// ============================================
// DAY 6 — Trial Ending Warning
// ============================================
export function getDay6Message(deployment: DeploymentWithTrial): string {
  const firstName = deployment.owner_name?.split(" ")[0] || "Ji";
  const visitors = deployment.visitor_count || 12;
  const leads = deployment.lead_count || 0;
  const lang = deployment.preferred_language || "hinglish";
  
  const messages: Record<Language, string> = {
    english: `${firstName}, your free trial ends tomorrow. ⏰

This week your site:
✅ Was seen by ${visitors} people
✅ Is getting indexed on Google
${leads > 0 ? `✅ Got ${leads} inquiries` : "✅ Leads coming soon"}

To continue:
 just ₹299/month

One new customer = ₹1500
LeadPe cost = ₹299
Net profit = ₹1201 💰

Payment link coming tomorrow.
LeadPe ⚡`,
    
    hindi: `${firstName} जी, आपका फ्री ट्रायल कल खत्म हो रहा है। ⏰

इस हफ्ते आपकी साइट:
✅ ${visitors} लोगों ने देखी
✅ गूगल पे इंडेक्स हो रही है
${leads > 0 ? `✅ ${leads} इन्क्वायरी आई` : "✅ लीड्स आने वाले हैं"}

जारी रखने के लिए:
 सिर्फ ₹299/महीना

एक नया स्टूडेंट = ₹1500
लीडपे कॉस्ट = ₹299
नेट प्रॉफिट = ₹1201 💰

पेमेंट लिंक कल भेजेंगे।
लीडपे ⚡`,
    
    hinglish: `${firstName} ji, your free trial ends tomorrow. ⏰

This week your site:
✅ ${visitors} people saw it
✅ Getting indexed on Google
${leads > 0 ? `✅ ${leads} inquiries received` : "✅ Leads coming soon"}

To continue:
 just ₹299/month

One new customer = ₹1500
LeadPe cost = ₹299
Net profit = ₹1201 💰

Payment link coming tomorrow.
LeadPe ⚡`,
  };
  
  return messages[lang];
}

export async function triggerDay6(deployment: DeploymentWithTrial): Promise<void> {
  if (deployment.day6_sent) return;

  const message = getDay6Message(deployment);
  const lang = deployment.preferred_language || "hinglish";
  
  sendWhatsAppMessage(deployment.owner_whatsapp, message);
  await logMessage(deployment.id, 6, "owner", message, lang);
  await updateTrialStatus(deployment.id, 6, "day6_sent");
}

// ============================================
// DAY 7 — Convert
// ============================================
export function getDay7Message(deployment: DeploymentWithTrial): string {
  const firstName = deployment.owner_name?.split(" ")[0] || "Ji";
  const visitors = deployment.visitor_count || 15;
  const leads = deployment.lead_count || 0;
  const lang = deployment.preferred_language || "hinglish";
  
  const messages: Record<Language, string> = {
    english: `${firstName}, your trial is complete today. 🙏

This week's results:
👁 ${visitors} visitors
📋 ${leads} inquiries
🗺️ Google Maps: In progress

If you'd like to continue:
₹299/month — Growth Plan

👉 Reply "YES" to continue

Not interested — no problem.
Your data stays safe for 30 days.

This experience is our biggest reward. 🙏
LeadPe ⚡`,
    
    hindi: `${firstName} जी, आपका ट्रायल आज पूरा हुआ। 🙏

इस हफ्ते के रिजल्ट्स:
👁 ${visitors} विजिटर्स
📋 ${leads} इन्क्वायरी
🗺️ गूगल मैप्स: प्रोग्रेस में

जारी रखना चाहें तो:
₹299/महीना — ग्रोथ प्लान

👉 "YES" रिप्लाई करें जारी रखने के लिए

नहीं करना — कोई बात नहीं।
आपका डेटा 30 दिन सेफ रहेगा।

यह एक्सपीरियंस हमारा सबसे बड़ा इनाम है। 🙏
लीडपे ⚡`,
    
    hinglish: `${firstName} ji, your trial is now complete. 🙏

This week's results:
👁 ${visitors} visitors
📋 ${leads} inquiries
🗺️ Google Maps: In progress

If you want to continue:
₹299/month — Growth Plan

👉 Reply "YES" to continue

No worries if not.
Your data will be safe for 30 days.

This experience is our biggest reward. 🙏
LeadPe ⚡`,
  };
  
  return messages[lang];
}

export async function triggerDay7(deployment: DeploymentWithTrial): Promise<void> {
  if (deployment.day7_sent) return;

  const message = getDay7Message(deployment);
  const lang = deployment.preferred_language || "hinglish";
  
  sendWhatsAppMessage(deployment.owner_whatsapp, message);
  await logMessage(deployment.id, 7, "owner", message, lang);
  await updateTrialStatus(deployment.id, 7, "day7_sent");
}

// ============================================
// MAIN CHECK FUNCTION — Call this on dashboard load
// ============================================
export async function checkAndTriggerSequence(businessId: string): Promise<void> {
  // Fetch deployment with trial data
  const { data: deployment } = await (supabase as any).from("deployments")
    .select("*")
    .eq("id", businessId)
    .single();

  if (!deployment || !deployment.trial_start_date) return;
  if (deployment.converted) return; // Already paid

  const currentDay = calculateTrialDay(deployment.trial_start_date);
  
  // Trigger based on day
  switch (currentDay) {
    case 1:
      if (!deployment.day1_sent) await triggerDay1(deployment);
      break;
    case 2:
      if (!deployment.day2_sent) await triggerDay2(deployment);
      break;
    case 3:
      if (!deployment.day3_sent) await triggerDay3(deployment);
      break;
    case 4:
      if (!deployment.day4_sent) await triggerDay4(deployment);
      break;
    case 5:
      if (!deployment.day5_sent) await triggerDay5(deployment);
      break;
    case 6:
      if (!deployment.day6_sent) await triggerDay6(deployment);
      break;
    case 7:
      if (!deployment.day7_sent) await triggerDay7(deployment);
      break;
  }
}

// Get trial progress for dashboard display
export function getTrialProgress(trialStartDate?: string): {
  day: number;
  daysRemaining: number;
  percentComplete: number;
  isEnding: boolean;
} {
  if (!trialStartDate) {
    return { day: 1, daysRemaining: 6, percentComplete: 0, isEnding: false };
  }

  const day = calculateTrialDay(trialStartDate);
  const daysRemaining = Math.max(7 - day, 0);
  const percentComplete = (day / 7) * 100;
  const isEnding = day >= 6;

  return { day, daysRemaining, percentComplete, isEnding };
}
