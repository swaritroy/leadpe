import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { githubUrl, businessData } = await req.json();

    if (!githubUrl || !businessData) {
      return new Response(JSON.stringify({ error: "Missing githubUrl or businessData" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract GitHub raw content URL
    const parts = githubUrl.replace("https://", "").replace("github.com/", "").split("/");
    const owner = parts[0];
    const repo = parts[1]?.replace(".git", "");

    let htmlContent = "";
    let fetchSuccess = false;

    // Try fetching index.html then src/App.tsx
    for (const filePath of ["index.html", "src/App.tsx", "src/pages/Index.tsx"]) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
        const res = await fetch(rawUrl);
        if (res.ok) {
          htmlContent = await res.text();
          fetchSuccess = true;
          break;
        }
      } catch { /* try next */ }
    }

    const html = htmlContent.toLowerCase();
    const name = (businessData.name || "").toLowerCase();
    const city = (businessData.city || "").toLowerCase();

    const checks = {
      hasWhatsAppButton: html.includes("whatsapp") || html.includes("wa.me"),
      hasMobileLayout: html.includes("responsive") || html.includes("viewport") || html.includes("flex") || html.includes("grid") || html.includes("tailwind"),
      hasContactForm: html.includes("form") || html.includes("contact") || html.includes("input"),
      hasServicesSection: html.includes("service") || html.includes("offer") || html.includes("what we"),
      hasAboutSection: html.includes("about") || html.includes("who we"),
      hasBusinessName: name ? html.includes(name) : true,
      hasCity: city ? html.includes(city) : true,
      hasSEOTitle: html.includes("<title") || html.includes("title:") || html.includes("helmet"),
      hasMetaDescription: html.includes("meta") && html.includes("description"),
      hasLeadForm: html.includes("leadpe") || html.includes("lead") || html.includes("enquiry") || html.includes("inquiry"),
      hasGoogleMaps: html.includes("maps") || html.includes("location") || html.includes("address"),
      loadsFast: fetchSuccess,
    };

    const checkValues = Object.values(checks);
    const passedCount = checkValues.filter(Boolean).length;
    const score = Math.round((passedCount / checkValues.length) * 100);

    const issues: string[] = [];
    const fixes: string[] = [];

    if (!checks.hasWhatsAppButton) {
      issues.push("❌ No WhatsApp button found");
      fixes.push("Add a WhatsApp floating button linking to wa.me/91XXXXXXXXXX");
    }
    if (!checks.hasMobileLayout) {
      issues.push("❌ Not mobile responsive");
      fixes.push("Add viewport meta tag and use Tailwind CSS responsive classes");
    }
    if (!checks.hasContactForm) {
      issues.push("❌ No contact form");
      fixes.push("Add a contact form with name and phone number fields");
    }
    if (!checks.hasBusinessName) {
      issues.push(`❌ Business name "${businessData.name}" not found in code`);
      fixes.push(`Add the business name "${businessData.name}" prominently in headings`);
    }
    if (!checks.hasCity) {
      issues.push(`❌ City "${businessData.city}" not mentioned`);
      fixes.push(`Add city "${businessData.city}" in the hero or about section`);
    }
    if (!checks.hasLeadForm) {
      issues.push("❌ No lead capture form connected");
      fixes.push("Add the LeadPe lead capture widget before </body>");
    }
    if (!checks.hasSEOTitle) {
      issues.push("❌ No SEO title tag found");
      fixes.push(`Add <title>${businessData.name} - ${businessData.type} in ${businessData.city}</title>`);
    }
    if (!checks.hasMetaDescription) {
      issues.push("❌ No meta description");
      fixes.push("Add a meta description tag with business info and city");
    }
    if (!checks.loadsFast) {
      issues.push("❌ Could not access GitHub repo");
      fixes.push("Make sure the GitHub repository is public and URL is correct");
    }

    // AI suggestions using Lovable AI
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
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are a web quality reviewer for Indian local business websites. Give specific, actionable code fixes. Be concise. Max 300 words." },
                { role: "user", content: `Review website for:\nBusiness: ${businessData.name}\nType: ${businessData.type}\nCity: ${businessData.city}\n\nIssues found:\n${issues.join("\n")}\n\nCode snippet (first 1500 chars):\n${htmlContent.substring(0, 1500)}\n\nProvide specific fixes for each issue.` },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiSuggestions = aiData.choices?.[0]?.message?.content || "";
          }
        } catch (e) {
          console.error("AI suggestions error:", e);
        }
      }
    }

    return new Response(JSON.stringify({
      score,
      passed: score >= 70,
      checks,
      issues,
      fixes,
      aiSuggestions,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Quality check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
