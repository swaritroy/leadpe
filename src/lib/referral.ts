import { supabase } from "@/integrations/supabase/client";

const REF_KEY = "leadpe_referral_code";
const REF_TS_KEY = "leadpe_referral_pending_at";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h

export function saveReferralCode(code: string) {
  try {
    localStorage.setItem(REF_KEY, code.trim().toUpperCase());
    localStorage.setItem(REF_TS_KEY, Date.now().toString());
  } catch {}
}

export function readPendingReferralCode(): string | null {
  try {
    const code = localStorage.getItem(REF_KEY);
    const ts = parseInt(localStorage.getItem(REF_TS_KEY) || "0", 10);
    if (!code) return null;
    if (!ts || Date.now() - ts > EXPIRY_MS) {
      clearPendingReferral();
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function clearPendingReferral() {
  try {
    localStorage.removeItem(REF_KEY);
    localStorage.removeItem(REF_TS_KEY);
  } catch {}
}

/**
 * After signup, attribute the new user to the referrer's code.
 * Safe to call multiple times — it skips if the user already has `referred_by`.
 */
export async function claimPendingReferral(newUserId: string): Promise<void> {
  const code = readPendingReferralCode();
  if (!code || !newUserId) return;

  try {
    // Skip if already claimed
    const { data: me } = await supabase
      .from("profiles")
      .select("referred_by, referral_code")
      .eq("user_id", newUserId)
      .maybeSingle();

    if (!me || me.referred_by) {
      clearPendingReferral();
      return;
    }

    // Find referrer
    const { data: referrer } = await supabase
      .from("profiles")
      .select("user_id, role")
      .eq("referral_code", code)
      .maybeSingle();

    if (!referrer || referrer.user_id === newUserId) {
      clearPendingReferral();
      return;
    }

    const referrerType =
      referrer.role === "vibe_coder" || referrer.role === "developer" ? "coder" : "business";

    // Update payee profile: discount + referred_by
    await (supabase.from("profiles") as any)
      .update({ referred_by: code, referral_discount: 100 })
      .eq("user_id", newUserId);

    // Insert referral row
    await (supabase.from("referrals") as any).insert({
      referrer_id: referrer.user_id,
      referrer_type: referrerType,
      referee_id: newUserId,
      referral_code: code,
      status: "pending",
    });
  } catch (e) {
    console.error("claimPendingReferral failed:", e);
  } finally {
    clearPendingReferral();
  }
}

export function buildReferralUrl(code: string): string {
  return `https://leadpe.online/ref/${code}`;
}

export function buildBusinessShareMessage(code: string): string {
  return `I built my website on LeadPe — ₹800, ready in 48 hours, customers come straight to WhatsApp. Sign up with my link and we both get ₹100 off: ${buildReferralUrl(code)}`;
}

export function buildCoderShareMessage(code: string): string {
  return `Get a professional website built on LeadPe — ₹800, ready in 48 hours. Sign up with my link and get ₹100 off your first website: ${buildReferralUrl(code)}`;
}
