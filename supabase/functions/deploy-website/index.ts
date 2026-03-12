import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERCEL_API = "https://api.vercel.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
    if (!VERCEL_TOKEN) {
      return new Response(
        JSON.stringify({ error: "VERCEL_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, data } = await req.json();
    const headers = {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    };

    if (action === "deploy") {
      const { businessName, businessType, city, githubUrl, trialCode } = data;

      // Parse GitHub URL
      const cleaned = githubUrl.replace("https://", "").replace("http://", "").replace("github.com/", "");
      const parts = cleaned.split("/").filter(Boolean);
      const githubOrg = parts[0];
      const githubRepo = parts[1]?.replace(".git", "");

      if (!githubOrg || !githubRepo) {
        return new Response(
          JSON.stringify({ error: "Invalid GitHub URL format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          ],
        }),
      });

      const projectData = await createResp.json();
      console.log("Project create response:", createResp.status, JSON.stringify(projectData));

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
      console.log("Deploy response:", deployResp.status, JSON.stringify(deployData));

      if (!deployResp.ok) {
        return new Response(
          JSON.stringify({ error: deployData.error?.message || "Deployment failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          deployUrl: `https://${deployData.url}`,
          projectName,
          deploymentId: deployData.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "status") {
      const { deploymentId } = data;
      const resp = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}`, { headers });
      const d = await resp.json();
      return new Response(
        JSON.stringify({ state: d.readyState, url: d.url ? `https://${d.url}` : null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    console.error("Deploy function error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
