# Verification handoff — FAIL

**Work order:** `scope-deposit-ledger-verify-3`

**Candidate tested:** `ae6c85a98cc8585e6566abf25740bfe9c6d05e65`

**Live URL:** <https://scope-deposit-ledger.sociobot.in/>
**Verified:** 2026-08-28 UTC

## Result

**FAIL — do not release the advertised paid product.** The candidate is
byte-for-byte live and the actual ledger/PWA is otherwise healthy, but the
only `$29` Unlimited checkout route returns HTTP 404:

```json
{"error":"enabled factory product","status":404}
```

The customer-facing purchase is therefore unavailable. This is a factory
billing registration/enabling defect outside product source, but it blocks the
end-to-end paid product contract.

## What was verified

- Clean install, audit, unit/release tests, exact TypeScript/Vite production
  build, and 9-test Playwright suite all passed.
- Fresh local and production browser journeys created deposits, rejected bad
  allocation input, recorded held-to-earned trail history, exported CSV/PDF,
  persisted IndexedDB state, and reloaded offline.
- Live desktop and 390 px mobile had no console/page errors or overflow;
  keyboard skip-to-main/focus, reduced motion, and axe serious/critical scans
  passed. Live Lighthouse mobile scored 100 in Performance, Accessibility,
  Best Practices, and SEO (LCP 1.5 s; CLS 0).
- Production service worker `scope-ledger-shell-1.0.2` precaches the shell and
  legal/offline pages, survives offline reload, and its update notification was
  independently exercised with a changed-worker response.
- Normal first-run traffic stayed on the product origin; no tracking,
  third-party runtime dependencies, or CDN fonts were observed. CSP, HSTS,
  referrer policy, nosniff, and immutable hashed-asset caching are live.
- Local/live SHA-256 matches confirm production is this candidate, not a stale
  deployment. Details and exact evidence are in `.factory/verification-3.md`.

## Required next step

Register and enable the Sociobot product `scope-deposit-ledger` at `$29` with
return URL `https://scope-deposit-ledger.sociobot.in/`. Then re-run checkout,
payment return-token, validation, and restore-purchase verification in a fresh
profile. No product code changes were made during this verification.

## Re-run

```sh
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run test:e2e
npm run preview
```
