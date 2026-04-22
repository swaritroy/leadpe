

## Goal
Add two trust-building elements to the LeadPe homepage (`/`):
1. A **"Trusted by"** brand strip showcasing real/representative client logos
2. A **clickable proof link** to the live client site `www.shivastudycentre.org`

Plus, set up the **`/blog` route** (from previous suggestion) so you can start publishing SEO ranking content.

---

## What gets built

### 1. Homepage trust section (`src/pages/Index.tsx`)

Insert a new section right below the hero, above existing services:

**"Trusted by Growing Businesses Across India"**

A horizontal logo strip (grayscale → colored on hover) with 6 brand placeholders:
- Shiva Study Centre (real, clickable → `https://www.shivastudycentre.org`)
- 5 representative local-business logos (doctor clinic, CA office, coaching centre, shop, contractor) — until you give me real ones, these will be tasteful text-based "logo cards" with business name + city, NOT fake brand names.

Below the strip, a **"See a real LeadPe website live →"** call-to-action card:
```
┌─────────────────────────────────────────┐
│ ✅ LIVE CLIENT WEBSITE                   │
│                                          │
│ Shiva Study Centre — Hajipur, Bihar      │
│ Built by LeadPe in 48 hours              │
│                                          │
│ → www.shivastudycentre.org    [Visit ↗] │
└─────────────────────────────────────────┘
```
Both the URL and the "Visit" button open `https://www.shivastudycentre.org` in a new tab (`target="_blank" rel="noopener"`).

### 2. Mobile-first responsive
- Desktop: 6 logos in a row
- Tablet: 3 per row
- Mobile: horizontal scroll snap
- Min 48px tap targets on the proof card

### 3. SEO boost (bonus)
Add a `Review` + `Organization` link in JSON-LD pointing to shivastudycentre.org as a portfolio reference. This signals real authority to Google.

### 4. New `/blog` route (SEO ranking accelerator)
- Create `src/pages/Blog.tsx` — list page (markdown-driven)
- Create `src/pages/BlogPost.tsx` — individual post page with full SEO meta + Article JSON-LD
- Create `src/content/blog/` folder with 1 starter post: *"Doctor Ke Liye Website Kaise Banwayein — 2026 Guide"*
- Add `/blog` and `/blog/:slug` to `App.tsx` routes
- Add `Blog` link to `Footer.tsx`
- Add blog URLs to `public/sitemap.xml`

This gives you an immediate channel to publish weekly long-tail content that ranks fast for low-competition Hindi/Hinglish keywords.

---

## Open questions before I build

1. **Other client logos:** Do you have any other live LeadPe client URLs to show as proof? If not, I'll use 5 tasteful placeholder cards labeled "Coming Soon" or "More clients launching weekly" to avoid faking testimonials.
2. **Brand logo for Shiva Study Centre:** Should I fetch their actual logo from their site, or just use the centre name in styled text?
3. **Blog scope:** Just scaffold the route + 1 starter post now, or want me to also generate 3-4 more starter posts (CA, coaching, shop, contractor)?

---

## Files touched
- `src/pages/Index.tsx` (add Trust section)
- `index.html` (extend JSON-LD)
- `src/pages/Blog.tsx` *(new)*
- `src/pages/BlogPost.tsx` *(new)*
- `src/content/blog/doctor-website-guide.md` *(new)*
- `src/App.tsx` (2 new routes)
- `src/components/Footer.tsx` (Blog link)
- `public/sitemap.xml` (blog URLs)

