

## Plan: 4 fixes for Admin + Twilio + SEO

### 1. Remove "Needs Attention" section from /admin
**File:** `src/pages/Admin.tsx`
- Delete the `actionItems` state, `ActionItem` interface, and `generateActionItems()` function (lines ~140-150, 167, 254, 289-358).
- Remove the rendered "Actions" / "Needs Attention" card block in the JSX (the section that maps `actionItems` and shows priority badges).
- Remove `"actions"` from the default `expandedSections` Set.
- Why: cleaner Admin UI; alerts are now handled by Twilio + Outbox.

### 2. Fix Twilio (test on 9973383902)
**Root cause:** Twilio Sandbox WhatsApp requires you to send `join <code>` to **+1 415 523 8886** from your WhatsApp every 72 hours. Until you do that, every WA message to your number returns Twilio error 63007/63016 silently. Also, no `TWILIO_SMS_FROM` secret is set, so SMS fallback can't fire either.

**Steps:**
1. **Add a diagnostic test endpoint** in `notify-admin`: support `event_type: "test_ping"` that sends `🔧 LeadPe test ping — if you see this, Twilio is wired correctly.` and returns the full Twilio error response in the HTTP body so we can see the exact failure reason.
2. **Add a "Twilio Status" card** at the top of `/admin`:
   - Shows: last successful send timestamp (from `message_log`), last error (if any), and a big **"Send Test Ping to my WhatsApp"** button.
   - Shows a yellow warning box with copy-pasteable join code instruction:  *"WhatsApp sandbox expires every 72h. To re-join: open WhatsApp → send `join <your-sandbox-code>` to +1 415 523 8886"*. Field for you to paste your current sandbox code, stored in `localStorage`.
3. **Surface real Twilio errors**: update `notify-admin` to return `error` text in the JSON response (already partially done) and log the full error body, not just status code, into `message_log.error_message`.
4. **Ask user (after deploy) to add `TWILIO_SMS_FROM` secret** with their Twilio SMS-enabled number so SMS fallback actually delivers when WA sandbox is dead. (Will request via add_secret tool when implementing.)
5. After deploy, click the test button → confirm WhatsApp arrives. If it fails, the error will say exactly why (sandbox not joined / number not opted in / wrong From).

### 3. Fix /admin reloading on every visit
**File:** `src/pages/Admin.tsx`
- Current bug: `fetchData` runs on every mount AND `setInterval(fetchData, 5min)` triggers `setLoading(true)` → full-screen spinner flashes. Plus admin role check refetches on every navigation.
- Fix:
  - Add a `hasFetchedRef = useRef(false)` so first mount fetches, subsequent mounts skip if data already loaded within 60s.
  - Cache `profiles/deployments/leads/orders/etc.` to `sessionStorage` keyed by `lp:admin:cache` with 5-min TTL — load instantly from cache on mount, then revalidate in background WITHOUT setting `loading=true`.
  - Change interval refresh to silent: don't toggle `loading`, just update state.
  - Move admin role check into a single `useEffect` that runs once and caches the role result in `sessionStorage` so it doesn't re-query on every visit.

### 4. SEO: rank leadpe.lovable.app on Google
The deep technical fix is already 80% done (SEO.tsx, sitemap edge function, robots.txt, JSON-LD all exist). Missing pieces:
- **Index.tsx is missing real text content** — Google sees only buttons/icons. Add a 500+ word content block below the hero: "What is LeadPe?", "Who is it for?", "How AI website building works", "Why local businesses need a website in 2026" — use natural keywords (lead generation, WhatsApp leads, local business website India, AI website builder, etc.).
- **Add proper `<h1>` with primary keyword**: "AI Website Builder for Indian Local Businesses — Live in 48 Hours". Right now the hero has no semantic h1.
- **Alt text** on all `<img>` in Index.tsx, Footer, business-type icons.
- **Sitemap rewrite** in `vercel.json` points to Supabase function — verify it returns 200 by hitting `/sitemap.xml` after deploy.
- **Add `lovable.app` canonical override**: SEO.tsx hardcodes `https://leadpe.tech` as canonical. Since user's live URL is `leadpe.lovable.app` and `leadpe.tech` is NOT yet connected, change canonical to dynamically use `window.location.origin` so Google indexes the actually-live URL.
- **Provide a Google Search Console action checklist** in chat after deploy:
  1. Go to https://search.google.com/search-console → Add property → `https://leadpe.lovable.app`
  2. Verify via the existing `public/google4105f9df489aedbf.html` file (already in repo)
  3. Submit `https://leadpe.lovable.app/sitemap.xml`
  4. URL Inspect homepage → "Request Indexing"
- **Strong recommendation in chat**: connect custom domain `leadpe.tech` (DNS already configured per memory). Subdomains on `*.lovable.app` rarely rank page-1 in India.

### Order of execution
1. Remove Needs Attention section (Admin.tsx)
2. Fix Admin reload (Admin.tsx — caching + ref guard)
3. Twilio diagnostic + Twilio Status card (notify-admin function + new component)
4. SEO content + h1 + alt text + dynamic canonical (Index.tsx, SEO.tsx)
5. After deploy: I'll send test ping → confirm WhatsApp delivery on 9973383902 → give you Search Console step-by-step.

### Out of scope
- Buying `.in` domain (your call — connect `leadpe.tech` via Project Settings → Domains).
- Backlinks / social sharing (manual work, not code).
- Full Meta WhatsApp Business API migration (post-MVP, after 10 clients).

