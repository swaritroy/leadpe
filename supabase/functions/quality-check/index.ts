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

    const parts = githubUrl.replace("https://", "").replace("http://", "").replace("github.com/", "").split("/");
    const owner = parts[0];
    const repo = parts[1]?.replace(".git", "");

    if (!owner || !repo) {
      return new Response(JSON.stringify({ error: "Invalid GitHub URL format" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fetch repo files from GitHub raw
    const filesToCheck = [
      "index.html",
      "src/App.tsx",
      "src/App.jsx",
      "src/pages/Index.tsx",
      "src/pages/Index.jsx",
      "src/components/WhatsAppButton.tsx",
      "src/components/Contact.tsx",
      "src/components/ContactForm.tsx",
      "src/components/About.tsx",
      "src/components/Services.tsx",
      "src/components/Hero.tsx",
      "src/components/Footer.tsx",
      "package.json",
    ];

    let allContent = "";
    let indexHtml = "";
    let packageJson = "";
    let fetchedFileCount = 0;

    const fetchPromises = filesToCheck.map(async (filePath) => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
        const res = await fetch(rawUrl);
        if (res.ok) {
          const text = await res.text();
          fetchedFileCount++;
          if (filePath === "index.html") indexHtml = text;
          if (filePath === "package.json") packageJson = text;
          return { path: filePath, content: text };
        } else {
          await res.text(); // consume body
        }
      } catch { /* skip */ }
      return null;
    });

    const results = await Promise.all(fetchPromises);
    const files = results.filter(Boolean) as { path: string; content: string }[];
    allContent = files.map(f => f.content).join("\n");
    const allLower = allContent.toLowerCase();

    // If we couldn't fetch ANY files, the repo might be private or empty
    if (fetchedFileCount === 0) {
      return new Response(JSON.stringify({
        score: 0,
        passed: false,
        checks: {},
        checkResults: [{ key: "repo_access", label: "Repository Access", passed: false, fix: "Could not access repository. Make sure it is PUBLIC and has files on the 'main' branch." }],
        issues: ["❌ Could not access repository — is it public?"],
        fixes: ["Make the repository public and ensure code is pushed to the 'main' branch."],
        aiSuggestions: "",
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Parse index.html for DOM checks
    let doc: any = null;
    if (indexHtml) {
      try {
        const parser = new DOMParser();
        doc = parser.parseFromString(indexHtml, "text/html");
      } catch { /* fallback to string matching */ }
    }

    const businessName = (businessData.name || "").toLowerCase().trim();
    const city = (businessData.city || "").toLowerCase().trim();

    // ── STRICT STRUCTURAL CHECKS ──
    const checkResults: CheckResult[] = [];

    // 1. WhatsApp Button — STRICT: must have wa.me or api.whatsapp.com link
    const whatsappLinkPatterns = ["wa.me/", "api.whatsapp.com/send"];
    const hasWhatsApp = whatsappLinkPatterns.some(p => allLower.includes(p));
    checkResults.push({
      key: "whatsapp_button",
      label: "WhatsApp Button",
      passed: hasWhatsApp,
      fix: 'Add a floating WhatsApp button with: <a href="https://wa.me/91YOURNUMBER" target="_blank">WhatsApp</a>. Must contain "wa.me/" in the link.',
    });

    // 2. Contact/Lead Form — STRICT: needs <form> or actual form elements with submit handler
    const hasFormTag = allLower.includes("<form");
    const hasSubmitHandler = allLower.includes("onsubmit") || allLower.includes("handlesubmit") || allLower.includes("submitlead");
    const hasInputFields = (allLower.match(/<input/g) || []).length >= 2;
    const hasSubmitButton = allLower.includes('type="submit"') || allLower.includes("type='submit'") || (allLower.includes("button") && (allLower.includes("submit") || allLower.includes("callback") || allLower.includes("send")));
    const hasContactForm = (hasFormTag || hasSubmitHandler) && hasInputFields && hasSubmitButton;
    checkResults.push({
      key: "contact_form",
      label: "Contact / Lead Form",
      passed: hasContactForm,
      fix: "Add a contact form with <form>, at least 2 <input> fields (name, phone), and a submit button. Must have a submit handler.",
    });

    // 3. About Section — STRICT: needs an element with about-related id/class AND content
    const aboutPatterns = ['id="about"', "id='about'", 'id="about-us"', 'id="about_us"', 'className="about', "about-section", "aboutsection", "about us", "who we are"];
    const hasAbout = aboutPatterns.some(p => allLower.includes(p));
    checkResults.push({
      key: "about_section",
      label: "About Section",
      passed: hasAbout,
      fix: 'Add an About section with id="about" containing heading and 2-3 paragraphs about the business.',
    });

    // 4. Services Section — STRICT: needs service-related section with multiple items
    const serviceIdPatterns = ['id="service', "id='service", 'id="our-service', "servicesection", "service-section", "services-grid", "service-card", "servicecard"];
    const hasServiceSection = serviceIdPatterns.some(p => allLower.includes(p));
    const hasServiceWord = allLower.includes("services") || allLower.includes("our services") || allLower.includes("what we offer");
    const hasServices = hasServiceSection || hasServiceWord;
    checkResults.push({
      key: "services_section",
      label: "Services Section",
      passed: hasServices,
      fix: 'Add a Services section with id="services" containing at least 3 service cards.',
    });

    // 5. Business Name in H1 — STRICT: business name must appear somewhere prominent
    let hasBusinessName = false;
    if (!businessName || businessName.length < 2) {
      hasBusinessName = true; // skip if no name provided
    } else {
      // Check if business name words appear in content
      const nameWords = businessName.split(/\s+/).filter(w => w.length > 2);
      const matchCount = nameWords.filter(w => allLower.includes(w)).length;
      hasBusinessName = matchCount >= Math.ceil(nameWords.length * 0.6); // at least 60% of words match
    }
    checkResults.push({
      key: "business_name",
      label: "Business Name Visible",
      passed: hasBusinessName,
      fix: `Add the business name "${businessData.name}" in the hero H1 heading and in the navbar/logo.`,
    });

    // 6. SEO Title — STRICT: must have <title> tag with meaningful content
    let titleText = "";
    if (doc) {
      const titleEl = doc.querySelector("title");
      titleText = titleEl?.textContent || "";
    }
    // Also check in allContent for React helmet or document.title
    const hasReactHelmet = allLower.includes("helmet") || allLower.includes("document.title");
    const hasTitleTag = allLower.includes("<title") && !allLower.includes("<title>vite + react</title>") && !allLower.includes("<title>react app</title>");
    const hasSeoTitle = (titleText.length >= 15 && !titleText.toLowerCase().includes("vite + react") && !titleText.toLowerCase().includes("react app")) || hasReactHelmet || hasTitleTag;
    checkResults.push({
      key: "seo_title",
      label: "SEO Title",
      passed: hasSeoTitle,
      fix: `Set a custom <title> tag: "${businessData.name} - Best ${businessData.type} in ${businessData.city}". Default "Vite + React" title does NOT pass.`,
    });

    // 7. Meta Description — STRICT: must have meta description with 80+ chars
    let metaDescContent = "";
    if (doc) {
      const metaDesc = doc.querySelector('meta[name="description"]');
      metaDescContent = metaDesc?.getAttribute("content") || "";
    }
    const hasMetaDescInCode = allLower.includes('name="description"') || allLower.includes("name='description'");
    const hasMetaDesc = (metaDescContent.length >= 80) || (hasMetaDescInCode && allLower.includes("content="));
    checkResults.push({
      key: "meta_description",
      label: "Meta Description",
      passed: hasMetaDesc,
      fix: `Add: <meta name="description" content="${businessData.name} is a trusted ${businessData.type} in ${businessData.city}. Contact us for quality services."> (must be 80+ characters)`,
    });

    // 8. Mobile Layout — STRICT: must have viewport meta tag
    const hasViewportTag = allLower.includes('name="viewport"') || allLower.includes("name='viewport'");
    const hasTailwind = allLower.includes("tailwindcss") || allLower.includes("tailwind.config") || (packageJson && packageJson.toLowerCase().includes("tailwindcss"));
    const hasResponsiveClasses = (allLower.match(/\b(sm:|md:|lg:|xl:)/g) || []).length >= 3;
    const hasMediaQueries = (allLower.match(/@media/g) || []).length >= 1;
    const hasMobileLayout = hasViewportTag && (hasTailwind || hasResponsiveClasses || hasMediaQueries);
    checkResults.push({
      key: "mobile_layout",
      label: "Mobile Responsive",
      passed: hasMobileLayout,
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in index.html AND use responsive CSS (Tailwind recommended).',
    });

    // 9. Google Maps / Location — STRICT: must have actual maps embed or maps link
    const mapsPatterns = ["google.com/maps", "maps.google", "maps.googleapis", "maps?q=", "maps/embed", "iframe"];
    const hasMapEmbed = mapsPatterns.some(p => allLower.includes(p));
    // Also accept explicit address mention with city
    const hasCityMention = city && allLower.includes(city);
    const hasGoogleMaps = hasMapEmbed || (hasCityMention && (allLower.includes("address") || allLower.includes("location")));
    checkResults.push({
      key: "google_maps",
      label: "Google Maps / Location",
      passed: hasGoogleMaps,
      fix: `Add a Google Maps iframe embed showing "${businessData.name}" in ${businessData.city}. Or add a section with the business address mentioning ${businessData.city}.`,
    });

    // 10. LeadPe Widget — STRICT: must have the actual lead widget code
    const hasLeadPeWidget = allLower.includes("leadpe-widget") || allLower.includes("leadpe_widget") ||
      allLower.includes("submitleadpelead") || allLower.includes("submit_leadpe") ||
      (allLower.includes("leads") && allLower.includes("supabase") && allLower.includes("business_id"));
    checkResults.push({
      key: "leadpe_widget",
      label: "LeadPe Lead Widget",
      passed: hasLeadPeWidget,
      fix: "Embed the LeadPe Lead Capture Widget code in the contact section. This is the MOST CRITICAL element — it captures customer leads into the CRM.",
    });

    // ── SCORING ──
    const weights: Record<string, number> = {
      whatsapp_button: 15,
      contact_form: 10,
      about_section: 8,
      services_section: 8,
      business_name: 10,
      seo_title: 8,
      meta_description: 6,
      mobile_layout: 10,
      google_maps: 5,
      leadpe_widget: 20,
    };

    let totalWeight = 0;
    let earnedWeight = 0;
    checkResults.forEach(c => {
      const w = weights[c.key] || 10;
      totalWeight += w;
      if (c.passed) earnedWeight += w;
    });

    const score = Math.round((earnedWeight / totalWeight) * 100);
    const issues = checkResults.filter(c => !c.passed).map(c => `❌ ${c.label}`);
    const fixes = checkResults.filter(c => !c.passed).map(c => c.fix);

    const checks: Record<string, boolean> = {};
    checkResults.forEach(c => { checks[c.key] = c.passed; });

    // ── AI SUGGESTIONS (only if there are failures) ──
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
          } else {
            await aiResponse.text();
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
