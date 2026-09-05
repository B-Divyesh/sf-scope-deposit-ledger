# Verify deposit-to-scope records — Independent verification 5

**Work order:** `scope-deposit-ledger-verify-5`  
**Verified:** 5 September 2026 UTC  
**Live URL:** https://scope-deposit-ledger.sociobot.in  
**Implementation reviewed:** `65680ac7f2a17314915ef227341f0eb35a47a2f1`  
**Documentation reviewed:** `41fbcc4ebca40a38480b6bd06b16c845284250e2`

## Verdict

**FAIL — 7 findings and 12 untested public claim groups.**

The repaired `1.0.5` build is now live. Its main files match the clean candidate
build byte for byte. The deposit workflow and the cross-tab repair work. The
product still fails the required demo, claims, copy, route, checkout, and
license-state contracts.

| Severity | Count |
| --- | ---: |
| P1 | 2 |
| P2 | 5 |
| P3 | 0 |
| Total | 7 |

## Findings

### P1 — The required sample-data demo does not exist

The first screen has no **Try it with sample data** action. Both `/?demo=1` and
`/demo` open the normal empty ledger. They use the production
`scope-deposit-ledger` IndexedDB database. Neither route shows the required
sample label, **Reset demo**, or **Start for real**.

`.factory/demo.md` is also absent. A visitor cannot inspect a populated trail
without creating records in the normal data store. This prevents the required
one-click sample and cannot prove that sample actions leave real data alone.

I entered a realistic record only in a disposable browser context. It contained
a CAD 4,250.75 kitchen deposit, two scope items, a status change, and a full
allocation boundary. This proved the real workflow, but it does not replace the
missing sandbox.

### P1 — Public claims have no claims registry or tagged claim tests

`.factory/claims.json` is absent. No `@claim:<id>` tests exist. There were no
declared claim commands to run.

The landing page, README, privacy page, and terms contain 12 distinct public
claim groups. All 12 are unlisted and lack their required tagged test. Manual
runtime evidence is recorded below, but it does not satisfy the claims
contract. This report therefore records `untested_claim_count: 12`.

### P2 — An invalid license notice disappears after reload

A fresh visit with `?license=qa-invalid-verify-5` called the real Sociobot
verification endpoint once. The endpoint returned `valid:false`. The app
stripped the token from the URL, locked Unlimited, and showed the inactive
license notice.

Reloading within the one-day cache period made no second request, as intended.
However, the inactive notice disappeared. The token and cached invalid verdict
remained stored. The paid-unlock contract requires the quiet inactive notice
while that state remains current.

`initLicense()` restores only `paid`; it does not restore `licenseNotice` from
the cached invalid verdict. This also means the earlier revoked-license repair
is incomplete for the normal next load.

### P2 — The one-time purchase is still unavailable

The live checkout status remains disabled. A direct request returned:

```text
HTTP 404
{"error":"enabled factory product","status":404}
```

The interface handles this honestly. It shows no broken buy action, keeps three
jobs and exports available, and allows license restore. The researched one-time
purchase is still unavailable until the factory billing product is enabled.

### P2 — Required routes, metadata, and shared site structure are incomplete

The live site is missing the required canonical, Open Graph, and Twitter card
metadata. The header has no navigation element. The footer has no build or
version identifier. `robots.txt`, `sitemap.xml`, and a product-styled 404 page
are absent.

An unknown path such as `/definitely-missing-qa5` returns HTTP 200 and the home
page. `/404.html` does the same. The required 404 state is therefore not merely
an expected HTTP 404; it is missing. Requests for `robots.txt` and `sitemap.xml`
return the generic Azure 404 page with no `<main>` or `<h1>`.

The privacy and terms routes are present. Their titles, one `<h1>`, main
landmark, links, and axe scans passed.

### P2 — The offline fallback violates the live content security policy

`/offline.html` contains an inline `<style>` block. The live response sends
`style-src 'self'` without an inline allowance. Chromium blocks the page style
and logs a CSP error. This breaks the no-console-error requirement and the
site-structure rule against inline-style violations.

Normal installed-ledger offline reload still works. It restores the populated
record from IndexedDB under service-worker cache
`scope-ledger-shell-1.0.5`. The defect is limited to the separate fallback
document.

### P2 — The first screen and supporting copy do not meet the plain-words contract

Before scrolling, the screen states:

- Job: “Show exactly what the deposit covers.” This is clear.
- Audience: not stated. Solo trade and professional-service operators are not
  named.
- First action: “Record a deposit.” The required sample action is absent.
- Facts: privacy and offline are combined into one line. A third price or free
  tier fact is absent.

