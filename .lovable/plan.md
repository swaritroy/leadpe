
## Plan: Triple-channel messaging — MSG91 (SMS OTP) + Email (transactional) + WhatsApp/SMS reminders

### Part 1: MSG91 signup walkthrough (you do this — 5 minutes)

1. Go to **https://control.msg91.com/signup/**
2. Sign up with email + Indian mobile (free, no card)
3. Verify your mobile (you'll get an OTP from MSG91 itself — proof it works)
4. Once logged in, look at the **left sidebar** → click **"Auth"** (NOT "SMS")
5. Click **"Configure widget"** → it auto-creates an OTP widget
6. From the same Auth page, copy two values:
   - **Auth Key** (top-right under your profile, looks like `12345AbcDef...`)
   - **Widget ID** (in the widget config, looks like `356a4f...`)
7. Paste both in chat → I'll add as Lovable secrets `MSG91_AUTH_KEY` and `MSG91_WIDGET_ID`

**Free tier**: 100 OTPs/day forever, no DLT, no template approval, ₹0.

### Part 2: What I'll build (after you give me the keys)

**A. OTP login (developers) — `send-otp` + `verify-otp`**
- Primary: MSG91 SMS OTP via `https://control.msg91.com/api/v5/otp` (instant, no DLT)
- Fallback: If user clicks "Resend via Email", switch channel to email OTP
- Verify: MSG91 OTP verify endpoint, fallback to existing `otp_verifications` table for email codes

**B. Email channel — Lovable built-in transactional email**
- Set up email infrastructure (one tool call — auto-provisions queue + sender)
- Used for: OTP fallback, lead alerts, weekly reports, trial reminders, payment receipts
- Zero config from you — uses Lovable's verified sender

**C. Automated reminders & reports — keep & upgrade `process-messages`**
- Existing `pg_cron` job stays (runs every minute on `scheduled_messages` table)
- Refactor `process-messages` to route by message type:
  - `otp` → MSG91 SMS
  - `lead_alert`, `weekly_report`, `trial_warning`, `payment_receipt` → **Email** (free, unlimited via Lovable)
  - `signup_alert_admin` → Email to your inbox
- All 6 existing automated sequences (Day 7/18/21 trial warnings, lead alerts, weekly reports, payment confirmations, admin signup alerts, lead lock alerts) keep working — just delivered via email instead of broken SMS
- Later (when you afford ₹999/mo AiSensy): swap email → WhatsApp by editing one function

**D. UI updates**
- `StudioAuth.tsx`: Add "Get OTP via Email instead" link below SMS OTP input
- No other UI changes — backend swap is invisible to users

### Part 3: Files I'll change

| File | Change |
|---|---|
| `supabase/functions/send-otp/index.ts` | Rewrite: MSG91 primary + email fallback (channel param) |
| `supabase/functions/verify-otp/index.ts` | Add MSG91 verify + keep DB verify for email |
| `supabase/functions/process-messages/index.ts` | Route by type → MSG91 (OTP only) or Email (everything else) |
| `supabase/functions/send-whatsapp/index.ts` | Repurpose as `send-notification` — routes to email by default |
| `src/pages/StudioAuth.tsx` | Add "Get code via email" toggle |
| New: `supabase/functions/send-transactional-email/` | Auto-scaffolded by email setup tool |
| `supabase/functions/_shared/email-templates/` | 4 templates: otp, lead-alert, weekly-report, trial-warning |

### Part 4: Tools I'll run (in order)

1. `email_domain--setup_email_infra` (creates queue + send log)
2. `email_domain--scaffold_transactional_email` (creates `send-transactional-email` function)
3. Add secrets: `MSG91_AUTH_KEY`, `MSG91_WIDGET_ID` (you provide)
4. Rewrite 4 edge functions
5. Deploy all 4 via `supabase--deploy_edge_functions`
6. Test: SMS OTP to 9973383902, then test email OTP, then trigger one scheduled message manually

### Part 5: Cost & vision alignment

| Channel | Cost | Use |
|---|---|---|
| MSG91 SMS OTP | ₹0 (100/day free), ₹0.15 after | Dev login OTP |
| Lovable Email | ₹0 unlimited | Reminders, reports, lead alerts, OTP fallback |
| WhatsApp | Deferred to AiSensy ₹999/mo upgrade | Future leads/alerts when revenue justifies |

**Customer experience preserved**: Business owners still use Google OAuth (zero change). Developers get reliable SMS OTP. Lead alerts switch from broken SMS → email (works on every device, every network). When you upgrade to AiSensy later, only `process-messages` changes — UI and DB stay identical.

### Out of scope
- WhatsApp customer notifications (deferred — AiSensy upgrade)
- DLT registration (not needed — MSG91 OTP route is generic-template, pre-approved)
- Twilio cleanup (keep secrets dormant — no harm, useful if you swap providers later)

### Next step
You sign up at MSG91 → paste Auth Key + Widget ID → I execute end-to-end in one pass and test live OTP delivery to 9973383902.
