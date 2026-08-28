# Independent verification — FAIL

**Work order:** `scope-deposit-ledger-verify-1`

**Candidate:** `cb2e2690f9ce96eb11be580fd03d2b5a9a60dee7` (`docs: record production smoke check`)

**Verified:** 2026-08-28

**Production URL:** https://scope-deposit-ledger.sociobot.in/

## Verdict

**FAIL.** The deployment is the exact candidate build, and the happy path is
substantially functional, but the product cannot be accepted for a financial
record workflow. It silently changes an invalid entered amount, permits an
unnamed scope, and accepts a malformed restore file that replaces valid local
records with a broken `$NaN` ledger. There is also an axe serious contrast
violation in the normal populated state.

## Reproducible defects

### P1 — Invalid deposit text is silently converted to a different amount

1. Open the app and choose **Record a deposit**.
2. Enter valid job and client names; enter `1e2` as the deposit.
3. Create the ledger.

Expected: validation rejects a non-money format and preserves the form for
correction. Actual: a ledger is created with **Original deposit $12.00**. The
normalizer removes `e` before conversion (`src/core.ts:5-8`), so `1e2` becomes
`12`. The same parser is used for allocation amounts. This can create an
incorrect client-facing deposit trail without an error.

### P1 — Malformed JSON restore destroys existing local records

1. Create a valid “Safe job” ledger.
2. Restore this file and accept the replacement confirmation:

   ```json
   {"schema":1,"jobs":[{"id":"bad","title":"Broken","allocations":[]}]}
   ```

Expected: the file is rejected before the existing ledger is changed. Actual:
the app accepts it, removes “Safe job”, and renders “Broken” with **Original
deposit $NaN**. `validateBackup` only checks `id`, `title`, and `allocations`
(`src/core.ts:62-72`); `replaceJobs` is then called for the unchecked data
(`src/app.ts:229-233`). This is destructive despite the supplied data being
invalid, and recovery requires an independent prior backup.

### P1 — Required scope can be whitespace only

1. Open **Record a deposit**.
2. Set **Job or scope name** to three spaces, enter a valid client and positive
deposit, then submit.

Expected: a field error. Actual: the dialog closes and a job is created with a
blank heading. Native `required` accepts whitespace and the value is trimmed
only while constructing the record (`src/app.ts:152-161`). A blank scope
defeats the product’s core promise to show what a deposit is held against.
The same trim-without-nonblank validation exists for allocation titles at
`src/app.ts:164-172`.

### P2 — Axe reports a serious contrast failure in the normal populated state

After creating a record, `@axe-core/playwright` 4.10.2 reports
`color-contrast` (serious) for `.export-row > div:nth-child(1) > .eyebrow`:
`#B53F32` on `#D9E7E2` is **4.42:1**, below the required 4.5:1 for its 12 px
bold text. The same violation occurs on the deployed URL. This contradicts the
accessibility acceptance gate and the declared palette requirements.

### P2 — Skip link does not move keyboard focus to main content

Tab focuses the skip link with a visible `3px` focus outline. Pressing Enter
sets `location.hash` to `#main`, but `document.activeElement` becomes `BODY`
(not `main`) and the main region remains 69 px below the viewport top. The
target at `index.html:26` is not programmatically focusable. This does not
satisfy the required keyboard skip-to-main behavior.

### P2 — PWA cache and installed start URL are not release-versioned

The live service worker exposes only the fixed cache name
`scope-ledger-shell-v1`; its precache asset names, and the manifest start URL’s
`v=1`, are also fixed (`public/sw.js:1-15`,
`public/manifest.webmanifest`). This fails the PWA contract’s versioned-cache
requirement and makes a future update/cache boundary untestable and unreliable.
The code contains an update toast listener, but a real changed-version
activation could not be demonstrated because this candidate has no version
increment.

### P3 — Production responses do not send a Content-Security-Policy

The live document, JS, CSS, manifest, and service-worker responses send HSTS,
`Referrer-Policy: strict-origin-when-cross-origin`, and
`X-Content-Type-Options: nosniff`, but no `Content-Security-Policy`. This is
not the reason for the FAIL, but it removes a useful containment layer for a
local-data application that renders user-provided strings.

## Evidence of checks that passed

### Clean candidate and repository gates

The worktree started clean on the requested SHA. `npm ci` from
`package-lock.json` completed with 0 audit vulnerabilities. No `lint` script
exists; `npm run build` includes `tsc --noEmit`.

