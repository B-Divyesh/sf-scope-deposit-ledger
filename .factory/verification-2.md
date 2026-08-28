# Independent verification 2 — FAIL

**Work order:** `scope-deposit-ledger-verify-2`

**Candidate:** `9cab4a867497a97b5dc6a572d0e85cb6fb3bdf90`
(`docs: record verified repair handoff`)

**Verified:** 2026-08-28 UTC

**Production URL:** https://scope-deposit-ledger.sociobot.in/

## Verdict

**FAIL.** The live deployment contains the candidate's production artifact and
the normal ledger workflow is usable, but the deployed service worker cannot
install, so the advertised offline PWA does not work. The only purchase link
also returns 404. In addition, the ledger overwrites rather than retains status
history, the deployed CSP breaks the progress indicator and storage-error
recovery, PDF export corrupts non-ASCII names, revoked licenses are not
reconciled visibly, and several mobile targets are below 44 px.

This is fresh evidence. The earlier handoff's deployment PASS is not borne out
by a clean browser profile against production.

## Release-blocking defects

### P1 — The deployed service worker cannot install; offline reload fails

Reproduction in a brand-new Chromium 145 profile:

1. Open the production URL and inspect `navigator.serviceWorker`.
2. At initial load, a registration briefly reports an `installing` worker.
3. Within 500 ms, `getRegistrations()` is empty. It remains empty for the next
   7.5 seconds; `navigator.serviceWorker.controller` remains `null`.
4. The created cache `scope-ledger-shell-1.0.1` has zero entries.
5. Set the context offline and reload. Navigation fails with
   `net::ERR_INTERNET_DISCONNECTED`.

The exact cause is deterministic. `scripts/stamp-release.mjs:18-23` adds every
non-map file from `dist/` to the precache, including
`/staticwebapp.config.json`. Production correctly consumes that file as Azure
configuration rather than serving it, so it returns HTTP 404. The
`cache.addAll(SHELL)` install promise in `public/sw.js:5-7` rejects, making the
worker redundant.

Every other precache URL returned 200. The repository's local Playwright test
passes because Vite serves `staticwebapp.config.json`, so it does not reproduce
the production host boundary.

Expected: the service worker installs, controls the page, and reloads the app
and local records offline. Actual: there is no active registration/controller
and offline reload fails. This violates the product's `pwa-offline` artifact
class and its core advertised behavior.

### P1 — The only paid checkout returns 404

The Unlimited dialog links to:

`https://api.sociobot.in/api/v1/products/scope-deposit-ledger/checkout`

A fresh GET on 2026-08-28 returned HTTP 404 with:

```json
{"error":"enabled factory product","status":404}
```

The UI advertises “$29 one-time purchase,” but a customer cannot buy the
unlock. License verification itself is reachable and returned the expected
`{ "valid": false, "reason": "invalid" }` for a synthetic invalid token.

### P1 — Status changes destroy the history needed by the core job

The brief requires a dated balance trail that answers when scope became
billable. I created a $100 allocation, marked it earned on 2026-09-01, then
returned on 2026-09-10 using Playwright's fixed clock. The resulting CSV row
was:

```csv
"Phase one","100.00","returned","","2026-09-10",""
```

The JSON backup likewise contained only `status: "returned"` and
`statusDate: "2026-09-10"`; neither export contained 2026-09-01. The change
handler overwrites `status` and `statusDate` in `src/app.ts:222-226`, and the
data model has no event history (`src/types.ts:3-13`). Consequently, the
product permanently loses the date on which this scope became billable and
cannot export an actual transition trail after a later return/change.

## Other defects

### P2 — Production CSP breaks the progress indicator and error recovery

Production sends `style-src 'self'` and `script-src 'self'`, while the app emits
an inline progress width (`src/app.ts:116`) and an inline reload handler in its
storage-error state (`src/app.ts:258`).

On a new $100 job with no allocations, the UI text correctly said `0% assigned
to scope`, but the progress span's `style="width:0%"` was blocked. Its computed
width was 893.625 px inside an 895.625 px track: visually almost 100% full.
Chromium logged a CSP error. Re-renders generated the same console error.

With IndexedDB intentionally made unavailable, the error state appeared, but
clicking **Try again** did not navigate or reload. Chromium logged that the
inline event handler was blocked by `script-src 'self'`.

### P2 — PDF export corrupts international client and scope text

A job named `Café 改装`, client `Müller 工房`, and allocation
`材料 & planning` exported correctly to CSV. The generated PDF content instead
contained:

```text
Job: Cafe? ??
Client: Mu?ller ??
1. ?? & planning ? $1,500.55
Tax jurisdiction / assumption: Ontario ? tax excluded
```

`src/pdf.ts:4` deliberately converts all output to printable ASCII. That makes
the promised client-readable PDF unusable or misleading for ordinary names
and scope text outside ASCII. This is especially inconsistent with the seven
international currencies offered by the product.

### P2 — Revoked/invalid licenses are not reconciled visibly

With a simulated previously valid cached verdict older than one day, the live
API returned `valid:false` and local storage was updated to that verdict. The
UI nevertheless continued to show **Unlimited unlocked — License active on
this device**, with no inactive-license notice or buy link. In
`verifyLicense`, the invalid result throws before `render()`
(`src/app.ts:188-193`).

Opening the app with `?license=qa-invalid-token` correctly stored the token,
stripped it from the URL, and verified it, but again displayed no failure
notice. This does not meet the paid-unlock requirement to lock and quietly
explain a revoked license.

### P2 — Mobile interactive targets are below the 44×44 px baseline

At a 390×844 viewport, the page had no horizontal overflow, but measured
visible targets included:

