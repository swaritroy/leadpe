

## Goal
Generate a high-quality, ready-to-use prompt for creating a 20-second cinematic video ad for LeadPe, designed for WhatsApp/Instagram/YouTube Shorts (9:16 vertical).

## The Prompt

Below is the prompt you can paste into Lovable (or any AI video tool like Runway, Pika, Sora, or Veo) to generate the LeadPe ad.

---

### 🎬 LeadPe — 20 Second Vertical Ad Prompt

**Brief:**
Create a 20-second vertical (1080x1920, 30fps) cinematic motion-graphics ad for **LeadPe** — an Indian platform that builds professional websites for local businesses in 48 hours and sends customer leads directly to WhatsApp.

**Tagline:** *"Website Nahi? Customer Nahi. — LeadPe."*

**Brand System:**
- Primary green: `#00C853`
- Background: `#F5FFF7` (soft mint) and pure white
- Text: `#1A1A1A`
- Fonts: **Syne** (headings, bold), **DM Sans** (body)
- Vibe: Clean, energetic, mobile-first, Indian MSME-friendly. Think Swiggy meets Linear.

**Aesthetic:** *Kinetic Energy meets Tech Product* — fast cuts, bold green accents, snappy spring animations, crisp geometric layouts, a WhatsApp chat bubble as the recurring hero motif.

**Scene Breakdown (20s total @ 30fps = 600 frames):**

| # | Time | Scene | Visual |
|---|------|-------|--------|
| 1 | 0-3s | **Hook** | Black screen → big white text bursts in: *"Dukaan hai. Customer kahan?"* Shake + zoom. |
| 2 | 3-7s | **Problem** | Split screen: empty shop (left, desaturated) vs phone with Google search "best [shop] near me" (right). Competitor names appear, yours is missing. |
| 3 | 7-11s | **Solution reveal** | Whoosh transition → LeadPe logo lands center on `#F5FFF7` bg. Tagline types out underneath. Green pulse ring radiates. |
| 4 | 11-15s | **Product demo** | Phone mockup: a beautiful website builds itself in 3 fast frames (wireframe → colors → live site with WhatsApp button). Counter shows *"48 hours"*. |
| 5 | 15-18s | **Lead alert** | WhatsApp notification slides in top: *"🔔 New Lead: Rohit wants a quote"*. Shop owner smiles, taps reply. Confetti pop. |
| 6 | 18-20s | **CTA** | Bold end card: *"Get your website in 48 hours"* + green button *"leadpe.online"* + small text *"₹800 one-time. Free 21-day trial."* |

**Motion System:**
- Default entrance: spring `{ damping: 15, stiffness: 180 }` with 8-frame stagger
- Scene transitions: `wipe` (from-right) for problem→solution, `slide` for the rest
- Hero accents: green underline strokes that draw in via `strokeDashoffset`
- Persistent layer: faint floating green dots drifting upward across all scenes
- Typography: per-character reveal on tagline, scale variation 0.95→1 on stats

**Audio direction (if adding voiceover/SFX later):**
- Upbeat lo-fi Indian beat (tabla + synth)
- WhatsApp "ting" SFX on Scene 5
- Soft whoosh on every transition

**Quality bar:** Awwwards-level. No generic stock animations. No purple gradients. No emojis floating randomly. Every frame should feel intentional.

---

## How to use this prompt

1. **In Lovable:** Reply with *"Build this video using the Remotion skill"* — I'll scaffold the project, write all 6 scenes, and render an MP4 to `/mnt/documents/leadpe-ad.mp4`.
2. **In Runway / Pika / Veo / Sora:** Paste the Brief + Scene Breakdown sections directly. Add aspect ratio `9:16` and duration `20s`.
3. **For a designer:** Send the whole block — it doubles as a creative brief.

## Next step
Say **"build it"** and I'll create the full Remotion video and deliver the MP4.

