

## Goal
Migrate everything from `leadpe.tech` → `leadpe.online`, and enable real Vercel custom-domain attachment so live sites deploy at `{slug}.leadpe.online`.

## Scope: 33 files contain `leadpe.tech` (353 references)

### 1. Domain string replacement (global find-replace `leadpe.tech` → `leadpe.online`)
**Frontend (UI / SEO / brand):**
- `index.html` (canonical, OG, JSON-LD schema, FAQ links)
- `src/components/SEO.tsx` (`SITE_URL`, default OG image)
- `src/components/SEOPreview.tsx`
- `src/components/Footer.tsx`
- `src/components/dashboard/StateBBuilding.tsx` (preview subdomain text)
- `src/components/dashboard/StateCLive.tsx` (live URL builder + display)
- `src/components/dashboard/StateExpired.tsx`
- `src/components/admin/RenewalReminders.tsx`
- `src/lib/clientBrief.ts` (example sites)
- `src/lib/leadWidget.ts`, `src/lib/whatsappService.ts`, `src/lib/notify.ts` (any links)
- `src/pages/Index.tsx`, `About.tsx`, `Privacy.tsx`, `Terms.tsx`, `Refund.tsx`, `Contact.tsx`, `Services.tsx`, `Admin.tsx`, `Studio.tsx`, `GetWebsite.tsx`
- `public/robots.txt` → sitemap URL
- `public/sitemap.xml` → all `<loc>` entries

**Backend (edge functions):**
- `supabase/functions/deploy-website/index.ts`
- `supabase/functions/razorpay/index.ts`
- `supabase/functions/payments-webhook/index.ts`
- `supabase/functions/sitemap/index.ts` (`SITE_URL` constant + subdomain template)
- `supabase/functions/ai-generate/index.ts` (CTO prompt: viral footer text, canonical link, exampleSites)
- `supabase/functions/verify-otp/index.ts` & all other functions: CORS allowlist regex `\.leadpe\.tech$` → `\.leadpe\.online$`, plus the literal `https://leadpe.tech` origin
- `supabase/functions/notify-admin/index.ts`, `daily-summary/index.ts`, `generate-seo/index.ts`, `process-messages/index.ts`, `send-whatsapp/index.ts`, `quality-check/index.ts`, `weekly-report/index.ts`, `auto-release/index.ts` — any remaining string references

**Email/support:** keep `support@leadpe.tech` in About/Privacy or change to `support@leadpe.online`?

### 2. Enable real Vercel subdomain attachment
In `supabase/functions/deploy-website/index.ts` (`deploy_live` action):
- Set `USE_CUSTOM_DOMAIN = true`
- Change `customDomain` to `${subdomain}.leadpe.online`
- Confirm the existing `POST /v10/projects/{id}/domains` Vercel API call runs (it already does — currently dead code behind the flag)
- Update the comment block accordingly

### 3. CORS allowlist (security)
Update every edge function's CORS check to accept the new apex + wildcard:
```
origin === "https://leadpe.online" || /\.leadpe\.online$/.test(origin)
```
Keep `leadpe.tech` entries during transition? **Decision needed (see Q1).**

### 4. SEO assets
- Rewrite `public/sitemap.xml` with `https://leadpe.online/...`
- Rewrite `public/robots.txt` sitemap line
- Update JSON-LD `@id`, `url`, `logo` in `index.html` and `SEO.tsx`

### 5. Memory update
Update `mem://infrastructure/dns/wildcard-routing` and `mem://project/identity` to reflect `leadpe.online`.

## Quick clarifying questions before I execute

**Q1.** Keep `leadpe.tech` as an active alias during transition (CORS + redirect), or kill it completely?

**Q2.** Change support email `support@leadpe.tech` → `support@leadpe.online`?

**Q3.** In Vercel dashboard, have you already added `*.leadpe.online` and `leadpe.online` as domains to the relevant Vercel team/projects, with DNS (`CNAME *.leadpe.online → cname.vercel-dns.com`) propagated? If not, I'll flip `USE_CUSTOM_DOMAIN = true` but live deploys will fail until DNS is ready.

## Out of scope
- Lovable platform's own `leadpe.tech` custom domain — you must update that yourself in Lovable Project Settings → Domains (connect `leadpe.online`, set as primary, remove `.tech`).
- Twilio/Stripe webhook URLs — those use `*.supabase.co` directly, no change needed.

## Execution order (once approved)
1. Frontend strings (35+ files)
2. Edge functions strings + CORS
3. Flip `USE_CUSTOM_DOMAIN = true` in `deploy-website`
4. Update `sitemap.xml`, `robots.txt`, JSON-LD
5. Update memory files

