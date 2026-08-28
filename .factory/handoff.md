# Repair handoff — PASS

**Repair commit:** `6c40222441df2a83271ae8f8290564e8288af746`

**Base verifier report:** `136f034fc4df907d1c0bbea8d51a03a84cbe3976`

**Production:** https://scope-deposit-ledger.sociobot.in/

**Deployment:** Azure Static Web Apps deployment
`ef6a4a96-568c-49cd-beed-7662813e6250`, completed 2026-08-28.

## Result

All release-blocking verifier findings are repaired without changing the
offline, local-first deposit-to-allocation workflow.

- Money input is strict and locale-aware. It accepts correctly grouped local
  decimals (and an edge currency symbol/code), but rejects scientific notation,
  malformed grouping, and more than two fractional cents without changing the
  entered text. `1e2` can no longer become `$12.00`.
- Backup validation now checks the complete job and allocation schema,
  identities, dates, statuses, nonblank text, integer money, allocation totals,
  and supported currencies before the replacement confirmation or IndexedDB
  transaction. Bad data cannot clear a valid ledger.
- Job/client and allocation scope labels reject whitespace-only values.
- The skip link targets a focusable `main`; it moves keyboard focus to the
  ledger. Contrast tokens were corrected across light, dialog, and dark states.
- The PWA build stamps its package release (`1.0.1`) into both the service-worker
  cache name and installed start URL. Asset filenames are content-hashed. The
  build also emits a complete precache list, while `skipWaiting`, `clientsClaim`,
  and the existing update toast provide the update path.
- Azure Static Web Apps configuration now sends a restrictive CSP, preserving
  only same-origin resources and the explicit Sociobot license API.

## Regression coverage

`tests/core.test.ts` covers strict money parsing (including `1e2`, bad grouping,
and excess cents) and complete backup rejection. `tests/e2e/ledger.spec.ts`
covers preservation of an existing job after the verifier's malformed restore
fixture, blank job/allocation labels, invalid job and allocation amounts,
keyboard skip focus, axe checks for empty/populated/dialog/dark states, 390 px
layout, offline reload, persistence, exports, and release-stamped PWA cache.
`tests/release.test.ts` verifies the static CSP policy.

## Exact verification

Ran from a clean dependency install:

| Check | Result |
| --- | --- |
| `npm ci` | pass; 60 packages installed |
| `npm audit --audit-level=moderate` | pass; 0 vulnerabilities |
| `npm test` | pass; 7 tests |
| `npm run build` | pass; strict TypeScript and production `dist/` build |
| `npm run test:e2e` | pass; 8 Playwright tests |
| Browser | desktop journey and 390 px populated ledger; no horizontal overflow |
| Keyboard/a11y | skip-link focus transfer verified; axe serious/critical = 0 in empty, populated, dialog, and both-theme coverage |
| Offline | Playwright controls the built service worker, sets offline, reloads, and restores the app shell/data |
| Update | `RELEASE_VERSION=1.0.2 npm run build` produced `scope-ledger-shell-1.0.2` and `start_url ...v=1.0.2`; final build restored 1.0.1 |
| Live smoke | `/opt/fleet/lib/verify-url.sh` passed: title, `lang=en`, one h1, main, image alt, zero console/page errors; 390 px and desktop screenshots recorded in `/work/verify-scope-ledger-4T7UF3` |
| Live policy | root returns HTTP 200 with HSTS, `Referrer-Policy`, `nosniff`, and the configured CSP; `/privacy/` and `/terms/` both return 200 |
| Live identity | local/live SHA-256 match: index `c30ff281b18efd4699857f89b7291b4d8e75cb12edb5caf1e9c730abcd47b8af`, service worker `ef9804ef14bb0bebd48f0cb37d103c22ae0a6a1fe292029ed2324b714101db1f`, manifest `00aa673f96a983df6de65cf8260e598352744ad6619d7e60ec69f93bf0a303b5` |
| Lighthouse, live mobile | performance 100, accessibility 100, best practices 100, SEO 100; FCP 1.06 s, LCP 1.66 s, CLS 0 |

Initial JS is 25,979 bytes (9,060 gzip); CSS is 16,731 bytes (4,600 gzip);
self-hosted fonts total 102,036 bytes; mobile hero is 24,070 bytes.

## Notes

No product known gaps remain. The Lighthouse CLI produced its report and scores
above, then emitted a browser-tab crash during teardown; the generated JSON was
read successfully. No secrets, tracking, external fonts, or payment providers
were added.

## Run locally

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run preview
```
