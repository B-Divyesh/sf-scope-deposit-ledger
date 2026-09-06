# Verify deposit-to-scope records — Independent verification 6

**Work order:** `scope-deposit-ledger-verify-6`  
**Verified:** 6 September 2026 UTC  
**Live URL:** https://scope-deposit-ledger.sociobot.in  
**Implementation reviewed:** `9865da41bd9ee6ac9937d83f33aa323d207d87a1`  
**Documentation reviewed:** `19db44414de93560e2a7157f8ce993d0b816c65a`

## Verdict

**PASS — 0 findings and 0 untested claims.**

The live `1.0.6` product completes the deposit-to-scope job in fresh desktop
and phone profiles. The sample is isolated from normal data, realistic,
resettable, and available offline. Normal records, allocation limits, dated
history, exports, restore, stale-tab merging, accessibility, privacy, routes,
and recovery paths passed.

The Sociobot checkout endpoint still deliberately returns HTTP 404 because the
billing product is not registered. This is not a product defect in this
candidate: the live app does not render a buy link, says purchases are
temporarily unavailable, keeps three jobs and all exports free, and retains
license restore. A real purchase remains an external follow-up.

| Severity | Count |
| --- | ---: |
| P1 | 0 |
| P2 | 0 |
| P3 | 0 |
| Total | 0 |

## First screen and visual review

Fresh 1440×900 desktop and 390×844 phone profiles showed the required facts
before scrolling:

- Job: **Track deposits against agreed work.**
- Audience: solo trades and service operators who track held, earned, and
  returned money.
- First action: **Try it with sample data**, with a nearby explanation that it
  opens a separate ledger.
- Facts: saved on the device, works offline after the first visit, and three
  jobs plus every export are free.

The direct demo uses its own job-focused title, **Review a sample deposit
trail.** The desktop and phone layouts were inspected in empty and populated
states. The warm paper ledger, locally hosted type, generated allocation image,
rules, balance strip, and vertical status trail match `.factory/design.md` and
remain distinct from a generic dashboard. The 390 px layout had no horizontal
overflow. Text-only resizing to 200% retained all content and controls, with no
document overflow beyond the resulting layout viewport.

## Sample and core workflow

The following sequence ran against the live site in a fresh browser context:

1. Created **Real verification job** in the normal ledger.
2. Opened `/demo` and found the persistent **Demo — sample data, nothing is
   saved to your ledger** label, **Reset demo**, and **Start for real**.
3. Inspected the CAD 4,250.75 Cedar Lane kitchen deposit for Maya Chen. It had
   three realistic scope items, CAD 500.75 unallocated, held, earned, and
   returned balances, dated history, tax wording, and client notes.
4. Changed the demo note and reloaded. The demo change persisted while the
   label remained visible.
5. Reset the demo. The original note and values returned, while the normal job
   stayed unchanged.
6. Tried to allocate CAD 500.76. The form rejected it and kept the correction
   path open. CAD 500.75 then succeeded and produced 100% assigned.
7. Tried to lower the deposit below its allocated total. The form rejected the
   edit. Raising the deposit succeeded.
8. Changed one item from held to earned to returned. The complete dated trail
   remained after reload and appeared in the JSON backup.
9. Exported client-readable CSV and PDF files. The CSV included the job,
   allocation, tax assumption, and accounting limitation. The PDF started with
   `%PDF-1.4` and contained the populated trail.
10. Supplied an incomplete backup. It was rejected without replacing the
    sample. Deleting the sample and restoring the valid backup recovered all
    three allocations and their history.
11. Saved a stale scope-note edit in a second tab after the first tab changed
    allocation status. The merge notice appeared, and both the note and newer
    trail survived reload.
12. Selected **Start for real**. The demo database was cleared, and **Real
    verification job** remained in the normal database unchanged.

The clean browser suite separately covered blank names, malformed and
scientific-notation money, zero/negative/excess-decimal values, unsafe and
over-allocated backups, delete cancellation, the three-job boundary, Unicode
PDF content, and valid recovery paths.

## Public claim audit

`.factory/claims.json` contains 14 entries. Each identifier occurs exactly once
as an `@claim:<id>` browser test. Every exact command below ran separately from
the clean checkout and passed 1/1. The home page, demo, privacy, terms, and
README were cross-checked; no unlisted public claim was found.

