

## Goal
1. Replace the generic green-square favicon with the actual **LeadPe** typography logo (matching the brand: "Lead" in dark + "Pe" in green `#00C853`).
2. Convert all SEO copy (titles, meta descriptions, FAQ schema) from Hinglish to clean English — keeping only the tagline *"Website Nahi? Customer Nahi."* and brand phrases as-is.

No page UI will be touched. Only `index.html`, `public/favicon.svg`, `src/components/SEO.tsx`, and the per-page `<SEO>` props in About / Services / Contact / Blog / StudioAuth.

---

## Fix 1 — Favicon (typography logo)

**File: `public/favicon.svg`** (overwrite)

A 32×32 SVG that mirrors the `LeadPeLogo` component — bold Syne-style wordmark, "Lead" in dark `#1A1A1A` and "Pe" in brand green `#00C853`, on a transparent rounded white tile so it stays crisp in browser tabs and Google search.

```text
[ Lead Pe ]   ← dark "Lead" + green "Pe", bold sans-serif, centered
```

Implementation: inline `<text>` element with `font-family="Syne, system-ui, sans-serif"`, `font-weight="800"`, two `<tspan>` children for the two-tone fill. White rounded-rect background (`rx=6`) so it's legible on both light and dark browser chrome.

No `.ico` fallback needed — modern browsers + Google all read SVG. `index.html` already points to `/favicon.svg` from the previous fix, so no changes there.

---

## Fix 2 — Hinglish → English in SEO

### `index.html`
- **Title**: `LeadPe — Websites in 48 Hours | India` (40 chars)
- **Description**: `Get a professional website in 48 hours from ₹800. Built for doctors, CAs, coaching centres and shops across India. Customer enquiries delivered to WhatsApp.`
- **OG + Twitter title/description**: same English copy
- **Org schema description**: `India's AI-powered website platform. Professional websites in 48 hours from ₹800. Customer enquiries delivered straight to WhatsApp.`
- **Offer descriptions**: `Professional website delivered in 48 hours` / `Monthly customer leads on WhatsApp`
- **FAQPage** — rewrite all 5 Q&A pairs in English:
  1. *How much does a website cost on LeadPe?* → "A Basic website starts at ₹800 with guaranteed 48-hour delivery."
  2. *How long does it take to launch?* → "Just 48 hours — your professional website goes live in two days."
  3. *Will my website always stay live?* → "Yes. LeadPe keeps your website live forever — that's our promise."
  4. *How will customers reach me?* → "Every customer enquiry is sent directly to your WhatsApp in real time."
  5. *How do I become a vibe coder?* → "Visit leadpe.online/studio, register with your phone number, build websites with AI, and earn ₹480–₹1,800 per project."
- **Slogan / tagline stays Hinglish**: `"Website Nahi? Customer Nahi."` (brand identity)

### `src/components/SEO.tsx`
- Default `title`: `LeadPe — Websites in 48 Hours | India`
- Default `description`: `Get a professional website in 48 hours from ₹800. Customer enquiries delivered to WhatsApp.`
- `SOFTWARE_SCHEMA.description`: `Launch a professional AI-built business website in 48 hours. Pay only for results.` (already English — keep)

### Per-page `<SEO>` props (English rewrites, ≤60 char titles, ≤155 char descriptions)

| File | Title | Description |
|------|-------|-------------|
| `src/pages/About.tsx` | `About LeadPe — Our Story` | `LeadPe is India's AI website platform. Professional websites in 48 hours from ₹800. Founded in Hajipur, Bihar.` |
| `src/pages/Services.tsx` | `Services & Pricing | LeadPe India` | `Website plans from ₹800. Basic, Standard and Premium tiers. Plus Growth plan at ₹299/month for unlimited WhatsApp leads.` |
| `src/pages/Contact.tsx` | `Contact LeadPe — Hajipur, Bihar` | `Reach LeadPe support over WhatsApp, email or phone. Based in Hajipur, Bihar — serving businesses across India.` |
| `src/pages/Blog.tsx` | `LeadPe Blog — Website & Growth Tips` | `Practical website tips, business growth ideas and digital marketing advice for Indian small businesses.` |
| `src/pages/StudioAuth.tsx` | `LeadPe Studio — Become a Vibe Coder` | `Join LeadPe Studio. Build websites with AI and earn ₹480–₹1,800 per project. Work from anywhere in India.` |

### `src/pages/About.tsx` body copy
The visible page already uses English — no changes to body content. Only the `<SEO>` props are updated.

---

## Files touched

- `public/favicon.svg` — overwrite with two-tone LeadPe wordmark
- `index.html` — title, description, OG, Twitter, Organization description, Offer descriptions, FAQPage answers
- `src/components/SEO.tsx` — default English title + description
- `src/pages/About.tsx` — `<SEO>` props only
- `src/pages/Services.tsx` — `<SEO>` props only
- `src/pages/Contact.tsx` — `<SEO>` props only
- `src/pages/Blog.tsx` — `<SEO>` props + Blog JSON-LD description
- `src/pages/StudioAuth.tsx` — `<SEO>` props only

No component logic, layout, routes, or page bodies will be modified.

