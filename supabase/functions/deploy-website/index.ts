import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const VERCEL_API = "https://api.vercel.com";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ★ FIX: package-friendly hint dictionary keyed on Vercel error codes + free-text fallback
function hintForCode(code: string, raw: string): string {
  const c = (code || "").toLowerCase();
  const r = (raw || "").toLowerCase();
  // Vercel-specific error codes
  if (c === "repo_not_found" || r.includes("repo_not_found")) return "GitHub repo not found by Vercel. Make sure the repo is PUBLIC and the URL is correct.";
  if (c === "not_authorized" || c === "forbidden" || r.includes("not_authorized")) return "Vercel does not have access to this repo. Install the Vercel GitHub app on your account, then retry.";
  if (c === "missing_files" || r.includes("missing_files")) return "Repo is missing required files. Push package.json and index.html / src/main.tsx, then retry.";
  if (c === "invalid_request") return "Vercel rejected the request. Double-check the GitHub URL is in the form github.com/username/repo.";
  if (c === "build_utils_spawn_1" || r.includes("build_utils_spawn_1")) return "Vercel build runner crashed. Usually a corrupt package-lock.json — delete it, run npm install locally, push, retry.";
  if (c === "function_invocation_failed") return "A serverless function crashed at runtime. Check your API routes for unhandled errors.";
  if (c === "missing_build_script" || r.includes("missing build script")) return 'package.json is missing a "build" script. Add `"build": "vite build"` and push.';
  if (c === "rate_limited" || c === "too_many_requests") return "Too many deployments in a short window. Wait a few minutes and retry.";
  // Free-text fallbacks (build logs)
  if (r.includes("module not found") || r.includes("can't resolve") || r.includes("cannot find module")) return "A file or package import is missing. Check the imports in the file mentioned above and push the fix.";
  if (r.includes("syntaxerror") || r.includes("unexpected token")) return "Syntax error in your code. Open the file from the log, fix the typo, push, retry.";
  if (r.includes("npm err") || r.includes("eresolve") || r.includes("peer dep")) return "npm install failed — check package.json for incompatible versions or missing packages.";
  if (r.includes("memory") || r.includes("heap out of memory")) return "Build ran out of memory. Reduce dependencies or split the project.";
  if (r.includes("timeout")) return "Build took too long. Optimize dependencies or remove heavy packages.";
  if (r.includes("not found") || r.includes("404")) return "Repository not found. Make sure your GitHub repo is PUBLIC and the URL is correct.";
  if (r.includes("permission") || r.includes("403") || r.includes("private")) return "Permission denied. Make sure the repository is PUBLIC, not private.";
  if (r.includes("no framework") || r.includes("no output")) return "No framework detected. Add an index.html to the root folder or ensure package.json has a build script.";
  return "Open the Vercel inspector link below to see the full build log, fix the issue, push to GitHub, and retry.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
    if (!VERCEL_TOKEN) {
      return new Response(
        JSON.stringify({ error: "VERCEL_TOKEN not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, data } = await req.json();
    const headers = {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    };

    // ══════════════════════════════════════════════
    // ACTION: deploy (demo mode — no custom domain)
    // ══════════════════════════════════════════════
    if (action === "deploy") {
      const { businessName, businessType, city, githubUrl, trialCode, buildRequestId, businessId } = data;

      const cleaned = (githubUrl || "").replace(/^https?:\/\//, "").replace(/^github\.com\//, "").replace(/\/$/, "");
      const parts = cleaned.split("/").filter(Boolean);
      const githubOrg = parts[0];
      const githubRepo = parts[1]?.replace(".git", "");

      if (!githubOrg || !githubRepo) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid GitHub URL format. Use github.com/username/repo.", stage: "validate" }),
          { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Detect default branch (don't force "main")
      let defaultBranch = "main";
      try {
        const repoResp = await fetch(`https://api.github.com/repos/${githubOrg}/${githubRepo}`, {
          headers: { "User-Agent": "LeadPe-Deploy" },
        });
        if (repoResp.ok) {
          const repoMeta = await repoResp.json();
          if (repoMeta?.default_branch) defaultBranch = repoMeta.default_branch;
        } else if (repoResp.status === 404 || repoResp.status === 403) {
          return new Response(
            JSON.stringify({
              success: false,
              stage: "repo_access",
              error: `GitHub repo not accessible (HTTP ${repoResp.status}). Make sure it is PUBLIC.`,
              hint: "Open the repo on GitHub → Settings → Change visibility → Public.",
            }),
            { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.warn("Default branch detection failed, using 'main':", e);
      }
      console.log(`[deploy] Repo ${githubOrg}/${githubRepo} branch=${defaultBranch}`);

      const projectName = `leadpe-${(businessName || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20)}-${(city || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 10)}`.replace(/-+/g, "-").replace(/-$/, "");

      // Step 1: Create Vercel project
      const createResp = await fetch(`${VERCEL_API}/v9/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: projectName,
          gitRepository: { type: "github", repo: `${githubOrg}/${githubRepo}` },
          framework: "vite",
          buildCommand: "npm run build",
          outputDirectory: "dist",
          installCommand: "npm install",
          environmentVariables: [
            { key: "VITE_BUSINESS_NAME", value: businessName, type: "plain", target: ["production"] },
            { key: "VITE_BUSINESS_CITY", value: city, type: "plain", target: ["production"] },
            { key: "VITE_BUSINESS_TYPE", value: businessType || "", type: "plain", target: ["production"] },
            { key: "VITE_TRIAL_CODE", value: trialCode || "", type: "plain", target: ["production"] },
            { key: "VITE_LEADPE_MODE", value: "demo", type: "plain", target: ["production"] },
          ],
        }),
      });

      const projectData = await createResp.json();
      console.log("Project create response:", createResp.status);

      // ★ FIX: catch project-create failures (except harmless "already exists")
      if (!createResp.ok && projectData?.error?.code !== "project_already_exists") {
        const code = projectData?.error?.code || `HTTP_${createResp.status}`;
        const msg = projectData?.error?.message || "Vercel project creation failed";
        return new Response(
          JSON.stringify({
            success: false,
            stage: "project_create",
            error: `${code}: ${msg}`,
            hint: hintForCode(code, msg),
          }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Step 2: Trigger deployment
      const deployResp = await fetch(`${VERCEL_API}/v13/deployments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: projectName,
          gitSource: { type: "github", org: githubOrg, repo: githubRepo, ref: defaultBranch },
          projectSettings: { framework: "vite", buildCommand: "npm run build", outputDirectory: "dist" },
        }),
      });

      const deployData = await deployResp.json();

      if (!deployResp.ok) {
        const code = deployData?.error?.code || `HTTP_${deployResp.status}`;
        const msg = deployData?.error?.message || "Deployment trigger failed";
        return new Response(
          JSON.stringify({
            success: false,
            stage: "deploy_trigger",
            error: `${code}: ${msg}`,
            hint: hintForCode(code, msg),
          }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const deploymentId = deployData.id;
      const deployUrl = `https://${deployData.url}`;
      const inspectorUrl = deployData.inspectorUrl || `https://vercel.com/deployments/${deploymentId}`;

      // Step 3: Poll deployment status (max 3 minutes)
      let finalState = "BUILDING";
      let finalUrl = deployUrl;
      let buildError = "";
      const maxWait = 180000;
      const pollInterval = 5000;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWait) {
        await sleep(pollInterval);
        try {
          const statusResp = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}`, { headers });
          const statusData = await statusResp.json();
          finalState = statusData.readyState || statusData.state || "BUILDING";
          if (statusData.url) finalUrl = `https://${statusData.url}`;

          // Capture build error details
          if (finalState === "ERROR") {
            buildError = statusData.errorMessage || statusData.error?.message || "";

            // ★ FIX: fetch real build event logs for the actual webpack/vite/npm message
            try {
              const evResp = await fetch(
                `${VERCEL_API}/v2/deployments/${deploymentId}/events?builds=1&direction=backward&limit=20`,
                { headers }
              );
              if (evResp.ok) {
                const events = await evResp.json();
                const arr = Array.isArray(events) ? events : (events?.events || []);
                const lastErr = arr.reverse().find((e: any) =>
                  e?.type === "stderr" || e?.type === "error" || /error|failed/i.test(e?.text || e?.payload?.text || "")
                );
                const errText = lastErr?.text || lastErr?.payload?.text || "";
                if (errText) buildError = buildError ? `${buildError}\n${errText}` : errText;
              }
            } catch (logErr) {
              console.error("Could not fetch build events:", logErr);
            }

            if (!buildError) buildError = "Build failed on Vercel (no error message available)";
            console.error("Deployment ERROR:", buildError);
          }

          if (finalState === "READY" || finalState === "ERROR") break;
        } catch (e) {
          console.error("Poll error:", e);
        }
      }

      // Step 4: Update build request based on final state — always persist deploy diagnostics
      if (buildRequestId) {
        const baseDiag = {
          deployment_id: deploymentId,
          deploy_inspector_url: inspectorUrl,
          last_deploy_checked_at: new Date().toISOString(),
        };
        if (finalState === "READY") {
          await supabase.from("build_requests").update({
            ...baseDiag,
            demo_url: finalUrl,
            deploy_url: finalUrl,
            status: "demo_ready",
            deployed_at: new Date().toISOString(),
            demo_deployed_at: new Date().toISOString(),
            deploy_stage: "ready",
            deploy_error: null,
            deploy_hint: null,
          }).eq("id", buildRequestId);
        } else if (finalState === "ERROR") {
          await supabase.from("build_requests").update({
            ...baseDiag,
            status: "failed",
            deploy_url: null,
            deploy_stage: "build",
            deploy_error: buildError || "Build failed on Vercel (no error message available)",
            deploy_hint: hintForCode("", buildError),
          }).eq("id", buildRequestId);
        } else {
          await supabase.from("build_requests").update({
            ...baseDiag,
            demo_url: finalUrl,
            deploy_url: finalUrl,
            status: "review",
            deployed_at: new Date().toISOString(),
            deploy_stage: "timeout",
            deploy_error: `Build still running after 3 minutes (state: ${finalState})`,
            deploy_hint: "Build is taking longer than expected. Check the Vercel inspector link.",
          }).eq("id", buildRequestId);
        }
      }

      // Step 5: Update business owner profile
      if (businessId) {
        await supabase.from("profiles").update({
          website_status: finalState === "ERROR" ? "failed" : "demo_ready",
        }).eq("user_id", businessId);
      }

      // Step 6: WhatsApp notification
      if (data.ownerWhatsapp && finalState === "READY") {
        try {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
            method: "POST",
            headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              to: data.ownerWhatsapp,
              message: `Your website preview is ready! 🎉 Login to review it: leadpe.online`,
            }),
          });
        } catch (e) {
          console.error("WhatsApp send error:", e);
        }
      }

      if (finalState === "ERROR") {
        const hint = hintForCode("", buildError);
        return new Response(
          JSON.stringify({
            success: false,
            stage: "build",
            error: buildError || "Build failed on deployment platform",
            hint,
            state: "ERROR",
            projectName,
            inspectorUrl,
          }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Timeout (still BUILDING after 3 minutes)
      if (finalState !== "READY") {
        return new Response(
          JSON.stringify({
            success: false,
            stage: "timeout",
            error: `Build still running after 3 minutes (state: ${finalState})`,
            hint: "Build is taking longer than expected. Check back in a few minutes via the Vercel inspector link.",
            state: finalState,
            projectName,
            inspectorUrl,
          }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          deployUrl: finalUrl,
          projectName,
          deploymentId,
          state: finalState,
        }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ══════════════════════════════════════════════
    // ACTION: deploy_live (after payment — with custom domain)
    // ══════════════════════════════════════════════
    if (action === "deploy_live") {
      const { buildRequestId, subdomain, userId } = data;

      // Fetch build request
      const { data: br } = await supabase.from("build_requests")
        .select("*").eq("id", buildRequestId).single();

      if (!br || !br.github_url) {
        return new Response(
          JSON.stringify({ error: "Build request or GitHub URL not found" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const cleaned = br.github_url.replace(/^https?:\/\//, "").replace(/^github\.com\//, "").replace(/\/$/, "");
      const parts = cleaned.split("/").filter(Boolean);
      const githubOrg = parts[0];
      const githubRepo = parts[1]?.replace(".git", "");

      // Detect default branch for live redeploy
      let liveBranch = "main";
      try {
        const repoResp = await fetch(`https://api.github.com/repos/${githubOrg}/${githubRepo}`, {
          headers: { "User-Agent": "LeadPe-Deploy" },
        });
        if (repoResp.ok) {
          const m = await repoResp.json();
          if (m?.default_branch) liveBranch = m.default_branch;
        }
      } catch { /* default to main */ }

      const bName = (br.business_name || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20);
      const bCity = (br.city || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 10);
      const projectName = `leadpe-${bName}-${bCity}`.replace(/-+/g, "-").replace(/-$/, "");

      // Custom domain attachment ENABLED.
      // Requires *.leadpe.online wildcard DNS (CNAME → cname.vercel-dns.com)
      // to be configured in the registrar and verified in Vercel.
      const USE_CUSTOM_DOMAIN = true;
      const customDomain = `${subdomain}.leadpe.online`;
      const vercelDomain = `${projectName}.vercel.app`;
      const liveUrl = USE_CUSTOM_DOMAIN
        ? `https://${customDomain}`
        : `https://${vercelDomain}`;

      // ══════════════════════════════════════════════
      // AUTO-SEO: Generate metadata, schema, OG tags
      // ══════════════════════════════════════════════
      let seoData: any = null;
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const seoResp = await fetch(`${SUPABASE_URL}/functions/v1/generate-seo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: br.business_name,
            businessType: br.business_type,
            city: br.city,
            ownerName: br.owner_name,
            whatsapp: br.owner_whatsapp,
            siteUrl: liveUrl,
          }),
        });
        if (seoResp.ok) {
          seoData = await seoResp.json();
          // Persist SEO
          await supabase.from("business_seo").upsert({
            business_id: buildRequestId,
            business_name: br.business_name,
            page_title: seoData.page_title || seoData.title,
            meta_description: seoData.meta_description || seoData.description,
            keywords: seoData.keywords,
            google_description: seoData.google_description,
            whatsapp_bio: seoData.whatsapp_bio,
            h1_heading: seoData.h1_heading || seoData.h1,
            about_text: seoData.about_text,
            generated_at: new Date().toISOString(),
          }, { onConflict: "business_id" });
        } else {
          console.error("SEO generation failed:", seoResp.status, await seoResp.text());
        }
      } catch (seoErr) {
        console.error("SEO generation error:", seoErr);
      }

      // Ping Google IndexNow
      try {
        await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(liveUrl + "/sitemap.xml")}`);
      } catch (_e) { /* best effort */ }

      // Update env var to live + inject SEO vars, then attach custom domain
      let latestDeployUrl: string | null = null;
      try {
        const projectResp = await fetch(`${VERCEL_API}/v9/projects/${projectName}`, { headers });
        const projectData = await projectResp.json();

        if (projectResp.ok && projectData.id) {
          const envResp = await fetch(`${VERCEL_API}/v9/projects/${projectData.id}/env`, { headers });
          const envData = await envResp.json();

          const envVarsToSet: Record<string, string> = {
            VITE_LEADPE_MODE: "live",
            VITE_SITE_URL: liveUrl,
          };
          if (seoData) {
            envVarsToSet.VITE_SEO_TITLE = (seoData.page_title || seoData.title || "").slice(0, 70);
            envVarsToSet.VITE_SEO_DESCRIPTION = (seoData.meta_description || seoData.description || "").slice(0, 160);
            envVarsToSet.VITE_SEO_KEYWORDS = seoData.keywords || "";
            envVarsToSet.VITE_SEO_H1 = seoData.h1_heading || seoData.h1 || "";
            envVarsToSet.VITE_SEO_OG_IMAGE = seoData.og_image || "";
          }

          for (const [key, value] of Object.entries(envVarsToSet)) {
            const existing = envData.envs?.find((e: any) => e.key === key);
            if (existing) {
              await fetch(`${VERCEL_API}/v9/projects/${projectData.id}/env/${existing.id}`, {
                method: "PATCH", headers,
                body: JSON.stringify({ value, target: ["production"] }),
              });
            } else {
              await fetch(`${VERCEL_API}/v10/projects/${projectData.id}/env`, {
                method: "POST", headers,
                body: JSON.stringify([{ key, value, type: "plain", target: ["production"] }]),
              });
            }
          }

          // Attach {subdomain}.leadpe.online to Vercel project
          if (USE_CUSTOM_DOMAIN) {
            const domainResp = await fetch(`${VERCEL_API}/v10/projects/${projectData.id}/domains`, {
              method: "POST", headers,
              body: JSON.stringify({ name: customDomain }),
            });
            if (!domainResp.ok) {
              const domainErr = await domainResp.json().catch(() => ({}));
              console.error(`[deploy_live] Domain attach failed for ${customDomain}:`, domainErr);
            } else {
              console.log(`[deploy_live] Attached ${customDomain} to ${projectName}`);
            }
          }

          // Trigger redeployment so VITE_LEADPE_MODE=live takes effect
          if (githubOrg && githubRepo) {
            const redeployResp = await fetch(`${VERCEL_API}/v13/deployments`, {
              method: "POST", headers,
              body: JSON.stringify({
                name: projectName,
                gitSource: { type: "github", org: githubOrg, repo: githubRepo, ref: "main" },
                projectSettings: { framework: "vite", buildCommand: "npm run build", outputDirectory: "dist" },
              }),
            });
            try {
              const redeployData = await redeployResp.json();
              if (redeployData?.url) latestDeployUrl = `https://${redeployData.url}`;
            } catch (_e) { /* ignore */ }
          }
        }
      } catch (vercelErr) {
        console.error("Vercel live deploy error:", vercelErr);
      }

      // Update build_requests
      await supabase.from("build_requests").update({
        status: "live",
        deploy_url: liveUrl,
        deployed_at: new Date().toISOString(),
      }).eq("id", buildRequestId);

      // Update profile (keep the intended subdomain — we'll re-attach it after DNS is fixed)
      if (userId) {
        await supabase.from("profiles").update({
          website_status: "live",
          site_url: liveUrl,
          subdomain: subdomain,
        }).eq("user_id", userId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          liveUrl,
          customDomainAttached: USE_CUSTOM_DOMAIN,
          intendedCustomDomain: customDomain,
          vercelDomain,
          latestDeployUrl,
          seo: seoData ? {
            title: seoData.page_title || seoData.title,
            description: seoData.meta_description || seoData.description,
            keywords: seoData.keywords,
          } : null,
        }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ══════════════════════════════════════════════
    // ACTION: status
    // ══════════════════════════════════════════════
    if (action === "status") {
      const { deploymentId } = data;
      const resp = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}`, { headers });
      const d = await resp.json();
      return new Response(
        JSON.stringify({ state: d.readyState, url: d.url ? `https://${d.url}` : null }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ══════════════════════════════════════════════
    // ACTION: add_custom_domain
    // ══════════════════════════════════════════════
    if (action === "add_custom_domain") {
      const { domain, buildRequestId, userId } = data;

      if (!domain || !domain.includes(".")) {
        return new Response(
          JSON.stringify({ error: "Invalid domain" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Find the Vercel project from build request
      const { data: br } = await supabase.from("build_requests")
        .select("*").eq("id", buildRequestId).single();

      if (!br) {
        return new Response(
          JSON.stringify({ error: "Build request not found" }),
          { status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const bName = (br.business_name || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20);
      const bCity = (br.city || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 10);
      const projectName = `leadpe-${bName}-${bCity}`.replace(/-+/g, "-").replace(/-$/, "");

      // Get Vercel project ID
      const projectResp = await fetch(`${VERCEL_API}/v9/projects/${projectName}`, { headers });
      const projectData = await projectResp.json();

      if (!projectResp.ok || !projectData.id) {
        return new Response(
          JSON.stringify({ error: "Vercel project not found" }),
          { status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Add custom domain to Vercel project
      const domainResp = await fetch(`${VERCEL_API}/v10/projects/${projectData.id}/domains`, {
        method: "POST", headers,
        body: JSON.stringify({ name: domain }),
      });
      const domainData = await domainResp.json();

      if (!domainResp.ok) {
        return new Response(
          JSON.stringify({ error: domainData.error?.message || "Failed to add domain" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Also add www variant
      await fetch(`${VERCEL_API}/v10/projects/${projectData.id}/domains`, {
        method: "POST", headers,
        body: JSON.stringify({ name: `www.${domain}` }),
      });

      return new Response(
        JSON.stringify({ success: true, domain }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // ══════════════════════════════════════════════
    // ACTION: verify_domain
    // ══════════════════════════════════════════════
    if (action === "verify_domain") {
      const { domain, buildRequestId, userId } = data;

      const { data: br } = await supabase.from("build_requests")
        .select("*").eq("id", buildRequestId).single();

      if (!br) {
        return new Response(
          JSON.stringify({ error: "Build request not found" }),
          { status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const bName = (br.business_name || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20);
      const bCity = (br.city || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 10);
      const projectName = `leadpe-${bName}-${bCity}`.replace(/-+/g, "-").replace(/-$/, "");

      const projectResp = await fetch(`${VERCEL_API}/v9/projects/${projectName}`, { headers });
      const projectData = await projectResp.json();

      if (!projectResp.ok || !projectData.id) {
        return new Response(
          JSON.stringify({ error: "Vercel project not found" }),
          { status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      // Check domain verification status
      const checkResp = await fetch(`${VERCEL_API}/v9/projects/${projectData.id}/domains/${domain}`, { headers });
      const checkData = await checkResp.json();

      const verified = checkData.verified === true;

      if (verified && userId) {
        await supabase.from("profiles").update({
          custom_domain_verified: true,
          site_url: `https://${domain}`,
        }).eq("user_id", userId);
      }

      return new Response(
        JSON.stringify({ verified, domain, details: checkData }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    console.error("Deploy function error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
