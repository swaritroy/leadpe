import { supabase } from "@/integrations/supabase/client";

interface SEOResult {
  pageTitle: string;
  metaDescription: string;
  keywords: string[];
  googleDescription: string;
  whatsappBio: string;
  h1: string;
  aboutText: string;
}

function fallbackSEO(business: { name: string; type: string; city: string; ownerName: string }): SEOResult {
  return {
    pageTitle: `${business.name} - ${business.type} in ${business.city}`,
    metaDescription: `Best ${business.type} in ${business.city}. Contact ${business.name} on WhatsApp for instant help.`,
    keywords: [`${business.type} ${business.city}`, `best ${business.type} near me`, business.name, `${business.city} ${business.type}`, `affordable ${business.type} ${business.city}`, `${business.type} contact ${business.city}`, `${business.name} ${business.city}`, `top ${business.type} ${business.city}`],
    googleDescription: `${business.name} is a trusted ${business.type} in ${business.city}. Contact us on WhatsApp for instant service.`,
    whatsappBio: `${business.name} | ${business.type} | ${business.city} | Powered by LeadPe`,
    h1: `Best ${business.type} in ${business.city}`,
    aboutText: `Welcome to ${business.name}. We are a trusted ${business.type} serving customers in ${business.city}. Contact us on WhatsApp for quick service and affordable rates.`,
  };
}

export async function generateSEO(business: { name: string; type: string; city: string; ownerName: string }): Promise<SEOResult> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-generate", {
      body: { type: "seo", data: business },
    });

    if (error || data?.error) {
      console.log("AI SEO error, using fallback:", error || data?.error);
      return fallbackSEO(business);
    }

    const text = data?.result || "";
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    console.log("AI SEO parse error, using fallback");
    return fallbackSEO(business);
  }
}

export async function generateWelcomeMessage(business: {
  name: string; type: string; city: string; ownerName: string;
  plan: string; trialCode: string; language: string;
}): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-generate", {
      body: { type: "welcome", data: business },
    });

    if (error || data?.error || !data?.result) {
      return defaultWelcome(business);
    }
    return data.result;
  } catch {
    return defaultWelcome(business);
  }
}

function defaultWelcome(b: { ownerName: string; name: string; trialCode: string }): string {
  return `🎉 Welcome to LeadPe, ${b.ownerName}!\n\nYour business ${b.name} is now part of the LeadPe family! 🌱\n\nWe will have your website ready within 48 hours.\n\nYour Trial Code: *${b.trialCode}*\n\nWhat happens next:\n✅ Our team will contact you within 2 hours\n🌐 Website will be built in 48 hours\n📲 Leads will come directly to your WhatsApp\n📍 Google Maps will be set up\n\nReply anytime if you have questions!\n\nLeadPe Team 🌱`;
}

export async function generateLeadMessage(lead: {
  customerName: string; customerPhone: string; interest: string;
  businessName: string; language: string;
}): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-generate", {
      body: { type: "lead", data: lead },
    });

    if (error || data?.error || !data?.result) {
      return `🔔 NEW LEAD ALERT!\n\nCustomer: ${lead.customerName}\nPhone: ${lead.customerPhone}\nLooking for: ${lead.interest}\n\nContact them quickly! This is a hot lead 🔥\n\nLeadPe 🔔`;
    }
    return data.result;
  } catch {
    return `🔔 NEW LEAD ALERT!\n\nCustomer: ${lead.customerName}\nPhone: ${lead.customerPhone}\nLooking for: ${lead.interest}\n\nContact them quickly!\n\nLeadPe 🔔`;
  }
}
