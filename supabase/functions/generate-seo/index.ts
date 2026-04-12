import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://leadpe.lovable.app",
  "https://id-preview--22f543a5-dc93-422b-8514-e3fff158bc80.lovable.app",
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

function getLeadWidgetHtml(businessId: string, supabaseUrl: string, supabaseKey: string): string {
  return `<!-- LeadPe Lead Capture Widget -->
<div id="leadpe-widget">
  <div style="background:#fff;border:2px solid #00C853;border-radius:16px;padding:24px;max-width:400px;margin:20px auto;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,200,83,0.15)">
    <h3 style="color:#1A1A1A;margin:0 0 8px;font-size:20px">Get Free Consultation 📞</h3>
    <p style="color:#666;margin:0 0 20px;font-size:14px">Leave your details. We'll call you back!</p>
    <input id="lp-name" type="text" placeholder="Your Name" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:12px;box-sizing:border-box;outline:none"/>
    <input id="lp-phone" type="tel" placeholder="WhatsApp Number" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:12px;box-sizing:border-box;outline:none"/>
    <input id="lp-interest" type="text" placeholder="What are you looking for?" style="width:100%;padding:12px 16px;border:1px solid #E0E0E0;border-radius:10px;font-size:16px;margin-bottom:16px;box-sizing:border-box;outline:none"/>
    <button onclick="submitLeadPeLead()" style="width:100%;background:#00C853;color:white;border:none;border-radius:10px;padding:14px;font-size:16px;font-weight:bold;cursor:pointer">Get Callback 📲</button>
    <p style="text-align:center;margin:12px 0 0;font-size:11px;color:#999">Powered by LeadPe 🌱</p>
  </div>
</div>
<script>
async function submitLeadPeLead(){
  var n=document.getElementById('lp-name').value;
  var p=document.getElementById('lp-phone').value;
  var i=document.getElementById('lp-interest').value;
  if(!n||!p){alert('Please fill name and phone');return}
  if(p.replace(/\\D/g,'').length!==10){alert('Enter 10 digit number');return}
  var btn=document.querySelector('#leadpe-widget button');
  btn.textContent='Sending...';btn.disabled=true;
  try{
    var res=await fetch('${supabaseUrl}/rest/v1/leads',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':'${supabaseKey}','Authorization':'Bearer ${supabaseKey}','Prefer':'return=minimal'},
      body:JSON.stringify({business_id:'${businessId}',customer_name:n,phone:p.replace(/\\D/g,''),message:i,source:'website',status:'new'})
    });
    if(res.ok){
      document.getElementById('leadpe-widget').innerHTML='<div style="text-align:center;padding:40px 20px;background:#F0FFF4;border-radius:16px;border:2px solid #00C853"><div style="font-size:48px">✅</div><h3 style="color:#1A1A1A">Request Received!</h3><p style="color:#666">We will call you back within 2 hours.</p><p style="color:#999;font-size:11px">Powered by LeadPe 🌱</p></div>';
    }else{btn.textContent='Get Callback 📲';btn.disabled=false;alert('Error. Please try again.')}
  }catch(e){btn.textContent='Get Callback 📲';btn.disabled=false;alert('Error. Please try again.')}
}
</script>
<!-- End LeadPe Widget -->`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

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
      systemPrompt = `You are a website build prompt generator for the LeadPe platform. Generate comprehensive, copy-paste ready prompts for vibe coders to build websites using Lovable.dev or Bolt.new. Return ONLY the prompt text, no JSON wrapping.

CRITICAL RULES:
- The prompt MUST include the EXACT LeadPe Lead Capture Widget HTML/JS code provided below — copy it AS-IS into the prompt
- The widget code must NOT be modified, summarized, or paraphrased
- The widget is the MOST IMPORTANT part of the website — it captures customer leads
- Without this widget, the website is USELESS to the business owner`;
      
      const seoData = data.seo || {};
      const supabaseUrl = data.supabaseUrl || "https://vlmdctanuarrmngkrvng.supabase.co";
      const supabaseKey = data.supabaseKey || "";
      const businessId = data.businessId || "";
      const widgetHtml = getLeadWidgetHtml(businessId, supabaseUrl, supabaseKey);

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
${data.logoUrl ? `Logo URL: ${data.logoUrl}` : "No logo — create text-based logo using business name"}
${data.photosUrls ? `Business Photos: ${data.photosUrls}` : "No photos — use relevant stock photos"}

SEO DATA:
Page Title: ${seoData.page_title || `${data.name} - ${data.type} in ${data.city}`}
Meta Description: ${seoData.meta_description || ""}
H1: ${seoData.h1_heading || `Best ${data.type} in ${data.city}`}
About Text: ${seoData.about_text || ""}
Keywords: ${JSON.stringify(seoData.keywords || [])}

Generate a COMPLETE, DETAILED prompt that includes ALL of the following sections:

═══════════════════════════════════════════
SECTION 1 — PROJECT SETUP
═══════════════════════════════════════════
- React + Vite + Tailwind CSS
- Mobile-first design (70% Indian users on mobile)
- TypeScript
- Single page application

═══════════════════════════════════════════
SECTION 2 — HOME PAGE DESIGN
═══════════════════════════════════════════
- HERO SECTION:
  • Headline: "${seoData.h1_heading || `Best ${data.type} in ${data.city}`}"
  • Subheadline mentioning ${data.city} and key services
  • Primary CTA: Big green WhatsApp button → https://wa.me/91${data.whatsapp}
  • Secondary CTA: "Call Now" → tel:+91${data.whatsapp}
  • Trust badges (Years of experience, Happy customers, etc.)
  ${data.logoUrl ? `• Display business logo from: ${data.logoUrl}` : "• Create attractive text-based logo"}

- SERVICES SECTION:
  • 4-6 specific services for ${data.type} business
  • Each service card with icon, title, short description
  • "Book Now" button on each → WhatsApp link

- ABOUT SECTION:
  • Owner: ${data.ownerName}
  • Business story and expertise
  • ${seoData.about_text ? `Use this about text: ${seoData.about_text.substring(0, 200)}...` : "Generate compelling about text"}

- TESTIMONIALS SECTION:
  • 3-4 realistic testimonials from ${data.city} customers
  • Star ratings, customer names

- CONTACT SECTION:
  • WhatsApp: +91${data.whatsapp}
  • City: ${data.city}, India
  • Business hours
  • Google Maps embed for "${data.name} ${data.city}"

═══════════════════════════════════════════
SECTION 3 — DESIGN SYSTEM
═══════════════════════════════════════════
- Primary color: ${data.colorPreference === "blue" ? "#2196F3" : data.colorPreference === "orange" ? "#FF6B35" : data.colorPreference === "dark" ? "#1A1A1A" : "#00C853"}
- Style: ${data.stylePreference || "modern"}, clean, professional
- Font: Syne for headings, Inter or DM Sans for body
- Mobile-first: all buttons 48px+ height, 16px+ font
- Border-radius: 16px on cards, 12px on buttons
- Smooth scroll behavior
- Animations: subtle fade-in on scroll

═══════════════════════════════════════════
SECTION 4 — FLOATING WHATSAPP BUTTON
═══════════════════════════════════════════
- Fixed position bottom-right corner
- Green WhatsApp icon (48x48px)
- Pulse animation to attract attention
- Links to: https://wa.me/91${data.whatsapp}
- Always visible on all screen sizes
- z-index: 9999

═══════════════════════════════════════════
SECTION 5 — SEO (CRITICAL FOR GOOGLE RANKING)
═══════════════════════════════════════════
In index.html <head>:
<title>${seoData.page_title || `${data.name} - Best ${data.type} in ${data.city}`}</title>
<meta name="description" content="${seoData.meta_description || `${data.name} is the best ${data.type} in ${data.city}. Contact us on WhatsApp.`}">
<meta name="keywords" content="${(seoData.keywords || []).join(", ")}">
<meta property="og:title" content="${seoData.page_title || data.name}">
<meta property="og:description" content="${seoData.meta_description || ""}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_IN">

LocalBusiness Schema JSON-LD in <head>:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${data.name}",
  "description": "${seoData.meta_description || ""}",
  "telephone": "+91${data.whatsapp}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "${data.city}",
    "addressCountry": "IN"
  }
}
</script>

