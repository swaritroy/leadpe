

# LeadPe — Complete Codebase Audit

---

## 1. WHAT IS WORKING

- **Business phone/password auth**: Sign up with phone + password creates a Supabase auth account, profile row via `handle_new_user` trigger, and user_roles entry. Sign in works. Duplicate phone detection works. Terms checkbox enforced.
- **Coder phone/OTP auth**: StudioAuth signup sends OTP via `send-otp` edge function (Fast2SMS `q` route), verifies via `verify-otp`, creates account with `vibe_coder` role. Test mode fallback shows OTP in toast if SMS fails.
- **Google OAuth flow**: Button calls `lovable.auth.signInWithOAuth("google")`, redirects to `/auth/callback`. AuthCallback checks profile completeness and routes correctly to `/onboarding` or `/client/dashboard`.
- **Onboarding page**: Shows only missing fields. Updates profile and redirects to dashboard.
- **GetWebsite 4-step wizard**: Business details (step 1) auto-fills from profile. Package selection (step 2) with 3 tiers. Assets/color/details (step 3). Submits order + build_request + AI prompt generation via `ai-generate` edge function.
- **Client Dashboard state machine**: State A (no website) → State B (pending/building/demo_ready) → State C (live) → State Expired. Each renders a dedicated component.
- **Client Dashboard realtime**: Subscribes to `build_requests` and `profiles` changes. Leads subscription on `businesses.id` match.
- **Dev Dashboard**: Fetches available pending requests filtered by `status=pending, assigned_coder_id=null, hard_deadline>now()`. Shows active builds. Earnings tab with totals. Profile edit tab.
- **Accept button with race-condition handling**: Optimistic UI removal + `.is("assigned_coder_id", null).eq("status", "pending")` guard. Max 3 active builds enforced.
- **Realtime on Dev Dashboard**: Removes cards accepted by others. Adds new requests via INSERT listener. 60-second expiry pruning interval.
- **BriefModal**: 3-tab modal (Prompt/Info/Submit). Prompt caching in `build_requests.ai_prompt`. Fallback prompt if AI fails. GitHub URL validation. Quality check via `checkWebsiteQuality`. Deploy via Vercel API.
- **Payment page**: Razorpay integration (create order, verify signature). UPI manual fallback with "I Have Paid" flow. Gate check via `sessionStorage.upgrade_intent`. Realtime subscription for activation.
- **Razorpay edge function**: Creates orders, verifies HMAC signature, updates payments/orders/profiles/build_requests, triggers Vercel redeployment (demo→live), sends WhatsApp to owner and coder, logs coder earnings.
- **Deploy edge function**: Parses GitHub URL, creates Vercel project, triggers deployment, polls status for 3 minutes.
- **Auto-release edge function**: Handles 3 cases — 24hr admin alert, 48hr order expiry, coder missed deadline release.
- **Route protection**: ProtectedRoute checks auth + role, redirects appropriately. PublicRoute redirects logged-in users.
- **Admin panel**: 1500-line admin page with overview stats, business management, builds management, coder management, messages, and activation panel.
- **Trial system**: `getTrialStatus()` calculates days remaining from profile dates. Trial bar in dashboard with color-coded urgency.
- **Terms page**: Full terms and conditions at `/terms`.

---

## 2. WHAT IS BROKEN

