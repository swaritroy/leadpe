import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

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

// ═══ DESIGN PROFILES BY BUSINESS TYPE ═══
const designProfiles: Record<string, { colors: string; style: string; fonts: string; sections: string; tone: string; images: string }> = {
  "doctor": { colors: "Trust blue #1565C0 + Clean white + Soft green #4CAF50", style: "Clean, medical, trustworthy", fonts: "Professional serif heading (Playfair Display) + Clean sans body (Inter)", sections: "Hero with doctor image, Services/Treatments, Doctor Bio & Qualifications, Clinic Timings, Location with map, Book Appointment CTA, Patient Testimonials", tone: "Professional, caring, reassuring", images: "Medical, healthcare, doctor-patient trust, clinic interior" },
  "clinic": { colors: "Trust blue #1565C0 + Clean white + Soft green #4CAF50", style: "Clean, medical, trustworthy", fonts: "Professional serif heading + Clean sans body (Inter)", sections: "Hero, Treatments, Doctor Profiles, Timings, Insurance Accepted, Book Appointment, Testimonials", tone: "Professional, caring, reassuring", images: "Medical, healthcare, clinic" },
  "ca": { colors: "Deep navy #1A237E + Gold #C9A84C + White", style: "Formal, prestigious, authoritative", fonts: "Classic serif heading (Libre Baskerville) + Formal sans body (IBM Plex Sans)", sections: "Hero, Services (ITR/GST/Audit), Experience & Credentials, Why Choose Us, Consultation Booking, Client Testimonials, Contact", tone: "Professional, expert, trustworthy", images: "Office, books, professional setting, documents" },
  "lawyer": { colors: "Deep navy #1A237E + Gold #C9A84C + White", style: "Formal, prestigious, authoritative", fonts: "Classic serif heading + Formal sans body", sections: "Hero, Practice Areas, Experience, Cases Won, Free Consultation Booking, Contact", tone: "Professional, expert, trustworthy, authoritative", images: "Law office, justice scales, courtroom, books" },
  "coaching": { colors: "Energetic orange #E65100 + Yellow #FDD835 + White", style: "Dynamic, motivating, energetic", fonts: "Bold impactful heading (Bebas Neue) + Clean readable body (Barlow)", sections: "Hero with results, Courses Offered, Top Results/Ranks, Faculty Profiles, Batch Timings, Fee Structure, Success Stories with photos, Enroll Now Form", tone: "Motivating, result-focused, confidence-building", images: "Students studying, exam success, classroom energy, toppers" },
  "restaurant": { colors: "Warm red #C62828 + Golden #FF8F00 + Cream #FFF8E1", style: "Appetizing, warm, inviting", fonts: "Friendly rounded heading (Poppins) + Readable body (Nunito)", sections: "Hero with food image, Menu Highlights with prices, Today's Specials, Photo Gallery, Customer Reviews, Location & Timings, Order on WhatsApp", tone: "Warm, appetizing, welcoming, homely", images: "Food close-ups, restaurant ambiance, happy customers dining, chef" },
  "cafe": { colors: "Warm brown #5D4037 + Cream #FFF8E1 + Accent orange #FF6F00", style: "Cozy, trendy, Instagram-worthy", fonts: "Handwritten heading + Clean body", sections: "Hero, Menu, Specialties, Ambiance Gallery, Reviews, Location", tone: "Warm, trendy, inviting", images: "Coffee, pastries, cozy interiors" },
  "salon": { colors: "Rose gold #C2185B + Blush pink #FCE4EC + White", style: "Elegant, feminine, aspirational", fonts: "Elegant script heading (Cormorant Garamond) + Clean body (Karla)", sections: "Hero with transformation, Services with Prices, Before/After Gallery, Our Team/Artists, Current Offers, Book Appointment Now", tone: "Beautiful, confidence-boosting, luxurious", images: "Beauty transformations, salon interior, hair/makeup, happy clients" },
  "parlour": { colors: "Rose gold #C2185B + Blush pink #FCE4EC + White", style: "Elegant, feminine", fonts: "Elegant heading + Clean body", sections: "Hero, Services + Prices, Gallery, Team, Offers, Book Now", tone: "Beautiful, confidence-boosting", images: "Beauty, makeover, bridal" },
  "gym": { colors: "Bold red #D32F2F + Dark #1A1A1A + White", style: "Energetic, powerful, motivating", fonts: "Bold uppercase heading (Archivo Black) + Strong body (Hind)", sections: "Hero with gym photo, Programs/Classes, Trainer Profiles, Class Schedule, Membership Plans with prices, Body Transformations, Join Now Form", tone: "Motivating, powerful, results-driven, intense", images: "Fitness, gym equipment, workout, body transformations" },
  "fitness": { colors: "Bold red #D32F2F + Dark #1A1A1A + White", style: "Energetic, powerful", fonts: "Bold heading + Strong body", sections: "Hero, Programs, Trainers, Plans, Transformations, Contact", tone: "Motivating, powerful", images: "Fitness, workout, transformations" },
  "contractor": { colors: "Strong gray #37474F + Safety yellow #F9A825 + White", style: "Strong, reliable, industrial", fonts: "Bold strong heading (Archivo Black) + Clean readable body (Work Sans)", sections: "Hero with project photo, Services List, Completed Projects Gallery, Materials Used, Why Choose Us, Free Quote Form, Contact", tone: "Reliable, experienced, quality-focused", images: "Construction sites, tools, completed projects, materials" },
  "plumber": { colors: "Strong gray #37474F + Blue #1976D2 + White", style: "Strong, reliable, service-focused", fonts: "Bold heading + Clean body", sections: "Hero, Services, Emergency Services, Areas Covered, Customer Reviews, Quick Contact", tone: "Reliable, fast, experienced", images: "Plumbing, tools, repairs" },
  "electrician": { colors: "Strong gray #37474F + Yellow #F9A825 + White", style: "Strong, reliable", fonts: "Bold heading + Clean body", sections: "Hero, Services, Areas Covered, Reviews, Emergency Contact", tone: "Reliable, fast, safe", images: "Electrical work, tools, wiring" },
  "photographer": { colors: "Dark charcoal #1A1A1A + White + Accent gold #C9A84C", style: "Cinematic, artistic, portfolio-focused", fonts: "Modern sans heading (Syne) + Minimal body (DM Sans)", sections: "Full-width hero photo, Portfolio Gallery (weddings/events/portraits), Services & Packages with prices, About the Photographer, Client Testimonials, Booking Form", tone: "Artistic, professional, storytelling", images: "Photography, portraits, events, weddings, cinematic shots" },
  "real estate": { colors: "Deep teal #004D40 + Gold #B8860B + White", style: "Luxurious, trustworthy, premium", fonts: "Elegant serif heading (DM Serif Display) + Clean body (Fira Sans)", sections: "Hero with property, Featured Properties, Services (Buy/Sell/Rent), Why Choose Us, Success Numbers, Client Testimonials, Contact Form", tone: "Prestigious, reliable, trustworthy", images: "Properties, buildings, luxury interiors, happy homeowners" },
  "digital": { colors: "Deep violet #7C3AED + Electric blue #1565C0 + White", style: "Modern, tech-forward, results-driven", fonts: "Syne bold heading + Inter clean body", sections: "Hero with stats, Services (SEO/Social/Ads), Results & Case Studies, Portfolio, Client Testimonials, Process Steps, Contact", tone: "Professional, results-focused, growth-oriented", images: "Digital marketing, growth charts, modern office" },
  "ngo": { colors: "Hope green #2E7D32 + Warm orange #E65100 + White", style: "Trustworthy, mission-driven, emotional", fonts: "Humanist heading (Nunito) + Readable body (Open Sans)", sections: "Hero with mission statement, Impact Numbers, Our Programs, Team Members, Success Stories, Donate/Support CTA, Contact", tone: "Inspiring, trustworthy, emotionally connecting", images: "Community work, volunteers, beneficiaries, impact moments" },
  "trust": { colors: "Hope green #2E7D32 + Warm orange #E65100 + White", style: "Trustworthy, mission-driven", fonts: "Humanist heading + Readable body", sections: "Hero + Mission, Impact, Programs, Team, Donate, Contact", tone: "Inspiring, trustworthy", images: "Community, impact" },
  "dance": { colors: "Vibrant purple #7B1FA2 + Pink #E91E63 + White", style: "Vibrant, energetic, artistic", fonts: "Bold heading + Fun body", sections: "Hero with dance photo, Classes Offered, Faculty, Schedule, Student Performances, Enroll Now", tone: "Energetic, artistic, fun", images: "Dance, performances, students, stage" },
  "music": { colors: "Rich maroon #880E4F + Gold #FFD54F + Dark", style: "Artistic, elegant, classical", fonts: "Serif heading + Clean body", sections: "Hero, Instruments/Classes, Faculty, Schedule, Student Achievements, Enroll", tone: "Artistic, passionate, disciplined", images: "Musical instruments, performances, students" },
  "tailor": { colors: "Royal purple #4A148C + Gold #C9A84C + White", style: "Elegant, bespoke, premium", fonts: "Elegant serif heading + Clean body", sections: "Hero, Services (Stitching/Alteration), Fabric Gallery, Custom Orders, Reviews, Contact", tone: "Elegant, personalized, quality-focused", images: "Fabrics, tailoring, custom clothing" },
  "grocery": { colors: "Fresh green #2E7D32 + Yellow #FDD835 + White", style: "Fresh, friendly, everyday", fonts: "Friendly heading + Readable body", sections: "Hero, Products, Today's Offers, Delivery Info, Customer Reviews, Order on WhatsApp", tone: "Fresh, affordable, convenient", images: "Fresh produce, groceries, delivery" },
  "bakery": { colors: "Warm brown #5D4037 + Cream #FFF8E1 + Pink #F48FB1", style: "Sweet, warm, homely", fonts: "Handwritten heading + Readable body", sections: "Hero, Specialties, Menu with Photos, Custom Orders, Reviews, Order Now", tone: "Sweet, warm, homemade feel", images: "Baked goods, cakes, pastries, bakery interior" },
  "hotel": { colors: "Deep burgundy #880E4F + Gold #C9A84C + White", style: "Luxurious, welcoming, premium", fonts: "Elegant serif heading + Clean body", sections: "Hero with room photos, Room Types & Rates, Amenities, Gallery, Guest Reviews, Book Now", tone: "Luxurious, welcoming, comfortable", images: "Hotel rooms, lobby, amenities, views" },
  "tutor": { colors: "Calm blue #1565C0 + Green #43A047 + White", style: "Academic, focused, trustworthy", fonts: "Clear heading + Readable body", sections: "Hero, Subjects Offered, Tutor Profile, Results, Batch Info, Enroll Now", tone: "Knowledgeable, patient, results-oriented", images: "Books, study, whiteboard, students" },
  "pet": { colors: "Warm orange #E65100 + Sky blue #29B6F6 + White", style: "Friendly, playful, caring", fonts: "Rounded heading + Friendly body", sections: "Hero with pets, Services, Pricing, Gallery, Reviews, Book Now", tone: "Loving, caring, playful", images: "Pets, grooming, veterinary, happy animals" },
  "jewel": { colors: "Rich gold #B8860B + Dark #1A1A1A + White", style: "Luxurious, elegant, premium", fonts: "Elegant serif heading + Clean body", sections: "Hero, Collections, Custom Orders, Craftsmanship, Reviews, Visit Us", tone: "Luxurious, exclusive, craftsmanship", images: "Jewelry, gold, diamonds, craftsmanship" },
};