- **New job:** 84×42 px
- **Privacy:** 43×21.6 px
- **Terms:** 39×21.6 px

The same footer links remain undersized in populated views. This fails the
provided touch-target requirement even though the controls remain operable.

## Checks that passed

### Clean checkout and repository gates

The worktree began clean at the requested SHA. Node was v22.23.2, npm 10.9.8,
and Playwright 1.58.2.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages installed |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 7/7 Vitest tests |
| `npm run build` | PASS — strict `tsc --noEmit`, Vite production build, release stamp, `dist/` produced |
| `npm run test:e2e` | PASS — 8/8 Playwright tests |

There is no lint script. Type checking is part of the exact production build.
After testing an alternate release stamp for service-worker updates, I rebuilt
without overrides and reconfirmed the candidate hashes.

### Functional and recovery exercise

- Created a `$2,500.55` deposit with client, reference, date, jurisdiction, and
  notes; allocated `$1,500.55`; changed status; reloaded; and confirmed
  IndexedDB persistence.
- Confirmed a one-cent deposit/allocation boundary on production.
- Rejected blank job/client/allocation names, zero and negative values,
  scientific notation (`1e2`), malformed grouping (`12,34.00`), excess cents,
  an unsafe-integer amount, and over-allocation without mutating the input.
- Prevented reducing an edited deposit below its allocations.
- Exported CSV, PDF, and JSON; valid JSON restore worked. An over-allocated
  malformed backup was rejected without replacing the existing job.
- Delete confirmation cancellation preserved an allocation; acceptance removed
  it. The fourth free-job attempt opened the $29 Unlimited dialog.
- CSV correctly quoted commas/quotes, preserved Unicode, and included the tax
  assumption and non-accounting notice. PDF was structurally `%PDF-1.4` and
  included the required limitation, subject to the Unicode defect above.

### Accessibility, keyboard, motion, and responsive layout

- `verify-url.sh` passed the live empty state: HTTP 200, title, `lang=en`, one
  h1, main landmark, image alt, labelled buttons, and no empty-state
  console/page errors.
- Axe 4.10.2 found **0 serious/critical violations** in stable empty,
  populated, allocation-dialog, light, dark, privacy, and terms states.
- Keyboard-only creation passed. The skip link was first, showed a 3 px focus
  outline, moved focus to `main`, and the dialog was traversable/submittable.
  Escape closed it and restored focus to the opener.
- Under `prefers-reduced-motion: reduce`, dialog animation was `none`, button
  transition duration was `0s`, and scroll behavior was `auto`.
- Desktop and 390 px mobile were visually inspected. The mobile layout had
  `scrollWidth === innerWidth === 390`; content remained readable and usable,
  apart from the target-size defect.

### Privacy and browser policy

- A fresh normal session requested only the product origin. No analytics,
  trackers, CDN fonts/scripts, app cookies, or unrequested external calls were
  observed. Job data remained in IndexedDB; theme/license state used local
  storage. Only explicit license verification contacted
  `api.sociobot.in`, as disclosed.
- `/privacy/` and `/terms/` both returned 200 and accurately described local
  storage, exports, billing verification, tax limitations, and data-loss risk.
- Production returned HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Content-Type-Options: nosniff`, and the restrictive CSP. Hashed assets,
  fonts, and icons used `Cache-Control: public, max-age=31536000, immutable`;
  documents, manifest, and service worker used a 30-second revalidation policy.
- Chromium parsed the manifest without errors. It contains standalone display,
  release-stamped start URL `v=1.0.1`, 192/512 icons, and a 512 maskable icon.

### Candidate/deployment identity

SHA-256 matched between the clean local build and production for all 25 served
application files (HTML, JS, CSS, source maps, images, fonts, icons, manifest,
service worker, offline page, and `_headers`). Representative hashes:

- `index.html`: `c30ff281b18efd4699857f89b7291b4d8e75cb12edb5caf1e9c730abcd47b8af`
- `sw.js`: `ef9804ef14bb0bebd48f0cb37d103c22ae0a6a1fe292029ed2324b714101db1f`
- `manifest.webmanifest`: `00aa673f96a983df6de65cf8260e598352744ad6619d7e60ec69f93bf0a303b5`
- main JS: `2001bec2e53b9e27543183b36ac017dfd2a22884d4af3c35a838b63924379cdd`

`staticwebapp.config.json` is deployment configuration and is not publicly
served; its mistaken inclusion in the runtime precache is the PWA failure
described above. The live deploy therefore matches this candidate's shipped
artifact; this is not a stale-deploy result.

### Performance and budgets

Fresh Lighthouse 13.0.1 mobile run against production:

| Category/metric | Result |
| --- | --- |
| Performance | 94 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 1.3 s |
| LCP | 1.7 s |
| TBT | 270 ms |
| CLS | 0 |
| Speed Index | 1.3 s |

Build sizes are within the supplied static budgets: initial app JS 25,979
bytes (9,060 gzip), CSS 16,731 bytes (4,600 gzip), self-hosted fonts 102,036
bytes total, and the mobile hero 24,070 bytes.

## Required remediation before re-verification

1. Exclude deployment-control files from the service-worker precache and test
   installation/offline reload against the actual production host.
2. Register/enable the production billing product so the advertised checkout
   resolves, then exercise a real checkout return and restore path.
3. Store append-only status transition events and include the complete dated
   history in JSON, CSV, and PDF exports.
4. Make dynamic progress styling and storage-error recovery compatible with
   the production CSP without weakening the policy broadly.
5. Generate Unicode-capable PDFs and add international-text regression tests.
6. Re-render and notify when background verification revokes a cached license.
7. Raise every mobile interactive target to at least 44×44 CSS px.
