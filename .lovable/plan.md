

## LeadPe Rebrand & Platform Overhaul Plan

This is a comprehensive rebrand from "Synapse Shift" to **LeadPe** with a completely new design system, new pages, and updated content targeting Indian local businesses.

### Scope Summary

The work covers ~15 files across 6 major areas:

---

### 1. Design System Overhaul (`src/index.css`, `tailwind.config.ts`)

- Replace all Synapse brand tokens with LeadPe tokens:
  - Primary: `#00E676` (electric green)
  - Background: `#080C09` (near-black green-tinted)
  - Card: `#101810` (dark green-tinted)
  - Text: `#DCF0E0`, Muted: `#5A7A5E`
- Import **Syne** (800 weight headlines) and **DM Sans** (body) fonts
- Add noise texture overlay via CSS pseudo-element
- Add custom green cursor on desktop (`cursor: url(...)`)
- Add smooth scroll (`scroll-behavior: smooth`)
- Staggered reveal animation utilities
- Border radius defaults: 16px-24px
- Floating animated mesh background (CSS gradient animation)
- Replace `.bg-gradient-hero` with green gradient
- Dark mode as **default** (not toggled)

### 2. Logo & Branding (`src/components/SynapseLogo.tsx` → `src/components/LeadPeLogo.tsx`)

- Replace hexagon+lightning with text logo: "Lead" in white, "Pe" in `#00E676`
- Update all imports across Navbar, Auth, Footer, etc.

### 3. Navbar (`src/components/Navbar.tsx`)

- Always dark, blur background
- Left: LeadPe logo
- Right: "How it Works" link, "Pricing" link, "Get Started Free" green button
- Mobile hamburger menu
- Remove old "Marketplace", "Developer", "Business" links

### 4. Homepage (`src/pages/Index.tsx`) — Complete Rewrite

Sections in order:
1. **Hero with Role Selection** — Two large cards: "I Want More Customers" (Business) and "I Want to Build & Earn" (Developer), with perks lists, CTAs that scroll to relevant sections, trust row below
2. **How It Works** — 4 steps on left, WhatsApp phone mockup on right (animated float, notification badge)
3. **For Who Section** — Grid of 10 business type cards with Hindi descriptions
4. **Stats Bar** — 63M+ MSMEs, 48hrs, 90+ Lighthouse, ₹0 trial
5. **Pricing Section** — 3 tiers: Basic (₹0), Growth (₹299, featured), Pro (₹499) with feature checklists
6. **Free Trial CTA** — WhatsApp number input + "🚀 Free Start" button
7. **Footer** — LeadPe logo, tagline, links, "Made in India 🇮🇳"

### 5. Business Onboarding (`src/pages/Business.tsx`) — Complete Rewrite

Replace the old static "Command Center" with a **3-step wizard**:
- Step 1: Business Name, Type (dropdown), City, WhatsApp Number, Owner Name
- Step 2: Short description, Timing, Starting Price, Special offer
- Step 3: Summary card, referral code field, "Start My 7-Day Free Trial" CTA
- Each field has Hindi hints below English labels
- Progress bar at top
- On submit: insert into `businesses` table

### 6. Developer/Studio Page (`src/pages/Developer.tsx`) — Complete Rewrite

- Hero: "Build Sites. Deploy Fast. Earn Monthly."
- How It Works for Devs (4 steps)
- **Earnings Calculator**: slider (1-50 clients), live calculation (clients × ₹299 × 20%)
- Vetting Agent section: checklist with score thresholds (85/90)
- Developer Signup Form: Name, WhatsApp, Email, sample site link, tools used, capacity
- Submit to `profiles` or a new developer applications flow

### 7. Auth Page (`src/pages/Auth.tsx`)

- Rebrand from "SYNAPSE SHIFT" to "LeadPe" with new logo and green gradient
- Keep Google login functionality unchanged

### 8. Client Dashboard (`src/pages/ClientDashboard.tsx`)

- Rebrand text: "Command Center" → simpler business-friendly language
- Update "Lead Access Suspended" message to "Renew plan to see your X pending customers 🔒" with ₹299 pricing
- Update add-on names and prices to match spec (WhatsApp Auto-Reply ₹199/mo, AI Booking ₹499/mo, etc.)
- Mobile: cards instead of tables, big call buttons, Hindi labels on key actions

### 9. Dev Dashboard (`src/pages/DevDashboard.tsx`)

- Rebrand: "Pilot Dashboard" → "LeadPe Studio"
- Update earnings display to ₹ currency
- Categories: add Indian business types (Coaching Centre, Doctor, etc.)

### 10. Client Settings (`src/pages/ClientSettings.tsx`)

- Make labels more business-friendly with Hindi hints
- Update service pricing to be generic (not dentist-specific)

### 11. ViewSite (`src/pages/ViewSite.tsx`)

- Footer: "Powered by LeadPe" instead of "Synapse Shift"
- Suspension banner text update

### 12. Select Role (`src/pages/SelectRole.tsx`)

- Rebrand text and styling to LeadPe green theme

### 13. Routing (`src/App.tsx`)

- Keep existing routes, ensure `/business` now serves the onboarding wizard
- Keep `/developer` as studio page

### 14. Database

- Add columns to `businesses` table for new onboarding fields: `business_type`, `city`, `whatsapp_number`, `owner_name`, `description`, `timing`, `starting_price`, `special_offer`, `referral_code`, `trial_start_date`, `trial_active`
- Migration to add these columns with sensible defaults

### Technical Notes

- All existing backend logic (RLS, auth, leads, projects) remains intact
- Google Auth continues to work via `lovable.auth.signInWithOAuth`
- No Next.js — staying on React/Vite as per platform constraints
- WhatsApp API integration (Twilio/Zapier) is out of scope for this implementation but UI elements will be present
- Razorpay/Stripe payment integration can be added as a follow-up

### Estimated Changes

- ~15 files modified/created
- 1 database migration
- Complete visual rebrand with zero backend disruption

