import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://leadpe.lovable.app",
  "https://id-preview--22f543a5-dc93-422b-8514-e3fff158bc80.lovable.app",
  "https://leadpe.online",
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
const designProfiles: Record<string, {
  colors: string; style: string; fonts: string; sections: string;
  tone: string; images: string; trustSignals: string; ctaStyle: string;
  contentSuggestions: string; conversionTips: string;
}> = {
  "doctor": {
    colors: "Trust blue #1565C0 primary + Clean white #FFFFFF bg + Soft green #4CAF50 accent + Light gray #F5F7FA section bg",
    style: "Clean, medical, trustworthy with soft rounded corners and calming visuals",
    fonts: "Playfair Display 700 for headings + Inter 400/500 for body text + Inter 600 for buttons",
    sections: "Hero with doctor photo & appointment CTA, Services/Treatments grid (6-8 items with icons), Doctor Bio & Qualifications with photo, Clinic Gallery (4-6 photos), Patient Testimonials (3-4 with names), Clinic Timings table, Google Maps location, FAQ section (5 questions), LeadPe Contact Widget, Footer",
    tone: "Professional, caring, reassuring, empathetic. Speak to patients' concerns. Use phrases like 'Your health is our priority', 'Expert care you can trust'",
    images: "Doctor with stethoscope, clean clinic interior, medical equipment, happy patient families, healthcare icons",
    trustSignals: "Years of experience badge, number of patients treated, certifications/degrees displayed, hospital affiliations, Google rating",
    ctaStyle: "Book Appointment (primary blue), Call Now (green), WhatsApp Consult (green circle)",
    contentSuggestions: "List specific treatments with brief descriptions. Add doctor's educational background. Mention insurance acceptance. Include emergency contact hours.",
    conversionTips: "Place appointment CTA in hero AND after services. Show 'Open Now' badge during business hours. Add 'Emergency? Call Now' floating bar.",
  },
  "clinic": {
    colors: "Trust blue #1565C0 + Clean white + Soft teal #009688 accent + Light blue #E3F2FD section bg",
    style: "Clean, medical, multi-doctor facility feel",
    fonts: "Playfair Display for headings + Inter for body",
    sections: "Hero, Department/Treatments grid, Doctor Profiles carousel, Insurance Accepted, Timings, Gallery, Testimonials, FAQ, LeadPe Widget, Footer",
    tone: "Professional, caring, reassuring, multi-specialty focus",
    images: "Medical facility, multiple doctors, patients, clean rooms",
    trustSignals: "NABH accreditation, years established, specialist count, patient count",
    ctaStyle: "Book Appointment, Emergency Helpline, WhatsApp",
    contentSuggestions: "List departments. Each doctor card with specialization. Emergency services highlighted.",
    conversionTips: "Department-wise CTAs. Show 'Available Today' for doctors. Emergency number prominent.",
  },
  "ca": {
    colors: "Deep navy #1A237E primary + Gold #C9A84C accent + White #FFFFFF bg + Light cream #FFFEF5 section bg",
    style: "Formal, prestigious, authoritative with sharp professional edges",
    fonts: "Libre Baskerville 700 for headings + IBM Plex Sans 400/500 for body + IBM Plex Sans 600 for buttons",
    sections: "Hero with professional tagline, Services grid (ITR/GST/Audit/Company Registration/Tax Planning), Experience & Credentials, Why Choose Us (4 pillars), Process Steps, Client Testimonials (3-4), Consultation Booking section, FAQ (5 tax-related questions), LeadPe Widget, Footer",
    tone: "Professional, expert, trustworthy, authoritative. Use language like 'Trusted by 500+ businesses', 'Expert financial guidance'",
    images: "Professional office setup, accounting documents, business meetings, financial charts, calculator with documents",
    trustSignals: "ICAI membership number, years of practice, clients served count, tax saved amount, industry specializations",
    ctaStyle: "Book Free Consultation (navy), Call Now (gold border), WhatsApp Query (green)",
    contentSuggestions: "List specific services with brief descriptions. Mention key compliance deadlines. Add calculator tools if premium. Show industry expertise areas.",
    conversionTips: "Highlight 'ITR deadline approaching' urgency. Show 'Free First Consultation' prominently. Add testimonials from business owners.",
  },
  "lawyer": {
    colors: "Deep navy #1A237E + Rich burgundy #800020 accent + Gold #C9A84C + White",
    style: "Formal, prestigious, authoritative, courtroom gravitas",
    fonts: "Libre Baskerville for headings + IBM Plex Sans for body",
    sections: "Hero with authority tagline, Practice Areas grid, Notable Cases/Experience, Advocate Profile, Why Choose Us, Free Consultation CTA, Client Testimonials, FAQ, LeadPe Widget, Footer",
    tone: "Professional, authoritative, protective. 'Justice is our commitment', 'Fearless legal representation'",
    images: "Law books, scales of justice, courtroom, professional advocate photo",
    trustSignals: "Bar Council enrollment, cases won count, years of practice, high court appearances",
    ctaStyle: "Book Free Legal Consultation (navy), Call for Emergency (red), WhatsApp (green)",
    contentSuggestions: "List practice areas in detail. Criminal, civil, property, family, corporate. Add landmark cases summary.",
    conversionTips: "Show 'Free Legal Consultation' prominently. Urgency: 'Don't delay your case'. Emergency number visible.",
  },
  "coaching": {
    colors: "Energetic orange #E65100 primary + Bright yellow #FDD835 accent + White bg + Light orange #FFF3E0 section bg",
    style: "Dynamic, motivating, energetic with bold typography and result-focused layout",
    fonts: "Bebas Neue 700 for headings + Barlow 400/500 for body + Barlow 700 for stats",
    sections: "Hero with results banner & enrollment CTA, Courses Offered grid, Top Results/Ranks showcase, Faculty Profiles with qualifications, Batch Schedule table, Fee Structure, Success Stories with student photos, Parent Testimonials, Demo Class CTA, FAQ (5 education questions), LeadPe Widget, Footer",
    tone: "Motivating, result-focused, confidence-building, ambitious. 'Your success starts here', '100% result-oriented coaching'",
    images: "Students celebrating results, classroom energy, toppers with certificates, books and study materials, institute building",
    trustSignals: "Selection/rank count, years of results, batch size, faculty experience, toppers list with ranks",
    ctaStyle: "Enroll Now (orange), Book Demo Class (yellow border), Call for Details (green)",
    contentSuggestions: "Show exact results: '23 students selected in NEET 2024'. List each course with eligibility, duration, fee. Faculty cards with subjects and experience.",
    conversionTips: "Results banner in hero with exact numbers. 'Limited seats' urgency. Free demo class offer. Parent testimonials add trust.",
  },
  "restaurant": {
    colors: "Warm red #C62828 primary + Golden #FF8F00 accent + Cream #FFF8E1 bg + Dark brown #3E2723 text",
    style: "Appetizing, warm, inviting with food-centric imagery and warm color palette",
    fonts: "Poppins 700 for headings + Nunito 400/500 for body + Poppins 600 for menu items",
    sections: "Full-width hero with signature dish photo, Menu Highlights with prices (8-12 items), Today's Specials section, Photo Gallery (6-8 food photos), Customer Reviews (4-5), Location & Timings with map, Order on WhatsApp CTA, FAQ, LeadPe Widget, Footer",
    tone: "Warm, appetizing, welcoming, homely, celebratory. 'Taste the tradition', 'Where every meal is a celebration'",
    images: "Food close-ups with steam/texture, restaurant interior ambiance, happy families dining, chef cooking, thali/platter spread",
    trustSignals: "Years serving, daily orders count, Google rating, FSSAI license, Zomato/Swiggy rating",
    ctaStyle: "Order Now (red), Reserve Table (golden), WhatsApp Order (green)",
    contentSuggestions: "Menu organized by category (Starters, Main Course, Desserts). Each item with price and brief description. Special combos highlighted. Delivery radius mentioned.",
    conversionTips: "Food photos are the #1 converter. Show 'Today's Special' prominently. WhatsApp ordering with pre-filled message. Lunch/dinner combo offers.",
  },
  "cafe": {
    colors: "Warm brown #5D4037 + Cream #FFF8E1 + Accent orange #FF6F00 + Olive #827717",
    style: "Cozy, trendy, Instagram-worthy, artisanal feel",
    fonts: "Playfair Display for headings + Nunito for body",
    sections: "Hero with signature coffee photo, Menu highlights, Specialties, Ambiance Gallery, Reviews, Location, Order on WhatsApp, LeadPe Widget, Footer",
    tone: "Warm, trendy, inviting, artisanal. 'Brewed with love', 'Your perfect coffee corner'",
    images: "Latte art, pastries, cozy seating, barista at work, aesthetic interiors",
    trustSignals: "Years serving, daily cups brewed, Instagram followers, Google rating",
    ctaStyle: "Visit Us (brown), Order Ahead (orange), WhatsApp (green)",
    contentSuggestions: "Specialty drinks, food pairings, WiFi/workspace friendly, live music schedule.",
    conversionTips: "Instagram-worthy photos convert. Show 'Open Now' status. Pre-order on WhatsApp for pickup.",
  },
  "salon": {
    colors: "Rose gold #C2185B primary + Blush pink #FCE4EC bg + White + Gold #D4AF37 accent",
    style: "Elegant, feminine, aspirational with before/after showcases",
    fonts: "Cormorant Garamond 600 for headings + Karla 400/500 for body",
    sections: "Hero with transformation photo, Services with Prices table, Before/After Gallery, Our Artists/Team profiles, Current Offers & Packages, Bridal Services section, Book Appointment CTA, Testimonials, FAQ, LeadPe Widget, Footer",
    tone: "Beautiful, confidence-boosting, luxurious, empowering. 'Glow with confidence', 'Your beauty transformation awaits'",
    images: "Hair transformations, bridal makeup, salon interior, nail art, skin treatments, happy clients",
    trustSignals: "Years in business, happy clients count, trained artists, brand products used",
    ctaStyle: "Book Now (rose gold), View Offers (pink border), WhatsApp Booking (green)",
    contentSuggestions: "Service-wise pricing: haircut, color, facial, bridal packages. Artist specializations. Product brands used (L'Oréal, Schwarzkopf etc).",
    conversionTips: "Before/after photos are highest converters. Bridal package highlighted. 'This week's offer' creates urgency. Instagram feed embed.",
  },
  "gym": {
    colors: "Bold red #D32F2F primary + Dark #1A1A1A bg sections + White text + Neon green #76FF03 accent",
    style: "Energetic, powerful, motivating with dark theme and bold contrast",
    fonts: "Archivo Black 700 for headings + Hind 400/500 for body + Archivo Black for stats",
    sections: "Hero with gym/fitness photo & Join CTA, Programs/Classes grid (6-8), Trainer Profiles with certifications, Class Schedule table, Membership Plans with prices (3 tiers), Body Transformation gallery, Success Stories, FAQ, LeadPe Widget, Footer",
    tone: "Motivating, powerful, results-driven, intense, transformative. 'Transform your body', 'No excuses, only results'",
    images: "Gym equipment, intense workouts, body transformations (before/after), group classes, trainer in action",
    trustSignals: "Members count, transformation stories, certified trainers, equipment brands, years operating",
    ctaStyle: "Join Now (red), Free Trial Class (neon green), WhatsApp Inquiry (green)",
    contentSuggestions: "Program details: weight training, cardio, yoga, CrossFit, Zumba. Each plan with duration, price, inclusions. Trainer certifications.",
    conversionTips: "Transformation photos convert best. 'Free trial class' removes friction. Show 'Members joined this month' counter. Early bird offers.",
  },
  "contractor": {
    colors: "Strong gray #37474F primary + Safety yellow #F9A825 accent + White + Blue #1565C0 links",
    style: "Strong, reliable, industrial with project showcase focus",
    fonts: "Archivo Black for headings + Work Sans for body",
    sections: "Hero with completed project photo, Services List with icons, Completed Projects Gallery (6-8), Materials & Brands Used, Why Choose Us, Free Quote Form, Customer Reviews, FAQ, LeadPe Widget, Footer",
    tone: "Reliable, experienced, quality-focused, hardworking. 'Built to last', 'Quality construction you can trust'",
    images: "Construction sites, completed buildings, tools, materials, team at work",
    trustSignals: "Projects completed count, years of experience, team size, satisfied clients",
    ctaStyle: "Get Free Quote (yellow), Call Now (gray), WhatsApp (green)",
    contentSuggestions: "List services: house construction, renovation, plumbing, electrical, painting. Show project timeline. Material brands.",
    conversionTips: "Project photos with before/after convert well. Free quote removes friction. Show 'Currently available' status.",
  },
  "photographer": {
    colors: "Dark charcoal #1A1A1A primary + White #FFFFFF + Accent gold #C9A84C + Warm gray #9E9E9E",
    style: "Cinematic, artistic, portfolio-focused with full-width imagery",
    fonts: "Syne 700 for headings + DM Sans 400 for body",
    sections: "Full-width hero with best photo, Portfolio Gallery (weddings/events/portraits tabs), Services & Packages with prices, About the Photographer with photo, Equipment & Style section, Client Testimonials with event photos, Booking Form, FAQ, LeadPe Widget, Footer",
    tone: "Artistic, professional, storytelling, passionate. 'Capturing moments that last forever', 'Your story, beautifully told'",
    images: "Wedding photography, portrait shots, event coverage, candid moments, artistic compositions",
    trustSignals: "Events covered count, years of experience, camera equipment, published in, awards",
    ctaStyle: "Book Now (gold), View Full Portfolio (white border), WhatsApp Inquiry (green)",
    contentSuggestions: "Portfolio categorized: weddings, pre-wedding, corporate, product. Package tiers with deliverables. Equipment list builds credibility.",
    conversionTips: "Portfolio quality is everything. Show pricing transparency. 'Book 3 months in advance for wedding season' urgency.",
  },
  "real estate": {
    colors: "Deep teal #004D40 + Gold #B8860B accent + White + Light green #E8F5E9 section bg",
    style: "Luxurious, trustworthy, premium with property showcases",
    fonts: "DM Serif Display for headings + Fira Sans for body",
    sections: "Hero with premium property, Featured Properties grid, Services (Buy/Sell/Rent), Why Choose Us, Success Numbers, Client Testimonials, Property Inquiry Form, FAQ, LeadPe Widget, Footer",
    tone: "Prestigious, reliable, trustworthy, aspirational. 'Your dream home awaits', 'Trusted property experts'",
    images: "Luxury properties, happy families at home, building exteriors, interior design, keys handover",
    trustSignals: "Properties sold count, years in market, RERA registered, happy families",
    ctaStyle: "View Properties (teal), Schedule Visit (gold), WhatsApp Inquiry (green)",
    contentSuggestions: "List property types: flats, plots, villas, commercial. Show price ranges by area. RERA numbers for trust.",
    conversionTips: "Property photos with prices convert. 'New launch' badges. EMI calculator widget. Site visit booking.",
  },
  "digital": {
    colors: "Deep violet #7C3AED primary + Electric blue #1565C0 accent + White + Dark #0F0F0F hero bg",
    style: "Modern, tech-forward, results-driven with gradient effects",
    fonts: "Syne 700 for headings + Inter 400/500 for body",
    sections: "Hero with growth stats animation, Services grid (SEO/Social/Ads/Web), Results & Case Studies, Portfolio/Clients served, Process Steps, Client Testimonials, Free Audit CTA, FAQ, LeadPe Widget, Footer",
    tone: "Professional, results-focused, growth-oriented, data-driven. 'Grow your business online', '10x your digital presence'",
    images: "Digital dashboards, growth charts, social media, modern workspace, team collaboration",
    trustSignals: "Clients served, revenue generated for clients, campaigns managed, Google Partner badge",
    ctaStyle: "Get Free Audit (violet gradient), Schedule Call (blue), WhatsApp (green)",
    contentSuggestions: "Each service with deliverables and expected results. Case studies with before/after metrics. Monthly report samples.",
    conversionTips: "Free website/SEO audit is best lead magnet. Show ROI numbers. Client logo carousel builds trust.",
  },
  "ngo": {
    colors: "Hope green #2E7D32 primary + Warm orange #E65100 accent + White + Light green #E8F5E9",
    style: "Trustworthy, mission-driven, emotional with impact storytelling",
    fonts: "Nunito 700 for headings + Open Sans 400 for body",
    sections: "Hero with mission & impact photo, Impact Numbers (lives touched, projects), Our Programs, Team Members, Success Stories with photos, Donate/Support CTA, Volunteer Form, FAQ, LeadPe Widget, Footer",
    tone: "Inspiring, trustworthy, emotionally connecting, hopeful. 'Together we make a difference', 'Every contribution counts'",
    images: "Community work, volunteers helping, beneficiaries smiling, program activities, team photos",
    trustSignals: "Registration number (12A/80G), lives impacted, years of service, projects completed, awards",
    ctaStyle: "Donate Now (orange), Volunteer (green), WhatsApp Support (green)",
    contentSuggestions: "Each program with beneficiaries count and photos. Transparent financials. Annual reports downloadable. Volunteer stories.",
    conversionTips: "Impact numbers in hero convert donors. Photo stories of beneficiaries. Recurring donation option. Tax benefit (80G) highlighted.",
  },
};

