import { supabase } from "@/integrations/supabase/client";

export type AuthEventName =
  | "callback_started"
  | "intent_detected"
  | "session_error"
  | "profile_missing"
  | "profile_loaded"
  | "role_promotion_attempt"
  | "role_promotion_success"
  | "role_promotion_failed"
  | "redirect"
  | "referral_claim_failed";

export interface AuthEventPayload {
  event: AuthEventName;
  userId?: string | null;
  email?: string | null;
  intent?: string | null;
  previousRole?: string | null;
  newRole?: string | null;
  promoted?: boolean;
  redirectTo?: string | null;
  details?: Record<string, unknown>;
  error?: string | null;
}

/**
 * Log a structured auth/OAuth flow event to Supabase.
 * Failures are swallowed — logging must never break auth.
 */
export async function logAuthEvent(payload: AuthEventPayload): Promise<void> {
  try {
    await supabase.from("auth_events").insert({
      user_id: payload.userId ?? null,
      email: payload.email ?? null,
      event: payload.event,
      intent: payload.intent ?? null,
      previous_role: payload.previousRole ?? null,
      new_role: payload.newRole ?? null,
      promoted: payload.promoted ?? false,
      redirect_to: payload.redirectTo ?? null,
      details: (payload.details ?? {}) as never,
      error: payload.error ?? null,
    });
  } catch (err) {
    // Never throw from a logger
    // eslint-disable-next-line no-console
    console.warn("[authEvents] log failed", err);
  }
}
