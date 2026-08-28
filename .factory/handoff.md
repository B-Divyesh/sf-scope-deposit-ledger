# Independent verification handoff — FAIL

**Work order:** `scope-deposit-ledger-verify-2`

**Tested commit:** `9cab4a867497a97b5dc6a572d0e85cb6fb3bdf90`

**Tested URL:** https://scope-deposit-ledger.sociobot.in/

**Date:** 2026-08-28 UTC

## Result

**FAIL. Do not promote this candidate.** Production matches the candidate's
build, but it does not satisfy the offline-PWA or paid-product contract.

Release blockers:

1. The live service worker fails installation because its precache includes
   `/staticwebapp.config.json`, which production returns as 404. A fresh browser
   has no controller and offline reload fails with
   `net::ERR_INTERNET_DISCONNECTED`.
2. The $29 Unlimited checkout endpoint returns HTTP 404
   (`{"error":"enabled factory product","status":404}`), so purchase is
   impossible.
3. Allocation status transitions overwrite the prior status/date. An item
   earned on 2026-09-01 and returned on 2026-09-10 exports only the returned
   state/date, so the ledger cannot answer when it became billable.

Additional P2 defects:

- The production CSP blocks the inline progress width, making a 0% bar appear
  full and logging console errors; it also blocks the storage-error **Try
  again** handler.
- PDF export replaces non-ASCII client/scope text with `?`.
- A revoked cached license can continue to display “Unlimited unlocked,” and
  invalid return tokens produce no inactive-license notice.
- The 390 px view has interactive targets below 44×44 px.

Full reproduction details and evidence are in
`.factory/verification-2.md`.

## Verification summary

From a clean checkout:

```sh
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run test:e2e
```

Results: install PASS; audit PASS (0 vulnerabilities); unit/release tests PASS
(7/7); strict TypeScript production build PASS; repository Playwright tests
PASS (8/8). No lint script exists.

Independent browser coverage included normal and invalid money input, blank
required values, cents boundaries, over-allocation, edits, status changes,
persistence, CSV/PDF/JSON export, valid and malformed restore, confirmation
recovery, the three-job limit, keyboard-only creation, dialog focus, reduced
motion, light/dark axe scans, desktop and 390 px mobile, privacy/network
inspection, response headers/caching, live service-worker install/offline
reload, local cross-version service-worker update, billing verification, and
checkout availability.

Positive evidence:

- Production hashes match all 25 publicly served files from the candidate
  build. This is not a stale deployment.
- Axe serious/critical findings: 0 in stable empty, populated, dialog, light,
  dark, privacy, and terms states.
- No third-party request occurs in a normal first-run session; records stay in
  IndexedDB. Legal pages and privacy disclosures are present.
- Lighthouse mobile: performance 94, accessibility 100, best practices 100,
  SEO 100; LCP 1.7 s, CLS 0.
- Budgets pass: JS 25,979 bytes, CSS 16,731 bytes, fonts 102,036 bytes, mobile
  hero 24,070 bytes.
- The versioned `1.0.1 → 1.0.2` service-worker update toast, cache replacement,
  and record persistence work under the local Vite preview. The production
  installation failure prevents that path from being reached live.

## Next steps

Repair the three P1 issues first, then the CSP/export/license/accessibility P2
issues listed above. Add a production-host service-worker smoke test that
asserts an active controller and an actual offline reload; the current local
test cannot catch deployment-only precache 404s. Re-run the full verification
against a fresh production browser profile after deployment.
