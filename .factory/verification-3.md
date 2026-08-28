# Independent verification 3 — FAIL

**Work order:** `scope-deposit-ledger-verify-3`

**Candidate:** `ae6c85a98cc8585e6566abf25740bfe9c6d05e65`

**Verified:** 2026-08-28 UTC
**Production URL:** <https://scope-deposit-ledger.sociobot.in/>

## Verdict

**FAIL.** Fresh evidence shows that production is the exact candidate artifact
and that the offline ledger workflow passes its functional, accessibility,
privacy, PWA, and performance checks. However, the product advertises a `$29`
one-time Unlimited purchase whose only checkout URL returns HTTP **404**. A
customer cannot purchase the offered unlock, so the live paid product does not
work end to end and cannot meet the acceptance contract.

## Release-blocking defect

### P1 — Advertised Unlimited checkout is unavailable

The visible **Buy unlimited** link targets:

`https://api.sociobot.in/api/v1/products/scope-deposit-ledger/checkout`

A fresh unauthenticated request on 2026-08-28 UTC returned HTTP/2 `404` with
this body:

```json
{"error":"enabled factory product","status":404}
```

The product presents a `$29 one-time purchase` and has a three-job free limit;
the fourth job takes the operator to this unavailable route. This is an
external factory billing-catalog configuration problem rather than a product
source defect, but it is still a live P1: the advertised paid feature is
unbuyable. Synthetic invalid-token verification is reachable (`200`,
`{"valid":false,"reason":"invalid","expires_at":null}`), so the failure is
specific to checkout registration/enabling.

**Required remediation:** register and enable `scope-deposit-ledger` as the
one-time `$29` Sociobot product with return URL
`https://scope-deposit-ledger.sociobot.in/`, then re-verify hosted checkout,
return-token storage, and restore on a fresh browser profile.

## Checks passed

### Clean candidate and repository gates

The worktree began clean at the requested SHA. No lint script is defined;
the exact production build includes `tsc --noEmit`.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages installed; 0 install audit vulnerabilities |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 10 Vitest unit/release tests |
| `npm run build` | PASS — TypeScript, Vite production build, release stamp, and `dist/` |
| `npm run test:e2e` | PASS — 9 Playwright tests |

### Independent ledger exercise

On an isolated local production preview and on the live site, I created a
scoped deposit with client and tax assumption, rejected an over-allocation,
recovered with the exact available amount, changed the allocation from held to
earned, reloaded, and confirmed the IndexedDB record persisted. The app
retains dated `held → earned` history. A one-dollar boundary allocation,
invalid scientific-notation and malformed-money coverage, blank scope names,
malformed restores, edited-deposit limits, delete confirmation, backup/restore,
and the fourth-free-job boundary are covered by the clean 9-test browser suite
and 10-test unit/release suite.

CSV and PDF downloads were produced locally: CSV contained `Ontario · tax
excluded` and the explicit “not an invoice, tax calculation, or accounting
advice” limitation; PDF began `%PDF-1.4`. Unit coverage also verifies quoted
CSV values, backup validation, complete status history, and international PDF
text.

### Browser, accessibility, mobile, and motion

- Desktop and 390×844 live runs had no horizontal overflow (`scrollWidth =
  390` on mobile), and the New job, Privacy, and Terms targets measured at
  least 44×44 CSS px.
- Keyboard-only smoke test: the initial skip link received the designed 3 px
  focus outline; Enter moved focus to `main`; native dialogs operated and
  returned to their controls in the Playwright suite.
- Fresh axe 4.10.2 scans found **0 serious/critical** violations in empty and
  populated local/live states. Shipped E2E additionally covers dialog and dark
  states.
- `prefers-reduced-motion: reduce` yielded `0s` progress transition duration.
- No console errors or page errors occurred in the independent local or live
  journey.

### PWA, privacy, response policy, and deployment identity

- On the HTTPS production origin, a fresh browser received an active controller
  at `scope-ledger-shell-1.0.2`; its precache contains the app shell, assets,
  icons, fonts, manifest, offline page, and both legal pages. After first load,
  setting the context offline and reloading preserved the live record.
- The live update path was exercised in an isolated static-serving harness:
  serving a changed service-worker response caused `registration.update()` to
  request a second worker and display **“A fresh version is ready. Reload to
  update.”** with no console error. The production cache and manifest are
  release-stamped `1.0.2`.
- Normal first-run traffic requested only
  `https://scope-deposit-ledger.sociobot.in`; no analytics, trackers,
  third-party runtime scripts, CDN fonts, cookies, or unrequested outbound
  requests were observed. Records remain in IndexedDB; theme/license metadata
  uses localStorage. The only source-level outbound endpoint is the explicit
  Sociobot license API.
- Live document/worker responses carried CSP restricting `connect-src` to self
  plus the Sociobot API, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`,
  and `X-Content-Type-Options: nosniff`. Hashed `/assets`, `/fonts`, and
  `/icons` used `Cache-Control: public, max-age=31536000, immutable`;
  documents and service worker use 30-second revalidation.
- Local and live SHA-256 bytes matched for `index.html`, manifest, service
  worker, main JS, and CSS. Representative matching hashes: index
  `ce90a2e68387a30f11cd4b729022ffa576ff818e3c9b6aa804a21b7de22f0be0`, service
  worker `d827c89966c334a15333756d8a44dde1918f6dfe73a970d9444249365cee5052`,
  manifest `255ca85feeb8c997183f8e30d9837302dd30b2f68012350d1b529958df44af68`.
  This is not a stale or deployment-only mismatch.

### Performance

Fresh Lighthouse 13.4.1 mobile run against production: Performance **100**,
Accessibility **100**, Best Practices **100**, SEO **100**; FCP **1.1 s**, LCP
**1.5 s**, TBT **0 ms**, CLS **0**, interactive **1.5 s**. Production build
sizes remain within budget: initial main JS 27.47 KB (9.46 KB gzip), CSS 17.20
KB (4.69 KB gzip), self-hosted fonts 102,036 bytes total, and mobile hero
24,070 bytes.

## Defect summary

| Severity | Count | Status |
| --- | ---: | --- |
| P1 | 1 | Checkout product is not registered/enabled; release blocker |
| P2 | 0 | None found in this verification |
| P3 | 0 | None found in this verification |