const defaultProfile = { colors: "LeadPe green #00C853 + Dark #1A1A1A + White", style: "Modern, clean, professional", fonts: "Syne bold heading + DM Sans body", sections: "Hero, Services, About Us, Gallery, Testimonials, Contact", tone: "Professional, friendly, trustworthy", images: "Relevant business stock photos" };

function getDesignProfile(businessType: string) {
  const t = (businessType || "").toLowerCase();
  for (const [key, profile] of Object.entries(designProfiles)) {
    if (t.includes(key)) return profile;
  }
  return defaultProfile;
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
      {"@type": "Question", "name": "How to contact [name]?", "acceptedAnswer": {"@type": "Answer", "text": "..."}}
    ]
  },
  "og_tags": {"og:title": "", "og:description": "", "og:type": "local.business", "og:locale": "en_IN"},
  "google_description": "250 chars for Google Business profile",
  "whatsapp_bio": "139 chars max for WhatsApp Business bio"
}

Fill ALL fields with real, specific data for this exact business. Keywords should be highly local.`;
    } else if (type === "prompt") {
      const profile = getDesignProfile(data.type || "");

      systemPrompt = `You are a website build prompt generator for the LeadPe platform. Generate comprehensive, copy-paste ready prompts for vibe coders to build websites using Lovable.dev or Bolt.new. Return ONLY the prompt text, no JSON wrapping.

