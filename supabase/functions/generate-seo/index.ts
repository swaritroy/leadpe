import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "seo") {
      systemPrompt = "You are an SEO expert for Indian local businesses. Return ONLY valid JSON, no markdown.";
      userPrompt = `Generate complete SEO data for this Indian local business:

Business Name: ${data.name}
Business Type: ${data.type}
City: ${data.city}
Owner: ${data.ownerName}
WhatsApp: ${data.whatsapp || ""}
Description: ${data.description || ""}

Return this exact JSON structure:
{
  "page_title": "60 chars max, include business name + city + type",
  "meta_description": "155 chars max, include city + type + benefit + CTA",
  "h1_heading": "Best [Type] in [City]",
  "about_text": "400+ words about the business, mention city 8-10 times, type 8-10 times, include owner name, WhatsApp number. Natural reading, not stuffed.",
  "keywords": ["10 local + type combinations like type in city, best type city, type near me city"],
  "schema_json": {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "",
    "description": "",
    "telephone": "",
    "address": {"@type": "PostalAddress", "addressLocality": "", "addressRegion": "", "addressCountry": "IN"},
    "url": "",
    "priceRange": "₹₹",
    "openingHours": "Mo-Sa 09:00-18:00"
  },
  "faq_schema": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "What services does [name] offer?", "acceptedAnswer": {"@type": "Answer", "text": "..."}},
      {"@type": "Question", "name": "Where is [name] located?", "acceptedAnswer": {"@type": "Answer", "text": "..."}},
      {"@type": "Question", "name": "How to contact [name]?", "acceptedAnswer": {"@type": "Answer", "text": "..."}},
      {"@type": "Question", "name": "What are [name]'s timings?", "acceptedAnswer": {"@type": "Answer", "text": "..."}},
      {"@type": "Question", "name": "How much does [name] charge?", "acceptedAnswer": {"@type": "Answer", "text": "..."}}
    ]
  },
  "og_tags": {"og:title": "", "og:description": "", "og:type": "local.business", "og:locale": "en_IN"},
  "gbp_description": "750 char Google Business Profile description",
  "google_description": "250 chars for Google Business profile",
  "whatsapp_bio": "139 chars max for WhatsApp Business bio",
  "citations_list": ["JustDial", "Sulekha", "IndiaMart", "Google Business", "Bing Places", "Apple Maps", "Facebook Business", "Instagram", "WhatsApp Business", "Yellow Pages India"],
  "review_message": "WhatsApp message business owner can send to happy customers asking for Google review",
  "sitemap_content": "Complete sitemap.xml string",
  "robots_content": "User-agent: *\\nAllow: /\\nSitemap: https://[slug].leadpe.tech/sitemap.xml"
}

Fill ALL fields with real, specific data for this exact business. Keywords should be highly local.`;
    } else if (type === "prompt") {
      systemPrompt = "You are a website build prompt generator for the LeadPe platform. Generate comprehensive, copy-paste ready prompts for vibe coders to build websites using Lovable.dev. Return ONLY the prompt text, no JSON wrapping.";
      
      const seoData = data.seo || {};
      userPrompt = `Generate a complete Lovable.dev build prompt for this business:

BUSINESS:
Name: ${data.name}
Type: ${data.type}
City: ${data.city}
Owner: ${data.ownerName}
WhatsApp: +91${data.whatsapp}
Color preference: ${data.colorPreference || "green"}
Style: ${data.stylePreference || "modern"}
Special requirements: ${data.specialRequirements || "None"}

SEO DATA:
Page Title: ${seoData.page_title || `${data.name} - ${data.type} in ${data.city}`}
Meta Description: ${seoData.meta_description || ""}
H1: ${seoData.h1_heading || `Best ${data.type} in ${data.city}`}
About Text: ${seoData.about_text || ""}
Keywords: ${JSON.stringify(seoData.keywords || [])}

Generate a COMPLETE prompt that includes:

1. Project setup (React + Tailwind, mobile-first)
2. HOME PAGE with:
   - Hero with headline "${seoData.h1_heading || `Best ${data.type} in ${data.city}`}"
   - Big green WhatsApp button linking to wa.me/91${data.whatsapp}
   - Services section with 4 specific services for ${data.type}
   - About section with the about text
   - Contact section with WhatsApp button
3. DESIGN specs:
   - Primary color based on ${data.colorPreference || "green"} preference
   - ${data.stylePreference || "modern"} style
   - Mobile-first, all buttons 44px+ height
   - Border-radius 16px on cards
4. SEO - index.html HEAD tags:
   - title, meta description, keywords, og tags
   - LocalBusiness schema JSON-LD
   - FAQ schema JSON-LD  
5. DEMO MODE code:
   - Check VITE_LEADPE_MODE env var
   - If "demo": show orange top bar "Preview Only", disable WhatsApp buttons
   - If "live": normal mode
6. LEADPE LEAD WIDGET (REQUIRED):
   - React component at bottom of homepage
   - Form with name, phone, interest fields
   - On submit: POST to Supabase
   - business_id: "${data.businessId}"
   - supabase_url: "${data.supabaseUrl}"
   - supabase_key: "${data.supabaseKey}"
   - business_whatsapp: "${data.whatsapp}"
   - "Powered by LeadPe 🌱" footer
7. GITHUB SETUP instructions (10 steps)
8. CHECKLIST before submitting

Make the prompt comprehensive, specific to THIS business, and ready to paste directly into Lovable.dev chat.`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("generate-seo error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
