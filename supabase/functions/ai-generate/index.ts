import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://leadpe.lovable.app",
  "https://id-preview--22f543a5-dc93-422b-8514-e3fff158bc80.lovable.app",
  "https://leadpe.tech",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// ═══ DESIGN PROFILES BY BUSINESS TYPE ═══
const designProfiles: Record<string, { colors: string; style: string; fonts: string; sections: string; tone: string; images: string }> = {
  "Doctor / Clinic": {
    colors: "Trust blue #1565C0 + Clean white + Soft green #4CAF50",
    style: "Clean, medical, trustworthy",
    fonts: "Professional serif heading + Clean sans body (Inter)",
    sections: "Hero, Services, Doctor Bio, Timings, Location, Book Appointment, Testimonials",
    tone: "Professional, caring, reassuring",
    images: "Medical, healthcare, doctor-patient trust",
  },
  "CA / Lawyer / CS": {
    colors: "Deep navy #1A237E + Gold #C9A84C + White",
    style: "Formal, prestigious, authoritative",
    fonts: "Classic serif heading + Formal sans body",
    sections: "Hero, Services, Experience, Why Choose Us, Cases Won, Consultation Booking, Contact",
    tone: "Professional, expert, trustworthy",
    images: "Office, books, professional setting",
  },
  "Coaching Institute": {
    colors: "Energetic orange #E65100 + Yellow #FDD835 + White",
    style: "Dynamic, motivating, energetic",
    fonts: "Bold impactful heading + Clean readable body",
    sections: "Hero, Courses, Results/Ranks, Faculty, Batches, Fees, Success Stories, Enroll Now",
    tone: "Motivating, result-focused, confidence-building",
    images: "Students, books, success, classroom energy",
  },
  "Restaurant / Cafe": {
    colors: "Warm red #C62828 + Golden #FF8F00 + Cream #FFF8E1",
    style: "Appetizing, warm, inviting",
    fonts: "Friendly rounded heading + Readable body",
    sections: "Hero, Menu Highlights, Specialties, Gallery, Location, Order/Reserve",
    tone: "Warm, appetizing, welcoming",
    images: "Food, restaurant ambiance, happy customers dining",
  },
  "Salon / Parlour": {
    colors: "Rose gold #C2185B + Blush pink #FCE4EC + White",
    style: "Elegant, feminine, aspirational",
    fonts: "Elegant script heading + Clean body",
    sections: "Hero, Services + Prices, Before/After Gallery, Team, Offers, Book Now",
    tone: "Beautiful, confidence-boosting, luxurious",
    images: "Beauty, transformation, salon atmosphere",
  },
  "Contractor / Plumber": {
    colors: "Strong gray #37474F + Yellow #F9A825 + White",
    style: "Strong, reliable, industrial",
    fonts: "Bold strong heading + Clean readable body",
    sections: "Hero, Services, Projects Done, Materials Used, Why Us, Free Quote Form, Contact",
    tone: "Reliable, experienced, quality-focused",
    images: "Construction, tools, completed projects",
  },
  "Photographer / Videographer": {
    colors: "Dark charcoal #1A1A1A + White + Accent gold #C9A84C",
    style: "Cinematic, artistic, portfolio-focused",
    fonts: "Modern sans heading + Minimal body",
    sections: "Hero with full-width photo, Portfolio Gallery, Services, Packages, About, Contact",
    tone: "Artistic, professional, storytelling",
    images: "Photography, portraits, events, cinematic shots",
  },
  "Architect": {
    colors: "Slate #334155 + White + Warm wood #8B6F47",
    style: "Minimal, architectural, clean lines",
    fonts: "Geometric sans heading + Light body",
    sections: "Hero, Projects Portfolio, Services, Design Philosophy, Process, Contact",
    tone: "Sophisticated, visionary, detail-oriented",
    images: "Architecture, buildings, interiors, blueprints",
  },
  "Gym / Fitness Trainer": {
    colors: "Bold red #D32F2F + Dark #1A1A1A + White",
    style: "Energetic, powerful, motivating",
    fonts: "Bold uppercase heading + Strong body",
    sections: "Hero, Programs, Trainers, Schedule, Membership Plans, Transformations, Contact",
    tone: "Motivating, powerful, results-driven",
    images: "Fitness, gym, workout, transformations",
  },
  "Digital Agency": {
    colors: "Deep violet #7C3AED + Electric blue #1565C0 + White",
    style: "Modern, tech-forward, results-driven",
    fonts: "Syne bold heading + Inter clean body",
    sections: "Hero, Services, Results/Stats, Portfolio, Testimonials, Process, Contact",
    tone: "Professional, results-focused, growth-oriented",
    images: "Digital, growth charts, modern office, tech",
  },
  "NGO / Trust": {
    colors: "Hope green #2E7D32 + Warm orange #E65100 + White",
    style: "Trustworthy, mission-driven, emotional",
    fonts: "Humanist heading + Readable body",
    sections: "Hero + Mission, Impact Numbers, Our Work, Team, Donate/Support, Contact",
    tone: "Inspiring, trustworthy, emotionally connecting",
    images: "Community, impact, people helped",
  },
  "Individual Consultant": {
    colors: "Professional blue #1976D2 + Light gray #F5F5F5 + White",
    style: "Personal brand, professional, credible",
    fonts: "Modern serif heading + Clean body",
    sections: "Hero, Expertise, Services, Success Stories, Process, Book Consultation, Contact",
    tone: "Expert, approachable, results-oriented",
    images: "Professional headshot, office, consulting",
  },
};