CRITICAL RULES:
- Generate a VERY LONG, DETAILED prompt (2500+ words minimum)
- The prompt MUST include the EXACT LeadPe Lead Capture Widget HTML/JS code provided below — copy it character-by-character AS-IS
- The widget code must NOT be modified, summarized, or paraphrased in ANY way
- The widget is the MOST IMPORTANT part of the website — it captures customer leads
- Without this widget, the entire website is USELESS to the business owner
- Include ALL sections: project setup, design system, every page section, SEO, widget, footer, performance, deployment
- Be specific to the business type — a doctor website should look COMPLETELY DIFFERENT from a restaurant website
- Include specific content suggestions for each section`;
      
      const seoData = data.seo || {};
      const supabaseUrl = data.supabaseUrl || "https://vlmdctanuarrmngkrvng.supabase.co";
      const supabaseKey = data.supabaseKey || "";
      const businessId = data.businessId || "";
      const widgetHtml = getLeadWidgetHtml(businessId, supabaseUrl, supabaseKey);

      userPrompt = `Generate a complete, LONG, DETAILED Lovable.dev build prompt for this business. The prompt must be 2500+ words.

═══════════════════════════════════════════════════════
BUSINESS DETAILS
═══════════════════════════════════════════════════════
Name: ${data.name}
Type: ${data.type}
City: ${data.city}, India
Owner: ${data.ownerName}
WhatsApp: +91${data.whatsapp}
Color preference: ${data.colorPreference || "green"}
Style: ${data.stylePreference || "modern"}
Special requirements: ${data.specialRequirements || "None"}

