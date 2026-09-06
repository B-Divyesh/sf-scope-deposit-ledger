# Independent verification 6 handoff — Scope Deposit Ledger

## Result

**PASS — 0 findings and 0 untested claims.**

Independent verification reviewed implementation
`9865da41bd9ee6ac9937d83f33aa323d207d87a1` and documentation
`19db44414de93560e2a7157f8ce993d0b816c65a` against the live product at
https://scope-deposit-ledger.sociobot.in. No product code was changed.

The full report is `.factory/verification-6.md`.

## What was verified

- Fresh desktop and 390×844 phone first screens name the deposit-tracking job,
  the solo trade/service audience, the sample action, and three factual limits
  before scrolling.
- The realistic CAD 4,250.75 sample uses a separate IndexedDB database. Its
  label persists, reset restores the fixture, and leaving it clears demo data
  without changing a normal job.
- Normal, invalid, boundary, recovery, export, restore, dated-history,
  cross-tab, license, and free-limit paths pass.
- Keyboard focus, dialog behavior, light/dark contrast, 44 px phone targets,
  reduced motion, 200% text, legal pages, privacy requests, links, route titles,
  offline fallback, designed 404, service-worker control, offline reload, and
  update notification pass.
- All 14 declared claim commands pass separately. There are no unlisted or
  untested public claims.
- All 27 public build artifacts match production byte for byte.
- Lighthouse 13.4.1 mobile scores 100 in Performance, Accessibility, Best
  Practices, SEO, and Agentic Browsing. FCP is 1.1 s, LCP 1.5 s, TBT 0 ms,
  CLS 0, and total transfer 147,793 bytes.

## How to verify

Use Node.js 20 or newer from a clean checkout:

```sh
npm ci
npm audit --audit-level=moderate
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
npm run test:claims
```

Run each command in `.factory/claims.json` separately for the acceptance
contract. Verification 6 recorded 11/11 unit tests, 28/28 browser tests, and
14/14 individually run claim commands.

## Remaining external dependency

The Sociobot billing product is not registered or enabled. The checkout
endpoint still returns the expected HTTP 404. The product handles this state
honestly: it renders no buy action, explains that purchases are unavailable,
keeps three jobs and every export free, and leaves license restore available.

The billing operator can use `/work/.evidence/billing-offer.json` to register
the one-time offer. After registration, enable `public/checkout-status.json`,
deploy, and verify a real hosted purchase return, restore on another browser,
and refund revocation. Do not enable the buy action before the hosted checkout
is confirmed.

## Evidence

The complete report is `.factory/verification-6.md`. Supporting runtime files
and screenshots are under `/work/.evidence/verify-6/`. The required factory
copies are `/work/.evidence/qa-report.md` and
`/work/.evidence/qa-result.json`.
