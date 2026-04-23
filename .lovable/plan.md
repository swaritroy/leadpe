
## Goal

Stabilize the full deployment pipeline so:
1. repo submit no longer gets stuck at false `0/100`,
2. demo deployment actually reaches Vercel and returns exact failure reasons,
3. paid websites automatically switch from demo to live after payment,
4. uploaded logo/photos always reach the vibe coder and the generated prompt.

No redesign. Deployment + prompt-asset reliability only.

---

## What is actually broken now

### 1) Preview-origin CORS is blocking deployment functions
The current `deploy-website`, `quality-check`, `ai-generate`, and related functions use a hardcoded `ALLOWED_ORIGINS` list with only:
- `leadpe.lovable.app`
- one `id-preview--...lovable.app`

But the active project preview is running from `*.lovableproject.com`. That means the browser can fail before the function is even reached. This matches the current symptom:
- quality check shows generic failure / `0/100`
- edge logs show boot/shutdown but almost no real requests

### 2) Quality audit is too fragile
`quality-check` still assumes:
- repo files are on `main`
- the important files live only in a small hardcoded path list

So a valid repo can still get a false low score if:
- default branch is not `main`
- the app structure is slightly different
- the needed evidence is in another file

### 3) Live deployment after payment is incomplete
`deploy_live` exists in `deploy-website`, but the current Stripe payment path does not call it. So demo may exist, but after payment the site is not reliably redeployed as live.

### 4) Business assets are not reliably attached to build requests
`BriefModal` tries to read logo/photos from `request`, but `build_requests` does not store those fields. It sometimes falls back to `orders`, but that lookup is by `business_name`, which is unreliable. So uploaded logo/photos can be missing from the coder brief and fallback prompt.

---

## Implementation plan

### A. Fix CORS for all deployment-related edge functions
Replace hardcoded exact-origin arrays with the same wildcard-style origin logic already used elsewhere:
- allow `*.lovable.app`
- allow `*.lovableproject.com`
- allow `leadpe.online`
- allow published app domain(s)

Apply this to:
- `supabase/functions/deploy-website/index.ts`
- `supabase/functions/quality-check/index.ts`
- `supabase/functions/ai-generate/index.ts`
- `supabase/functions/generate-seo/index.ts`
- any payment/deploy helper function still using the old static list

Result:
- preview can actually call deployment functions
- quality check and deploy requests reach the backend instead of failing at the browser boundary

---

### B. Make quality-check stop giving false `0/100`
Keep the existing lazy `deno_dom` protection, but improve repo inspection so the score reflects the real repo:

#### In `supabase/functions/quality-check/index.ts`
- detect the repo’s default branch from GitHub API instead of forcing `main`
- fetch repo tree / contents from the detected branch, not just a tiny fixed list
- still keep the focused checks, but search across all fetched code instead of only a few paths
- preserve structured `checkResults`, `issues`, and `error` in every failure path
- return the exact GitHub / build / parsing reason in the JSON body

#### In `src/lib/qualityChecker.ts`
- keep showing the raw reason from the edge function
- if structured `checkResults` are present, never overwrite them with a generic failure blob

#### In `src/components/BriefModal.tsx`
- keep showing the exact failure reason
- include AI suggestions and individual failed checks in the error card
- keep the coder override button, but make the default path accurate enough that override is rarely needed

Result:
- real repos stop incorrectly scoring `0/100`
- coders see the exact reason when a repo is actually bad

---

### C. Make demo deployment reliable and debuggable
Strengthen the Vercel flow in `supabase/functions/deploy-website/index.ts`:

- validate GitHub URL and repo owner/repo parsing more defensively
- detect default branch before triggering deployment
- use that detected branch instead of always forcing `main`
- keep current exact error surfacing (`project_create`, `deploy_trigger`, `build`, `timeout`)
- fetch build-event logs on Vercel `ERROR` and return the real build failure text
- persist deployment diagnostics on the build request so failures are not lost after modal close

#### Database migration
Add non-breaking diagnostic columns to `build_requests`, for example:
- `deployment_id`
- `deploy_stage`
- `deploy_error`
- `deploy_hint`
- `deploy_inspector_url`
- `last_deploy_checked_at`

Result:
- repo submit can fail with exact actionable reason
- admin/coder can re-open the request and still see the last deploy failure

---

### D. Make live deployment happen automatically after payment
The Stripe payment flow currently upgrades plan data but does not reliably trigger `deploy_live`.

#### In `supabase/functions/payments-webhook/index.ts`
After successful one-time checkout:
- locate the latest relevant `build_requests` row for that business
- if a demo repo / GitHub URL exists, call `deploy-website` with `action: "deploy_live"`
- pass `buildRequestId`, `subdomain`, and `userId`
- on success, update `build_requests.live_url`, `live_deployed_at`, and final `status`
- on failure, store exact deploy diagnostics on the row instead of silently marking success

#### Review current status transitions
Make the statuses consistent:
- demo submit → `review` / `building`
- successful demo → `demo_ready`
- successful paid launch → `live`
- failed launch → `failed`

Result:
- demo deployment works before payment
- payment automatically promotes the website to live

---

### E. Fix logo/photos not reaching vibe coder and prompt
Make assets part of the build-request snapshot instead of relying on fragile lookup-by-name.

#### Database migration
Add to `build_requests`:
- `logo_url text`
- `photos_urls text[]`
- `color_preference text`

#### In `src/pages/GetWebsite.tsx`
When creating `build_requests`, also store:
- `logo_url`
- `photos_urls`
- `color_preference`

#### In `src/components/BriefModal.tsx`
Read assets from the build request first, not only from `orders`.
Use the same source for:
- Info tab preview
- AI prompt request payload
- fallback prompt text

#### In `supabase/functions/ai-generate/index.ts`
No prompt rewrite. Only ensure the existing asset instructions always use:
- the actual logo URL
- the actual photo URLs
- package scope already in place

Result:
- coder always sees the same assets the business uploaded
- prompt reliably includes real logo/photos

---

## Files to update

### Edge functions
- `supabase/functions/deploy-website/index.ts`
- `supabase/functions/quality-check/index.ts`
- `supabase/functions/payments-webhook/index.ts`
- `supabase/functions/ai-generate/index.ts`
- `supabase/functions/generate-seo/index.ts` (CORS consistency)

### Frontend
- `src/lib/qualityChecker.ts`
- `src/lib/deployService.ts`
- `src/components/BriefModal.tsx`
- `src/pages/GetWebsite.tsx`

### Database
- new migration for `build_requests` asset snapshot + deployment diagnostics columns

---

## Validation after implementation

1. Submit a valid public GitHub repo from preview:
   - quality check runs from preview without CORS failure
   - score is not falsely `0/100`

2. Submit an invalid repo:
   - exact reason appears in modal
   - stage + hint + inspector link are shown

3. Submit a valid repo:
   - demo deploy reaches Vercel
   - build request gets deployment metadata

4. Complete payment:
   - webhook triggers live deployment automatically
   - build request moves to `live`
   - final live URL is saved

5. Upload logo/photos during onboarding:
   - coder sees them in BriefModal
   - prompt includes the same asset URLs

## Technical notes
- Vercel credentials are already configured; this is a flow/reliability issue, not a missing-token issue.
- No page redesign is needed.
- Database changes are additive only, so existing data remains compatible.
