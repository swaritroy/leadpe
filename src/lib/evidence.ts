import { supabase } from "@/integrations/supabase/client";

export async function logEvent(
  orderId: string,
  event: string,
  details?: string
) {
  await (supabase as any).from("order_timeline").insert({
    order_id: orderId,
    event,
    details: details || null,
    timestamp: new Date().toISOString(),
  });
}

export const ORDER_EVENTS = {
  ORDER_PLACED: "ORDER_PLACED",
  WHATSAPP_VERIFIED: "WHATSAPP_VERIFIED",
  CODER_ASSIGNED: "CODER_ASSIGNED",
  BUILD_STARTED: "BUILD_STARTED",
  DEMO_SUBMITTED: "DEMO_SUBMITTED",
  DEMO_SENT_TO_CUSTOMER: "DEMO_SENT_TO_CUSTOMER",
  DEMO_VIEWED_BY_CUSTOMER: "DEMO_VIEWED_BY_CUSTOMER",
  DEMO_APPROVED: "DEMO_APPROVED",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  SITE_WENT_LIVE: "SITE_WENT_LIVE",
  CODER_PAID: "CODER_PAID",
} as const;
