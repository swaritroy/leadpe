// ━━━ LeadPe Platform Constants ━━━

export const ADMIN_WHATSAPP = "919973383902";
export const TRIAL_DAYS = 21;
export const MONTHLY_PRICE = 299;
export const FOUNDING_SPOTS = 50;
export const FOUNDING_LEFT = 47;

export const PRICES = {
  growth_monthly: 299,
  pro_monthly: 999,
  basic_website: 800,
  standard_website: 1500,
  premium_website: 3000,
  custom_website: 5000,
  domain_addon: 999,
  revision_extra: 200,
} as const;

export const CODER_SHARE = 0.80;
export const LEADPE_SHARE = 0.20;
export const PASSIVE_PER_SITE = 30;

export const PLAN_PRICES: Record<string, number> = {
  basic: 0,
  trial: 0,
  growth: PRICES.growth_monthly,
  pro: PRICES.pro_monthly,
};

export const BUSINESS_TYPES = [
  "Coaching Centre",
  "Doctor / Clinic",
  "Lawyer / CA",
  "Salon / Parlour",
  "Gym / Fitness",
  "Plumber / Electrician",
  "Photographer",
  "Real Estate",
  "Restaurant",
  "Dance / Music Class",
  "Kirana / Grocery",
  "Tailor / Boutique",
  "Travel Agent",
  "Pest Control",
  "Other",
] as const;

export const LANGUAGES = [
  { code: "english", label: "🇬🇧 English" },
  { code: "hindi", label: "🇮🇳 Hindi" },
  { code: "hinglish", label: "⚡ Hinglish" },
] as const;

export const ORDER_STATUS_FLOW = [
  "pending",
  "building",
  "demo_ready",
  "approved",
  "paid",
  "live",
] as const;

export const BUILD_STATUS_FLOW = [
  "pending",
  "building",
  "review",
  "deploying",
  "live",
] as const;

export const UPI_ID = "9973383902@upi";
export const RAZORPAY_KEY_ID = "rzp_test_SNA8UASKNisTI9";
