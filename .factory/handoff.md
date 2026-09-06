# Repair 5 handoff — Scope Deposit Ledger

## Result

The seven verification-5 product findings are repaired and deployed as version
`1.0.6`. The live implementation is commit
`9865da41bd9ee6ac9937d83f33aa323d207d87a1`. This handoff is a later
documentation-only commit; use `git rev-parse HEAD` for its documentation SHA.

The remaining dependency is outside this repository: the factory billing
product is not registered or enabled. The hosted checkout still returns HTTP
404. The app therefore keeps the $29 one-time offer unavailable, never renders
a broken buy action, and leaves three jobs plus every export free. Registration
metadata is in `/work/.evidence/billing-offer.json` for the separate billing
operator.

## Repairs

1. Added a one-click `/demo` and `?demo=1` sample with a realistic CAD
   4,250.75 kitchen deposit, three scope items, dated status history, and an
   unallocated balance. Demo records use `demo:scope-deposit-ledger`, never the
   normal database. The persistent banner provides **Reset demo** and **Start
   for real**. `.factory/demo.md` records the boundary.
2. Added `.factory/claims.json` with 14 public claims and one outcome-based
   browser test for each. The tests exercise the sample, storage isolation,
   balance boundary, dated history, CSV, PDF, JSON restore, privacy, offline
   reload, cross-tab merge, free limit, license cache, and conditional offer.
3. Restored the inactive-license notice from the cached invalid verdict on
   every load. A live synthetic invalid token verifies once, remains locked,
   and keeps its notice after reload.
4. Added route-specific canonical and social metadata, original 1200×630 social
   art, favicon and touch icon, header navigation, footer build identity,
   `robots.txt`, `sitemap.xml`, and a styled 404 response. Unknown live paths
   now return that page with HTTP 404.
5. Moved the offline fallback styling into `/offline.css`, so the page obeys
   the production CSP without an inline-style error.
6. Rewrote the first screen and supporting headings in plain words. The first
   phone screen names the job, audience, sample action, real action, privacy,
   offline behavior, and free limit. `.factory/copy-audit.md` records the
   sentence and terminology audit.
7. Kept the earlier money validation, backup validation, Unicode exports,
   dated history, PWA, accessibility, and cross-tab merge behavior intact.

## Clean local verification

Run from a clean checkout with Node.js 20 or newer:

```sh
npm ci
npm audit --audit-level=moderate
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
npm run test:claims
```

Results on 6 September 2026:

- install and audit: 60 packages, 0 vulnerabilities;
- unit/release tests: 11 passed;
- strict TypeScript: passed;
- production build: passed with `dist/index.html` at the root;
- full Playwright suite: 28 passed;
- every one of the 14 exact commands in `.factory/claims.json`: passed
  individually;
- main JS: 36,352 bytes (11.99 kB gzip); CSS: 20,652 bytes (5.40 kB
  gzip); fonts: 102,036 bytes; phone hero: 24,070 bytes.

## Live verification

The local build and live HTTPS site match for all 27 public artifacts. The
matching representative SHA-256 values are:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `fc864a695fdc4c0bd68d58be9541e87d1546ff6920afae87e3090b4d876c6575` |
| `sw.js` | `4c8bad107b427355a54fda7952e3e64783899d7e7f4a99290b1bd6dd7a94be85` |
| `manifest.webmanifest` | `c02caf9958534e65845f8cfe09b75c17455f032b95e39840c4c33a45bc51bbbe` |

Fresh desktop and 390×844 phone contexts confirmed the job, audience, primary
sample action, and all three facts before scrolling. The phone has no horizontal
overflow. At 200% text size it still has no horizontal overflow or lost content.

The live demo showed its persistent sample label and the expected held, earned,
returned, and unallocated balances. A one-cent over-allocation was rejected.
Reset restored the fixture. Starting for real returned to a pre-existing normal
job unchanged. No demo-flow request left the product origin.

Fresh live checks also passed:

- exact stale-tab edit while another tab changed allocation history;
- invalid-license return, URL cleanup, lock, one daily request, and notice after
  reload;
- service-worker control and populated `/demo` reload without a network;
- keyboard skip focus, native dialog behavior, reduced motion, and storage-error
  reload recovery;
- zero serious or critical axe findings on home, demo, phone, privacy, terms,
  offline fallback, and 404 states;
- correct titles and one `<h1>` on every route; `robots.txt`, `sitemap.xml`,
  social art, and touch icon all return 200;
- unknown routes return the designed 404 body with HTTP 404. Its browser resource
  message is the expected result of that deliberate request;
- a derived `1.0.7` service worker installed beside `1.0.6` and displayed
  **A fresh version is ready. Reload to update.** with no console error.

`verify-url.sh` passed in 623 ms with no console or page errors. Lighthouse
mobile scores are Performance 100, Accessibility 100, Best Practices 100, and
SEO 100. FCP is 1.07 s, LCP 1.67 s, TBT 59 ms, CLS 0.00034, and total transfer
149,612 bytes.

Evidence is in `/work/.evidence/live-1.0.6/`, including screenshots,
`repair-5-live-qa.json`, `verify-url/verify.json`, and `lighthouse.json`.

## Earlier finding disposition

| Finding | Disposition |
| --- | --- |
| Invalid money text changed the amount | Closed by strict parsing and unit/browser invalid-input checks. |
| Malformed restore replaced valid records | Closed by complete validation and preservation checks. |
| Blank job or allocation names were accepted | Closed by trimmed-value validation. |
| Populated contrast and skip-link focus failed | Closed by axe scans and keyboard focus checks. |
| PWA cache/start URL were unversioned | Closed; both live values are `1.0.6`. |
| Production CSP was absent or blocked progress/retry | Closed; the live CSP is present and both controls work without inline code. |
| Service worker precached deployment-only files | Closed; live install and offline reload pass. |
| Status changes erased earlier dates | Closed in UI, JSON, CSV, and PDF checks. |
| PDF corrupted international text | Closed by the Unicode PDF regression. |
| Invalid/revoked license stayed unlocked or lost its notice | Closed locally and live, including reload. |
| Mobile targets were below 44 px | Closed in the 390 px browser regression. |
| Stale tabs erased newer allocations | Closed locally and live; the merge notice and both edits survive. |
| Nested complementary landmark warning | Closed; current axe scans have no violations. |
| Demo sandbox and documentation were missing | Closed. |
| Public claims were undeclared and untested | Closed with 14 individually passing tagged claims. |
| Site metadata, navigation, footer identity, robots, sitemap, and 404 were missing | Closed locally and live. |
| Offline fallback violated CSP | Closed locally and live. |
| First-screen and mood-copy contract failed | Closed with phone evidence and copy audit. |
| Hosted checkout was unavailable | Open external dependency; the UI handles it honestly and metadata is ready for registration. |

## Next step

The billing operator must register and enable the one-time offer from
`/work/.evidence/billing-offer.json`. After registration, change
`public/checkout-status.json` to enabled, deploy, and verify a real paid return,
license entitlement, restore on a second browser, and refund revocation. Do not
enable the buy action before the hosted checkout is confirmed.