const defaultProfile = {
  colors: "LeadPe green #00C853 primary + Dark #1A1A1A + White #FFFFFF bg + Light gray #F5F5F5 section bg",
  style: "Modern, clean, professional with green accents",
  fonts: "Syne 700 for headings + DM Sans 400/500 for body",
  sections: "Hero with CTA, Services grid, About Us, Gallery, Testimonials, Contact section, FAQ, LeadPe Widget, Footer",
  tone: "Professional, friendly, trustworthy. 'Your trusted local business'",
  images: "Relevant business stock photos from Unsplash",
  trustSignals: "Years of experience, happy customers count, service quality guarantee",
  ctaStyle: "Contact Us (green), Call Now (dark), WhatsApp (green circle)",
  contentSuggestions: "Describe services in detail. Add owner's personal touch. Mention local area expertise.",
  conversionTips: "Strong hero CTA. WhatsApp button always visible. Testimonials build trust. FAQ reduces friction.",
};

function getDesignProfile(businessType: string) {
  const t = (businessType || "").toLowerCase();
  for (const [key, profile] of Object.entries(designProfiles)) {
    if (t.includes(key)) return profile;
  }
  return defaultProfile;
}

// ═══ PACKAGE-SPECIFIC SCOPE (what to build / what NOT to build) ═══
const PACKAGE_SCOPE: Record<string, {
  label: string; pages: number; delivery: string;
  always_include: string[]; never_include: string[]; instruction: string;
}> = {
  basic: {
    label: "Basic Website — ₹800",
    pages: 5,
    delivery: "48 hours",
    always_include: [
      "Professional homepage with hero section",
      "Services / offerings page",
      "About page",
      "Gallery page",
      "Contact page with WhatsApp button",
      "Google Maps location embed",
      "Mobile responsive design",
      "Basic SEO meta tags",
      "LeadPe lead capture widget (mandatory)",
      "Footer with business details + viral LeadPe credit",
    ],
    never_include: [
      "Online booking / appointment calendar system",
      "Online payment / checkout integration",
      "Student / patient login portal",
      "Blog section",
      "Video gallery",
      "Live chat",
      "Multiple staff / team profiles",
      "Custom domain setup",
      "WhatsApp chatbot automation",
    ],
    instruction:
      "BUILD A BASIC 5-PAGE WEBSITE. Simple. Clean. Fast loading. Pages: Home, Services, About, Gallery, Contact. Must have: floating WhatsApp button + LeadPe lead capture widget. Do NOT add booking systems, payment, login portals, or blogs. Keep it focused — this is the ₹800 package and scope creep is not allowed.",
  },
  standard: {
    label: "Standard Website — ₹1,500",
    pages: 8,
    delivery: "72 hours",
    always_include: [
      "Everything in Basic",
      "Photo / image gallery section",
      "Testimonials / reviews section",
      "Team / staff introduction",
      "FAQ section (5-6 questions)",
      "AI-written content for all pages",
      "Full local SEO optimisation",
      "Social media links integration",
      "Business hours display",
    ],
    never_include: [
      "Online payment / checkout integration",
      "Student / patient login portal",
      "Live streaming",
      "Advanced booking calendar with slot management",
      "Multi-vendor / multi-tenant features",
    ],
    instruction:
      "BUILD A STANDARD 8-PAGE WEBSITE. Professional, complete, well-designed. Include all Basic pages PLUS gallery, testimonials, team, FAQ, business hours. Add the business-specific sections listed in the package features. Write polished AI-generated content for every page. Do NOT add payment systems or user-login portals — this is the ₹1,500 package.",
  },
  premium: {
    label: "Premium Website — ₹3,000",
    pages: 12,
    delivery: "5 days",
    always_include: [
      "Everything in Standard",
      "Online appointment / booking enquiry system (form-based, no live calendar slots)",
      "WhatsApp chatbot integration link",
      "Blog section with 3 starter posts",
      "Advanced animations and scroll effects",
      "Newsletter signup",
      "Multiple gallery sections",
      "Google Business Profile integration hint",
      "Advanced SEO with city-targeted pages",
    ],
    never_include: [
      "Real-money payment processing",
      "Patient / student authenticated login portal",
      "Multi-language switcher (English only unless requested)",
    ],
    instruction:
      "BUILD A PREMIUM 12-PAGE WEBSITE. Advanced, feature-rich, impressive. Include everything from Standard PLUS booking enquiry system, blog, chatbot link, animations. Add ALL business-specific premium features listed in the package features. Write comprehensive AI content. Optimise heavily for local SEO with city-targeted pages. This is the ₹3,000 premium package — make it look as professional as possible.",
  },
};

