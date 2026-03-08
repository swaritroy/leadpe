import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    let maxTokens = 500;

    if (type === "seo") {
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
        messages: [{ role: "user", content: prompt }],
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
  } catch (e) {
    console.error("AI error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
