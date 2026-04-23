import { supabase } from "@/integrations/supabase/client";

export interface DeployRequest {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  githubUrl: string;
  trialCode: string;
}

export interface DeployResult {
  success: boolean;
  deployUrl?: string;
  projectName?: string;
  deploymentId?: string;
  error?: string;
}

export async function deployWebsite(request: DeployRequest): Promise<DeployResult> {
  try {
    const { data, error } = await supabase.functions.invoke("deploy-website", {
      body: {
        action: "deploy",
        data: {
          businessName: request.businessName,
          businessType: request.businessType,
          city: request.city,
          githubUrl: request.githubUrl,
          trialCode: request.trialCode,
        },
      },
    });

    if (error) {
      console.log("Deploy invoke error:", error);
      return { success: false, error: error.message };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      deployUrl: data.deployUrl,
      projectName: data.projectName,
      deploymentId: data.deploymentId,
    };
  } catch (err: any) {
    console.log("Deploy error:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

export async function checkDeployStatus(deploymentId: string): Promise<{ state: string; url: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("deploy-website", {
      body: { action: "status", data: { deploymentId } },
    });
    if (error || data?.error) return { state: "building", url: null };
    return { state: data.state, url: data.url };
  } catch {
    return { state: "building", url: null };
  }
}