function getPackageScope(packageId?: string) {
  const id = (packageId || "basic").toLowerCase();
  if (id === "complex") return PACKAGE_SCOPE.premium;
  return PACKAGE_SCOPE[id] || PACKAGE_SCOPE.basic;
}

// ═══ BUSINESS-SPECIFIC PREMIUM FEATURES (drives long, tailored prompts) ═══
const BUSINESS_SPECIFIC_FEATURES: Record<string, { standard: string[]; premium: string[] }> = {
  doctor: {
    standard: [
      "Appointment enquiry form (name, phone, preferred date, reason)",
      "Services with consultation fees displayed transparently",
      "Doctor qualifications & registration number block",
      "Clinic timings table (Mon-Sun) with lunch break",
    ],
    premium: [
      "Online appointment booking enquiry with date + time-slot picker (form-based)",
      "Multiple doctor profiles with photos, specializations, experience",
      "Patient testimonials carousel with star ratings",
      "Health tips blog (3 starter SEO articles for the city)",
      "Insurance / cashless payment information page",
      "Emergency contact sticky banner (top of page, red)",
      "Pre-consultation patient form (symptoms, history)",
    ],
  },
  clinic: {
    standard: [
      "Department-wise services with fees",
      "Multi-doctor profile cards",
      "Insurance accepted list",
      "Clinic photo gallery (interior, equipment)",
    ],
    premium: [
      "Department-wise appointment booking enquiry",
      "Doctor availability calendar (this week)",
      "Health checkup package pricing (Basic / Standard / Premium body packages)",
      "NABH / quality certifications showcase",
      "Health blog with 3 starter posts",
      "Emergency helpline sticky banner",
    ],
  },
  coaching: {
    standard: [
      "Course / batch details page with eligibility, duration, fee",
      "Top student results showcase (photos + ranks)",
      "Faculty profiles with subjects + experience",
      "Fee structure table by course",
      "Online enquiry form (name, phone, course interest, class)",
    ],
    premium: [
      "Online admission enquiry form with file upload (mark sheet)",
      "Batch schedule grid (subject × time × faculty)",
      "Result / rank announcement page with year-wise toppers",
      "Study material downloads section (PDF previews)",
      "Parent testimonials with audio/text quotes",
      "Free demo class booking enquiry",
      "Scholarship test announcement banner",
      "Blog with 3 SEO articles (e.g. 'Best NEET coaching in {city}')",
    ],
  },
  ca: {
    standard: [
      "Practice areas (ITR, GST, Audit, Company Reg, Tax Planning) detail page",
      "Client testimonials section (business owner quotes)",
      "Document checklist downloadable as PDF",
      "Fee structure for common services",
    ],
    premium: [
      "Free consultation booking enquiry with date picker",
      "Industry-wise case studies (manufacturing, retail, services)",
      "Tax tips blog (3 SEO posts targeted at {city} businesses)",
      "Monthly compliance calendar widget",
      "Newsletter signup for tax updates",
      "Multiple service detail pages (one per practice area)",
      "GST calculator embedded section",
    ],
  },
  lawyer: {
    standard: [
      "Practice areas in detail (criminal, civil, family, property, corporate)",
      "Case win statistics / years of practice",
      "Free legal consultation enquiry form",
      "Client testimonials anonymised",
    ],
    premium: [
      "Consultation booking enquiry with date picker",
      "Notable cases / landmark judgements section",
      "Legal blog with 3 SEO posts (e.g. 'Property law in {city}')",
      "Document checklist by case type (downloadable)",
      "Multiple advocate profiles with bar council number",
      "Emergency legal helpline sticky banner",
    ],
  },
  restaurant: {
    standard: [
      "Full menu organised by category with prices",
      "Food photo gallery (8-12 dishes)",
      "Today's special / chef recommends section",
      "Catering / bulk order enquiry form",
    ],
    premium: [
      "Online ordering information & WhatsApp menu",
      "Table reservation enquiry form (date, time, party size)",
      "Chef's special weekly carousel",
      "Events booking page (birthdays, parties, anniversaries)",
      "Festival special menu seasonal section",
      "Food blog with 3 SEO posts ('Best biryani in {city}')",
      "Loyalty / membership programme page",
    ],
  },
  salon: {
    standard: [
      "Service price list (haircut, color, facial, threading, etc.)",
      "Before / after transformation gallery",
      "Appointment enquiry form (service + preferred time)",
      "Stylist / artist profiles",
    ],
    premium: [
      "Online appointment booking enquiry with stylist + service + slot",
      "Membership packages display (Bronze / Silver / Gold)",
      "Gift voucher information & enquiry",
      "Bridal package detail page (trial, day-of, party)",
      "Loyalty programme page",
      "Beauty blog with 3 SEO posts ('Best salon for bridal in {city}')",
      "Instagram feed embed section",
    ],
  },
  gym: {
    standard: [
      "Programs / classes grid (weights, cardio, yoga, zumba, crossfit)",
      "Trainer profiles with certifications",
      "Membership plans pricing (3 tiers)",
      "Free trial class enquiry form",
    ],
    premium: [
      "Online membership enquiry with goal selection",
      "Body transformation gallery (before / after with consent)",
      "Class schedule weekly grid",
      "Personal training package detail page",
      "Diet & nutrition consultation enquiry",
      "Blog with 3 fitness SEO posts ('Best gym in {city}')",
    ],
  },
  contractor: {
    standard: [
      "Completed project portfolio (6-8 builds)",
      "Services list with brief descriptions",
      "Free quote enquiry form",
      "Materials & brand partners section",
    ],
    premium: [
      "Project portfolio with detailed case studies",
      "Free quote calculator (sq ft × rate)",
      "Video walkthrough of key projects",
      "Materials showcase with brand certifications",
      "Warranty / guarantee policy page",
      "Construction blog with 3 SEO posts",
    ],
  },
  photographer: {
    standard: [
      "Portfolio tabs (weddings / portraits / events / corporate)",
      "Package pricing with deliverables",
      "Booking enquiry form (event date, type, location)",
      "About the photographer with style & equipment",
    ],
    premium: [
      "Detailed package comparison table (Basic / Standard / Premium shoots)",
      "Pre-wedding shoot location ideas page",
      "Client testimonials with event photos",
      "Booking calendar enquiry (event date picker)",
      "Photography blog with 3 SEO posts",
      "Equipment & technique section",
    ],
  },
};

