# Track deposits against agreed work — Review 1

**Work order:** `scope-deposit-ledger-review-1`  
**Reviewed:** 6 September 2026 UTC  
**Live URL:** https://scope-deposit-ledger.sociobot.in  
**Implementation reviewed:** `9865da41bd9ee6ac9937d83f33aa323d207d87a1`  
**Documentation reviewed:** `f4721b4791f0e465554db1c2a990c6c2163bc114`

## Verdict

**PASS — 0 findings and 0 untested claims.**

Scope Deposit Ledger serves solo trades and service operators who need to show
which agreed work a deposit is held against, and when each amount becomes
earned or is returned. The first action is **Try it with sample data**. It
opens an isolated, populated ledger without changing normal records.

The requested `factory-evidence/.../qa-report.md` path was not included in
this checkout. I read the complete repository verification report
`.factory/verification-6.md`, then repeated the live and clean-checkout checks
below. The reported candidate remains live: all 27 public implementation
artifacts match its rebuilt output. The documentation-only commit changes
`.factory/handoff.md` and `.factory/verification-6.md`; it does not change the
reviewed product.

| Severity | Count |
| --- | ---: |
| P1 | 0 |
| P2 | 0 |
| P3 | 0 |
| Total | 0 |

## Fresh live review

Fresh desktop (1440×900) and phone (390×844) browser profiles showed the job,
audience, and first action before scrolling:

- **Job:** Track deposits against agreed work.
- **Audience:** Solo trades and service operators who need a clear record of
  held, earned, and returned money.
- **First action:** Try it with sample data. The nearby text says it opens a
  separate ledger with realistic entries.

The three visible facts are saved on the device, works offline after the first
visit, and three jobs plus all exports are free. Both profiles had no console
or page errors and no horizontal overflow.

In a fresh profile I created a normal **Review-only normal job**, entered
`/demo`, and reviewed the populated CAD 4,250.75 Cedar Lane kitchen refit for
Maya Chen. The persistent label says **Demo — sample data, nothing is saved to
your ledger**, with Reset demo and Start for real. A changed sample scope note
survived reload while that label remained visible. Reset restored the original
note. Start for real returned to the normal ledger with the normal job intact.
No console error occurred.

A fresh demo profile received service-worker control, cache
`scope-ledger-shell-1.0.6`, then reloaded the populated sample offline with
the visible offline status. Its observed requests were product-origin only and
it set no cookies. A direct unknown route returned HTTP 404 and the styled
not-found page. Privacy, terms, offline, and 404 routes each had their expected
title, one h1, one main landmark, `lang=en`, and no console errors.

The direct billing checkout endpoint returned HTTP 404 as expected. This is not
a defect: the deployed checkout status disables the buy action, explains that
purchases are temporarily unavailable, leaves the three-job free product and
all exports usable, and still offers license restore.

## Claims and clean checkout

From a new clone at `f4721b4`, with Node 20-compatible documented setup:

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages installed |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 11/11 |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — `dist/index.html` produced |
| `npm run test:e2e` | PASS — 28/28 |
| Each of 14 exact commands in `.factory/claims.json` | PASS — 14/14, run separately |

The 14 registered claims are each represented once by an
`@claim:<id>` browser test: demo isolation, ledger details, allocation limit,
status history, CSV, PDF, JSON backup, on-device data, offline reload,
cross-tab merge, free core, daily license check, no tracking, and the
checkout-available paid offer fixture. Home, demo, README, privacy, and terms
copy were cross-checked against this registry; no unlisted public claim was
found.

The release suite covers normal, invalid, boundary, and recovery paths,
including strict money parsing, blank names, one-cent over-allocation, lowering
a deposit below allocated money, malformed/unsafe restore, delete cancellation,
three-job limit, export and restore, Unicode PDF text, stale-tab merging, and
invalid license reconciliation. Its accessibility coverage includes populated,
dialog, dark, legal, mobile, 404, offline, keyboard, focus, and reduced-motion
states. It passed. The standalone axe CLI could not launch the container's
Chrome; the installed Playwright axe integration is the applicable successful
accessibility evidence.

## Deployment and product checks

The rebuilt candidate's 27 public non-source-map artifacts matched production
byte-for-byte. Deployment-only `_headers` and `staticwebapp.config.json` were
not counted. Production sent HSTS, CSP, strict-origin referrer policy, and
`X-Content-Type-Options: nosniff`. The manifest has standalone display,
versioned start URL, 192/512/maskable icons, and palette colors.

This is a static, local-first PWA. Backend tenant isolation, server restart,
health endpoint, and 429/Retry-After checks do not apply. It is not a CLI,
library, or desktop package. An AI feature is not expected for this deterministic
deposit ledger workflow.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Invalid money text, malformed restore, blank scope/allocation | Closed: strict validation and preservation regressions pass. |
| Contrast, skip focus, phone targets, landmark warning | Closed: accessibility regressions pass. |
| Unversioned cache/start URL, failed worker, offline CSP | Closed: versioned worker, offline reload, and strict-policy checks pass. |
| Lost status dates, corrupted Unicode PDF, CSP-blocked controls | Closed: trail/export and recovery regressions pass. |
| Invalid-license notice and stale-tab data loss | Closed: reload notice and merge regressions pass. |
| Demo, claims, metadata/routes/404, first-screen copy | Closed: live demo, 14 commands, route checks, and copy audit pass. |
| Hosted checkout HTTP 404 / unavailable purchase | Product disposition closed: no buy link is rendered until registration; billing registration remains an external follow-up. |

## Evidence

Fresh review evidence is under `/work/.evidence/review-1/`, including desktop
and phone first screens, populated/reset sample evidence, offline/privacy
evidence, route results, response headers, and the 27-artifact comparison.

