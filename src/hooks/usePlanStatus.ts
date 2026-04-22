import { useAuth } from "./useAuth";

/**
 * Single source of truth for trial / growth / free status.
 * Reads new columns (trial_started_at, trial_ends_at, growth_started_at, growth_ends_at, plan_type)
 * with backward-compat to the legacy trial_start_date / trial_end_date.
 */
export function usePlanStatus() {
  const { profile } = useAuth();
  const p = profile as any;

  const now = Date.now();
  const trialEndStr = p?.trial_ends_at || p?.trial_end_date || null;
  const growthEndStr = p?.growth_ends_at || p?.plan_renewal_date || null;
  const trialEnd = trialEndStr ? new Date(trialEndStr).getTime() : 0;
  const growthEnd = growthEndStr ? new Date(growthEndStr).getTime() : 0;

  const planType: "trial" | "free" | "growth" =
    (p?.plan_type as any) || (trialEnd > now ? "trial" : "free");

  const isGrowthActive = planType === "growth" && growthEnd > now;
  const isTrialActive = !isGrowthActive && planType === "trial" && trialEnd > now;
  const isFree = !isGrowthActive && !isTrialActive;

  const trialDaysLeft = Math.max(
    0,
    Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
  );
  const growthDaysLeft = Math.max(
    0,
    Math.ceil((growthEnd - now) / (1000 * 60 * 60 * 24))
  );

  const features = {
    websiteLive: true, // always
    whatsappAlerts: isTrialActive || isGrowthActive,
    googleVisibility: isTrialActive || isGrowthActive,
    weeklyReport: isTrialActive || isGrowthActive,
    customerDetails: isTrialActive || isGrowthActive,
    monthlyChanges: isGrowthActive,
    prioritySupport: isGrowthActive,
    customDomain: isGrowthActive,
  };

  return {
    isTrialActive,
    isGrowthActive,
    isFree,
    trialDaysLeft,
    growthDaysLeft,
    features,
    planType,
  };
}

export default usePlanStatus;