| Issue | File | Why |
|---|---|---|
| **`ratings` table does not exist** | `src/components/dashboard/StateCLive.tsx:84` | Code inserts into `ratings` table but no migration creates it. Will throw RLS/404 error when rating is submitted. |
| **`feedback` table does not exist** | `src/components/dashboard/StateCLive.tsx:102` | Same — code inserts into `feedback` but table was never created. |
| **`name_changes_this_month` column missing** | `src/pages/DevDashboard.tsx:302-316` | Profile update references columns `name_changes_this_month` and `number_changes_this_month` which don't exist in `profiles` table. Update will silently fail or error. |
| **Leads never save for business clients** | `src/pages/ClientDashboard.tsx:60-68` | Leads are fetched via `businesses.id` but the `businesses` table row is never created during the order flow. `GetWebsite.tsx` inserts into `orders` and `build_requests` but never into `businesses`. So `business` is always null → leads never load. |
| **Lead widget uses `user.id` as `business_id`** | `src/pages/GetWebsite.tsx:143` | The lead widget HTML hardcodes `business_id` as `user?.id` (auth UUID), but the `leads` table's INSERT RLS requires `EXISTS (SELECT 1 FROM businesses WHERE id = leads.business_id)`. Since no `businesses` row exists, lead inserts from the widget will fail. |
| **DevDashboard queries `ratings` join** | `src/pages/DevDashboard.tsx:229` | `.select("*, ratings(rating)")` — no `ratings` table and no foreign key relation. Will error. |
| **Google OAuth may fail** | `src/pages/Auth.tsx:34` | Uses `lovable.auth.signInWithOAuth("google")` — depends on Google provider being configured in the backend. If not configured, users see an error. |
| **OTP security: test OTP shown in toast** | `src/pages/StudioAuth.tsx:71` | If Fast2SMS fails or API key missing, the actual OTP is shown in a client-side toast. Fine for testing, a security hole in production. |
| **BriefModal WhatsApp messages in Hinglish** | `src/components/BriefModal.tsx:207` | "Aapki website preview ready hai!" — should be English per project rules. |
| **`deploy_url` vs `demo_url` column confusion** | Multiple files | `build_requests` table has `deploy_url` but code also writes to `demo_url` (BriefModal.tsx:199) which doesn't exist in the schema. The `update` silently ignores the unknown column. |
| **StateBBuilding typo** | `src/components/dashboard/StateBBuilding.tsx:89` | "We are fining the right builder" should be "finding". |

---

## 3. MISSING FEATURES

- **`ratings` and `feedback` tables**: Referenced in code but never created via migration.
- **`businesses` table auto-creation**: The order flow never inserts a row into `businesses`, so leads RLS policy blocks all lead captures.
- **File uploads for logo/photos**: GetWebsite has file inputs but never uploads to Supabase Storage. Files are captured in local state but discarded on submit.
- **Subscription renewal / pg_cron for trial expiry**: `trialManager.ts` checks trial status client-side only. No server-side cron to auto-expire trials or send WhatsApp reminders.
- **Google Indexing API call**: Referenced in plans but never implemented.
- **Razorpay Payout API for coders**: Earnings are logged but actual UPI payouts are manual.
- **Passive income schedule**: No `passive_income_schedule` table or monthly payout logic.
- **Coder notification dropdown**: Bell icon exists in DevDashboard but uses hardcoded empty array, no actual notification data source.
- **Change request tracking**: `ChangeRequestSheet` component exists but the revision flow (updating `revision_count`, storing revision feedback) isn't fully connected to a column or notification system.

---

## 4. DATABASE ISSUES

| Issue | Severity |
|---|---|
| **Missing table: `ratings`** — code writes to it, will fail | CRITICAL |
| **Missing table: `feedback`** — code writes to it, will fail | CRITICAL |
| **Missing columns: `name_changes_this_month`, `number_changes_this_month`** on `profiles` | HIGH |
| **Missing column: `demo_url`** on `build_requests` — code writes to it but column doesn't exist (uses `deploy_url` instead) | MEDIUM |
| **`leads` INSERT RLS requires `businesses` row** — but `businesses` rows are never created | CRITICAL — blocks entire lead capture |
| **`otp_verifications` has wide-open RLS** — anyone can SELECT/UPDATE/DELETE all OTPs | HIGH — security risk |
| **`orders` table has open RLS** — anyone can read/update any order | HIGH — security risk |
| **`business_seo` table has open RLS** — anyone can read/write any SEO data | MEDIUM |
| **`scheduled_messages` has open RLS** — anyone can read all messages | MEDIUM |
| **`coder_penalties.coder_id` references `profiles.id` (not `profiles.user_id`)** — but code uses `user.id` everywhere | MEDIUM — may break if IDs don't match |

---

## 5. SECURITY ISSUES

| Issue | Severity |
|---|---|
| **VITE_TWILIO credentials in `.env`** — `VITE_TWILIO_ACCOUNT_SID` and `VITE_TWILIO_AUTH_TOKEN` are in `.env` with `VITE_` prefix, exposing them in the browser bundle | CRITICAL |
| **Razorpay test key hardcoded in `constants.ts`** | HIGH — `rzp_test_SNA8UASKNisTI9` exposed client-side. Must use live key from server. |
| **UPI ID hardcoded in `constants.ts`** | LOW — intentional for payment display |
| **Admin WhatsApp number hardcoded** | LOW — intentional |
| **OTP returned in response body** when SMS fails (`send-otp` edge function) | HIGH — security risk in production |
| **`otp_verifications` RLS allows anyone to read all OTPs** | CRITICAL — attacker can read any OTP without auth |
| **`orders` table RLS allows anyone to read/update any order** | HIGH |
| **No rate limiting on OTP sends** | MEDIUM — can be abused for SMS bombing |
| **Auto-confirm likely enabled** — signups work without email verification | MEDIUM |

