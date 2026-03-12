export interface TrialStatus {
  daysLeft: number;
  daysUsed: number;
  totalDays: number;
  isExpired: boolean;
  isTrialEning: boolean; // <= 3 days
  isWarning: boolean; // <= 7 days
  percentage: number;
  plan: string | null;
  isActive: boolean;
  isTrial: boolean;
}

export function getTrialStatus(profile: {
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  subscription_plan?: string | null;
  status?: string | null;
} | null): TrialStatus | null {
  if (!profile) return null;

  const now = new Date();
  const startDate = profile.trial_start_date ? new Date(profile.trial_start_date) : new Date();
  const endDate = profile.trial_end_date ? new Date(profile.trial_end_date) : new Date(Date.now() + 21 * 86400000);

  const totalDays = 21;
  const daysUsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / 86400000));
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));

  const isExpired = now > endDate;
  const isTrialEning = daysLeft <= 3 && !isExpired;
  const isWarning = daysLeft <= 7 && daysLeft > 3;

  return {
    daysLeft,
    daysUsed,
    totalDays,
    isExpired,
    isTrialEning,
    isWarning,
    percentage: Math.min(100, (daysUsed / totalDays) * 100),
    plan: profile.subscription_plan || null,
    isActive: profile.status === "active",
    isTrial: profile.status === "trial",
  };
}