function getBusinessSpecific(businessType: string, packageId: string): string[] {
  const t = (businessType || "").toLowerCase();
  for (const [key, set] of Object.entries(BUSINESS_SPECIFIC_FEATURES)) {
    if (t.includes(key)) {
      if (packageId === "premium" || packageId === "complex") return set.premium;
      if (packageId === "standard") return set.standard;
      return [];
    }
  }
  return [];
}

// ═══ EXTRA DEEP INSTRUCTION BLOCKS for Standard / Premium (forces longer prompts) ═══
function getDeepPackageBlock(packageId: string, data: Record<string, string>, profile: { ctaStyle: string; conversionTips: string }): string {
  const id = (packageId || "basic").toLowerCase();
  const city = data.city || "the city";
  const type = data.business_type || "business";

  if (id === "standard") {
    return `
╔══════════════════════════════════════════════════════════════════╗
║       STANDARD-TIER DEEP BUILD INSTRUCTIONS (₹1,500)            ║
╚══════════════════════════════════════════════════════════════════╝

This is the ₹1,500 Standard package — a polished, 8-page conversion-grade website.
Every section below MUST be built with the exact depth described.

1. HOMEPAGE (must take ~5 scroll screens):
   - Hero: full-bleed image (use uploaded photo if available), bold H1 with "${city}" mention, sub-headline, primary CTA + secondary CTA, trust strip (years / customers / rating)
   - "Why Choose Us" 4-pillar grid with icons + 2-line descriptions
   - Services preview (top 4 services as cards linking to Services page)
   - Featured testimonial block (1 large quote with photo + name + locality)
   - Photo gallery preview (4 photos, link to gallery page)
   - "Visit Us" mini-section with map preview + WhatsApp CTA
   - LeadPe Lead Capture Widget BEFORE footer

2. SERVICES PAGE:
   - 6-8 services, each with: icon, title, 3-line description, indicative price (or "On enquiry"), individual WhatsApp CTA pre-filled with service name
   - Section: "Our Process" — 4 numbered steps with icons
   - Service-area FAQ (3 questions specific to ${type} pricing/duration)

3. ABOUT PAGE:
   - Owner photo + bio (mention "${data.owner_name || "the owner"}", years of experience, what makes them different)
   - "Our Story" timeline (founded → milestones → today)
   - Team section: 3-4 staff cards with photo + role + 1-line bio (use uploaded photos if available)
   - Values / mission block

4. GALLERY PAGE:
   - Masonry / grid layout
   - All uploaded business photos used here at full resolution
   - Lightbox on click
   - Categorised tabs if photos suggest multiple themes

5. TESTIMONIALS PAGE / SECTION:
   - 6 detailed testimonials with name, locality in ${city}, star rating, optional photo
   - Use realistic Indian names from ${city}
   - Mix short and long quotes for visual rhythm

6. FAQ PAGE / SECTION:
   - 8 questions matching real Google searches for "${type} in ${city}"
   - Accordion UI, FAQ schema markup in <head>

7. CONTACT PAGE:
   - Hero: "Get in touch with ${data.business_name}"
   - Two-column: contact info + map | LeadPe widget
   - Business hours table (Mon-Sun)
   - WhatsApp + Call buttons prominent
   - Social media links row

8. FOOTER (every page):
   - 4-column on desktop: Brand+tagline | Quick links | Services | Contact
   - Newsletter row above copyright
   - Viral "Built with LeadPe 🌱" credit (mandatory)

CONVERSION LAYER (apply across pages):
- Sticky header with logo + nav + WhatsApp pill on right
- Floating WhatsApp button bottom-right
- Exit-intent or scroll-50% subtle banner offering free consultation (CSS only, no JS heavy libs)
- ${profile.ctaStyle}
- ${profile.conversionTips}

CONTENT DEPTH:
- Every page minimum 400 words of polished, ${city}-localised English copy
- Hero H1 must mention "${city}"
- Each service description must mention either "${city}" or a neighbourhood within it
- AI-generated tone: trustworthy, local, expert
`;
  }

  if (id === "premium" || id === "complex") {
    return `
╔══════════════════════════════════════════════════════════════════╗
║       PREMIUM-TIER DEEP BUILD INSTRUCTIONS (₹3,000)             ║
╚══════════════════════════════════════════════════════════════════╝

This is the ₹3,000 Premium package — a flagship 12-page website that should
feel like a ₹30,000 agency build. Every section below is MANDATORY and must
be built with the exact depth described. The vibe coder MUST NOT skip any.

PAGE STRUCTURE (12 pages — build them all):
1. Home  2. About  3. Services (overview)  4. Service detail × 2 (top 2 services as their own pages)
5. Gallery  6. Team  7. Testimonials  8. Pricing/Packages  9. Booking / Enquiry
10. Blog (index)  11. Blog post sample × 2 (or single template ready)  12. Contact

1. HOMEPAGE — premium hero treatment:
   - Cinematic hero with parallax / Ken Burns effect on uploaded photo
   - Animated stat counters (years / clients / rating / cities served)
   - "Featured in" / press / certifications strip
   - Services carousel with hover micro-interactions
   - 3-step "How it works" with animated illustrations
   - Featured project / case-study block
   - Dual testimonial layout (text + video placeholder)
   - Booking enquiry CTA section
   - LeadPe widget + map combo

2. ABOUT PAGE — story-driven:
   - Owner spotlight: large photo, full bio, signature, social links
   - Timeline of milestones (founded → expansions → recognition)
   - Mission / vision / values 3-column with icons
   - Press & awards grid

3. SERVICES OVERVIEW + 2 DETAIL PAGES:
   - Overview: all services with rich icons, descriptions, "Learn more" linking to detail pages
   - Detail pages (top 2 most important services for ${type}):
     * Hero with service-specific image
     * What's included (checklist)
     * Process (numbered steps)
     * Pricing options (3 tiers)
     * FAQ (4 questions specific to that service)
     * Booking enquiry CTA pre-filled with service name

4. GALLERY — premium showcase:
   - Filterable gallery (category tabs)
   - Lightbox with arrow navigation + captions
   - All uploaded photos used; supplement with high-quality stock if needed
   - Lazy-loaded with skeleton placeholders

5. TEAM PAGE:
   - Owner + senior staff cards with full bios, qualifications, social links
   - Group photo if uploaded
   - "Join us" mini-CTA at bottom

6. TESTIMONIALS PAGE:
   - 10+ testimonials, mix of text + star ratings + locality + (where realistic) photo
   - Filter by service type
   - Aggregate rating block (e.g. "4.9 / 5 from 200+ ${city} customers")

7. PRICING / PACKAGES PAGE:
   - 3-tier comparison table (Basic / Standard / Premium offerings of THIS business)
   - "Most popular" highlight on middle tier
   - FAQ specific to pricing
   - Custom quote enquiry CTA

8. BOOKING / ENQUIRY PAGE:
   - Multi-field form (name, phone, email optional, service select, preferred date, preferred time, notes)
   - Date picker, time-slot select (form-only, no live calendar slot management)
   - Submits via the LeadPe widget POST schema (same business_id + leads endpoint)
   - Confirmation screen with WhatsApp pre-filled deep link

9. BLOG (index + 2 starter posts):
   - Index: card grid with title, excerpt, date, category
   - Each post: H1 title, hero image, 600+ word AI-written ${city}-targeted SEO content,
     author block, related posts, share buttons, lead-magnet CTA mid-article
   - Topics auto-generated for ${type} in ${city} (e.g. "Top 5 ${type} services in ${city} 2025")

10. CONTACT PAGE:
    - Premium contact layout: split hero with image + form
    - Multiple contact methods (WhatsApp / call / email / map)
    - Sticky LeadPe widget on the side on desktop
    - Business hours with "Open now" live indicator (CSS / JS)

GLOBAL PREMIUM ENHANCEMENTS:
- Sticky transparent header that becomes solid on scroll
- Smooth Framer Motion fade-in + stagger on every section
- Animated scroll-progress bar at top
- "Back to top" floating button
- Newsletter signup in footer with success state
- Social proof bar above footer ("Trusted by 500+ ${city} customers")
- Cookie consent banner (lightweight)
- 404 page with brand styling
- Sitemap.xml + robots.txt

SEO PREMIUM LAYER:
- City-targeted landing copy on Home, Services, Blog
- LocalBusiness + Service + FAQPage + BreadcrumbList JSON-LD schemas
- OG image suggestions per page
- Internal linking between Services ↔ Blog ↔ Booking

CONVERSION PREMIUM LAYER:
- ${profile.ctaStyle}
- ${profile.conversionTips}
- Multiple CTAs per page (above fold + mid + before footer)
- Trust signals (badges, ratings, counts) repeated near each CTA
- Urgency micro-copy ("Limited slots this week", seasonal offers)

CONTENT DEPTH:
- Every page minimum 600 words of polished, ${city}-localised English copy
- Blog posts 600+ words each with H2/H3 structure
- All copy must feel locally written, not generic — mention ${city} landmarks/areas where natural
`;
  }

  return "";
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

function buildCTOPrompt(data: Record<string, string>): { system: string; user: string } {
  const profile = getDesignProfile(data.business_type || "Other");
  const scope = getPackageScope(data.package_id);
  const supabaseUrl = data.supabaseUrl || "https://vlmdctanuarrmngkrvng.supabase.co";
  const supabaseKey = data.supabaseKey || "";
  const businessId = data.businessId || "";
  const widgetHtml = getLeadWidgetHtml(businessId, supabaseUrl, supabaseKey);
  const seoData = data.seo ? (typeof data.seo === "string" ? JSON.parse(data.seo) : data.seo) : {};

  const system = `You are the CTO of LeadPe and an expert AI vibe-coder. You generate production-ready, conversion-optimized website build prompts for Indian local businesses.

CRITICAL RULES:
1. Generate a COMPREHENSIVE prompt of 3000+ words minimum — every section must have specific, detailed instructions
2. You must include the EXACT LeadPe Lead Capture Widget HTML/JS code provided — copy it CHARACTER BY CHARACTER, never modify, summarize, or paraphrase
3. Without this widget, the website is COMPLETELY USELESS — it is the core lead generation component
4. Never generate generic websites — every website must feel custom-built for the specific business
5. Always enhance client-provided content into professional, persuasive language
6. Include the viral footer: "Built with LeadPe 🌱 — Get your free website at leadpe.online"
7. Follow mobile-first design — 70% of Indian users are on mobile
8. Every section needs specific content suggestions, not just placeholders
9. Include conversion optimization tips throughout
10. Return ONLY the prompt text — no JSON, no markdown fences, no explanation`;

  // Build content enhancement section based on business info
  const contentEnhancement = data.one_line_description
    ? `\nThe client described their business as: "${data.one_line_description}"
Enhance this into professional marketing copy. Example: If they wrote "we do dental treatment" → "Advanced dental clinic providing world-class root canal therapy, orthodontic treatments, cosmetic dentistry, and preventive dental care with state-of-the-art equipment and experienced specialists."`
    : "";

  const logoInstruction = data.logo_url
    ? `\n🖼️ LOGO (PROVIDED BY CLIENT):
URL: ${data.logo_url}
⚠️ CRITICAL: Use this ACTUAL logo image in the navbar. Display at 40-48px height. Do NOT create a text logo. Place prominently in the navigation bar with proper alt text.`
    : `\n🖼️ LOGO:
No logo provided by client. Create a professional text-based logo using the business name "${data.business_name}" with appropriate typography matching the design profile.`;

  const photosInstruction = data.photos_urls
    ? `\n📸 BUSINESS PHOTOS (PROVIDED BY CLIENT — USE THESE, NOT STOCK):
${data.photos_urls}

⚠️ CRITICAL: These are REAL photos of this actual business. Use them in:
- Hero section as background or primary image
- Gallery/portfolio section
- About section
- Service cards where relevant
Do NOT replace these with generic stock photos. These photos make the website authentic and real.
If a photo looks like food → use in menu/hero. If it looks like interior → use in gallery/about. If it shows people → use in team/about section.`
    : `\n📸 PHOTOS:
No business photos provided. Use high-quality, relevant stock photos matching these themes: ${profile.images}
Use Unsplash URLs. Choose photos that look like real INDIAN businesses, not Western stock photos.
Example Unsplash search terms: "${data.business_type} India", "Indian ${data.business_type?.toLowerCase()}", "${data.city} business"`;

  const user = `Generate a COMPLETE, PRODUCTION-READY Lovable.dev website build prompt for this Indian local business.
The prompt must be 3000+ words with specific instructions for EVERY section.

╔══════════════════════════════════════════════════════════════════╗
║                    BUSINESS INFORMATION                         ║
╚══════════════════════════════════════════════════════════════════╝

Business Name: ${data.business_name}
Business Type: ${data.business_type}
City/Location: ${data.city}, India
Owner Name: ${data.owner_name || "Owner"}
WhatsApp Number: +91${data.whatsapp_number || data.whatsapp}
Package: ${scope.label}
Package Features to Build: ${data.package_features || "Standard website features"}
Special Requirements: ${data.special_requirements || "None specified"}
Reference Sites: ${data.reference_sites || "None"}
${contentEnhancement}

╔══════════════════════════════════════════════════════════════════╗
║              PACKAGE SCOPE — STRICT BOUNDARIES                  ║
╚══════════════════════════════════════════════════════════════════╝

Package: ${scope.label}
Total Pages: ${scope.pages}
Delivery Window: ${scope.delivery}

${scope.instruction}

✅ MUST INCLUDE in this package:
${scope.always_include.map((f) => `  - ${f}`).join("\n")}

🚫 DO NOT INCLUDE in this package (scope creep is a quality-fail):
${scope.never_include.map((f) => `  ✗ ${f}`).join("\n")}

If the client's special requirements ask for something in the "DO NOT INCLUDE" list, politely substitute with the closest allowed alternative (e.g. replace "online payment" with "WhatsApp enquiry to pay").

╔══════════════════════════════════════════════════════════════════╗
║              BUSINESS CONTEXT ANALYSIS                          ║
╚══════════════════════════════════════════════════════════════════╝

Understand this business type deeply:
- What do customers of a ${data.business_type} in ${data.city} search for?
- What are their concerns and pain points?
- What trust signals matter most for ${data.business_type}?
- What conversion actions should visitors take?
- What makes a ${data.business_type} website in India unique?

Trust signals to include: ${profile.trustSignals}
Conversion approach: ${profile.conversionTips}
CTA style: ${profile.ctaStyle}

╔══════════════════════════════════════════════════════════════════╗
║                    DESIGN SYSTEM                                ║
╚══════════════════════════════════════════════════════════════════╝

Color Palette: ${profile.colors}
${data.color_preference && data.color_preference !== "#00C853" && data.color_preference !== "green" && data.color_preference !== "rainbow" ? `⚠️ Client preferred color: ${data.color_preference} — use this as primary accent instead of the default profile color` : ""}
Visual Style: ${profile.style}
Typography: ${profile.fonts}
Content Tone: ${profile.tone}

Layout Specifications:
- Mobile-first (primary target: 375px width, test at 360px-428px range)
- Border radius: 16px on cards, 12px on buttons, 24px on hero sections
- Box shadows: 0 4px 20px rgba(0,0,0,0.08) for cards, 0 8px 32px rgba(0,0,0,0.12) for hover
- Smooth scroll behavior with scroll-behavior: smooth
- Section padding: 80px vertical desktop, 48px vertical mobile
- Content max-width: 1200px centered
- Side padding: 24px on mobile, 48px on tablet, auto-centered on desktop
- Button minimum: 48px height, 16px+ font size, full-width on mobile
- Gradient backgrounds where appropriate for hero and CTA sections
- Framer Motion animations: fade-in on scroll, scale on hover for cards

${logoInstruction}

${photosInstruction}

╔══════════════════════════════════════════════════════════════════╗
║              WEBSITE SECTIONS (BUILD ALL)                        ║
╚══════════════════════════════════════════════════════════════════╝

Required sections: ${profile.sections}

For EACH section provide:
1. Exact heading text (with ${data.city} mention where relevant)
2. Specific content/copy suggestions tailored to ${data.business_type}
3. Layout description (grid columns, flex direction, card structure)
4. Icons to use (from Lucide React icons)
5. CTA button text and action
6. Image suggestions specific to this business

Content suggestions for this business type: ${profile.contentSuggestions}

Additional MANDATORY elements on EVERY website:

A) FLOATING WHATSAPP BUTTON:
- Fixed position bottom-right corner (bottom: 24px, right: 24px)
- Green circle (#25D366) with WhatsApp icon, 56px diameter
- Pulse animation to draw attention (CSS keyframes, subtle glow)
- z-index: 9999, always visible on all sections
- Links to: https://wa.me/91${data.whatsapp_number || data.whatsapp}
- Tooltip on hover: "Chat with us on WhatsApp"

B) GOOGLE MAPS:
- Embed Google Maps iframe showing "${data.business_name} ${data.city}"
- Full-width in location section
- Height: 300px mobile, 400px desktop
- Rounded corners matching design system

C) FAQ SECTION:
- 5-6 common questions about ${data.business_type} in ${data.city}
- Accordion-style expandable answers
- Questions should match real Google searches (e.g., "What is the best ${data.business_type} in ${data.city}?")
- Answers should be 2-3 sentences, naturally including city name and business name

╔══════════════════════════════════════════════════════════════════╗
║                    SEO OPTIMIZATION                             ║
╚══════════════════════════════════════════════════════════════════╝

In index.html <head>:

<title>${seoData.page_title || `${data.business_name} - Best ${data.business_type} in ${data.city}`}</title>
<meta name="description" content="${seoData.meta_description || `${data.business_name} is the best ${data.business_type} in ${data.city}. Call +91${data.whatsapp_number || data.whatsapp} for instant service.`}">
<meta name="keywords" content="${data.business_type} in ${data.city}, best ${data.business_type} ${data.city}, ${data.business_name}, ${data.business_type} near me ${data.city}">
<meta property="og:title" content="${seoData.page_title || data.business_name}">
<meta property="og:description" content="${seoData.meta_description || ""}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_IN">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://SUBDOMAIN.leadpe.online">

Heading structure:
- H1: Main headline (only ONE per page), must include ${data.city}
- H2: Section titles (Services, About Us, etc.)
- H3: Individual service names, FAQ questions
- Never skip heading levels

LocalBusiness Schema JSON-LD:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${data.business_name}",
  "description": "${seoData.meta_description || `Best ${data.business_type} in ${data.city}`}",
  "telephone": "+91${data.whatsapp_number || data.whatsapp}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "${data.city}",
    "addressCountry": "IN"
  },
  "priceRange": "₹₹"
}
</script>

FAQPage Schema for the FAQ section.

╔══════════════════════════════════════════════════════════════════╗
║                  CONTENT LANGUAGE                               ║
╚══════════════════════════════════════════════════════════════════╝

Write all content in professional English with Hindi-friendly phrasing.
Target audience: Local people in ${data.city} searching for ${data.business_type}.
Hero headline MUST mention ${data.city}.
About section should feel personal — mention owner name "${data.owner_name || "the owner"}".
Testimonials should use realistic Indian names from ${data.city}.
Services described in detail — not just one-word labels.
Each service card: icon + title + 2-line description + CTA link.

╔══════════════════════════════════════════════════════════════════╗
║                    DEMO MODE                                    ║
╚══════════════════════════════════════════════════════════════════╝

Check for VITE_LEADPE_MODE environment variable:
- If VITE_LEADPE_MODE === "demo":
  • Show orange top bar: "⚠️ This is a preview — Contact buttons are disabled"
  • Disable WhatsApp/call buttons (show toast: "This is a preview")
  • Lead capture form still works (for testing)
  • Add subtle watermark or demo indicator
- If VITE_LEADPE_MODE === "live" or not set:
  • Normal mode, all buttons fully functional
  • No demo indicators

╔══════════════════════════════════════════════════════════════════╗
║     ⚠️⚠️⚠️ LEADPE LEAD CAPTURE WIDGET — MOST CRITICAL ⚠️⚠️⚠️      ║
╚══════════════════════════════════════════════════════════════════╝

This is the MOST IMPORTANT component of the entire website.
Without this widget, the website generates ZERO leads and is completely useless.
The widget captures customer inquiries and sends them to the LeadPe CRM database.

You MUST embed this EXACT HTML/JavaScript widget code in the website.
Place it in the Contact section, or as a standalone section before the footer.

DO NOT modify this code.
DO NOT summarize it.
DO NOT create your own version.
DO NOT change any URLs, IDs, or API keys.
Copy-paste this EXACTLY AS-IS:

${widgetHtml}

IMPORTANT NOTES ABOUT THE WIDGET:
- The business_id "${businessId}" is pre-configured — DO NOT change it
- The Supabase API URL and key are pre-configured — DO NOT change them
- The widget submits leads to the "leads" table in the database
- On success: shows green "Request Received!" confirmation
- On error: re-enables button and shows alert
- Phone validation: must be exactly 10 digits
- "Powered by LeadPe 🌱" text MUST remain visible

If building with React/Vite:
Option A: Embed this HTML directly in public/index.html before </body>
Option B: Create a React component that:
- Has the same input fields (name, phone, interest)
- Makes the same POST request to ${supabaseUrl}/rest/v1/leads
- Sends the same headers (apikey, Authorization, Content-Type, Prefer)
- Sends the same body structure (business_id, customer_name, phone, message, source, status)
- Shows the same success/error states
- The business_id, API URL, and API key must be IDENTICAL to the widget above

╔══════════════════════════════════════════════════════════════════╗
║              VIRAL FOOTER (REQUIRED ON EVERY PAGE)              ║
╚══════════════════════════════════════════════════════════════════╝

At the very bottom of every page footer, add this line:
Small gray text, centered:
"Built with LeadPe 🌱 — Get your free website at leadpe.online"
- Font size: 12px
- Color: #999999
- "leadpe.online" must be a clickable <a> link to https://leadpe.online (target="_blank")
- This MUST appear on EVERY page of the website
- Do NOT remove or hide this credit line

╔══════════════════════════════════════════════════════════════════╗
║                    FOOTER SECTION                               ║
╚══════════════════════════════════════════════════════════════════╝

Full footer with:
- Business name and one-line tagline
- Quick links: Home, Services, About, Contact (smooth scroll)
- WhatsApp contact: +91${data.whatsapp_number || data.whatsapp}
- Business hours (realistic for ${data.business_type} in India)
- Address: ${data.city}, India
- Social media placeholders (Instagram, Facebook)
- © ${new Date().getFullYear()} ${data.business_name}. All rights reserved.
- "Built with LeadPe 🌱" viral credit line (see above)

╔══════════════════════════════════════════════════════════════════╗
║              CONVERSION OPTIMIZATION                            ║
╚══════════════════════════════════════════════════════════════════╝

Apply these conversion principles:
1. Above-the-fold CTA: The hero section must have a clear, compelling call-to-action visible without scrolling
2. Multiple CTAs: Every 2-3 sections should have a relevant CTA (WhatsApp, call, form)
3. Social proof: Testimonials, stats, trust badges placed strategically near CTAs
4. Urgency: "Limited time offer", "Book today", "Only X slots left" where appropriate
5. Reduce friction: One-tap WhatsApp, simple form, click-to-call
6. Mobile optimization: Full-width buttons, thumb-friendly spacing, fast load
7. Trust signals near every conversion point
8. Clear value proposition in the first 3 seconds of viewing the website

╔══════════════════════════════════════════════════════════════════╗
║              TECHNICAL REQUIREMENTS                             ║
╚══════════════════════════════════════════════════════════════════╝

Tech Stack:
- React + Vite + Tailwind CSS + TypeScript
- Framer Motion for animations (subtle, performance-friendly)
- Lucide React for icons
- Google Fonts via CDN import

Performance:
- Target: 90+ mobile PageSpeed score
- All images: lazy loading with loading="lazy"
- Fonts: preconnect to Google Fonts, display=swap
- No jQuery, no Bootstrap, no heavy frameworks
- Minimal JavaScript — prioritize CSS for animations
- Bundle size under 500KB total
- First Contentful Paint under 1.5 seconds

Mobile-First:
- Primary design target: 375px width
- Test at: 360px, 375px, 390px, 414px, 428px
- All buttons: 48px minimum height, 16px+ font size
- Side padding: 16px minimum on mobile
- No horizontal scroll on any screen
- Touch targets: 44px minimum
- Sticky header with 56px height on mobile

Accessibility:
- Alt text on all images
- Proper heading hierarchy (H1 > H2 > H3)
- Color contrast ratio: 4.5:1 minimum
- Focus indicators on interactive elements

╔══════════════════════════════════════════════════════════════════╗
║              GITHUB & DEPLOYMENT                                ║
╚══════════════════════════════════════════════════════════════════╝

After building:
1. Connect GitHub in Lovable.dev (click GitHub icon top-right)
2. Create a PUBLIC repository (⚠️ MUST be public, NOT private)
3. Branch must be "main"
4. Ensure package.json has: "build": "vite build"
5. Verify: npm run build → produces ZERO errors
6. Copy the GitHub URL (e.g., github.com/yourname/repo-name)
7. Go to LeadPe Studio → Submit tab → paste URL → Submit

╔══════════════════════════════════════════════════════════════════╗
║              FINAL CHECKLIST (VERIFY ALL)                       ║
╚══════════════════════════════════════════════════════════════════╝

□ Hero section with business name, ${data.city} mention, and primary CTA
□ Services section with 4-8 specific ${data.business_type} services
□ About section mentioning owner name and years of experience
□ Testimonials section with 3-4 realistic reviews from ${data.city} customers
□ FAQ section with 5-6 questions matching Google searches
□ Google Maps embed showing ${data.city} location
□ Contact section with WhatsApp number prominently displayed
□ LeadPe Lead Capture Widget embedded EXACTLY as provided (⚠️ MOST CRITICAL)
□ Widget has correct business_id: ${businessId}
□ Floating WhatsApp button (bottom-right, green, pulse, z-index 9999)
□ WhatsApp links to: wa.me/91${data.whatsapp_number || data.whatsapp}
${data.logo_url ? "□ Client's logo displayed in navbar (NOT a text logo)" : "□ Text logo using business name in navbar"}
${data.photos_urls ? "□ Client's actual photos used (NOT replaced with stock)" : "□ High-quality Indian-relevant stock photos used"}
□ Mobile design perfect on 375px width — no horizontal scroll
□ SEO title is custom (NOT "Vite + React" or "React App")
□ Meta description is 80+ characters, includes ${data.city}
□ JSON-LD LocalBusiness schema in <head>
□ Footer has "Built with LeadPe 🌱" credit line with link to leadpe.online
□ Demo mode: VITE_LEADPE_MODE check implemented
□ Framer Motion subtle animations on scroll
□ All buttons 48px+ height on mobile
□ npm run build → ZERO errors
□ GitHub repo is PUBLIC with branch "main"

Generate the COMPLETE prompt now. Make it highly specific to "${data.business_type}" business in "${data.city}".
Use real Indian context, culturally appropriate content, and local references.
The prompt should be so detailed that a vibe coder can copy-paste it into Lovable.dev and get a near-perfect website on the first attempt.`;

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
      const prompts = buildCTOPrompt(data);
      systemPrompt = prompts.system;
      userPrompt = prompts.user;
    } else if (type === "seo") {
      systemPrompt = "You are an SEO expert for Indian local businesses. Return ONLY valid JSON with no markdown fencing.";
      userPrompt = `Generate SEO content for this business as a JSON object with these exact keys: pageTitle, metaDescription, keywords (array of 8 strings), googleDescription, whatsappBio, h1, aboutText.

Business: ${data.name}
Type: ${data.type}
City: ${data.city}
Owner: ${data.ownerName}

Make it locally optimized for "${data.city}" searches. Use natural Indian English.`;
    } else if (type === "welcome") {
      systemPrompt = "You are a friendly business onboarding assistant for LeadPe, an Indian MSME platform. Write warm WhatsApp welcome messages.";
      userPrompt = `Write a WhatsApp welcome message for a new business signup:
Name: ${data.name}, Type: ${data.type}, City: ${data.city}, Owner: ${data.ownerName}, Plan: ${data.plan}, Trial Code: ${data.trialCode}, Language preference: ${data.language}.
Keep it under 500 chars, use emojis, mention 48h website delivery and the trial code.`;
    } else if (type === "lead") {
      systemPrompt = "You are a lead notification assistant. Write short, urgent WhatsApp alerts for business owners about new customer inquiries.";
      userPrompt = `Write a WhatsApp lead alert for:
Customer: ${data.customerName}, Phone: ${data.customerPhone}, Interest: ${data.interest}, Business: ${data.businessName}.
Language: ${data.language || "english"}. Keep under 300 chars, use emojis, create urgency.`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown type. Use 'build_prompt', 'seo', 'welcome', or 'lead'." }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // build_prompt needs a much larger output budget + a stronger model.
    // Flash truncates ~5000-word structured outputs at its default cap.
    const isLong = type === "build_prompt";
    const model = isLong ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    const maxTokens = isLong ? 16000 : 2048;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "";
    const finishReason = result.choices?.[0]?.finish_reason;
    console.log(`ai-generate type=${type} model=${model} finish=${finishReason} chars=${text.length}`);

    if (isLong && finishReason === "length") {
      console.warn("Prompt was truncated by output cap; consider raising max_tokens further.");
    }

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    console.error("ai-generate error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
