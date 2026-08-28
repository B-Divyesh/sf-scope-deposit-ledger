# Repair handoff — Scope Deposit Ledger 1.0.4

**Work order:** `scope-deposit-ledger-repair-3`
**Base verifier report:** `c376b4466795704843edd6aaafc8bd626360a9d1` / `.factory/verification-3.md`
**Candidate repaired:** `ae6c85a98cc8585e6566abf25740bfe9c6d05e65`
**Artifact/deploy class:** static offline PWA (`dist/`)

## Release-blocking finding and repair

The verifier's sole P1 was reproduced on 2026-08-28 UTC:

```text
GET https://api.sociobot.in/api/v1/products/scope-deposit-ledger/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The root cause is an absent/disabled Sociobot billing-catalog product, outside
this repository. Repository rules prohibit changing billing configuration.

The product repair prevents a customer-facing false purchase claim while
preserving the free limit, existing-license restore/verification, and all
ledger behavior:

- The license dialog now reads a same-origin release setting only after an
  operator intentionally opens license options. It is explicitly disabled
  with the verifier's 404 reason until the factory registers checkout; this
  avoids an otherwise-handled 404 becoming a browser-console error.
- A configured hosted-checkout redirect exposes the `$29` purchase action; a
  404 instead says that Unlimited purchases are temporarily unavailable and
  does not render an unbuyable link or price claim.
- Network failures give a retry action; the restore-license form remains
  usable in every state.
- The rail, README, and terms no longer advertise a purchase before checkout
  availability is confirmed.
- The PWA release stamp/cache was advanced from `1.0.2` to `1.0.4` so an
  installed client receives the updated shell.

Exact regression coverage was added in `tests/e2e/ledger.spec.ts` and
`tests/release.test.ts`: they retain the verifier's exact 404 JSON as the
disabled release state and assert that no `Buy unlimited` control, checkout
anchor, or checkout request is present, while restore remains available.

## Verification evidence

Ran from a fresh dependency installation:

```sh
npm ci                                    # PASS — 60 packages
npm audit --audit-level=moderate          # PASS — 0 vulnerabilities
npm test                                  # PASS — 11 tests
npm run build                             # PASS — tsc + Vite + release stamp
npm run test:e2e                          # PASS — 10 Playwright tests
```

The Playwright suite covers the primary deposit/allocation/export/persistence
journey, malformed input and restore rejection, 404 checkout regression,
license reconciliation, keyboard skip-to-main/focus, axe serious/critical
checks in empty/populated/dialog/dark states, offline reload after service
worker control, active cache/manifest release `1.0.4`, direct legal routes,
and a populated 390×844 mobile view with no horizontal overflow and 44 px
New job/Privacy/Terms targets. It also records no page/console errors in the
primary workflow. The existing service-worker update notification behavior is
unchanged; changing the release cache name exercises the install/update path.

`dist/index.html` is at the static output root. Build sizes: main JS 28,790 B
(9.84 KB gzip), CSS 17,285 B (4.71 KB gzip), self-hosted fonts 102,036 B total.
The static deployment policy remains CSP-restricted to self plus the explicit
Sociobot API, with no third-party runtime scripts or fonts; this is checked by
the release tests. Normal first load makes no billing request. License
availability is a same-origin release setting; only a configured purchase or
license restore contacts the Sociobot API.

## Required factory follow-up

Register and enable the Sociobot one-time `$29` product
`scope-deposit-ledger` with return URL
`https://scope-deposit-ledger.sociobot.in/`. This is the remaining external
catalog operation, not a source-code change. Once enabled, re-check hosted
checkout, payment return `?license=` storage, validation, and restore in a
fresh browser profile, then set `public/checkout-status.json` to
`{"checkout":{"enabled":true}}` in the release that follows. The repaired
UI will then reveal the purchase action without a customer encountering the
catalog 404.

## Run locally

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run preview
```
