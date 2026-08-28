# Verification handoff — FAIL

**Work order:** `scope-deposit-ledger-verify-4`

**Candidate tested:** `f554088c444fb05d89072568883d548f3a79f087`

**Production tested:** <https://scope-deposit-ledger.sociobot.in/>

**Date:** 2026-08-28 UTC

## Result

**FAIL — P1 silent cross-tab data loss.** A stale second tab can overwrite a
newer IndexedDB job and erase allocations/status history while saving an
unrelated job-detail edit. This breaks the product's core durable-evidence job.

Production is otherwise the exact candidate build: all checked runtime files
matched local `dist/` byte-for-byte. The earlier deployment-only concern is not
present.

## Reproduction

1. In tab A, create a `$1,000` job.
2. Open tab B on the same origin and let it load the job.
3. In tab A, add a `$400` allocation.
4. In tab B, edit only the scope note and save.
5. Reload tab A: the allocation is gone.

Fresh evidence: allocation visible before the stale save; afterward DOM count
was 0 and direct IndexedDB inspection returned `storedAllocationCount: 0`.

Required repair: merge job-detail edits against the latest stored record,
detect revisions/conflicts, notify or refresh other tabs, give the operator a
visible recovery choice, and add a two-page regression test.

## Verification performed

```sh
npm ci                              # PASS — 60 packages, 0 vulnerabilities
npm audit --audit-level=moderate    # PASS
npm test                            # PASS — 11/11
npx tsc --noEmit                    # PASS
npm run build                       # PASS — exact production build, dist/
npm run test:e2e                    # PASS — 10/10
```

Independent live checks passed for the normal ledger journey, exact-cent and
over-allocation boundaries, invalid-input recovery, held/earned/returned
history, edit guard, CSV/PDF/JSON exports, delete cancellation/confirmation,
backup restore, three-job limit, real invalid-license return, IndexedDB reload,
offline reload, worker update toast, keyboard/dialog focus, reduced motion,
390 px mobile layout/touch targets, dark/light axe scans, request privacy,
security/cache headers, and deploy identity.

Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100;
LCP 1.5 s, TBT 0 ms, CLS 0, 141 KiB transfer. Main JS is 28,794 B, CSS 17,285
B, fonts 102,036 B, and mobile hero 24,070 B.

## Other findings / next steps

- **P2:** hosted checkout remains externally disabled: direct request returns
  `404 {"error":"enabled factory product","status":404}`. The UI now hides the
  broken purchase action and honestly preserves the useful three-job product;
  enable the catalog item before offering the one-time purchase.
- **P3:** axe reports one repeated moderate
  `landmark-complementary-is-top-level` warning for the nested job-index aside;
  serious/critical count is zero.
- Full evidence is in `.factory/verification-4.md`.

No product code was modified during verification.
