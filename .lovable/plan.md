

## Goal
Replace the incorrect generic `public/logo.png` with a PNG that faithfully renders your real typography logo: **"LeadPe"** in Syne Bold, "Lead" in `#1A1A1A`, "Pe" in `#00C853`, on a clean white background. This satisfies Google's Organization schema requirement while staying true to your brand.

## What changes

### 1. Generate brand-accurate `public/logo.png`
- 512×512 PNG, white background (Google prefers square + solid bg for knowledge panel)
- Centered text "LeadPe" in **Syne Bold 700**, letter-spacing -0.5px (matches `LeadPeLogo.tsx` exactly)
- "Lead" → `#1A1A1A`, "Pe" → `#00C853`
- Generated via Python + Pillow using the actual Syne font file
- Overwrites the current generic `public/logo.png`

### 2. Also regenerate `public/apple-touch-icon.png` (180×180)
Same typography, scaled — so iOS home-screen icon matches the brand instead of the generic one currently there.

### 3. Keep favicons as-is
The current `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png` are too small (16/32px) to render readable "LeadPe" text. **Recommendation:** use just the **"Pe" letter mark** in green on white for favicons (since at 16px the full word is unreadable). Confirm before I proceed — see Q1.

### 4. No code changes needed
`index.html` already references `/logo.png` and `/apple-touch-icon.png` — just the image bytes get replaced.

## Quick question

**Q1.** For the small favicons (16/32px), should I:
- **(a)** Use just **"Pe"** in green on white (clean, readable at tiny sizes — recommended)
- **(b)** Use just **"P"** in green on white (even simpler)
- **(c)** Keep current generic favicons (not recommended — they don't match your brand)

## Files touched
- `public/logo.png` (regenerated — typography "LeadPe")
- `public/apple-touch-icon.png` (regenerated — typography "LeadPe")
- `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/favicon.ico` (regenerated based on Q1 answer)

