import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

interface CheckResult {
  key: string;
  label: string;
  passed: boolean;
  fix: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const { githubUrl, businessData } = await req.json();
    if (!githubUrl || !businessData) {
      return new Response(JSON.stringify({ error: "Missing githubUrl or businessData" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Extract owner/repo from GitHub URL
    const parts = githubUrl.replace("https://", "").replace("github.com/", "").split("/");
    const owner = parts[0];
    const repo = parts[1]?.replace(".git", "");

    // Fetch multiple files to get a comprehensive view
    const filesToCheck = [
      "index.html",
      "src/App.tsx",
      "src/pages/Index.tsx",
      "src/components/WhatsAppButton.tsx",
      "src/components/Contact.tsx",
      "src/components/ContactForm.tsx",
      "src/components/About.tsx",
      "src/components/Services.tsx",
      "src/components/Hero.tsx",
    ];

    let allContent = "";
    let indexHtml = "";
    let fetchedAny = false;

    const fetchPromises = filesToCheck.map(async (filePath) => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
        const res = await fetch(rawUrl);
        if (res.ok) {
          const text = await res.text();
          fetchedAny = true;
          if (filePath === "index.html") indexHtml = text;
          return { path: filePath, content: text };
        }
      } catch { /* skip */ }
      return null;
    });

    const results = await Promise.all(fetchPromises);
    const files = results.filter(Boolean) as { path: string; content: string }[];
    allContent = files.map(f => f.content).join("\n");
    const allLower = allContent.toLowerCase();

    // Parse index.html if available for DOM checks
    let doc: any = null;
    if (indexHtml) {
      try {
        const parser = new DOMParser();
        doc = parser.parseFromString(indexHtml, "text/html");
      } catch { /* fallback to string matching */ }
    }

    const businessName = (businessData.name || "").toLowerCase();
    const city = (businessData.city || "").toLowerCase();

    // ── UNIVERSAL STRUCTURAL CHECKS ──

    const checkResults: CheckResult[] = [];

    // 1. WhatsApp Button Detection
    const whatsappPatterns = ["wa.me", "api.whatsapp.com", "whatsapp://", "chat.whatsapp", "whatsapp"];
    const hasWhatsApp = whatsappPatterns.some(p => allLower.includes(p)) ||
      (doc?.querySelectorAll?.('a[href*="wa.me"], a[href*="whatsapp"], a[href*="api.whatsapp.com"]')?.length > 0);
    checkResults.push({
      key: "whatsapp_button",
      label: "WhatsApp Button",
      passed: hasWhatsApp,
      fix: "Add a floating WhatsApp button with link: <a href=\"https://wa.me/91YOURNUMBER\">Chat on WhatsApp</a>",
    });

    // 2. Contact Form Detection
    const hasContactForm =
      allLower.includes("<form") ||
      allLower.includes("onsubmit") ||
      allLower.includes("handlesubmit") ||
      (allLower.includes("input") && (allLower.includes("textarea") || allLower.includes("submit") || allLower.includes("button"))) ||
      allLower.includes("contact") ||
      allLower.includes("enquiry") ||
      allLower.includes("inquiry");
    checkResults.push({
      key: "contact_form",
      label: "Contact Form",
      passed: hasContactForm,
      fix: "Add a contact form with Name, Phone, and Message fields with a submit button.",
    });

    // 3. About Section Detection
    const aboutIds = ["about", "about-us", "company", "who-we-are", "about_us"];
    const hasAbout =
      aboutIds.some(id => allLower.includes(`id="${id}"`) || allLower.includes(`id='${id}'`)) ||
      allLower.includes("about us") ||
      allLower.includes("about section") ||
      allLower.includes("aboutsection") ||
      allLower.includes("who we are") ||
      /about/i.test(allContent.match(/className="[^"]*"/g)?.join(" ") || "");
    checkResults.push({
      key: "about_section",
      label: "About Section",
      passed: hasAbout,
      fix: "Add an About section with a heading and 2-3 paragraphs describing the business.",
    });

    // 4. Services Section Detection
    const servicePatterns = ["service", "services", "what we offer", "our services", "feature", "features"];
    const hasServices =
      servicePatterns.some(p => allLower.includes(p)) ||
      (allLower.match(/service-card|service_card|servicecard|feature-card|feature_card/g)?.length || 0) >= 1;
    checkResults.push({
      key: "services_section",
      label: "Services Section",
      passed: hasServices,
      fix: "Add a Services section with at least 3 service cards showing what the business offers.",
    });

    // 5. Business Name Detection
    const hasBusinessName =
      !businessName ||
      allLower.includes(businessName) ||
      (doc?.querySelector?.("h1")?.textContent?.toLowerCase()?.includes(businessName));
    checkResults.push({
      key: "business_name",
      label: "Business Name",
      passed: hasBusinessName,
      fix: `Add the business name "${businessData.name}" prominently in the hero H1 heading.`,
    });

    // 6. SEO Title Check
    let titleLength = 0;
    if (doc) {
      const titleEl = doc.querySelector("title");
      titleLength = titleEl?.textContent?.length || 0;
    }
    const hasSeoTitle =
      (titleLength >= 10) ||
      allLower.includes("<title") ||
      allLower.includes("helmet") ||
      allLower.includes("document.title") ||
      allLower.includes("pagetitle") ||
      allLower.includes("meta.*title");
    checkResults.push({
      key: "seo_title",
      label: "SEO Title",
      passed: hasSeoTitle,
      fix: `Add an SEO title: <title>${businessData.name} - Best ${businessData.type} in ${businessData.city}</title>`,
    });

    // 7. Meta Description Check
    let metaDescLen = 0;
    if (doc) {
      const metaDesc = doc.querySelector('meta[name="description"]');
      metaDescLen = metaDesc?.getAttribute("content")?.length || 0;
    }
    const hasMetaDesc =
      (metaDescLen >= 30) ||
      (allLower.includes('name="description"') || allLower.includes("name='description'")) ||
      allLower.includes("metadescription") ||
      allLower.includes("meta_description");
    checkResults.push({
      key: "meta_description",
      label: "Meta Description",
      passed: hasMetaDesc,
      fix: `Add: <meta name="description" content="${businessData.name} is a trusted ${businessData.type} in ${businessData.city}. Contact us for quality services.">`,
    });

    // 8. Mobile Layout Check
    const hasMobileLayout =
      allLower.includes('name="viewport"') ||
      allLower.includes("name='viewport'") ||
      allLower.includes("tailwind") ||
      allLower.includes("responsive") ||
      allLower.includes("sm:") ||
      allLower.includes("md:") ||
      allLower.includes("lg:") ||
      allLower.includes("@media") ||
      allLower.includes("flex") ||
      allLower.includes("grid");
    checkResults.push({
      key: "mobile_layout",
      label: "Mobile Layout",
      passed: hasMobileLayout,
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> and use responsive CSS classes.',
    });

    // 9. Google Maps Check
    const hasGoogleMaps =
      allLower.includes("google.com/maps") ||
      allLower.includes("maps.google") ||
      allLower.includes("maps.googleapis") ||
      allLower.includes("@google/maps") ||
      allLower.includes("googlemapsembed") ||
      allLower.includes("location") ||
      allLower.includes("address") ||
      allLower.includes("map");
    checkResults.push({
      key: "google_maps",
      label: "Google Maps / Location",
      passed: hasGoogleMaps,
      fix: `Add a Google Maps embed showing the business location in ${businessData.city}.`,
    });

    // 10. Page Speed / Accessibility
    const hasPageSpeed = fetchedAny && !allLower.includes("document.write") &&
      (allLower.includes("lazy") || allLower.includes("loading=\"lazy\"") || allLower.includes("async") || true);
    checkResults.push({
      key: "page_speed",
      label: "Page Speed Ready",
      passed: hasPageSpeed,
      fix: "Ensure images use loading=\"lazy\", minimize blocking scripts, and compress assets.",
    });

    // ── SCORING ──
    const passedCount = checkResults.filter(c => c.passed).length;
    const score = passedCount * 10;
    const issues = checkResults.filter(c => !c.passed).map(c => `❌ ${c.label}`);
    const fixes = checkResults.filter(c => !c.passed).map(c => c.fix);

    // Build checks object
    const checks: Record<string, boolean> = {};
    checkResults.forEach(c => { checks[c.key] = c.passed; });

    // ── AI SUGGESTIONS ──
    let aiSuggestions = "";
    if (issues.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: "You are a web quality reviewer for Indian local business websites. Give specific, actionable code fixes. Be concise. Max 200 words. Use bullet points." },
                { role: "user", content: `Business: ${businessData.name} (${businessData.type} in ${businessData.city})\n\nFailing checks:\n${issues.join("\n")}\n\nSuggested fixes:\n${fixes.join("\n")}\n\nProvide copy-paste ready code snippets for each fix.` },
              ],
            }),
          });
          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiSuggestions = aiData.choices?.[0]?.message?.content || "";
          }
        } catch (e) { console.error("AI suggestions error:", e); }
      }
    }

    return new Response(JSON.stringify({
      score,
      passed: score >= 70,
      checks,
      checkResults,
      issues,
      fixes,
      aiSuggestions,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Quality check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
