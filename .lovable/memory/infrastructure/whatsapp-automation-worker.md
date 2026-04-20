---
name: Hybrid admin notification system
description: Twilio sends only to admin (9973383902). Client messages queue in scheduled_messages with whatsapp_url, surfaced in /admin Outbox for one-click manual send via wa.me.
type: feature
---

For MVP (first 10 clients) the platform uses a hybrid notification model.

**Twilio (admin-only, instant):**
The `notify-admin` edge function sends a WhatsApp message to the admin (9973383902) via the Twilio connector gateway for every key event: business signup, dev signup, order placed, coder accept, demo ready, website live, payment received, new lead, revision requested, deadline warning. Frontend uses `notifyAdmin(event_type, payload, client_message?)` from `src/lib/notify.ts`.

**Outbox (client-facing, manual):**
Every client message is inserted into `scheduled_messages` with `recipient_type='client'`, `status='queued_for_admin'`, and a pre-built `whatsapp_url` (`https://wa.me/<digits>?text=<encoded>`). The admin views these in `/admin` → Outbox section (`src/components/admin/AdminOutbox.tsx`). Each card shows client name, phone, editable message, and a green "Send via WhatsApp" button that opens `wa.me` in a new tab and marks the row `sent_manual`. Filter chips: All / Welcome / Demo / Live / Lead / Payment / Trial nudge. A Quick Reply panel offers 5 ready-made templates.

**process-messages worker:** Auto-sends only when `to === 9973383902`; all other recipients are flipped to `queued_for_admin`.

After 10 clients, evaluate Meta WhatsApp Business API for direct client sends.