| Claim | Exact declared command | Result |
| --- | --- | --- |
| `demo-isolation` | `npm run test:claims -- --grep @claim:demo-isolation` | PASS |
| `ledger-details` | `npm run test:claims -- --grep @claim:ledger-details` | PASS |
| `allocation-limit` | `npm run test:claims -- --grep @claim:allocation-limit` | PASS |
| `status-history` | `npm run test:claims -- --grep @claim:status-history` | PASS |
| `csv-export` | `npm run test:claims -- --grep @claim:csv-export` | PASS |
| `pdf-export` | `npm run test:claims -- --grep @claim:pdf-export` | PASS |
| `json-backup` | `npm run test:claims -- --grep @claim:json-backup` | PASS |
| `on-device-data` | `npm run test:claims -- --grep @claim:on-device-data` | PASS |
| `offline-reload` | `npm run test:claims -- --grep @claim:offline-reload` | PASS |
| `cross-tab-merge` | `npm run test:claims -- --grep @claim:cross-tab-merge` | PASS |
| `free-core` | `npm run test:claims -- --grep @claim:free-core` | PASS |
| `license-daily-check` | `npm run test:claims -- --grep @claim:license-daily-check` | PASS |
| `no-tracking` | `npm run test:claims -- --grep @claim:no-tracking` | PASS |
| `paid-offer` | `npm run test:claims -- --grep @claim:paid-offer` | PASS |

The paid-offer test uses recorded enabled-checkout and hosted-page fixtures, as
declared. The live disabled state was also checked independently and is
reported below.

## Accessibility, keyboard, phone, and motion

- `/opt/fleet/lib/verify-url.sh` passed in 661 ms with no console or page
  errors. It found `lang=en`, a title, one `<h1>`, one `<main>`, no missing image
  alt text, and no unnamed buttons.
- Twelve live axe scans across empty, populated, phone, dark, dialog, legal,
  storage-error, offline, and not-found states found zero violations.
- The skip link was first in keyboard order, displayed a 3 px outline, moved
  focus to `<main>`, and had a measured focus contrast of 5.14:1 in light mode
  and 10.83:1 in dark mode.
- Native dialog focus worked with Enter and Escape, and focus returned to the
  opener. Form errors remained visible and the dialog stayed open for repair.
- The measured phone targets for the sample controls, new-job action, Privacy,
  and Terms were all at least 44×44 CSS px.
- At 390 px the populated page had no horizontal overflow. The 200% text check
  preserved content and functionality.
- With reduced motion requested, the dialog animation was `none` and its
  transition duration was `0s`.

## Offline, privacy, routes, and policy

- A fresh `/demo` visit was controlled by
  `sw.js?v=1.0.6`; cache `scope-ledger-shell-1.0.6` was present. Removing the
  network and reloading retained the populated sample and its demo label.
- A local two-version production-artifact harness installed `1.0.6`, served a
  derived `1.0.7` worker, and displayed **A fresh version is ready. Reload to
  update.** with no console or page errors.
- The live sample status-change and export journey made eight requests, all to
  the product origin. It set no cookies, loaded no remote script or stylesheet,
  and created only `demo:scope-deposit-ledger` in IndexedDB.
- A real synthetic invalid license was stripped from the URL, verified once,
  locked Unlimited, and kept its inactive notice after reload without a second
  daily request.
- The home, demo, privacy, terms, offline, and direct 404 pages had the expected
  route titles, one `<h1>`, `lang=en`, and a main landmark. All four rendered
  internal links returned 200.
- `robots.txt`, `sitemap.xml`, the manifest, social image, touch icon, legal
  routes, offline document, and direct 404 document returned 200. An unknown
  route returned the designed not-found page with HTTP 404. That deliberate
  status is expected, not a defect.
- The manifest uses standalone display, 192/512/maskable icons, palette colors,
  and release-stamped start URL `/?source=installed&v=1.0.6`.
- Live responses include CSP, HSTS, strict-origin referrer policy, and
  `X-Content-Type-Options: nosniff`. No CSP error appeared.
- The privacy page explains local storage, deletion, exports, license requests,
  merchant handling, and the privacy contact. The terms state the accounting
  limits and local-data risk.

This is a static local-first PWA. Backend tenant isolation, server restart
persistence, health, and 429/`Retry-After` checks do not apply. CLI, library,
and desktop-package checks do not apply. The optional AI guidance does not add
value to this deterministic ledger workflow, so no AI feature is expected.

## Checkout classification

A fresh direct request to
`https://api.sociobot.in/api/v1/products/scope-deposit-ledger/checkout` returned
the known HTTP 404 response. The live `checkout-status.json` keeps purchase
state disabled. Opening license options showed the temporary-unavailability
message, no **Buy unlimited** button or checkout link, and a working license
restore form.

