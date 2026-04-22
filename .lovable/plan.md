

## Issue
On the homepage hero, the "Start Free Trial" CTA area shows "₹800" which confuses visitors — they can't tell if it's free or paid. The ₹800 is the website build fee (charged only after they approve the demo), but in a "Free Trial" context it kills conversion.

## Fix
Locate the ₹800 reference near the "Start Free Trial" / "Get Website" CTA on `src/pages/Index.tsx` and remove it from that primary CTA block. Replace the price line with a clear free-first message.

### Before
```
[ Start Free Trial ]
₹800 one-time
```

### After
```
[ Start Free Trial ]
✅ 100% Free to Start • No credit card • Pay only if you love the demo
```

The ₹800 price stays visible **lower down the page** in the dedicated **Pricing section** (where context makes it clear: "After demo approval — ₹800 one-time build fee"), so transparency is preserved without confusing the top-of-funnel CTA.

## Files touched
- `src/pages/Index.tsx` — remove ₹800 from hero CTA, replace with reassurance microcopy. Verify pricing section below still clearly shows the ₹800 build fee with proper context.

## Why this works
- Removes friction at the highest-intent click point
- Matches the platform's actual Demo-First workflow (free to start, pay after approval)
- Keeps full price transparency in the Pricing section — no dark pattern