═══════════════════════════════════════════════════════
IMAGES & ASSETS
═══════════════════════════════════════════════════════
${data.logoUrl ? `LOGO: ${data.logoUrl}\n⚠️ IMPORTANT: Use this ACTUAL logo image in the navbar. Do NOT create a text logo. Display it prominently at 40-48px height.` : "No logo provided — create a professional text-based logo using the business name with appropriate typography."}

${data.photosUrls ? `BUSINESS PHOTOS (USE THESE, NOT STOCK PHOTOS):\n${data.photosUrls}\n\n⚠️ IMPORTANT: These are REAL photos of this business. Use them in:\n- Hero section background/image\n- Gallery/portfolio section\n- About section\n- Service cards where relevant\nDo NOT replace these with generic stock photos.` : `No business photos provided.\nUse high-quality, relevant stock photos matching this theme: ${profile.images}\nUse Unsplash URLs. Choose photos that look like real Indian businesses, not Western stock photos.`}

═══════════════════════════════════════════════════════
DESIGN SYSTEM (UNIQUE TO ${(data.type || "").toUpperCase()})
═══════════════════════════════════════════════════════
Primary Colors: ${profile.colors}
${data.colorPreference && data.colorPreference !== "#00C853" && data.colorPreference !== "green" && data.colorPreference !== "rainbow" ? `Client preferred color: ${data.colorPreference} — use this as primary accent color instead of the default` : ""}
Design Style: ${profile.style}
Typography: ${profile.fonts}
Content Tone: ${profile.tone}
Mobile-first design (70% of Indian users browse on mobile phones)
Border radius: 16px on cards, 12px on buttons, 24px on hero sections
Smooth scroll behavior
Subtle fade-in animations on scroll using Framer Motion
Box shadows: 0 4px 20px rgba(0,0,0,0.08) for cards
Gradient backgrounds where appropriate