---

## 6. PERFORMANCE ISSUES

| Issue | File |
|---|---|
| **DevDashboard `fetchData()` called from earnings realtime listener** | `DevDashboard.tsx:280` — any earnings change triggers full refetch of all data |
| **No error boundaries** | Entire app — a crash in any dashboard component takes down the whole page |
| **Admin page is 1504 lines** | `Admin.tsx` — single massive component, slow to parse/render |
| **`as any` casts everywhere** | Multiple files — bypasses TypeScript safety, hides runtime errors |
| **Splash screen delays initial load by 800ms** | `App.tsx` — every page load has an artificial 800ms delay |

---

## 7. ENVIRONMENT VARIABLES

| Variable | Status |
|---|---|
| `VITE_SUPABASE_URL` | CONFIGURED |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | CONFIGURED |
| `VITE_SUPABASE_PROJECT_ID` | CONFIGURED |
| `VITE_TWILIO_ACCOUNT_SID` | HARDCODED in `.env` — should NOT be VITE_ prefixed |
| `VITE_TWILIO_AUTH_TOKEN` | HARDCODED in `.env` — CRITICAL: exposed in browser |
| `VITE_TWILIO_WHATSAPP_FROM` | HARDCODED in `.env` — should NOT be VITE_ prefixed |
| `VITE_ADMIN_WHATSAPP` | HARDCODED in `.env` — low risk (public number) |
| `FAST2SMS_API_KEY` | CONFIGURED (edge function secret) |
| `VERCEL_TOKEN` | CONFIGURED (edge function secret) |
| `RAZORPAY_KEY_ID` | CONFIGURED (edge function secret) + HARDCODED in `constants.ts` |
| `RAZORPAY_KEY_SECRET` | CONFIGURED (edge function secret only) |
| `VITE_ANTHROPIC_API_KEY` | CONFIGURED (edge function secret) |
| `LOVABLE_API_KEY` | CONFIGURED (edge function secret) |
| Google OAuth Client ID/Secret | MISSING — needed in backend auth config for Google sign-in |

---

## 8. PRODUCTION READINESS SCORE

### **35 / 100**

**Blocking production launch:**

1. **Leads cannot be captured** — the entire revenue model (leads → WhatsApp → business pays) is broken because `businesses` rows are never created, and the leads INSERT RLS blocks all inserts.
2. **Ratings and feedback tables don't exist** — the live dashboard will crash when users try to rate.
3. **Twilio credentials exposed in browser** — anyone can extract them from the JS bundle.
4. **OTP table is completely open** — anyone can read any OTP without authentication.
5. **Google OAuth not configured** — the "Continue with Google" button likely fails.
6. **Razorpay uses test keys** — no real payments can be processed.

**Must fix before first real client:**
- Create `businesses` row during order flow (or change leads RLS)
- Create `ratings` and `feedback` tables
- Remove VITE_TWILIO_ vars from `.env`
- Lock down `otp_verifications` RLS
- Switch to live Razorpay keys
- Configure Google OAuth or remove the button
- Fix the "fining" typo in StateBBuilding

---

## 9. PRIORITY FIX LIST

| # | Fix | Impact |
|---|---|---|
| 1 | **Create `businesses` row during order flow** (or change leads RLS to use `profiles.user_id`) — without this, zero leads can be saved | Revenue-blocking |
| 2 | **Create `ratings` and `feedback` tables** with proper schema and RLS | Dashboard crash |
| 3 | **Remove `VITE_TWILIO_*` from `.env`** — these are server secrets exposed client-side | Security critical |
| 4 | **Lock down `otp_verifications` RLS** — restrict to service_role only | Security critical |
| 5 | **Lock down `orders` table RLS** — restrict reads to owner + admin | Security |
| 6 | **Add missing `profiles` columns** (`name_changes_this_month`, `number_changes_this_month`) or remove references | Dev dashboard crash |
| 7 | **Fix `demo_url` column** — either add it to `build_requests` or use `deploy_url` consistently | Data loss |
| 8 | **Configure Google OAuth** in backend or remove the button | Broken UX |
| 9 | **Switch Razorpay to live keys** and remove hardcoded test key from `constants.ts` | Cannot collect money |
| 10 | **Remove OTP from response body** in production (the `test_otp` field) | Security |

