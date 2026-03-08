import { supabase } from "@/integrations/supabase/client";

export async function updateCoderEarnings(
  coderId: string,
  buildRequest: {
    id: string;
    coder_earning: number;
    business_name: string;
  }
) {
  // Add building fee to earnings
  await (supabase as any).from("earnings").insert({
    vibe_coder_id: coderId,
    type: "building",
    amount: buildRequest.coder_earning,
    deployment_id: buildRequest.id,
    month: new Date().toISOString().slice(0, 7),
    paid: false,
    created_at: new Date().toISOString(),
  });

  // Update profile totals
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", coderId)
    .maybeSingle();

  if (profile) {
    const totalEarned = ((profile as any).total_earned || 0) + buildRequest.coder_earning;
    const totalBuilt = ((profile as any).total_sites_built || 0) + 1;
    const totalLive = ((profile as any).total_sites_live || 0) + 1;

    await (supabase as any)
      .from("profiles")
      .update({
        total_earned: totalEarned,
        total_sites_built: totalBuilt,
        total_sites_live: totalLive,
        monthly_passive: totalLive * 30,
      })
      .eq("user_id", coderId);
  }
}