The product also lacks `.factory/copy-audit.md`. Several supporting headings
use mood or metaphor instead of naming their section. Examples include “Begin
with the agreement”, “A durable tool, once”, and “This page is beyond the saved
trail.”

## Public claim audit

Every row lacks a claims entry and tagged command. The runtime column records
extra evidence only.

| Public claim group | Runtime result | Contract result |
| --- | --- | --- |
| Records client, scope, deposit, date, currency, tax assumption | Pass | Untested: no claim entry |
| Prevents allocation above the deposit | Pass at CAD 1,250.76 rejection and 1,250.75 boundary | Untested: no claim entry |
| Keeps dated held, earned, and returned history | Pass | Untested: no claim entry |
| Exports client-readable CSV and PDF | Pass | Untested: no claim entry |
| Exports and restores the full JSON ledger | Pass | Untested: no claim entry |
| Stores job data on-device | Pass during the observed flow | Untested: no claim entry |
| Works offline after the first load | Pass | Untested: no claim entry |
| Merges stale cross-tab edits and asks for review | Pass | Untested: no claim entry |
| Includes three jobs free and keeps core tools free | Pass | Untested: no claim entry |
| Verifies a license no more than once per day | Request count passed; notice persistence failed | Untested: no claim entry |
| Uses no analytics, trackers, CDN fonts, or runtime scripts | Pass for observed normal and export flows | Untested: no claim entry |
| Offers a $29 one-time Unlimited purchase when checkout is available | Checkout unavailable | Untested: no available checkout and no claim entry |

## Main workflow evidence

The live workflow was exercised in fresh desktop and phone contexts.

- Blank scope and scientific notation were rejected without closing the form.
- A CAD 4,250.75 deposit was recorded for “Cedar Lane kitchen refit”.
- CAD 3,000.00 was allocated to materials and marked earned.
- CAD 1,250.76 was rejected against the remaining CAD 1,250.75.
- The exact CAD 1,250.75 boundary was accepted. The JSON total equals the
  deposit exactly.
- CSV includes the job, full status history, tax assumption, and accounting
  limitation.
- PDF begins `%PDF-1.4` and is 4,576 bytes.
- JSON backup contains both allocations and both material-status events.
- A valid backup restored the full record and status history.
- A malformed backup was rejected and preserved the existing record.
- Reload and offline reload preserved the record.
- Storage denial showed the recovery state. **Try again** performed a reload.
- Three free jobs were accepted. A fourth opened the honest unavailable state.
  CSV and PDF remained available.

The disposable contexts had no access to an existing user profile. They left
no server-side product data because this is a static local-first product.

## Cross-tab repair evidence

The exact verification-4 sequence now passes on the live build.

1. Tab B opened job details at the old revision.
2. Tab A added “Materials” and changed it from held to earned.
3. Tab B saved only a scope note.
4. Reload retained the allocation, both status events, and the note.

Direct IndexedDB evidence showed one allocation, history
`[held, earned]`, and revision 4. The receiving tab announced the other-tab
change. The repository regression also confirmed the recovery notice and
**Review latest trail** action. This closes verification 4’s P1 data-loss
finding.

## Accessibility, phone, keyboard, and motion

- The factory URL verifier passed the live home page in 623 ms with no load or
  console errors. It found `lang=en`, one `<h1>`, one `<main>`, no missing image
  alt text, and no unnamed buttons.
- Axe 4.10.2 found zero violations in empty desktop, populated light,
  populated dark, empty phone, privacy, and terms states.
- The skip link is first, has a 3 px visible outline, and moves focus to main.
- The native dialog receives focus and returns focus to its opener on close.
- At 390×844 there was no horizontal overflow. All visible targets measured at
  least 44×44 CSS px.
- At 200% page zoom the heading remained visible and the page retained its
  layout width.
- Reduced motion produced `animation: none` and `transition: 0s`.
- Normal desktop, phone, export, invalid input, cross-tab, and offline-ledger
  flows produced no console or page errors.

The standalone offline fallback CSP error is recorded as a finding above.

## PWA, privacy, update, links, and policy

- The manifest starts at `/?source=installed&v=1.0.5`.
- The active worker controls the page and uses
  `scope-ledger-shell-1.0.5`.
- Offline reload retained the populated ledger.
- A derived local `1.0.6` worker installed from the same clean artifact. The
  app displayed “A fresh version is ready. Reload to update.” with no errors.
- Normal create, allocate, export, backup, and reload traffic used only the
  product origin. No job or client data request left the origin.
- The explicit invalid-license action contacted only the documented Sociobot
  verification endpoint. It sent the synthetic token, not ledger data.
