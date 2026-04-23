import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
// NOTE: deno_dom is loaded LAZILY inside the handler to survive cold-boot WASM fetch failures.
// If the WASM import fails, we fall back to pure string-matching checks instead of crashing.

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

    // ── STEP 1: Verify repo is accessible (not private) ──
    console.log(`[quality-check] Fetching repo: ${owner}/${repo}`);
    const repoApiResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { "User-Agent": "LeadPe-QualityChecker" },
    });

    if (!repoApiResp.ok) {
      const status = repoApiResp.status;
      await repoApiResp.text();
      if (status === 404 || status === 403) {
        return new Response(JSON.stringify({
          score: 0, passed: false, checks: {},
          checkResults: [{ key: "repo_access", label: "Repository Access", passed: false, fix: "Repository is PRIVATE or does not exist. Go to Settings → Change visibility to Public." }],
          issues: ["❌ Repository is private or not found"],
          fixes: ["Make the repository PUBLIC on GitHub: Settings → Danger Zone → Change visibility → Public"],
          aiSuggestions: "",
        }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
      }
    }

    const repoData = await repoApiResp.json();
    const defaultBranch: string = repoData?.default_branch || "main";
    console.log(`[quality-check] Default branch: ${defaultBranch}`);

    // ── STEP 2: Check if repo is empty ──
    if (repoData.size === 0 || (repoData.pushed_at === null)) {
      return new Response(JSON.stringify({
        score: 0, passed: false, checks: {},
        checkResults: [{ key: "repo_empty", label: "Repository Content", passed: false, fix: "Repository is empty. Push your website code first." }],
        issues: ["❌ Repository is empty — no code found"],
        fixes: ["Push your website code to this repository, then submit again."],
        aiSuggestions: "",
      }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    // ── STEP 3: Fetch key files from repo (use detected default branch) ──
    const filesToCheck = [
      "index.html", "public/index.html",
      "src/App.tsx", "src/App.jsx",
      "src/pages/Index.tsx", "src/pages/Index.jsx",
      "src/components/WhatsAppButton.tsx", "src/components/Contact.tsx",
      "src/components/ContactForm.tsx", "src/components/About.tsx",
      "src/components/Services.tsx", "src/components/Hero.tsx",
      "src/components/Footer.tsx",
      "package.json", "vite.config.ts", "vite.config.js",
      "next.config.js", "next.config.mjs", "next.config.ts",
      "tsconfig.json",
    ];

    let indexHtml = "";
    let packageJson = "";
    let packageJsonParsed: any = null;
    let hasViteConfig = false;
    let hasNextConfig = false;
    let fetchedFileCount = 0;

    const fetchPromises = filesToCheck.map(async (filePath) => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`;
        const res = await fetch(rawUrl);
        if (res.ok) {
          const text = await res.text();
          fetchedFileCount++;
          if (filePath === "index.html" || filePath === "public/index.html") indexHtml = text;
          if (filePath === "package.json") {
            packageJson = text;
            try { packageJsonParsed = JSON.parse(text); } catch { /* ignore */ }
          }
          if (filePath.includes("vite.config")) hasViteConfig = true;
          if (filePath.includes("next.config")) hasNextConfig = true;
          return { path: filePath, content: text };
        } else {
          await res.text();
        }
      } catch { /* skip */ }
      return null;
    });

    const results = await Promise.all(fetchPromises);
    const files = results.filter(Boolean) as { path: string; content: string }[];
    const allContent = files.map(f => f.content).join("\n");
    const allLower = allContent.toLowerCase();
    console.log(`[quality-check] Repo size=${repoData.size}, branch=${defaultBranch}, fetched ${fetchedFileCount}/${filesToCheck.length} files`);

    if (fetchedFileCount === 0) {
      return new Response(JSON.stringify({
        score: 0, passed: false, checks: {},
        checkResults: [{ key: "repo_access", label: "Repository Access", passed: false, fix: `Could not access any files on branch '${defaultBranch}'. Make sure the repo is PUBLIC and your code is pushed to this branch.` }],
        issues: [`❌ Could not access repository files on branch '${defaultBranch}'`],
        fixes: [`Make the repository public and ensure code is pushed to the '${defaultBranch}' branch.`],
        aiSuggestions: "",
      }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    // Parse index.html — lazy import deno_dom so a WASM cold-boot failure
    // doesn't crash the whole function. We fall back to pure string matching.
    let doc: any = null;
    if (indexHtml) {
      try {
        const { DOMParser } = await import("https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts");
        const parser = new DOMParser();
        doc = parser.parseFromString(indexHtml, "text/html");
      } catch (e) {
        console.warn("[quality-check] deno_dom unavailable, falling back to string matching:", e instanceof Error ? e.message : e);
        doc = null;
      }
    }

    const businessName = (businessData.name || "").toLowerCase().trim();
    const city = (businessData.city || "").toLowerCase().trim();

    // ═══ REAL STRUCTURAL CHECKS ═══
    const checkResults: CheckResult[] = [];

    // ── CHECK 0: Build Configuration (CRITICAL) ──
    let hasBuildScript = false;
    let detectedFramework = "unknown";
    let buildIssue = "";

    if (packageJsonParsed) {
      hasBuildScript = !!(packageJsonParsed.scripts?.build);
      
      // Detect framework
      const deps = { ...packageJsonParsed.dependencies, ...packageJsonParsed.devDependencies };
      if (deps?.next) detectedFramework = "nextjs";
      else if (deps?.vite || hasViteConfig) detectedFramework = "vite";
      else if (deps?.react) detectedFramework = "react-cra";
      else detectedFramework = "unknown";

      if (!hasBuildScript) {
        buildIssue = "No 'build' script found in package.json. Add: \"build\": \"vite build\" to scripts.";
      }
    } else if (indexHtml && !packageJson) {
      // Static HTML site — acceptable
      detectedFramework = "static-html";
      hasBuildScript = true; // static sites don't need a build script
    } else {
      buildIssue = "No package.json found. Either add a package.json with a build script, or use plain HTML with index.html at root.";
    }

    checkResults.push({
      key: "build_config",
      label: "Build Configuration",
      passed: hasBuildScript,
      fix: buildIssue || "Build configuration looks good.",
    });

    // ── CHECK 0b: Framework Compatibility ──
    const frameworkOk = detectedFramework !== "unknown";
    checkResults.push({
      key: "framework",
      label: `Framework (${detectedFramework})`,
      passed: frameworkOk,
      fix: detectedFramework === "unknown"
        ? "Could not detect framework. Use React+Vite, Next.js, or plain HTML."
        : `Detected: ${detectedFramework}. Deployment will use appropriate settings.`,
    });

    // ── CHECK 1: WhatsApp Button ──
    const whatsappLinkPatterns = ["wa.me/", "api.whatsapp.com/send"];
    const hasWhatsApp = whatsappLinkPatterns.some(p => allLower.includes(p));
    checkResults.push({
      key: "whatsapp_button", label: "WhatsApp Button", passed: hasWhatsApp,
      fix: 'Add a floating WhatsApp button: <a href="https://wa.me/91YOURNUMBER" target="_blank">WhatsApp</a>.',
    });

    // ── CHECK 2: Contact/Lead Form ──
    const hasFormTag = allLower.includes("<form");
    const hasSubmitHandler = allLower.includes("onsubmit") || allLower.includes("handlesubmit") || allLower.includes("submitlead") || allLower.includes("submitform");
    const hasInputFields = (allLower.match(/<input/g) || []).length >= 2;
    const hasSubmitButton = allLower.includes('type="submit"') || allLower.includes("type='submit'") || (allLower.includes("button") && (allLower.includes("submit") || allLower.includes("callback") || allLower.includes("send")));
    const hasContactForm = (hasFormTag || hasSubmitHandler) && hasInputFields && hasSubmitButton;
    checkResults.push({
      key: "contact_form", label: "Contact / Lead Form", passed: hasContactForm,
      fix: "Add a contact form with <form>, at least 2 <input> fields (name, phone), and a submit button.",
    });

    // ── CHECK 3: About Section ──
    const aboutPatterns = ['id="about"', "id='about'", 'id="about-us"', 'id="about_us"', 'className="about', "about-section", "aboutsection", "about us", "who we are"];
    const hasAbout = aboutPatterns.some(p => allLower.includes(p));
    checkResults.push({
      key: "about_section", label: "About Section", passed: hasAbout,
      fix: 'Add an About section with id="about" containing business details.',
    });

    // ── CHECK 4: Services Section ──
    const serviceIdPatterns = ['id="service', "id='service", 'id="our-service', "servicesection", "service-section", "services-grid", "service-card", "servicecard"];
    const hasServiceSection = serviceIdPatterns.some(p => allLower.includes(p));
    const hasServiceWord = allLower.includes("services") || allLower.includes("our services") || allLower.includes("what we offer");
    const hasServices = hasServiceSection || hasServiceWord;
    checkResults.push({
      key: "services_section", label: "Services Section", passed: hasServices,
      fix: 'Add a Services section with id="services" containing service cards.',
    });

    // ── CHECK 5: Business Name Visible ──
    let hasBusinessName = false;
    if (!businessName || businessName.length < 2) {
      hasBusinessName = true;
    } else {
      const nameWords = businessName.split(/\s+/).filter(w => w.length > 2);
      const matchCount = nameWords.filter(w => allLower.includes(w)).length;
      hasBusinessName = matchCount >= Math.ceil(nameWords.length * 0.6);
    }
    checkResults.push({
      key: "business_name", label: "Business Name Visible", passed: hasBusinessName,
      fix: `Add "${businessData.name}" in the hero H1 heading and navbar.`,
    });

    // ── CHECK 6: SEO Title ──
    let titleText = "";
    if (doc) {
      const titleEl = doc.querySelector("title");
      titleText = titleEl?.textContent || "";
    }
    const hasReactHelmet = allLower.includes("helmet") || allLower.includes("document.title");
    const hasTitleTag = allLower.includes("<title") && !allLower.includes("<title>vite + react</title>") && !allLower.includes("<title>react app</title>");
    const hasSeoTitle = (titleText.length >= 15 && !titleText.toLowerCase().includes("vite + react") && !titleText.toLowerCase().includes("react app")) || hasReactHelmet || hasTitleTag;
    checkResults.push({
      key: "seo_title", label: "SEO Title", passed: hasSeoTitle,
      fix: `Set <title>${businessData.name} - Best ${businessData.type} in ${businessData.city}</title>. Default "Vite + React" does NOT pass.`,
    });

    // ── CHECK 7: Meta Description ──
    let metaDescContent = "";
    if (doc) {
      const metaDesc = doc.querySelector('meta[name="description"]');
      metaDescContent = metaDesc?.getAttribute("content") || "";
    }
    const hasMetaDescInCode = allLower.includes('name="description"') || allLower.includes("name='description'");
    const hasMetaDesc = (metaDescContent.length >= 80) || (hasMetaDescInCode && allLower.includes("content="));
    checkResults.push({
      key: "meta_description", label: "Meta Description", passed: hasMetaDesc,
      fix: `Add <meta name="description" content="..."> with 80+ characters.`,
    });

    // ── CHECK 8: Mobile Layout ──
    const hasViewportTag = allLower.includes('name="viewport"') || allLower.includes("name='viewport'");
    const hasTailwind = allLower.includes("tailwindcss") || allLower.includes("tailwind.config") || packageJson.toLowerCase().includes("tailwindcss");
    const hasResponsiveClasses = (allLower.match(/\b(sm:|md:|lg:|xl:)/g) || []).length >= 3;
    const hasMediaQueries = (allLower.match(/@media/g) || []).length >= 1;
    const hasMobileLayout = hasViewportTag && (hasTailwind || hasResponsiveClasses || hasMediaQueries);
    checkResults.push({
      key: "mobile_layout", label: "Mobile Responsive", passed: hasMobileLayout,
      fix: 'Add viewport meta tag AND use responsive CSS (Tailwind or media queries).',
    });

    // ── CHECK 9: Google Maps / Location ──
    const mapsPatterns = ["google.com/maps", "maps.google", "maps.googleapis", "maps?q=", "maps/embed", "iframe"];
    const hasMapEmbed = mapsPatterns.some(p => allLower.includes(p));
    const hasCityMention = city && allLower.includes(city);
    const hasGoogleMaps = hasMapEmbed || (hasCityMention && (allLower.includes("address") || allLower.includes("location")));
    checkResults.push({
      key: "google_maps", label: "Google Maps / Location", passed: hasGoogleMaps,
      fix: `Add Google Maps iframe or an address section mentioning "${businessData.city}".`,
    });

    // ── CHECK 10: LeadPe Widget ──
    const hasLeadPeWidget = allLower.includes("leadpe-widget") || allLower.includes("leadpe_widget") ||
      allLower.includes("submitleadpelead") || allLower.includes("submit_leadpe") ||
      (allLower.includes("leads") && allLower.includes("supabase") && allLower.includes("business_id"));
    checkResults.push({
      key: "leadpe_widget", label: "LeadPe Lead Widget", passed: hasLeadPeWidget,
      fix: "Embed the LeadPe Lead Capture Widget code. This is CRITICAL for lead capture.",
    });

    // ── CHECK 11: LeadPe Footer Credit ──
    const hasLeadPeFooter = allLower.includes("built with leadpe") || allLower.includes("leadpe.online") || allLower.includes("leadpe 🌱");
    checkResults.push({
      key: "leadpe_footer", label: "LeadPe Footer Credit", passed: hasLeadPeFooter,
      fix: 'Add "Built with LeadPe 🌱" with link to https://leadpe.online in the footer.',
    });

    // ═══ WEIGHTED SCORING ═══
    const weights: Record<string, number> = {
      build_config: 15,   // CRITICAL — no build = no deploy
      framework: 5,
      whatsapp_button: 12,
      contact_form: 8,
      about_section: 5,
      services_section: 5,
      business_name: 8,
      seo_title: 6,
      meta_description: 4,
      mobile_layout: 8,
      google_maps: 4,
      leadpe_widget: 15,  // CRITICAL — core feature
      leadpe_footer: 5,
    };

    let totalWeight = 0;
    let earnedWeight = 0;
    checkResults.forEach(c => {
      const w = weights[c.key] || 5;
      totalWeight += w;
      if (c.passed) earnedWeight += w;
    });

    const score = Math.round((earnedWeight / totalWeight) * 100);
    const issues = checkResults.filter(c => !c.passed).map(c => `❌ ${c.label}: ${c.fix}`);
    const fixes = checkResults.filter(c => !c.passed).map(c => c.fix);

    const checks: Record<string, boolean> = {};
    checkResults.forEach(c => { checks[c.key] = c.passed; });

    // ── AI SUGGESTIONS (only if failures) ──
    let aiSuggestions = "";
    if (issues.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: "You are a web quality reviewer. Give specific, copy-paste-ready code fixes. Be concise. Max 200 words. Bullet points." },
                { role: "user", content: `Business: ${businessData.name} (${businessData.type} in ${businessData.city})\nFramework: ${detectedFramework}\n\nFailing checks:\n${issues.join("\n")}\n\nProvide code snippets to fix each issue.` },
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

    // ── BUILD BLOCKER: If build config fails, force fail regardless of score ──
    const buildConfigFailed = !hasBuildScript;
    const finalPassed = buildConfigFailed ? false : score >= 70;
    const finalScore = buildConfigFailed ? Math.min(score, 15) : score;

    return new Response(JSON.stringify({
      score: finalScore,
      passed: finalPassed,
      checks,
      checkResults,
      issues,
      fixes,
      aiSuggestions,
      framework: detectedFramework,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Quality check error:", e);
    return new Response(JSON.stringify({
      score: 0,
      passed: false,
      checks: {},
      checkResults: [{ key: "system_error", label: "System Error", passed: false, fix: "Internal error during quality check. Try again." }],
      issues: [`❌ System error: ${e instanceof Error ? e.message : "Unknown error"}`],
      fixes: ["Try submitting again. If the issue persists, contact support."],
      aiSuggestions: "",
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 200, // Return 200 so client can parse the failure details
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
