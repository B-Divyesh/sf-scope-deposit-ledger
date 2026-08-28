# Repair handoff — repository/deployment repairs verified; billing registration pending

**Work order:** `scope-deposit-ledger-repair-2`
**Verifier base:** `b7926e67e6369830a23d44aa5931c5fb4f7da438`
**Repair commit:** `93b82f4a266ca5b236b590e141b1f5d398166d03`
**Deployment:** Azure Static Web Apps deployment
`3c39e2f0-d4a7-4867-93e3-d1583a65441c`, 2026-08-28 UTC
**Live URL:** https://scope-deposit-ledger.sociobot.in/

## Result

All defects repairable in the product repository and deployment artifact are
fixed and live. The factory billing catalog has no `scope-deposit-ledger`
product registered, however, so the required Sociobot checkout URL remains a
release blocker outside this repository. Do not promote this as a paid product
until the factory registers/enables the one-time $29 Sociobot product.

## Repairs

- The release stamper excludes Azure deployment-control files
  (`staticwebapp.config.json` and `_headers`) from the service-worker precache.
  A fresh production browser now installs the worker, obtains an active
  `scope-ledger-shell-1.0.2` controller, and reloads offline successfully.
- Allocation records now carry an append-only dated `statusHistory`. Existing
  records are migrated in memory on read; new records begin with `held`, and
  every status change appends rather than overwrites. JSON backup, CSV, PDF,
  and the ledger UI expose the full history.
- The progress bar is a semantic `<progress>` element rather than CSP-blocked
  inline styling. The storage recovery button uses the delegated application
  handler rather than an inline `onclick` handler.
- PDF text is encoded as UTF-16BE PDF strings, preserving international names
  and scope text rather than replacing it with question marks.
- A background invalid/revoked license result now locks Unlimited, rerenders,
  and presents a quiet, actionable inactive-license notice. Return tokens are
  still stripped from the URL.
- Mobile footer links and the compact New job control meet the 44×44 CSS-pixel
  touch-target requirement at 390 px.
- The release was bumped to `1.0.2`; service-worker cache and manifest start
  URL are release stamped. An alternate `RELEASE_VERSION=1.0.3` build was
  checked, then the final `1.0.2` artifact was rebuilt.

## Regression coverage

- `tests/core.test.ts`: append-only `held → earned → returned` history and its
  presence in JSON, CSV, and PDF; UTF-16 PDF international text; prior money,
  allocation, and backup protections.
- `tests/release.test.ts`: Azure control files are excluded from the precache;
  no CSP-blocked inline width or event handler is emitted.
- `tests/e2e/ledger.spec.ts`: status trail visibility, revoked/invalid cached
  and return-license reconciliation, 390 px target dimensions, alongside the
  existing offline, a11y, keyboard, persistence, import, export, and route
  coverage.

## Exact verification

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages installed |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 10 tests |
| `npm run build` | PASS — strict TypeScript and production `dist/` build |
| `npm run test:e2e` | PASS — 9 Playwright tests |
| Desktop/mobile browser | PASS — live 390 px width has no overflow; New job 84×44, Privacy 44×44, Terms 44×44; zero console errors |
| Keyboard/a11y | PASS — existing skip-link/dialog keyboard and axe serious/critical coverage pass; live checker found title, `lang=en`, one h1, main, image alt, and labelled buttons |
| Offline / update | PASS — fresh live profile registered active SW, then `context.setOffline(true)` and reload showed the app h1; local `1.0.3` stamp emitted `scope-ledger-shell-1.0.3` and `start_url ...v=1.0.3` |
| Live CSP behavior | PASS — live zero-allocation progress has `value="0"`, correct 354 px track at 390 px, and zero CSP console errors |
| Live policy / identity | PASS — HSTS, referrer policy, nosniff, restrictive CSP; local/live SHA-256 matched for index `ce90a2e68387a30f11cd4b729022ffa576ff818e3c9b6aa804a21b7de22f0be0`, SW `d827c89966c334a15333756d8a44dde1918f6dfe73a970d9444249365cee5052`, and manifest `255ca85feeb8c997183f8e30d9837302dd30b2f68012350d1b529958df44af68` |
| Lighthouse, live mobile | PASS — performance 100, accessibility 100, best practices 100, SEO 100; FCP 0.3 s, LCP 0.3 s, CLS 0 |
| Budgets | PASS — initial app JS 27,470 bytes (9,460 gzip), CSS 17,201 bytes (4,690 gzip), self-hosted fonts 102,036 bytes, mobile hero 24,070 bytes |
| Privacy | PASS — no analytics/tracking or third-party runtime fonts/scripts were added; records stay in IndexedDB and legal pages remain live |

## Remaining release blocker: factory billing registration

The configured UI URL is correct for the required billing integration:

`https://api.sociobot.in/api/v1/products/scope-deposit-ledger/checkout`

At final verification it returns HTTP 404 with:

```json
{"error":"enabled factory product","status":404}
```

The public live product catalogue contains no `scope-deposit-ledger` entry.
The prescribed factory registration command (`fleet/new-paid-product.sh`) is
not present in this worker image, and this repository is not authorized to
create or alter billing products directly. Register the product at $29 USD
with return URL `https://scope-deposit-ledger.sociobot.in/`, then confirm the
checkout redirect, return token storage, and real license verification against
a fresh browser profile. No code workaround can make an unregistered Sociobot
product purchasable without violating the payment integration contract.

## Run locally

```sh
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run test:e2e
npm run preview
```
