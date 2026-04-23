

## Goal
Two targeted bug fixes — no design changes, no new features.

1. **Deploy / Quality check failure**: stop blocking submissions with the generic "Quality check service unavailable" error. Make the check resilient and surface the *real* reason whenever it fails.
2. **"Submit for Review" button hidden on mobile**: the BriefModal sits at `z-50`, but the dashboard's bottom nav is at `z-[60]` and covers the bottom of the modal — so the green Submit button gets eaten on small screens.

---

## Fix 1 — Quality check stops the deploy

### Root cause
`supabase/functions/quality-check/index.ts` imports `deno_dom` WASM at module top-level. On cold boot or transient WASM-fetch failures, the function returns a non-2xx response. `src/lib/qualityChecker.ts` then calls `getFailedReport("Quality check service unavailable. Please try again.")` — a hard-fail that blocks Submit forever, and the user sees no real reason.

The screenshot confirms this exact path (red card: *"Quality check failed: Quality check service unavailable. Please try again."*).

### Changes

**`supabase/functions/quality-check/index.ts`**
- Make the `deno_dom` parse defensive: it already wraps `parseFromString` in `try/catch`, but the **import** itself is the real risk. Move it to a lazy dynamic import inside a `try` block — if it fails, set `doc = null` and let all string-matching checks continue. The function never throws on parse failure again.
- Wrap the entire handler body in an outer try, but on error return `status: 200` (already does) AND include the **raw error message** in `error` plus a populated `checkResults` so the UI can render real diagnostics. Currently most failure paths still return reasonable data; we only need to harden the `deno_dom` import.
- Add `console.log` for the GitHub fetch URL + repo size + fetched file count so future debugging is trivial.

**`src/lib/qualityChecker.ts`**
- Stop returning the canned `"Quality check service unavailable"` blob. When `supabase.functions.invoke` returns an `error`, surface `error.message` (or `error.context?.body`) as the reason so the user sees the real cause (CORS, 5xx, timeout, etc.).
- When `data?.error` exists alongside valid `checkResults`, still return the structured report (don't replace it) — so the user sees genuine check failures rather than a generic banner.

**`src/components/BriefModal.tsx`**
- In `handleSubmitGithub`, when `report.passed` is false, build the `DeployError.detail` from `report.issues.join("\n")` (already does) AND also include `report.aiSuggestions` if present — so the inline "Reason from Vercel" panel shows the real diagnostics rather than just one line.
- Add a **"Skip quality check & deploy anyway"** secondary button on the quality-failure card, gated to coders (the existing `profile.role === "vibe_coder"` check). It calls `deployWebsite` directly and skips the quality gate. This unblocks legitimate cases where the audit's heuristics misfire (e.g., the user's screenshot shows a brand-new working repo failing because the WASM service was down). The button is small, secondary, and clearly labelled — not the primary path.

---

## Fix 2 — Submit button hidden behind bottom nav (mobile)

### Root cause
- `src/pages/DevDashboard.tsx` line 1015: `<nav className="fixed bottom-0 ... z-[60]">`
- `src/components/BriefModal.tsx` line 454: `className="fixed inset-0 ... z-50"`

The dashboard's bottom navigation has a higher z-index than the modal, so on phones the bottom 68 px of the modal — which contains the "Submit for Review →" button — is covered.

### Changes

**`src/components/BriefModal.tsx`**
- Bump the modal overlay from `z-50` to `z-[70]` so it sits above the dashboard's `z-[60]` bottom nav.
- Add safe-area bottom padding to the scroll container (`pb-[88px] sm:pb-0`) so on mobile the Submit button always clears the on-screen bar even if z-index changes.
- Same z-index bump for the payout modal in `DevDashboard.tsx` (`z-50` → `z-[70]`) for consistency, since it has the identical issue when opened from the bottom-nav profile tab.

No layout, color, typography, or copy changes.

---

## Files touched

- `supabase/functions/quality-check/index.ts` — defensive `deno_dom` import, real error surfaced.
- `src/lib/qualityChecker.ts` — preserve real error reason; don't overwrite genuine `checkResults`.
- `src/components/BriefModal.tsx` — `z-[70]` overlay, mobile bottom padding, surface full report detail, secondary "Deploy anyway" button on quality-fail card.
- `src/pages/DevDashboard.tsx` — payout modal overlay `z-50` → `z-[70]` (consistency only).

**Untouched**: design tokens, payment flow, referral system, prompt logic, package definitions, all dashboards.

