import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const VERCEL_API = "https://api.vercel.com";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

      const cleaned = githubUrl.replace("https://", "").replace("http://", "").replace("github.com/", "");
      const parts = cleaned.split("/").filter(Boolean);
      const githubOrg = parts[0];
      const githubRepo = parts[1]?.replace(".git", "");

      if (!githubOrg || !githubRepo) {
        return new Response(
          JSON.stringify({ error: "Invalid GitHub URL format" }),
          { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const projectName = `leadpe-${businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20)}-${city.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 10)}`.replace(/-+/g, "-").replace(/-$/, "");

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

      // Step 2: Trigger deployment
      const deployResp = await fetch(`${VERCEL_API}/v13/deployments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: projectName,
          gitSource: { type: "github", org: githubOrg, repo: githubRepo, ref: "main" },
          projectSettings: { framework: "vite", buildCommand: "npm run build", outputDirectory: "dist" },
        }),
      });

      const deployData = await deployResp.json();

      if (!deployResp.ok) {
        return new Response(
          JSON.stringify({ error: deployData.error?.message || "Deployment failed" }),
          { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }

      const deploymentId = deployData.id;
      const deployUrl = `https://${deployData.url}`;

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
            buildError = statusData.errorMessage || statusData.error?.message || "Build failed on Vercel";
            console.error("Deployment ERROR:", buildError);
          }
          
          if (finalState === "READY" || finalState === "ERROR") break;
        } catch (e) {
          console.error("Poll error:", e);
        }
      }

      // Step 4: Update build request based on final state
      if (buildRequestId) {
        if (finalState === "READY") {
          await supabase.from("build_requests").update({
            demo_url: finalUrl,
            deploy_url: finalUrl,
            status: "demo_ready",
            deployed_at: new Date().toISOString(),
          }).eq("id", buildRequestId);
        } else if (finalState === "ERROR") {
          // Mark as failed — dashboard will show failure state
          await supabase.from("build_requests").update({
            status: "failed",
            deploy_url: null,
          }).eq("id", buildRequestId);
        } else {
          // Timeout — still building
          await supabase.from("build_requests").update({
            demo_url: finalUrl,
            deploy_url: finalUrl,
            status: "review",
            deployed_at: new Date().toISOString(),
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
              message: `Your website preview is ready! 🎉 Login to review it: leadpe.tech`,
            }),
          });
        } catch (e) {
          console.error("WhatsApp send error:", e);
        }
      }

      if (finalState === "ERROR") {
        return new Response(
          JSON.stringify({
            success: false,
            error: buildError || "Build failed on deployment platform",
            state: "ERROR",
            projectName,
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

      const cleaned = br.github_url.replace("https://", "").replace("http://", "").replace("github.com/", "");
      const parts = cleaned.split("/").filter(Boolean);
      const githubOrg = parts[0];
      const githubRepo = parts[1]?.replace(".git", "");

      const bName = (br.business_name || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 20);
      const bCity = (br.city || "").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 10);
      const projectName = `leadpe-${bName}-${bCity}`.replace(/-+/g, "-").replace(/-$/, "");
      const customDomain = `${subdomain}.leadpe.tech`;

      // Update env var to live
      try {
        const projectResp = await fetch(`${VERCEL_API}/v9/projects/${projectName}`, { headers });
        const projectData = await projectResp.json();

        if (projectResp.ok && projectData.id) {
          // Update VITE_LEADPE_MODE to live
          const envResp = await fetch(`${VERCEL_API}/v9/projects/${projectData.id}/env`, { headers });
          const envData = await envResp.json();
          const existingEnv = envData.envs?.find((e: any) => e.key === "VITE_LEADPE_MODE");

          if (existingEnv) {
            await fetch(`${VERCEL_API}/v9/projects/${projectData.id}/env/${existingEnv.id}`, {
              method: "PATCH", headers,
              body: JSON.stringify({ value: "live", target: ["production"] }),
            });
          } else {
            await fetch(`${VERCEL_API}/v10/projects/${projectData.id}/env`, {
              method: "POST", headers,
              body: JSON.stringify([{ key: "VITE_LEADPE_MODE", value: "live", type: "plain", target: ["production"] }]),
            });
          }

          // Add custom domain
          await fetch(`${VERCEL_API}/v10/projects/${projectData.id}/domains`, {
            method: "POST", headers,
            body: JSON.stringify({ name: customDomain }),
          });

          // Trigger redeployment
          if (githubOrg && githubRepo) {
            await fetch(`${VERCEL_API}/v13/deployments`, {
              method: "POST", headers,
              body: JSON.stringify({
                name: projectName,
                gitSource: { type: "github", org: githubOrg, repo: githubRepo, ref: "main" },
                projectSettings: { framework: "vite", buildCommand: "npm run build", outputDirectory: "dist" },
              }),
            });
          }
        }
      } catch (vercelErr) {
        console.error("Vercel live deploy error:", vercelErr);
      }

      // Update build_requests
      await supabase.from("build_requests").update({
        status: "live",
        deploy_url: `https://${customDomain}`,
        deployed_at: new Date().toISOString(),
      }).eq("id", buildRequestId);

      // Update profile
      if (userId) {
        await supabase.from("profiles").update({
          website_status: "live",
          site_url: `https://${customDomain}`,
          subdomain: subdomain,
        }).eq("user_id", userId);
      }

      return new Response(
        JSON.stringify({ success: true, liveUrl: `https://${customDomain}` }),
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