═══════════════════════════════════════════════════════
SECTIONS TO BUILD (ALL REQUIRED)
═══════════════════════════════════════════════════════
${profile.sections}

Generate detailed content and layout for EACH section listed above.
Each section should have:
- A clear heading
- Relevant content specific to ${data.type} in ${data.city}
- Appropriate icons or images
- Call-to-action buttons where relevant

Additional mandatory sections:
- Sticky/fixed WhatsApp floating button (bottom-right corner)
  • Green circle with WhatsApp icon
  • Pulse animation to draw attention
  • Links to: https://wa.me/91${data.whatsapp}
  • z-index: 9999, always visible
- Google Maps embed showing "${data.name} ${data.city}"
- FAQ section with 4-5 common questions about ${data.type} in ${data.city}

═══════════════════════════════════════════════════════
SEO (CRITICAL FOR GOOGLE RANKING IN ${(data.city || "").toUpperCase()})
═══════════════════════════════════════════════════════
In index.html <head>:
<title>${seoData.page_title || `${data.name} - Best ${data.type} in ${data.city}`}</title>
<meta name="description" content="${seoData.meta_description || `${data.name} is the best ${data.type} in ${data.city}. Contact us on WhatsApp for instant service.`}">
<meta name="keywords" content="${(seoData.keywords || [`${data.type} ${data.city}`, `best ${data.type} in ${data.city}`, `${data.name}`]).join(", ")}">
<meta property="og:title" content="${seoData.page_title || data.name}">
<meta property="og:description" content="${seoData.meta_description || ""}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_IN">
<link rel="canonical" href="https://SUBDOMAIN.leadpe.online">

LocalBusiness Schema JSON-LD in <head>:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${data.name}",
  "description": "${seoData.meta_description || `Best ${data.type} in ${data.city}`}",
  "telephone": "+91${data.whatsapp}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "${data.city}",
    "addressCountry": "IN"
  }
}
</script>

═══════════════════════════════════════════════════════
CONTENT LANGUAGE
═══════════════════════════════════════════════════════
Write all content in HINDI + ENGLISH mix (Hinglish).
Target audience: Local people in ${data.city} searching for ${data.type}
Use local language phrases where natural.
Hero headline MUST mention ${data.city}.
About section should feel personal and local.
Testimonials should use Indian names from ${data.city}.

═══════════════════════════════════════════════════════
DEMO MODE (IMPORTANT)
═══════════════════════════════════════════════════════
Check for VITE_LEADPE_MODE environment variable:
- If VITE_LEADPE_MODE === "demo":
  • Show orange top bar: "⚠️ This is a preview. Contact buttons are disabled."
  • Disable all WhatsApp/call buttons (show toast "This is a preview")
  • Lead form still works (for testing)
- If VITE_LEADPE_MODE === "live" or not set:
  • Normal mode, all buttons functional

═══════════════════════════════════════════════════════
⚠️ LEADPE LEAD CAPTURE WIDGET — MOST CRITICAL SECTION ⚠️
═══════════════════════════════════════════════════════

You MUST embed this EXACT HTML/JavaScript widget code in the website's contact section or as a standalone section before the footer.

This widget captures customer inquiries and sends them directly to the LeadPe CRM database. WITHOUT this widget, the entire website is COMPLETELY USELESS to the business owner. This is the core revenue-generating component.

