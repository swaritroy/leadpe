---
name: Hybrid admin notification system
description: Twilio sends WA→SMS-fallback only to admin (9973383902). Client messages queue in scheduled_messages with whatsapp_url, surfaced in /admin Outbox for one-click manual send. Daily 9pm IST summary + coder_accepted alert.
type: feature
---

For MVP (first 10 clients) the platform uses a hybrid notification model.

**Twilio (admin-only, instant, WA→SMS fallback):**
The `notify-admin` edge function tries WhatsApp first via Twilio sandbox (`whatsapp:+14155238886` → `whatsapp:+919973383902`). If WA fails (24h sandbox session closed, 72h re-join required), it falls back to plain SMS using `TWILIO_SMS_FROM` (optional E.164 SMS-enabled number). Reminder text in SMS body: "Re-join sandbox every 72h: send 'join <code>' to +1 415 523 8886". Frontend uses `notifyAdmin(event_type, payload, client_message?)` from `src/lib/notify.ts`.

Events: business_signup, dev_signup, order_placed, **coder_accepted** (fired from DevDashboard accept flow), demo_ready, website_live, payment_received, new_lead, revision_requested, deadline_warning, daily_summary.

**Daily 9pm IST summary:**
`pg_cron` job `daily-admin-summary-9pm-ist` runs at `30 15 * * *` UTC, calls `daily-summary` edge function which counts last-24h signups/orders/demos/payment-total + outbox-pending and pings `notify-admin` with `event_type='daily_summary'`.

**Outbox (client-facing, manual):**
Every client message is inserted into `scheduled_messages` with `recipient_type='client'`, `status='queued_for_admin'`, and a pre-built `whatsapp_url` using `encodeURIComponent` (handles spaces, emojis, newlines, &). Admin views them in `/admin` → Outbox section (`src/components/admin/AdminOutbox.tsx`). Each card: client name, phone, editable textarea, green "Send via WhatsApp" → opens `wa.me` → marks row `sent_manual`. Filter chips: All / Welcome / Demo / Live / Lead / Payment / Trial nudge. Quick Reply panel with 5 templates. **"Mark all N as sent" bulk button** clears the visible filtered backlog in one click.

**process-messages worker:** Auto-sends only when `to === 9973383902`; all other recipients are flipped to `queued_for_admin`.

**Security:** `/admin` route is gated on `profiles.role === 'admin'`; non-admins are redirected. Outbox shows client phones/names — admin-only.

After 10 clients, evaluate Meta WhatsApp Business API for direct client sends.
