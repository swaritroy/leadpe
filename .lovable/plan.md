

## Goal
Build a complete two-sided referral system where both businesses and vibe coders can refer new businesses to LeadPe. Each successful conversion gives the referrer ₹100 credit (businesses) or ₹100 cash bonus (coders), and the new business gets ₹100 off their first order.

---

## 1. Database changes

### New table: `referrals`
```sql
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,           -- profile.user_id of referrer
  referrer_type text not null,         -- 'business' | 'coder'
  referee_id uuid,                     -- profile.user_id of new signup (null until signup)
  referral_code text not null,         -- the code used (e.g. LP-AB12CD)
  status text not null default 'pending', -- pending | converted | rewarded
  reward_amount integer default 0,
  converted_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz default now()
);
create index idx_referrals_referrer on public.referrals(referrer_id);
create index idx_referrals_code on public.referrals(referral_code);
```
RLS:
- Owners read own referrals (`referrer_id = auth.uid()` OR `referee_id = auth.uid()`)
- Service role manages all
- Authenticated insert when `referee_id = auth.uid()`

### `profiles` columns to add
- `referral_code text unique` — auto-filled `LP-XXXXXX` for every user
- `referral_discount integer default 0` — credit balance in ₹
- `referral_bonus_total integer default 0` — coder lifetime bonus
- `referred_by` already exists ✅

### `handle_new_user` trigger update
Generate `referral_code = 'LP-' || upper(substring(md5(random()::text), 1, 6))` on profile creation.

### Backfill
One-time UPDATE to give existing profiles a `referral_code`.

---

## 2. Routing

`src/App.tsx` — add public route:
```tsx
<Route path="/ref/:code" element={<Referral />} />
```

---

## 3. New page: `src/pages/Referral.tsx`

- Read `:code` from URL params.
- Validate the code exists by querying `profiles.referral_code`.
- Show top banner (green `#00C853`):
  > "Your friend invited you! Sign up and get ₹100 off your first website."
- Save `localStorage.setItem('referral_code', code)` and `referral_pending_at` timestamp (24 h expiry).
- Render the existing `<Auth />` flow underneath (reused, not duplicated).
- After signup completes, the auth callback claims the code (see step 4).

---

## 4. Signup attribution — `src/pages/AuthCallback.tsx`

After session establishes and profile is loaded, run a `claimReferralCode()` helper:
1. Read `localStorage.referral_code`.
2. Look up `profiles` where `referral_code = code` to find `referrer_id` + `role`.
3. Skip if `referrer_id == new_user_id` (self-refer).
4. UPDATE new user's `profiles`: `referred_by = code`, `referral_discount = 100`.
5. INSERT into `referrals`: referrer_id, referrer_type (business/coder), referee_id, referral_code, status=`pending`.
6. `localStorage.removeItem('referral_code')`.

---

## 5. Business dashboard — `src/components/dashboard/StateCLive.tsx`

Add a new "Refer a Friend" card (rendered only when website is live):

- Heading: **"Refer a Friend — Both Win"**
- Sub: "Refer any business — both of you get ₹100 off."
- Read-only input: `https://leadpe.online/ref/{profile.referral_code}` + Copy icon.
- WhatsApp share button → `https://wa.me/?text=` with prefilled English message:
  > "I built my website on LeadPe — ₹800, ready in 48 hours, customers come straight to WhatsApp. Sign up with my link and we both get ₹100 off: https://leadpe.online/ref/CODE"
- Stats row (3 mini cards), fetched from `referrals` where `referrer_id = me`:
  - Invited: count of all rows
  - Converted: count where status in (`converted`,`rewarded`)
  - Credit earned: `referral_discount` from profile (₹)

Same component logic encapsulated in a small reusable `<ReferralCard />` so the coder studio can reuse it.

---

## 6. Apply discount at payment — `src/pages/Payment.tsx`

Before rendering checkout:
- Read `profile.referral_discount` (already in `useAuth`).
- If `> 0`, show price breakdown:
  ```
  Original: ₹800
  Referral discount: −₹100
  You pay: ₹700
  ```
- Pass `referral_discount: 100` in the `create-checkout` edge function body so it can apply a Stripe coupon / `unit_amount` reduction.

`supabase/functions/create-checkout/index.ts`:
- Accept `referralDiscount` param. If > 0, compute `unit_amount = base − referralDiscount*100` using `price_data` (one-time payments only).
- Add `metadata.referralDiscountApplied = '100'` so the webhook can clear it.

---

## 7. Reward on conversion — `supabase/functions/payments-webhook/index.ts`

Inside `handleCheckoutCompleted` after recording the payment:

1. Fetch new payer's profile → read `referred_by` (the code).
2. If `referred_by` is set and a `referrals` row with `status='pending'` exists for this referee:
   - UPDATE that referral: `status='converted'`, `converted_at=now()`.
   - Look up referrer profile via `referral_code`.
   - **If referrer.role = 'business':** `referral_discount += 100`. Status → `rewarded`, `reward_amount=100`.
   - **If referrer.role = 'vibe_coder':** insert `earnings` row `{ vibe_coder_id, type:'referral_bonus', amount:100, month: YYYY-MM }`, increment `profiles.referral_bonus_total += 100`. Status → `rewarded`.
3. Clear payer's `referral_discount = 0` if `metadata.referralDiscountApplied` was set.
4. Insert into `scheduled_messages` to notify referrer over WhatsApp:
   > "Your referral converted! ₹100 credit added to your LeadPe account."

---

## 8. Coder studio — `src/pages/DevDashboard.tsx`

In the profile/earnings tab, add a "Bring Clients — Earn Extra" card:

- Heading: **"Bring Clients — Earn Extra"**
- Sub: "Bring a paying client — earn ₹100 bonus on top of your usual 60%."
- How it works (4 numbered steps in English, matching user's request).
- Important note (highlighted box): "₹100 bonus is paid only after your client pays for their first website."
- Same shareable link `/ref/{code}` + WhatsApp button (English message tailored to coders).
- Earnings list adds a line: **"Referral Bonuses: ₹{referral_bonus_total}"**.

---

## 9. Files touched

**Created**
- `src/pages/Referral.tsx`
- `src/components/ReferralCard.tsx` (shared between business + coder)
- `src/lib/referral.ts` (claim helper, share message builders, link copy)
- Migration: add columns + `referrals` table + trigger update + backfill

**Edited**
- `src/App.tsx` — add `/ref/:code` route
- `src/pages/AuthCallback.tsx` — claim referral on signup
- `src/pages/Payment.tsx` — show discount breakdown, pass to edge fn
- `src/components/dashboard/StateCLive.tsx` — embed `<ReferralCard variant="business" />`
- `src/pages/DevDashboard.tsx` — embed `<ReferralCard variant="coder" />` + bonus stat
- `src/hooks/useAuth.tsx` — extend `Profile` type with `referral_code`, `referral_discount`, `referral_bonus_total`
- `supabase/functions/create-checkout/index.ts` — accept + apply `referralDiscount`
- `supabase/functions/payments-webhook/index.ts` — convert + reward logic + notify

**Untouched**: visual design, brand tokens, all other dashboards, Stripe products, RLS on existing tables.

---

## 10. Language note

Per the existing **Language Policy** memory (English-only UI), all referral copy will be **clean English**, not Hinglish. Headings and CTAs:
- "Refer a Friend — Both Win"
- "Bring Clients — Earn Extra"
- WhatsApp prefill messages in English.

If you'd prefer Hinglish strings as written in the brief, say so before approval and I'll switch the copy.

