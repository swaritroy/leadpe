

# LeadPe Production-Ready Platform — Gap Analysis & Implementation Plan

## Current State Assessment

The platform already has a solid foundation with most core pages, auth system, database tables, and basic flows working. Here's what exists and what needs fixing/adding:

### What Already Works
- Auth system (AuthContext, ProtectedRoute, PublicRoute, role-based routing)
- All pages exist: Index, Business, Auth, GetWebsite, Payment, Studio, StudioAuth, ClientDashboard, DevDashboard, DevOnboarding, Admin, DemoPreview, ClientSettings
- Database tables: profiles, signups, orders, build_requests, leads, business_seo, scheduled_messages, quality_reports, earnings, order_timeline, payments, deployments, businesses, projects, user_roles
- AI services (SEO generation, welcome messages)
- Deploy service (Vercel API)
- Quality checker
- Trial manager
- Evidence/timeline system
- Lead widget generator
- Packages system
- WhatsApp integration

### Gaps & Issues to Fix

---

## Phase 1: Critical Fixes & Missing Constants

### 1. Create `src/lib/constants.ts`
All hardcoded values scattered across files need to be centralized:
- ADMIN_WHATSAPP, TRIAL_DAYS, FOUNDING_SPOTS, FOUNDING_LEFT
- All price constants, coder/leadpe share percentages, passive per site

### 2. Fix RLS Policies (RESTRICTIVE → PERMISSIVE)
Many tables still have `RESTRICTIVE` policies (build_requests, deployments, earnings, leads, businesses, profiles, user_roles, etc.). These need to be converted to PERMISSIVE to prevent access issues. The previous migration only fixed user_roles and profiles but missed other tables.

### 3. Fix `handle_new_user` Trigger
The trigger exists as a function but there is no actual trigger attached (`db-triggers` shows empty). Need to create the trigger on `auth.users` table. Wait — we cannot attach triggers to `auth` schema. The trigger likely exists but isn't shown in the metadata. Need to verify via a test signup.

---

## Phase 2: Page-Level Improvements

### 4. Index.tsx Improvements
- Add "For Builders" nav link
- Ensure the Vibe Coder bar at bottom exists (currently has it)
- Ensure comparison table is present (already exists)
- Add founding member badge/countdown if desired
- Minor copy/polish

### 5. Business.tsx — Signup Wizard Hardening
- Ensure all 10 post-submit steps fire reliably (auth user creation, profile update, signups insert, build_request creation, SEO generation, welcome message, WhatsApp to admin, success screen, auto-login, navigate)
- Add `business_since` and `description` fields if missing
- Use constants for trial days

### 6. ClientDashboard.tsx Enhancements
- Remove any SEO/technical sections if they leak through
- Add "Share My Website" quick action (WhatsApp share with URL)
- Add "My Trial Code" quick action
- Link to ClientSettings from quick actions
- Ensure celebration confetti works when status changes to "live"
- Add new lead toast notification (partially exists)

### 7. GetWebsite.tsx — Order Flow Polish
- Custom subdomain input (recently added)
- WhatsApp OTP verification step (currently just form submit)
- Build record document generation
- Ensure `website_purpose` dropdown exists
- Ensure order success page shows order ID + build record

### 8. DemoPreview.tsx Improvements
- Add sticky top watermark bar: "LeadPe Demo — Not Live Yet"
- Add sticky bottom bar with price and approve/changes buttons
- Disable contact forms and WhatsApp buttons in demo
- Blur form fields in demo mode

### 9. Payment.tsx Enhancements
- Add polling for profile status change (30-second interval)
- Add celebration screen when admin activates
- Add trust badges (Safe, Cancel anytime, etc.)
- GST display

### 10. Studio.tsx Polish
- Ensure white+green theme (already done)
- Verify earnings calculator works (exists)
- Verify all 4 packages shown with coder earnings