═══════════════════════════════════════════
SECTION 6 — DEMO MODE (IMPORTANT)
═══════════════════════════════════════════
Check for VITE_LEADPE_MODE environment variable:
- If VITE_LEADPE_MODE === "demo":
  • Show orange top bar: "⚠️ This is a preview. Contact buttons are disabled."
  • Disable all WhatsApp/call buttons (show toast "This is a preview")
  • Lead form still works (for testing)
- If VITE_LEADPE_MODE === "live" or not set:
  • Normal mode, all buttons functional

═══════════════════════════════════════════
SECTION 7 — LEADPE LEAD CAPTURE WIDGET
⚠️ THIS IS THE MOST CRITICAL SECTION ⚠️
═══════════════════════════════════════════

You MUST embed this EXACT HTML/JavaScript widget code in the website's contact section or as a standalone section before the footer.

This widget captures customer inquiries and sends them directly to the LeadPe CRM database. WITHOUT this widget, the entire website is USELESS.

DO NOT modify this code. DO NOT create your own version. Copy-paste this EXACTLY:

${widgetHtml}

IMPORTANT NOTES ABOUT THE WIDGET:
- The business_id "${businessId}" is pre-configured — DO NOT change it
- The Supabase API URL and key are pre-configured — DO NOT change them
- The widget submits leads to the "leads" table in the database
- On success, it shows a "Request Received!" confirmation
- On error, it shows an alert and re-enables the button
- The "Powered by LeadPe 🌱" footer MUST remain visible

If building with React:
- You can either embed this HTML directly in index.html
- OR create a React component that replicates this exact functionality
- The React component MUST make the same POST request to the same Supabase URL with the same headers and body structure

═══════════════════════════════════════════
SECTION 8 — FOOTER
═══════════════════════════════════════════
- Business name and tagline
- Quick links: Home, Services, About, Contact
- WhatsApp contact button
- "Powered by LeadPe 🌱" with link to leadpe.tech
- © ${new Date().getFullYear()} ${data.name}. All rights reserved.

═══════════════════════════════════════════
SECTION 9 — PERFORMANCE
═══════════════════════════════════════════
- Target: 90+ mobile PageSpeed score
- Lazy load images
- Minimize CSS/JS
- Use system fonts as fallback
- No heavy animations
- Compress all assets

═══════════════════════════════════════════
SECTION 10 — GITHUB & DEPLOYMENT
═══════════════════════════════════════════
After building:
1. Connect GitHub in Lovable (top right icon)
2. Create PUBLIC repository
3. Branch must be "main"
4. Ensure "build": "vite build" in package.json
5. Verify no build errors
6. Copy GitHub URL
7. Submit in LeadPe Studio

Make the prompt comprehensive, specific to THIS ${data.type} business in ${data.city}, and ready to paste directly into Lovable.dev chat.`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("generate-seo error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
