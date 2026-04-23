

## Goal
Two updates only — no UI redesign, no feature scope change.

1. **Fix deploy failure reporting** so vibe coders see the *exact* reason a Vercel deployment failed (not a generic "Deploy failed").
2. **Make the AI build prompt package-aware** so the scope of features (booking system, chatbot, e-commerce, animations, etc.) scales with Basic ₹800 / Standard ₹1,500 / Premium ₹3,000 / Custom ₹5,000+.

---

## Fix 1 — Real deploy error surfaced end-to-end

### `supabase/functions/deploy-website/index.ts` (action `deploy`)

- **Catch project-create failures**: today, if `POST /v9/projects` fails (invalid URL, bad token, repo not connected to GitHub app, name collision, framework not detected), the response is parsed but never inspected — it falls through and the deployment call then fails with a confusing message. Add a check right after `createResp`: if `!createResp.ok` AND it's not the harmless `project_already_exists` (`409`), return `{ success:false, error, hint, stage:"project_create" }` immediately.
- **Surface the deployment trigger error** with the full Vercel error code + message: `${err.code}: ${err.message}` (e.g. `repo_not_found`, `invalid_request`, `forbidden`).
- **Fetch real build logs on ERROR state**: when polling returns `readyState === "ERROR"`, additionally call `GET /v2/deployments/{id}/events?builds=1&direction=backward&limit=20` and pick the last `error`/`stderr` event. Concatenate into `buildError` so the coder sees the actual webpack/vite/npm message (e.g. `Module not found: Can't resolve './App'`).
- **Always include in the response**: `error` (raw Vercel reason), `hint` (human action), `stage` (`project_create` | `deploy_trigger` | `build` | `timeout`), and `inspectorUrl` (Vercel deployment URL the coder can open).
- **Expand the hint dictionary** with Vercel-specific codes: `repo_not_found`, `not_authorized`, `missing_files`, `invalid_request`, `BUILD_UTILS_SPAWN_1`, `FUNCTION_INVOCATION_FAILED`, `MISSING_BUILD_SCRIPT`.

### `src/lib/deployService.ts`

- Extend `DeployResult` with `hint?: string`, `stage?: string`, `inspectorUrl?: string`.
- **Stop swallowing the hint**: current code returns `{ success:false, error: data.error }` when `data?.error` exists, dropping `hint` and `inspectorUrl`. Pass them through.

### `src/components/BriefModal.tsx`

- `getErrorCard()` already renders `err.detail`. Update `handleSubmitGithub` so when `deployResult.success === false`, it builds `DeployError` with:
  - `message = deployResult.error` (raw)
  - `detail = deployResult.error` (always shown)
  - plus a new line in detail when `deployResult.hint` exists: `"Suggested fix: …"`
  - plus an inline "View on Vercel" link when `deployResult.inspectorUrl` exists (small text-button under steps).
- Map `stage` → existing icons: `project_create → 🔧`, `deploy_trigger → 🚀`, `build → 🔴`, `timeout → ⏳`.
- Keep all existing error categories — only add a new `deploy_failed` category that always shows the raw Vercel reason verbatim.

---

## Fix 2 — Package-aware prompt (just an update, not a rewrite)

The existing CTO prompt in `supabase/functions/ai-generate/index.ts` already accepts `package_id` but ignores it. Add **one new constant + one inserted block** — no other edits.

### Inside `ai-generate/index.ts`

Add a small lookup `PACKAGE_SCOPE` mapping each package to **what to build vs. what NOT to build**:

```text
basic (₹800):       5 pages, WhatsApp button, contact form, Google Maps, basic SEO.
                    DO NOT build: gallery > 4 photos, blog, booking, chatbot, animations, multi-language.

standard (₹1,500):  All Basic + photo gallery (8-12), testimonials, AI-written long-form content,
                    full SEO + schema, advanced lead capture, Google Business profile section.
                    DO NOT build: online booking, chatbot, blog, e-commerce, custom dashboard.

premium (₹3,000):   All Standard + ONLINE BOOKING SYSTEM (date/time picker → WhatsApp/email),
                    WhatsApp chatbot stub, blog (3 sample posts), Framer-Motion animations,
                    Hindi + English toggle, advanced analytics dashboard.
                    DO NOT build: e-commerce, payment gateway, custom user dashboard.

complex (₹5,000+):  Everything in Premium + e-commerce (cart, checkout), payment gateway
                    (Razorpay test), custom admin dashboard, advanced 3rd-party integrations.
                    Vibe coder decides exact scope per client.
```

In `buildCTOPrompt`, append a **new mandatory section** before the "WEBSITE SECTIONS" block:

```
╔══ PACKAGE SCOPE — STRICT ══╗
Client paid for: {package_name} (₹{price})
Coder earning:  ₹{coder_earning}
Delivery:       {deliveryDays} days

✅ MUST BUILD (in scope, paid for):
{scope.includes}

❌ DO NOT BUILD (out of scope — upsell only):
{scope.excludes}

Why this matters:
- Building extras = unpaid work for you.
- Skipping required scope = quality audit fail.
- If client asks for an out-of-scope feature, reply:
  "That feature is part of the {next_tier} package. I can upgrade your plan."
```

Also pass through `package_features` (the `WEBSITE_PACKAGES[].features` array, joined) so the LLM has both the human-readable feature list AND the strict scope rules.

### `src/components/BriefModal.tsx` & `src/pages/GetWebsite.tsx`

- `BriefModal`: when calling `ai-generate`, also send `package_id`, `package_name`, `package_price`, `coder_earning`, and the joined `package_features` from `WEBSITE_PACKAGES` (look up via `getPackageById(request.package_id)`).
- `GetWebsite`: in the fast `fallbackPrompt` (used until Gemini enriches), append the same strict scope block in plain text so even the fallback is package-correct.

### Package selection clarity (no UI change required)

The user said *"package must be understandable with clarity"*. The `WEBSITE_PACKAGES.features` strings already drive the package picker UI in `GetWebsite.tsx`. Update **only the feature wording** in `src/lib/packages.ts` so each tier clearly signals what's exclusive to it:

- Basic: keep as-is (5 pages, WhatsApp, contact, Maps, basic SEO).
- Standard: prefix exclusive items with the tier name → `"+ Photo gallery"`, `"+ AI-written content"`, `"+ Lead capture form"`.
- Premium: prefix true upgrades → `"+ Online booking system"`, `"+ WhatsApp chatbot"`, `"+ Blog section"`, `"+ Framer Motion animations"`, `"+ Hindi + English toggle"`.
- Custom: `"+ E-commerce / Cart"`, `"+ Payment gateway"`, `"+ Custom admin dashboard"`.

That single wording tweak makes the package picker self-explanatory without touching any component.

---

## Files touched

**Edited (no new files):**
- `supabase/functions/deploy-website/index.ts` — surface project-create errors, fetch Vercel build-event logs, return `{error, hint, stage, inspectorUrl}`.
- `src/lib/deployService.ts` — extend `DeployResult`, stop dropping `hint`/`inspectorUrl`.
- `src/components/BriefModal.tsx` — show raw Vercel reason + hint + Vercel inspector link in `getErrorCard`; pass package fields to `ai-generate`.
- `supabase/functions/ai-generate/index.ts` — add `PACKAGE_SCOPE` lookup + strict scope block in `buildCTOPrompt` (no rewrite of existing prompt).
- `src/pages/GetWebsite.tsx` — append scope block to fallback prompt; pass package fields when inserting build request.
- `src/lib/packages.ts` — small wording prefix on Standard/Premium/Custom features for picker clarity.

**Untouched:** all designs, dashboards, payment flow, referral flow, language policy.

