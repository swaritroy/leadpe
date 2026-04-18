
User's concern: businesses (kirana owners, MSMEs) live on WhatsApp, not email. The LeadPe core promise is "Naya Customer, Seedha Aapke Phone Pe 🔔" — leads must hit WhatsApp. Email-only for business notifications breaks the brand promise.

Reality check on channels for business notifications:
- **Twilio WhatsApp Sandbox**: free, but each business must send `join <code>` to a US number first → kirana owners won't do this. Dead-end for production.
- **Twilio WhatsApp Production**: needs Meta Business verification (7-14 days) + ₹0.45/msg + template approval. Works long-term.
- **AiSensy/Wati**: ₹999-2500/mo + Meta verification. Same timeline.
- **MSG91 WhatsApp**: ₹0.50/msg, also needs Meta verification.
- **SMS via MSG91 OTP route**: works instantly, no DLT, ₹0.15/msg, 100/day free — works TODAY for lead alerts.

Honest answer: **WhatsApp for businesses is blocked by Meta verification (7-14 days)** — there is no zero-friction shortcut. But businesses MUST get instant lead alerts or the platform dies.

## Plan: Hybrid notification — SMS now (works today), WhatsApp ready (flip switch when Meta approves)

### Channel routing by audience

| Audience | Channel | Why |
|---|---|---|
| Developers (login OTP) | Email OTP (Supabase built-in) — already done ✅ | Tech-literate, instant, ₹0 |
| **Businesses (lead alerts, reminders)** | **MSG91 SMS now** → WhatsApp later | Works on every Indian phone, no app needed, instant |
| Admin alerts (signups, payouts) | Email | You check email |

### Why SMS for businesses (not email)
- Kirana owner's phone buzzes the second a lead arrives — same UX as WhatsApp
- No app install, no internet needed, no spam folder
- MSG91 OTP route is pre-approved (no DLT, no template wait) for transactional alerts
- ₹0.15/msg × 100 leads/mo = ₹15/business/month — absorbed in ₹299 Growth plan
- When Meta approves WhatsApp later, swap one function (`process-messages`) → users see WhatsApp instead of SMS, zero UI change

### Build steps

**1. You sign up at MSG91** (5 min, walkthrough already given last message)
- Get `MSG91_AUTH_KEY` (for SMS sending)
- For SMS sending route, also need a **Sender ID** (6 chars, e.g. `LEADPE`) — auto-approved on free tier

**2. I rewrite `process-messages` edge function**
- Reads `scheduled_messages` table (cron already runs every minute — keep as-is)
- Routes by `type` field:
  - `lead_alert`, `trial_warning`, `payment_receipt`, `weekly_report` → MSG91 SMS to business WhatsApp number
  - `admin_alert` (signups, payout requests) → Email to your admin inbox
- Logs to `message_log` (already exists)

**3. I add an "active_channel" config flag** in a new `platform_config` table
- Default: `sms`
- Future value: `whatsapp` (when Meta approves)
- `process-messages` reads this flag → switches provider without code change

**4. Existing flows preserved**
- Lead capture in dashboard → inserts into `scheduled_messages` with type `lead_alert` (already wired)
- Day 7/18/21 trial warnings → already insert into `scheduled_messages`
- Weekly reports → already insert into `scheduled_messages`
- All 6 sequences keep working — just delivery channel changes from broken Twilio → working MSG91 SMS

**5. UI: add tiny "Notification preference" toggle in `ClientSettings.tsx`**
- "Get lead alerts via: ☑ SMS  ☐ WhatsApp (coming soon)"
- Stored in `profiles.notification_channel`
- Future-proofs the WhatsApp opt-in flow

### What customers experience tomorrow
- Customer fills lead form on kirana website → kirana owner's phone buzzes within 60 seconds with SMS: *"New lead from Rajesh (98xxxxxx12) for your shop. Call now: leadpe.tech/dashboard"*
- Same UX as WhatsApp — buzz, read, call back
- Brand promise intact: "Seedha Aapke Phone Pe 🔔" (just SMS not WhatsApp for now)

### Migration to WhatsApp later (when Meta approves you, ~2 weeks)
- One file change: `process-messages/index.ts` → swap MSG91 SMS API call for AiSensy/Twilio WhatsApp API call
- Flip `platform_config.active_channel` from `sms` to `whatsapp`
- Zero downtime, zero customer-side change

### Files I'll touch
| File | Change |
|---|---|
| `supabase/functions/process-messages/index.ts` | Rewrite: route by type → MSG91 SMS or email |
| `supabase/functions/send-otp/index.ts` | Delete (developer email OTP via Supabase replaces it) |
| `supabase/functions/send-whatsapp/index.ts` | Repurpose as `send-business-notification` wrapper |
| `src/pages/ClientSettings.tsx` | Add notification channel toggle |
| New migration | `platform_config` table + `profiles.notification_channel` column |
| New: `supabase/functions/send-admin-email/` | Lovable email for admin alerts |

### Out of scope (explicit)
- WhatsApp Business API setup (deferred — needs Meta verification, you start that paperwork in parallel)
- DLT registration (not needed — MSG91 OTP/transactional route is pre-approved)
- Customer-facing WhatsApp Web Click-to-Chat (already in widget, unchanged)

### Cost summary
- Developer login: ₹0 (Supabase email OTP)
- Business lead alerts: ₹15/business/mo at 100 leads (covered by ₹299 plan)
- Admin emails: ₹0 (Lovable email)
- Total marginal cost: ~5% of revenue — sustainable

### Next steps
1. You sign up at MSG91, paste `MSG91_AUTH_KEY` + `MSG91_SENDER_ID` (e.g. `LEADPE`)
2. I execute end-to-end: rewrite `process-messages`, add config table, deploy, test live SMS to 9973383902
3. In parallel, you start Meta WhatsApp Business verification (I'll give checklist) — when approved, we flip the switch