| Command | Result |
| --- | --- |
| `npm ci` | pass; 58 packages installed; 0 vulnerabilities |
| `npm audit --audit-level=moderate` | pass; 0 vulnerabilities |
| `npm test` | pass; 5/5 Vitest tests |
| `npm run build` | pass; type check and Vite production build to `dist/` |
| `npm run test:e2e` | pass; 3/3 Playwright tests |

### End-to-end and recovery exercise

On a fresh local production preview and again on the live URL, I created a
`$2,500.55` scoped deposit, allocated `$900.55`, changed it to earned, exported
CSV and PDF, and reloaded. The record persisted from IndexedDB. CSV contained
the tax-jurisdiction heading and the accounting limitation; PDF began
`%PDF-1.4`. Over-allocation (`$100.01` against a `$100.00` deposit) and zero
deposit values remained in the dialog with clear errors. Returned status,
delete confirmation wording, JSON backup download, and direct `/privacy/` and
`/terms/` routes were also checked.

The negative cases above were run in isolated browser profiles. The malformed
restore repro specifically replaced a valid record; this is the destructive
boundary that the shipped tests do not cover.

### Accessibility, keyboard, responsive, and browser health

- Desktop (1440 px) and 390 px mobile were visually inspected. The mobile page
  had no horizontal overflow (`scrollWidth === innerWidth === 390`).
- Empty-state axe had no serious/critical findings. The populated state had the
  serious contrast defect listed above.
- There was one `<h1>`, `lang="en"`, a `<main>`, labelled controls, meaningful
  hero alt text, and no console or page errors during the normal local or live
  journeys.
- The initial Tab target had a visible `rgb(14, 115, 82) solid 3px` outline.
  The skip link’s focus-transfer defect is listed above.
- With `prefers-reduced-motion: reduce`, progress transition duration and
  dialog transition duration were both `0s` and scrolling was `auto`.

### PWA, privacy, policy, and deployment identity

- On the live HTTPS origin, the service worker controlled the page and used
  IndexedDB database `scope-deposit-ledger` (version 1). After first load,
  `context.setOffline(true)` followed by reload showed the application shell
  successfully.
- Normal first-run browser traffic went only to
  `https://scope-deposit-ledger.sociobot.in`; no analytics, trackers, cookies,
  third-party fonts, or external runtime requests were observed. Source review
  found the Sociobot billing API only on explicit license verification.
- The privacy and terms pages accurately disclose local IndexedDB/localStorage,
  exports, billing-token verification, and the non-accounting limitation.
- `curl` found HTTP 200 and matching SHA-256 bytes for **every file in `dist/`**
  against the live URL: root, main/styles/legal JS, CSS, maps, manifest,
  service worker, offline page, legal pages, fonts, icons, and both hero
  images. The root `index.html` hash was
  `134f4892052a7a5aaf864ec8abea542d80108ffc037bde58f13b7b1e4a631c31` both
  locally and live. The deployment-only failure previously mentioned is not
  present; production is this candidate.
- Live headers: HTTP/2 200; HSTS
  `max-age=10886400; includeSubDomains; preload`; strict referrer policy;
  `nosniff`; `Cache-Control: public, must-revalidate, max-age=30` for document
  and runtime assets. The short asset caching is mitigated after service-worker
  installation but is not immutable HTTP asset caching.

### Performance

Production build output: main JS 23.70 KB (8.27 KB gzip), CSS 16.73 KB
(4.60 KB gzip), self-hosted fonts 102,036 bytes, mobile hero 24,070 bytes.
All relevant static budgets are met.

Fresh Lighthouse 13 mobile run against the live URL (Chrome for Testing 145):
performance **100**, accessibility **100**, best practices **100**, SEO **100**;
FCP 0.9 s, LCP 1.5 s, TBT 0 ms, CLS 0, speed index 1.9 s. This is an
empty-state lab run and does not supersede the populated-state axe failure.

## Required remediation and re-verification

1. Replace permissive money sanitization with strict locale-aware decimal
validation; reject scientific notation and malformed input rather than altering
it. Add unit and browser coverage for `1e2`, excess fractional cents, and
allocation input.
2. Validate every backup field and nested allocation before confirmation or any
store mutation; never clear the existing store until the entire imported data
is valid. Add malformed-backup preservation tests.
3. Validate trimmed required names and titles as nonempty before saving.
4. Correct the contrast token/use, make the skip target focusable, and re-run
axe on empty, populated, dark, and dialog states.
5. Use a build/release-derived service-worker cache version and manifest
start-url version; verify a changed service worker announces and activates a
new cache.
6. Add a production CSP compatible with the static app and its explicit
Sociobot checkout/verification behavior.
