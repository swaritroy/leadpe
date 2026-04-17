
The user wants to clear all non-admin test accounts to start fresh for MVP testing.

Plan:
1. Identify admin accounts in `user_roles` (role='admin').
2. Delete from `auth.users` for all non-admin user_ids — this cascades to `profiles`, `user_roles`, `businesses`, `orders`, etc. via the existing trigger setup. Where no cascade exists, manually delete dependent rows first.
3. Tables to clean: `leads`, `orders`, `build_requests`, `deployments`, `earnings`, `payments`, `subscriptions`, `businesses`, `change_requests`, `coder_penalties`, `feedback`, `ratings`, `quality_reports`, `projects`, `business_seo`, `order_timeline`, `signups`, `otp_verifications`, `scheduled_messages`, `message_log`, `profiles`, `user_roles`, then `auth.users`.
4. Keep all admin user data intact.

Approach: Run a migration that:
- Saves admin user_ids
- Deletes all dependent table rows where owner/business/coder ≠ admin
- Truncates fully test-only tables (signups, otp_verifications, scheduled_messages, message_log, order_timeline, quality_reports — these have no admin ownership concept)
- Deletes non-admin profiles, user_roles
- Deletes non-admin auth.users (this also cleans up sessions)

After cleanup, MVP test checklist (you run manually):
- Sign up new business at `/auth` → onboarding → `/client/dashboard`
- Place a Get Website order → verify orders row + no auto-order bug
- Sign up coder at `/studio/auth` → verify lands on `/dev/onboarding`, never `/auth`
- Accept build → submit GitHub → quality check → deploy → verify `{slug}.vercel.app` URL on dashboard
- Verify auto-SEO row in `business_seo` after deploy
- Test Conversion Suite widget on live site (VCF, WhatsApp intent, calculator, social toasts)
- Test ₹1,500 Standard package shows POPULAR badge + ₹299 Growth add-on toggle on mobile (390px)

I'll present this concisely.

---

## Plan: Clear test accounts & MVP smoke test

### 1. Database cleanup (admin-safe)
Run a migration that preserves any user with `user_roles.role = 'admin'` and wipes everything else:

**Preserve**: admin auth users, their profiles, their user_roles, admin-owned data (if any).

**Delete (non-admin only)**:
- `leads`, `change_requests`, `ratings`, `feedback` (by business_id → owner)
- `orders`, `payments`, `subscriptions` (by user/business)
- `build_requests`, `deployments`, `earnings`, `coder_penalties`, `projects`, `quality_reports` (by coder/business)
- `business_seo`, `businesses` (by owner_id)
- `profiles`, `user_roles` (by user_id)
- `auth.users` (non-admin) — cascades sessions

**Truncate fully (no admin concept)**:
- `signups`, `otp_verifications`, `scheduled_messages`, `message_log`, `order_timeline`

### 2. MVP smoke test checklist (manual after cleanup)

| # | Flow | Expected |
|---|------|----------|
| 1 | Sign up business at `/auth` (Google) | Lands on `/onboarding`, no auto-order created |
| 2 | Complete onboarding → `/client/dashboard` | State A (no website), no orders row in DB |
| 3 | `/get-website` on mobile (390px) | No overflow, POPULAR badge on ₹1,500, Growth ₹299 toggle works |
| 4 | Submit order | One `orders` row, `[GROWTH_PLAN_OPTIN]` tag if toggled |
| 5 | Sign up coder at `/studio/auth` (new phone, OTP) | Lands on `/dev/onboarding`, never `/auth` or `/onboarding` |
| 6 | Coder accepts build → submits GitHub → deploy | `deploy_url = {slug}.vercel.app`, `business_seo` row created |
| 7 | Visit live site | View-source shows generated meta tags, Conversion Suite widget loads |
| 8 | Test widget | VCF download gated by phone, WhatsApp intent menu, calculator unlock, social toasts |
| 9 | Try `/studio/auth` with existing business phone | Inline error, NO redirect to `/onboarding` or `/auth` |
| 10 | Mark order paid via webhook | Dashboard refreshes, live URL shown, SEO injected to Vercel |

### 3. Bug-watch list (from recent fixes)
- Auto-order bug after login → must NOT recur (step 2)
- `/onboarding` glitch flicker for coders → must NOT recur (step 5)
- Studio→`/auth` redirect bug → must NOT recur (step 5, 9)
- OTP sent to invalid numbers → verify 10-digit check before send
- Mobile widget oversize → verify on 390px viewport

### Deliverables on approval
1. One migration: cleanup SQL preserving admins
2. After you run the smoke test, report any failing step and I'll patch the specific component/edge function