const defaultProfile = {
  colors: "LeadPe green #00C853 + Dark #1A1A1A + White",
  style: "Modern, clean, professional",
  fonts: "Syne bold heading + Inter body",
  sections: "Hero, Services, About, Gallery, Testimonials, Contact",
  tone: "Professional, friendly, trustworthy",
  images: "Relevant business stock photos",
};

function getDesignProfile(businessType: string) {
  for (const [key, profile] of Object.entries(designProfiles)) {
    if (businessType.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
      return profile;
    }
  }
  return designProfiles[businessType] || defaultProfile;
}

function buildSmartPrompt(data: Record<string, string>): { system: string; user: string } {
  const profile = getDesignProfile(data.business_type || "Other");

  const system = `You are an expert web developer creating detailed build instructions for a professional Indian business website. Generate a complete, specific, actionable Lovable.dev prompt. Return ONLY the prompt text. No explanation. No preamble.

CRITICAL: The prompt you generate MUST include the EXACT LeadPe Lead Capture Widget HTML/JS code provided in the user message. Copy it AS-IS into the prompt output. This widget is the MOST IMPORTANT part — it captures customer leads. Without it the website is USELESS.

ALSO CRITICAL: The footer of EVERY website MUST include this line:
"Built with LeadPe 🌱 — Get your free website at leadpe.tech"
Make "leadpe.tech" a clickable link opening https://leadpe.tech in a new tab.`;

  const user = `Generate a complete Lovable.dev website build prompt for this Indian business:

════ BUSINESS DETAILS ════
Business Name: ${data.business_name}
Type: ${data.business_type}
City: ${data.city}
WhatsApp: ${data.whatsapp_number}
Owner: ${data.owner_name || "Owner"}
One line: ${data.one_line_description || ""}
Special requirements: ${data.special_requirements || "None"}

════ DESIGN SYSTEM (UNIQUE TO ${data.business_type?.toUpperCase()}) ════
Colors: ${profile.colors}
${data.color_preference && data.color_preference !== "#00C853" && data.color_preference !== "rainbow" ? `Client preferred color: ${data.color_preference} — use this as primary instead` : ""}
Style: ${profile.style}
Fonts: ${profile.fonts}
Tone: ${profile.tone}
Mobile-first (70% Indian users are on mobile)
Border radius: 12px for cards
Smooth scroll behavior

════ SECTIONS TO BUILD ════
${profile.sections}

Plus these on EVERY website:
- Fixed WhatsApp button bottom-right, green #25D366, pulse animation, z-index 9999
  Links to: https://wa.me/91${data.whatsapp_number}
- Google Maps embed for "${data.business_name} ${data.city}"
- Fast loading (no heavy libraries)

════ IMAGES ════
${data.logo_url ? `USE THIS LOGO: ${data.logo_url}\nPlace in navbar prominently. Do NOT use text logo.` : "No logo provided — create a professional text logo using the business name."}

${data.photos_urls ? `USE THESE ACTUAL BUSINESS PHOTOS:\n${data.photos_urls}\nUse in hero and gallery sections.\nDo NOT use stock photos for main sections.\nThese are real photos of this business.` : `No photos provided.\nUse high-quality relevant stock photos matching: ${profile.images}\nUse Unsplash URLs for stock photos.`}

════ CONTENT ════
Write all content in HINDI + ENGLISH mix (Hinglish).
Target audience: People in ${data.city}
Use local language where appropriate.
Headline must mention ${data.city}.

════ SEO META TAGS ════
<title>${data.business_name} - Best ${data.business_type} in ${data.city}</title>
Meta description, keywords, OG tags, LocalBusiness schema JSON-LD.

════ DEMO MODE ════
Check VITE_LEADPE_MODE env var.
If "demo": show orange bar "⚠️ This is a preview", disable contact buttons.
If "live" or not set: normal mode.

════ ⚠️ LEADPE LEAD CAPTURE WIDGET — MOST CRITICAL ⚠️ ════
You MUST include this EXACT HTML/JavaScript widget code in the contact section or before the footer.
This widget captures customer inquiries and sends them to the LeadPe CRM database.
WITHOUT this widget, the entire website is USELESS.

DO NOT modify, summarize, or create your own version. Include this EXACTLY AS-IS:

${data.lead_widget_html || "<!-- Lead widget will be added -->"}

IMPORTANT NOTES:
- The business_id is pre-configured — DO NOT change it
- The Supabase API URL and key are pre-configured — DO NOT change them
- The widget submits leads to the "leads" table
- On success shows "Request Received!" confirmation
- "Powered by LeadPe 🌱" footer MUST remain visible

If building with React, you can either:
a) Embed this HTML in index.html directly
b) Create a React component that makes the SAME POST request to the SAME URL with SAME headers/body

════ VIRAL FOOTER (REQUIRED ON EVERY PAGE) ════
At the very bottom of every page footer, add this line:
Small gray text, centered, font-size: 12px, color: #999999:
"Built with LeadPe 🌱 — Get your free website at leadpe.tech"
Make "leadpe.tech" a clickable link that opens https://leadpe.tech in a new tab.
This MUST appear on EVERY page of the website.

════ TECHNICAL REQUIREMENTS ════
- React + Vite OR plain HTML+CSS+JS (choose what gives fastest load)
- Mobile first — test on 375px width
- No frameworks heavier than needed
- Images: lazy loading
- Fonts: Google Fonts only
- No jQuery
- All links working
- Performance: 90+ mobile PageSpeed

════ GITHUB SETUP ════
After building: Connect GitHub → Create PUBLIC repo → Branch "main" → Copy URL → Submit in LeadPe

FINAL CHECK before submitting:
□ All sections present
□ WhatsApp button working
□ LeadPe widget embedded correctly
□ Business photos used (not generic) if provided
□ Logo in navbar
□ Mobile looks perfect
□ Footer has "Built with LeadPe 🌱" credit line
□ GitHub repo is PUBLIC

Generate the complete prompt now. Make it specific to ${data.business_type}. Use real Indian context.`;

  return { system, user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "build_prompt") {
      const prompts = buildSmartPrompt(data);
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
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("AI error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
