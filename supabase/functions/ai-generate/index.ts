import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
   Based on ${data.business_type}, specify exactly which pages:
   
   For Doctor/Clinic:
   Home, About Doctor, Services/Treatments, Patient Reviews, Contact + Appointment
   
   For CA/Lawyer:
   Home, About, Practice Areas, Why Choose Us, Contact
   
   For Coaching Institute:
   Home, About, Courses/Batches, Results/Testimonials, Contact + Enquiry
   
   For Contractor/Plumber:
   Home, Services, Our Work (gallery), Why Us, Contact + Quote Request
   
   For Others:
   Home, About, Services, Testimonials, Contact

4. HERO SECTION (most important)
   - Headline targeting people searching for ${data.business_type} in ${data.city}
   - Subheadline: ${data.one_line_description || data.business_name}
   - Primary CTA: "WhatsApp Us Now →" links to: https://wa.me/91${data.whatsapp_number}
   - Secondary CTA: "Call Now →" links to: tel:+91${data.whatsapp_number}
   - Trust badges relevant to business type

5. WHATSAPP INTEGRATION (CRITICAL)
   Fixed floating WhatsApp button bottom-right corner:
   - Green circle, WhatsApp icon
   - Opens: https://wa.me/91${data.whatsapp_number}
   - Pre-filled message: "Hi, I found you on Google. I need [service]."
   
   Lead capture widget MUST be embedded:
   Paste this exact HTML in the contact section and any enquiry forms:
   ${data.lead_widget_html || "<!-- Lead widget will be added -->"}

6. SEO META TAGS (in <head>):
   Title: "${data.business_name} | ${data.business_type} in ${data.city}"
   Description: "${data.one_line_description || data.business_name}. Contact us on WhatsApp for instant response."
   Keywords: "${data.business_type} in ${data.city}, best ${data.business_type} ${data.city}, ${data.business_name}"
   OG tags for WhatsApp sharing

7. GOOGLE MAPS
   Embed Google Maps search for: "${data.business_name} ${data.city}" in the Contact section

8. TRUST ELEMENTS
   Based on ${data.business_type} add:
   - Years of experience section
   - Number of clients served
   - Certifications/qualifications
   - Before/after or results section
   - Client testimonials (3 placeholder cards)

9. CONTACT SECTION
   - Business name
   - WhatsApp: ${data.whatsapp_number}
   - City: ${data.city}
   - Working hours placeholder
   - Google Maps embed
   - Lead capture widget embedded here

10. FOOTER
    - Business name + tagline
    - Quick links
    - WhatsApp button
    - "Powered by LeadPe" small text

11. PERFORMANCE REQUIREMENTS
    - No heavy animations
    - Images must be lazy loaded
    - Must score 90+ on mobile PageSpeed
    - No external fonts that slow loading

12. LEAD WIDGET REQUIREMENT (CRITICAL)
    The following HTML widget MUST be embedded in the contact section.
    Do not modify it. Paste as-is:
    ${data.lead_widget_html || "<!-- Lead widget will be added -->"}

Generate the complete prompt now.
Make it specific to ${data.business_type}.
Use real Indian context and language.`;

  return { system, user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, data } = await req.json();
    const API_KEY = Deno.env.get("VITE_ANTHROPIC_API_KEY");
    
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let prompt = "";
    let systemPrompt = "";
    let maxTokens = 500;

    if (type === "build_prompt") {
      maxTokens = 2000;
      const prompts = buildPromptTemplate(data);
      systemPrompt = prompts.system;
      prompt = prompts.user;
    } else if (type === "seo") {
      maxTokens = 800;
      prompt = `You are an SEO expert for Indian local businesses.
Generate SEO content for:
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
      maxTokens = 400;
      prompt = `Write a WhatsApp welcome message for a new LeadPe client.
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
      maxTokens = 300;
      prompt = `Write a WhatsApp notification to a business owner about a new lead.
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

    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: "user", content: prompt });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages,
      }),
    });

    const result = await response.json();

    if (result.error) {
      console.error("Claude error:", result.error);
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = result.content?.[0]?.text || "";

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
