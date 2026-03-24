import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildPromptTemplate(data: Record<string, string>): { system: string; user: string } {
  const system = `You are an expert web developer creating detailed build instructions for a professional Indian business website. Generate a complete, specific, actionable Lovable.dev prompt. Return ONLY the prompt text. No explanation. No preamble.`;

  const user = `Generate a complete Lovable.dev website build prompt for this Indian business:

BUSINESS DETAILS:
- Name: ${data.business_name}
- Type: ${data.business_type}
- City: ${data.city}
- WhatsApp: ${data.whatsapp_number}
- Owner: ${data.owner_name}
- One line: ${data.one_line_description || ""}
- Brand color: ${data.color_preference || "#00C853"}
- Special requirements: ${data.special_requirements || "None"}

PACKAGE: ${data.package_name || "Standard"}
Package includes: ${data.package_features || "5 pages, WhatsApp button, Mobile friendly"}

The prompt must include ALL of these sections in this exact order:

1. PROJECT OVERVIEW
   Specific website purpose for this exact business type in India.
   Target audience description.

2. DESIGN SYSTEM
   - Primary color: ${data.color_preference || "#00C853"}
   - Font: Syne for headings, Inter for body text
   - Style: Modern, trustworthy, professional Indian business
   - Mobile-first (70% Indian users are on mobile)
   - Border radius: 12px for cards
   - Smooth scroll behavior

3. PAGES TO BUILD
   Based on ${data.business_type}, specify exactly which pages.

4. HERO SECTION (most important)
   - Headline targeting people searching for ${data.business_type} in ${data.city}
   - Primary CTA: "WhatsApp Us Now →" links to: https://wa.me/91${data.whatsapp_number}
   - Secondary CTA: "Call Now →" links to: tel:+91${data.whatsapp_number}
   - Trust badges relevant to business type

5. WHATSAPP INTEGRATION (CRITICAL)
   Fixed floating WhatsApp button bottom-right corner.
   Lead capture widget MUST be embedded:
   ${data.lead_widget_html || "<!-- Lead widget will be added -->"}

6. SEO META TAGS
7. GOOGLE MAPS for "${data.business_name} ${data.city}"
8. TRUST ELEMENTS based on ${data.business_type}
9. CONTACT SECTION with WhatsApp: ${data.whatsapp_number}, City: ${data.city}
10. FOOTER with "Powered by LeadPe"
11. PERFORMANCE REQUIREMENTS - 90+ mobile PageSpeed
12. LEAD WIDGET embedded as-is:
    ${data.lead_widget_html || "<!-- Lead widget will be added -->"}

Generate the complete prompt now. Make it specific to ${data.business_type}. Use real Indian context.`;

  return { system, user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "build_prompt") {
      const prompts = buildPromptTemplate(data);
      systemPrompt = prompts.system;
      userPrompt = prompts.user;
    } else if (type === "seo") {
      systemPrompt = "You are an SEO expert for Indian local businesses. Return ONLY valid JSON, no markdown fences.";
      userPrompt = `Generate SEO content for:
Business Name: ${data.name}
Type: ${data.type}
City: ${data.city}
Owner: ${data.ownerName}

Return ONLY valid JSON:
{
  "pageTitle": "...",
  "metaDescription": "...",
  "keywords": ["...", "..."],
  "googleDescription": "...",
  "whatsappBio": "...",
  "h1": "...",
  "aboutText": "..."
}

Rules:
- pageTitle: 60 chars max, include business name + city
- metaDescription: 155 chars max, include city + type + benefit
- keywords: 8 keywords, local + type + city combinations
- googleDescription: 250 chars for Google Business profile
- whatsappBio: 139 chars max for WhatsApp Business bio
- h1: Main heading for website
- aboutText: 100 words about section
- Language: Hinglish friendly
- Focus: local customers in ${data.city}`;
    } else if (type === "welcome") {
      systemPrompt = "You are a friendly business messaging assistant. Return ONLY the message text.";
      userPrompt = `Write a WhatsApp welcome message for a new LeadPe client.
Details:
Business: ${data.name}
Type: ${data.type}
City: ${data.city}
Owner: ${data.ownerName}
Plan: ${data.plan}
Trial Code: ${data.trialCode}
Language: ${data.language}

LeadPe = AI-powered website + lead generation platform for Indian businesses. ₹299/month after 21 day free trial.

Rules:
- Max 200 words
- Warm and friendly
- In ${data.language} (Hinglish = mix Hindi + English)
- Include trial code
- Mention 48 hour website build
- Mention leads on WhatsApp
- Use emojis naturally
- Sign off as "LeadPe Team 🌱"
Return ONLY the message text.`;
    } else if (type === "lead") {
      systemPrompt = "You are a lead notification assistant. Return ONLY the notification message.";
      userPrompt = `Write a WhatsApp notification to a business owner about a new lead.
Customer Name: ${data.customerName}
Customer Phone: ${data.customerPhone}
Interest: ${data.interest}
Business: ${data.businessName}
Language: ${data.language}

Rules: Max 100 words, exciting urgent tone, in ${data.language}, include customer phone, tell owner to call quickly, use emojis, sign off as "LeadPe 🔔"
Return ONLY the message.`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("AI error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