The visible paid wording is conditional: **Pay $29 once when checkout is
available.** The free product works in full within its declared three-job
limit. The 404 therefore records the acknowledged external billing dependency,
not a broken page, unexpected error, false availability claim, or failed live
path.

## Clean checkout and build evidence

The clean checkout was at documentation SHA `19db444`; its product tree differs
from implementation SHA `9865da4` only in `.factory/handoff.md`.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages installed; 0 vulnerabilities |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 11/11 |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — `dist/index.html` produced |
| `npm run test:e2e` | PASS — 28/28 |
| 14 exact claim commands | PASS — 14/14, each run separately |

The production build remains below every static budget:

- main JavaScript: 36,352 bytes; 11,931 bytes gzip;
- CSS: 20,652 bytes; 5,421 bytes gzip;
- self-hosted fonts: 102,036 bytes total;
- phone hero: 24,070 bytes.

Fresh Lighthouse 13.4.1 mobile results were Performance 100,
Accessibility 100, Best Practices 100, SEO 100, and Agentic Browsing 100. FCP
was 1.1 s, LCP 1.5 s, TBT 0 ms, CLS 0, and total transfer 147,793 bytes.

## Deployment identity

All 27 public, non-source-map artifacts in the clean build matched the live
responses byte for byte. Deployment-only `_headers` and
`staticwebapp.config.json` were correctly excluded.

| Artifact | Local and live SHA-256 |
| --- | --- |
| `index.html` | `fc864a695fdc4c0bd68d58be9541e87d1546ff6920afae87e3090b4d876c6575` |
| `assets/main-CddFfi_s.js` | `622ae4df4e1a812e793840e22b6e141077821150cd88680fccb313e4f77ec039` |
| `manifest.webmanifest` | `c02caf9958534e65845f8cfe09b75c17455f032b95e39840c4c33a45bc51bbbe` |
| `sw.js` | `4c8bad107b427355a54fda7952e3e64783899d7e7f4a99290b1bd6dd7a94be85` |

## Earlier finding disposition

| Earlier finding | Verification 6 disposition |
| --- | --- |
| Invalid money text changed the stored value | Closed: strict parser tests and invalid-form recovery pass. |
| Malformed restore replaced valid records | Closed: live rejection preserved the current record. |
| Blank job or allocation names were accepted | Closed: browser regressions reject both. |
| Populated contrast failed | Closed: current light and dark axe scans have zero violations. |
| Skip link did not move focus | Closed: keyboard check moves focus to main. |
| PWA cache and start URL were unversioned | Closed: both are stamped `1.0.6`. |
| Production CSP was missing | Closed: live CSP is present and clean. |
| Service worker could not install | Closed: fresh control, cache, and offline reload pass. |
| Status changes erased earlier dates | Closed: UI, reload, JSON, CSV, and PDF retain the trail. |
| CSP broke progress and storage retry | Closed: controls work without CSP errors. |
| PDF corrupted international text | Closed: Unicode PDF regression passes. |
| Invalid or revoked license remained unlocked | Closed: live invalid-token reconciliation locks it. |
| Invalid-license notice disappeared after reload | Closed: live notice persists with one daily request. |
| Phone controls were below 44 px | Closed: current measured targets meet the baseline. |
| Stale tabs erased newer allocations | Closed: exact live merge sequence preserves both edits. |
| Nested complementary landmark warning | Closed: current axe scans have zero violations. |
| Demo sandbox and documentation were missing | Closed: live isolated demo, reset, exit, and docs pass. |
| Public claims were undeclared or untested | Closed: 14 registered claims pass 14 exact commands. |
| Site metadata, navigation, identity, robots, sitemap, and 404 were missing | Closed: live route and artifact checks pass. |
| Offline fallback violated CSP | Closed: live page and strict-policy regression pass. |
| First screen omitted audience, sample action, and three facts | Closed on fresh phone and desktop profiles. |
| Supporting copy used mood headings | Closed: copy audit and live wording use direct section names. |
| Hosted checkout returned 404 | Product disposition closed: purchase UI is honestly disabled. External billing registration remains. |

## Evidence

Evidence is in `/work/.evidence/verify-6/`:

- `live-qa.json`, `live-privacy.json`, `live-a11y-extra.json`;
- `artifact-match.json`, `update-check.json`, and `lighthouse.json`;
- first-screen, populated desktop/phone, and 200% text screenshots;
- exported sample CSV, PDF, and JSON;
- `verify-url/verify.json` and verifier screenshots.

No product code was changed during verification.
