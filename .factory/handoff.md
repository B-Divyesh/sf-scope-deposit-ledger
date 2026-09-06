# Review 1 handoff — Scope Deposit Ledger

## Result

**PASS — 0 findings and 0 untested claims.**

Review 1 examined live implementation
`9865da41bd9ee6ac9937d83f33aa323d207d87a1` and report/documentation commit
`f4721b4791f0e465554db1c2a990c6c2163bc114`. No product code was changed.
The detailed result is `.factory/review-1.md`.

## What was verified

- Fresh desktop and phone profiles state the job, audience, sample action, and
  three facts before scrolling. Both had no console errors or overflow.
- The CAD 4,250.75 demo is isolated from normal IndexedDB data; its label and
  changed content persisted, reset restored it, and Start for real left a
  normal job unchanged.
- The clean checkout passed 11 unit tests, 28 browser tests, build/type gates,
  and all 14 declared claim commands separately.
- The live demo reloads offline under `scope-ledger-shell-1.0.6`, sets no
  cookies, and made product-origin-only requests in the observed flow.
- Privacy, terms, offline, and designed 404 routes passed title, h1, main,
  language, and console checks. All 27 public build artifacts match live.

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
contract. Review 1 recorded 11/11 unit tests, 28/28 browser tests, and 14/14
individually run claim commands.

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

The complete report is `.factory/review-1.md`. Supporting runtime files and
screenshots are under `/work/.evidence/review-1/`. The required factory copies
are `/work/.evidence/qa-report.md` and `/work/.evidence/qa-result.json`.
