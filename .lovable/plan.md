## Plan

### 1. Fix admin → coder assignment so work persists in the coder dashboard
- Normalize `assigned_coder_id` to always be the auth `user_id` (the value the coder dashboard already filters on).
- In `Admin.tsx`, fix `assignCoder` and `assignCoderToOrder` to write the coder’s `user_id` (not `profiles.id`) plus `assigned_coder_name`.
- Update enrichment in `fetchData` so coder lookup uses `user_id`.
- Replace the post-assign full reload with optimistic local state updates plus a silent background refresh, so the page no longer appears to “reload”.

### 2. Make assigned work always visible in the coder builder panel
- The coder dashboard already filters by `assigned_coder_id = user.id`, so step 1 is enough for new assignments.
- Add a one-time backfill: rewrite any existing `build_requests.assigned_coder_id` and `orders.assigned_coder_id` that point to a `profiles.id` to use the matching `profiles.user_id`.

### 3. Fix deployment 0-score issue
- Update `quality-check` to detect the repository’s actual default branch (currently hardcoded to `main`) and fall back to `master` if needed, so valid repos no longer return score 0.
- Keep weighted scoring intact.

### 4. Make demo → live fully automatic after Stripe payment
- Update `payments-webhook` `handleCheckoutCompleted` to:
  - Look up the latest `build_requests` row for the user.
  - If it’s `demo_ready` and has a `github_url`, call `deploy-website` with `action: "deploy_live"`.
  - Mark the build `live` and notify business + admin via the existing notify pipeline.

### 5. Replace UTR-only manual payment with Number / Amount / UPI Name
- In `Payment.tsx`, replace the UTR field with three required fields: payer phone number, amount paid, UPI name.
- Save them in `payments` (new columns below) and send the same details to admin WhatsApp.
- Update the admin UPI verification card to show payer number, amount, and UPI name.

### 6. New admin “Manual Activation” controls
- Extend `ActivationPanel` with two admin-only actions per business:
  - “Move Demo → Live” — calls `deploy-website` `deploy_live`, marks build live, updates profile/business.
  - “Upgrade Trial → Growth” — sets `plan_type='growth'`, `plan_status='active'`, `plan_renewal_date`/`subscription_expiry` one year out, status active, sends WhatsApp.
- Update `handleVerifyUpiPayment` to also trigger `deploy_live` (currently only updates profile/website_status).

## Database changes
- Add columns to `payments`: `payer_phone text`, `payer_upi_name text`.
- Backfill: rewrite `build_requests.assigned_coder_id` and `orders.assigned_coder_id` from `profiles.id` to `profiles.user_id` where applicable.
- No RLS changes.

## Technical details
- Files I’ll touch:
  - `src/pages/Admin.tsx`
  - `src/components/admin/ActivationPanel.tsx`
  - `src/pages/Payment.tsx`
  - `supabase/functions/quality-check/index.ts`
  - `supabase/functions/payments-webhook/index.ts`
  - One Supabase migration (new columns + assignment backfill)
- Verification flow after build:

```text
1. Admin assigns build → DB shows assigned_coder_id = coder's user_id.
2. Coder logs out and back in → assigned build still visible in builder panel.
3. Quality check on a real repo (default branch master or main) → score > 0.
4. Demo deploy → demo_url stored, status = demo_ready.
5. Payment (Stripe OR manual UPI verify) → status auto = live, deploy_live triggered.
6. Manual UPI form sends Number / Amount / UPI Name to admin WhatsApp.
7. Admin can manually trigger Demo → Live and Trial → Growth from the Activation panel.
```

If you approve, I’ll run the migration first and then implement all of the above in one pass.