### 11. DevDashboard.tsx Improvements
- Add bottom mobile navigation (Home, Builds, Earnings, Profile tabs)
- Ensure brief modal shows ChatGPT prompt, widget code, copy buttons
- Ensure quality report shows score circle, checklist
- Ensure auto-deploy triggers on score >= 70
- Add "My Live Sites" section with ₹30/month label

### 12. DevOnboarding.tsx
- Ensure all 5 steps work: Welcome, Tools, Practice Build, Payment Setup, Ready
- Practice build quality check integration (exists)

### 13. Admin.tsx — Missing Tabs/Sections
- **Orders tab**: Exists but needs status filter tabs for all statuses (New, Building, Demo Sent, Approved, Paid, Live)
- **Leads tab**: Add cross-business leads view with filters by business, city, date
- **Payments tab**: Add dedicated payments section with confirm/activate buttons
- **Order timeline**: Already has inline timeline viewer
- Activate business plan button (mark business as "active" in profiles)
- Mark order as "demo_ready" and set demo_url

### 14. LoadingSpinner Component
Create a reusable `LoadingSpinner.tsx` component to replace duplicated spinner code across pages.

---

## Phase 3: System-Level Features

### 15. Referral System
- Add referral_code generation on business signup (LP-XXXXXX format already used for trial codes)
- Add `referred_by`, `referral_count`, `free_months_earned` columns to profiles (migration)
- Add share button in ClientDashboard that opens WhatsApp with referral link
- Track referral on Business.tsx signup (check `?ref=` URL param)

### 16. Realtime Subscriptions
- ClientDashboard: leads realtime (exists), build_requests realtime (exists), profiles realtime (needs adding for plan activation detection)
- DevDashboard: build_requests realtime for new pending requests
- Admin: signups, orders, payments realtime badges
- Enable realtime on relevant tables via `ALTER PUBLICATION supabase_realtime ADD TABLE`

### 17. WhatsApp Message Automation
- Ensure scheduled_messages are created at every key event
- Welcome message on signup (exists in Business.tsx)
- Coder assigned notification
- Website live notification
- Lead notification (via widget)
- Trial day 18 and 21 reminders (admin-triggered from scheduled_messages)

### 18. Watermark System for Demo Sites
- This is external to the platform (applies to deployed sites)
- The DemoPreview page handles the in-platform demo view
- Add instructions in dev brief about watermark removal after payment

---

## Phase 4: Database Migrations Needed

### Migration 1: Referral columns on profiles
```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_months_earned integer DEFAULT 0;
```

### Migration 2: Fix RESTRICTIVE policies on remaining tables
Convert all remaining RESTRICTIVE policies to PERMISSIVE on: build_requests, deployments, earnings, leads, businesses, business_seo, orders, payments, signups, message_log, order_timeline, quality_reports, projects, scheduled_messages.

### Migration 3: Enable realtime
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.build_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```

---

## Implementation Order (Priority)

1. **Create constants.ts** — foundational, used everywhere
2. **Fix all RESTRICTIVE RLS policies** — critical, blocks all data access
3. **Create LoadingSpinner component** — reusable, quick win
4. **Admin.tsx** — add Leads tab, Payments tab, activate business action
5. **ClientDashboard.tsx** — add share/trial code actions, profile realtime for payment detection
6. **Payment.tsx** — add polling + celebration
7. **DemoPreview.tsx** — watermark bar + bottom CTA bar
8. **DevDashboard.tsx** — bottom mobile nav, live sites section
9. **Business.tsx** — referral param tracking
10. **Referral system** — migration + dashboard share button
11. **Enable realtime** — migration + subscription setup
12. **Polish all pages** — mobile perfection, error handling, loading states

---

## Estimated Scope

This is a large undertaking spanning 12+ files and 3-4 database migrations. I recommend implementing in batches:

- **Batch 1**: Constants + RLS fixes + LoadingSpinner (foundation)
- **Batch 2**: Admin enhancements + ClientDashboard polish + Payment polling
- **Batch 3**: DemoPreview + DevDashboard mobile nav + Referral system
- **Batch 4**: Realtime subscriptions + final polish + mobile testing

Shall I proceed with Batch 1 first?

