import { supabase } from "@/integrations/supabase/client";

export type NotifyEvent =
  | "business_signup"
  | "dev_signup"
  | "order_placed"
  | "coder_accepted"
  | "demo_ready"
  | "website_live"
  | "payment_received"
  | "new_lead"
  | "revision_requested"
  | "deadline_warning";

export interface ClientMessage {
  to: string; // phone digits
  message: string;
  type?: string;
  client_name?: string;
  business_id?: string;
}

/**
 * Fire-and-forget admin alert + optional client message queueing.
 * - Admin alert goes via Twilio to 9973383902 (instant WhatsApp).
 * - client_message gets queued in scheduled_messages → visible in /admin Outbox.
 */
export async function notifyAdmin(
  event_type: NotifyEvent,
  payload: Record<string, any> = {},
  client_message?: ClientMessage,
): Promise<void> {
  try {
    await supabase.functions.invoke("notify-admin", {
      body: { event_type, payload, client_message },
    });
  } catch (err) {
    console.error("notifyAdmin failed:", err);
  }
}