DO NOT modify this code. DO NOT summarize it. DO NOT create your own version. Copy-paste this EXACTLY AS-IS:

${widgetHtml}

IMPORTANT NOTES ABOUT THE WIDGET:
- The business_id "${businessId}" is pre-configured — DO NOT change it
- The Supabase API URL and key are pre-configured — DO NOT change them
- The widget submits leads to the "leads" table in the database
- On success, it shows a "Request Received!" confirmation
- On error, it shows an alert and re-enables the button
- The "Powered by LeadPe 🌱" footer MUST remain visible
- Phone validation: must be exactly 10 digits

If building with React:
- You can either embed this HTML directly in index.html
- OR create a React component that replicates this exact functionality
- The React component MUST make the same POST request to the same Supabase URL with the same headers and body structure
- The business_id, API URL, and API key must be IDENTICAL

═══════════════════════════════════════════════════════
VIRAL FOOTER (REQUIRED ON EVERY PAGE)
═══════════════════════════════════════════════════════
At the very bottom of every page footer, add this line:
Small gray text, centered:
"Built with LeadPe 🌱 — Get your free website at leadpe.online"
- Font size: 12px
- Color: #999999
- "leadpe.online" must be a clickable link to https://leadpe.online (opens in new tab)
- This MUST appear on EVERY page of the website
- Do NOT remove or hide this credit line

═══════════════════════════════════════════════════════
FOOTER SECTION
═══════════════════════════════════════════════════════
- Business name and one-line tagline
- Quick links: Home, Services, About, Contact
- WhatsApp contact: +91${data.whatsapp}
- Business hours (realistic for ${data.type})
- Address: ${data.city}, India
- © ${new Date().getFullYear()} ${data.name}. All rights reserved.
- "Powered by LeadPe 🌱" link

═══════════════════════════════════════════════════════
TECHNICAL REQUIREMENTS
═══════════════════════════════════════════════════════
- React + Vite + Tailwind CSS + TypeScript
- Mobile first — primary design target: 375px width
- All buttons: minimum 48px height, 16px+ font size
- Padding: 16px minimum on mobile sides
- No horizontal scroll on any screen size
- Images: lazy loading with loading="lazy"
- Fonts: Google Fonts only (import via CDN)
- No jQuery, no heavy frameworks
- All links working and tested
- Performance target: 90+ mobile PageSpeed score
- Smooth scrolling between sections
- Framer Motion for subtle animations

═══════════════════════════════════════════════════════
GITHUB & DEPLOYMENT
═══════════════════════════════════════════════════════
After building:
1. Connect GitHub in Lovable (click GitHub icon top right)
2. Create PUBLIC repository (MUST be public, not private)
3. Branch must be "main"
4. Ensure package.json has "build": "vite build"
5. Verify: npm run build produces no errors
6. Copy the GitHub URL (e.g., github.com/yourname/repo-name)
7. Go to LeadPe Studio → Submit tab → paste URL

═══════════════════════════════════════════════════════
FINAL CHECKLIST (VERIFY ALL BEFORE SUBMITTING)
═══════════════════════════════════════════════════════
□ All sections present and filled with content
□ WhatsApp floating button working (links to wa.me/91${data.whatsapp})
□ LeadPe Lead Capture Widget embedded EXACTLY as provided
□ Widget has correct business_id: ${businessId}
□ Business photos used (if provided) — not replaced with stock
□ Logo displayed in navbar (if provided)
□ Mobile design looks perfect on 375px width
□ No horizontal scrolling on any page
□ Footer has "Built with LeadPe 🌱" credit line with link
□ SEO title is custom (NOT "Vite + React")
□ Meta description is 80+ characters
□ Google Maps or address section mentions ${data.city}
□ GitHub repo is PUBLIC
□ Branch is "main"
□ npm run build → zero errors

Generate the complete prompt now. Make it highly specific to ${data.type} business in ${data.city}. Use real Indian context, local language, and culturally appropriate content.`;
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
