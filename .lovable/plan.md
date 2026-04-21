
## Goal
- **Twilio → admin only**: Every key event sends a WhatsApp/SMS to YOU (9973383902) so you never miss activity.
- **Admin Outbox**: Every client-facing message that *would* have gone out is queued in the admin panel as a ready-to-send card with a "Send via WhatsApp" button (opens `wa.me` with pre-filled text → you tap send).
- MVP-only, scoped for first 10 clients. Twilio cost stays tiny (only YOUR number gets API messages).

## Events that trigger admin alerts (to 9973383902 via Twilio)
1. New business signup (name, city, WhatsApp, plan)
2. New developer signup (name, email, awaiting approval)
3. New order placed (business, package, ₹amount)
4. Coder accepts build (coder name, business, deadline)
5. Demo ready / submitted (demo URL)
6. Website deployed live (live URL)
7. Payment received (amount, business, plan)
8. New customer lead captured (business, customer name + phone)
9. Revision requested (business, request #)
10. Build deadline approaching / missed

## Events that queue in Admin Outbox (client-facing, you send manually)
- Welcome message to new business owner
- Welcome to new developer (with approval status)
- "Demo is ready" → business owner
- "Website is LIVE" → business owner
- "New lead 🔔" → business owner
- "Payment received, thank you" → business owner
- Day-3, Day-6 trial nudges → business owner
- Custom reply templates (5 ready-made: greeting, follow-up, payment reminder, thank you, support)

## Plan

### 1. Edge function: `notify-admin` (NEW)
- Single endpoint, called from app code on each event.
- Input: `{ event_type, payload }`.
- Sends formatted SMS to `9973383902` via Twilio gateway (`/Messages.json`, From = `TWILIO_WHATSAPP_FROM` for WA, or plain From for SMS).
- Logs to `message_log` (admin-readable).
- Uses connector gateway pattern (`LOVABLE_API_KEY` + `TWILIO_API_KEY` already set).

### 2. Edge function: `process-messages` (UNPAUSE for admin only)
- Re-enable Twilio sending **only when `to === 9973383902`**.
- All other recipients → status stays `queued_for_admin` (visible in Outbox, never auto-sent).

### 3. DB: extend `scheduled_messages`
- Add columns: `recipient_type` ('admin' | 'client'), `client_name`, `event_type`, `whatsapp_url` (generated `wa.me/?text=...`).
- No new table needed — reuse `scheduled_messages` + `message_log`.

### 4. App-side hooks (insert calls to `notify-admin` + queue client message)
Files to touch:
- `src/pages/Auth.tsx` → on signup success: notify admin "New business signup"
- `src/pages/StudioAuth.tsx` → on signup: notify admin "New dev signup, awaiting approval"
- `src/pages/Onboarding.tsx` / `src/pages/GetWebsite.tsx` → on order placed: notify admin + queue welcome to client
- `src/pages/Studio.tsx` (accept build) → notify admin
- `src/components/BriefModal.tsx` (submit demo/deploy) → notify admin + queue "demo ready" / "live" to client
- `supabase/functions/payments-webhook/index.ts` → notify admin on payment success
- Lead capture path (widget endpoint or `leads` insert trigger) → notify admin + queue "new lead" to client
- `src/components/RevisionRequestSheet.tsx` → notify admin

### 5. Admin Outbox UI (NEW component on `/admin`)
- New tab/section: **"Outbox 📬"**
- Lists all rows from `scheduled_messages` where `recipient_type='client'` and `status='queued_for_admin'`, newest first.
- Each card shows: client name + WhatsApp number, event type badge, message preview (editable textarea), big green **"Send via WhatsApp"** button → opens `https://wa.me/<number>?text=<encoded>` in new tab → marks row as `sent_manual` after click.
- Filter chips: All / Welcome / Demo / Live / Lead / Payment / Trial nudge.
- "Quick Replies" panel with 5 ready-made templates (one-click insert into custom number).

### 6. Memory updates
- Update `mem://infrastructure/whatsapp-automation-worker` → "Twilio sends only to admin (9973383902). Client messages queue to Admin Outbox for manual one-click send."

## ASCII flow
```text
[App event] ──► notify-admin ──► Twilio ──► 📱 9973383902 (instant)
     │
     └──► insert into scheduled_messages
              recipient_type='client'
              status='queued_for_admin'
              whatsapp_url='wa.me/...?text=...'
                        │
                        ▼
            /admin → Outbox tab → [Send via WhatsApp] → wa.me opens → you tap send
```

## Out of scope (MVP)
- No bulk send, no scheduling future sends, no auto-reply.
- Twilio Geo + SMS Pumping protection: I'll remind you to enable in Twilio console after deploy.
- After 10 clients, we re-evaluate Meta WhatsApp Business API for direct client sends.