- All rendered home-page links returned 200. Mail links on legal pages are
  explicit contacts.
- HSTS, CSP, strict referrer policy, and `nosniff` are present.

This is a static PWA. Backend tenant isolation, restart persistence, health,
and 429 behavior do not apply. CLI, library, and desktop package checks do not
apply.

## Clean candidate commands

The commands ran from a separate clean clone at documentation SHA `41fbcc4`.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages, 0 vulnerabilities |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 11/11 Vitest tests |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — `dist/index.html` produced |
| `npm run test:e2e` | PASS — 11/11 Playwright tests |
| Declared `.factory/claims.json` commands | FAIL — file and commands absent |

The same 11-test suite was also aimed at production. Ten tests passed. The
license test’s local-only mock sent an `Access-Control-Allow-Origin` value for
`http://127.0.0.1:4173`, so Chromium correctly rejected that mock on the live
origin. The real endpoint then passed a separate live check and exposed the
notice-persistence defect above.

## Build size and performance

- Main JS: 32,621 bytes; 10.95 kB gzip.
- CSS: 17,439 bytes; 4.73 kB gzip.
- Fonts: 102,036 bytes total.
- Phone hero: 24,070 bytes.
- Lighthouse 12.8.2 mobile: performance 100, accessibility 100, best practices
  100, SEO 100.
- FCP 1.1 s, LCP 1.5 s, TBT 0 ms, CLS 0, total transfer 155 KiB.

All measured performance budgets pass.

## Deployment identity

The assignment snapshot said production still reported `1.0.4`. That changed
before this verification. Production now reports `1.0.5`.

The live and clean candidate hashes match for the main HTML, manifest, service
worker, checkout status, main JS, CSS, privacy, terms, and offline document.
Representative matches:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `edf24cf657705175867cb878405dd3686675037a66fd20c407c66a864ee5b54b` |
| `manifest.webmanifest` | `eb0e80353fce7e4b73d0f4ff0852280598cf9ced90bc979363af540be2f06a05` |
| `sw.js` | `debc891ce180f410624635fbe6ea7947e3518fdf1c0118336e7553d9f1c784f2` |
| `assets/main-BYdfRqtD.js` | `946eefb33189e722f8247b8d435e3df93256f4351262e95adae97b0b3cb5b7eb` |

Later documentation commit `41fbcc4` changes only the handoff. The product
implementation under review is `65680ac`.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Invalid money text changed value | Closed: live invalid-input check and unit test pass |
| Malformed restore replaced valid data | Closed: live record stayed intact |
| Blank scope or allocation title accepted | Closed: live form rejects blank scope; browser suite rejects both |
| Populated contrast violation | Closed: all current axe scans report zero violations |
| Skip link did not move focus | Closed: focus moves to main |
| Unversioned PWA cache and start URL | Closed: both report `1.0.5` |
| Missing production CSP | Closed: CSP is present |
| Service worker failed to install | Closed: controlled online and offline reload pass |
| Status changes lost earlier dates | Closed: JSON, CSV, UI, and tests retain history |
| Progress and storage retry blocked by CSP | Closed for those controls; retry reloads |
| International PDF text was corrupted | Closed by unit test against the exact deployed implementation artifact |
| Invalid or revoked license stayed unlocked | Partly closed: locking works; the notice now disappears after reload |
| Mobile targets below 44 px | Closed: no visible phone target was below 44 px |
| Hosted checkout returned 404 | Open: direct checkout still returns 404; UI is honest |
| Stale tab deleted newer allocation history | Closed: exact live regression passes |
| Nested complementary landmark warning | Closed: current axe scans report zero violations |

## Evidence files

Detailed machine output and screenshots are in `/work/.evidence/`:

- `live-qa.json`, `live-extra.json`, and `update-check.json`
- `live-desktop-first-screen.png`, `live-phone-first-screen.png`, and
  `live-desktop-populated.png`
- exported CSV, PDF, and JSON files
- `lighthouse.json`
- checkout and license endpoint headers and bodies

## Required next work

1. Add the isolated one-click demo and `.factory/demo.md`.
2. Add `.factory/claims.json` and one tagged sandbox test for every public
   claim. Remove claims that cannot be tested.
3. Restore the cached invalid-license notice on every load.
4. Enable the factory billing product, then test purchase return and restore.
5. Add canonical and social metadata, header navigation, footer build identity,
   `robots.txt`, `sitemap.xml`, and a styled real 404 response.
6. Move the offline fallback CSS to an allowed file or adjust policy without
   weakening it.
7. Add the missing audience, sample action, and three facts to the first screen.
   Replace mood headings and produce `.factory/copy-audit.md`.
