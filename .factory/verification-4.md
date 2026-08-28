# Independent verification 4 — FAIL

**Work order:** `scope-deposit-ledger-verify-4`

**Candidate:** `f554088c444fb05d89072568883d548f3a79f087`

**Production URL:** <https://scope-deposit-ledger.sociobot.in/>

**Verified:** 2026-08-28 UTC

## Verdict

**FAIL.** The requested candidate installs, tests, builds, and is deployed
correctly. The normal single-tab ledger journey, exports, backup/restore,
offline reload, service-worker update, privacy boundary, accessibility, mobile
layout, and performance budgets all pass. Fresh cross-tab testing nevertheless
found a P1 silent data-loss defect: a stale second tab can erase an allocation
and its complete status trail when it saves an unrelated job-detail edit.

This is a core release blocker for a product whose job is to preserve a durable
deposit-to-scope evidence trail. It is not a stale deployment or a deployment-
only failure.

## Release-blocking defect

### P1 — A stale second tab silently deletes newer allocation records

Fresh production reproduction in one clean Chromium context:

1. Tab A created **Concurrent ledger**, deposit `$1,000.00`.
2. Tab B opened the same live origin and loaded that job while it had no
   allocations.
3. Tab A added **Materials**, `$400.00`; it was visible and persisted.
4. Tab B edited only **Scope note** and selected **Save changes**.
5. Tab A reloaded. **Materials** was gone. Direct IndexedDB inspection returned
   `storedAllocationCount: 0`; the stale tab's note was present.

Exact captured result:

```json
{
  "allocationVisibleBeforeSecondTabSave": true,
  "allocationCountAfterSecondTabSaveAndReload": 0,
  "staleTabNoteCount": 1,
  "storedAllocationCount": 0
}
```

The loss is silent, has no undo or conflict notice, and destroys the very
allocation/status history clients rely on. The source mechanism is a stale
in-memory `jobs` snapshot in each tab: `submitJob` rebuilds the whole job with
`existing.allocations`, then `saveJob` performs an unconditional IndexedDB
`put`. There is no revision check, merge, or cross-tab refresh.

**Required remediation:** update job details transactionally against the latest
stored record (preserving current allocations), add a revision/`updatedAt`
conflict check and visible recovery path, notify other tabs of mutations, and
add a two-page Playwright regression covering job edits alongside allocation
and status changes.

## Other findings

### P2 — One-time purchase remains externally unavailable

The live product now handles this honestly: it does not show a broken purchase
action, says Unlimited purchases are temporarily unavailable, preserves the
complete three-job free product, and keeps license restore available. A fresh
direct checkout request still returned:

```text
HTTP/2 404
{"error":"enabled factory product","status":404}
```

Invalid-token verification itself is healthy (`200`, `valid:false`, correct
CORS). This is no longer a customer-facing broken link, but the researched
one-time monetization remains unavailable until the factory registers/enables
the Sociobot catalog product.

### P3 — Repeated moderate axe landmark warning

Axe reported `landmark-complementary-is-top-level` in empty, populated light,
populated dark, and 390 px populated states because the job-index `aside` is
nested inside another landmark. There were **zero serious or critical** axe
findings, and the license dialog had no axe findings. This is a semantic cleanup
item, not the cause of the FAIL.

## Clean checkout and repository gates

The worktree began clean on `main` at the exact requested SHA. No lint command
is defined in `package.json`; the available strict type check was run both
directly and as part of the exact build.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 60 packages installed; 0 vulnerabilities |
| `npm audit --audit-level=moderate` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 11/11 Vitest tests |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — exact `tsc --noEmit && vite build && node scripts/stamp-release.mjs`; `dist/` produced |
| `npm run test:e2e` | PASS — 10/10 Playwright tests |

This is a PWA, not a library/CLI or backend, so package-consumer, backend
concurrency, server persistence, and health/build-identity checks do not apply.

## Independent product exercise

On the live deployment, in clean browser profiles, I independently verified:

- Empty state to deposit creation using a `$1,234.56 CAD` deposit, explicit
  Ontario tax assumption, client/reference, date, and scope note.
- An allocation one cent above the balance was rejected; the exact remaining
  `$1,234.56` boundary was accepted, produced 100% assigned, and disabled the
  allocation action at zero remaining.
- `held → earned → returned` transitions remained visible with dated history.
- Lowering the deposit below its allocated amount was rejected, and correcting
  the amount recovered without losing the form.
- CSV escaped commas/quotes and included the tax assumption, complete status
  history, and “not an invoice, tax calculation, or accounting advice” notice.
  PDF began `%PDF-1.4` and was non-empty.
- JSON backup used schema 1; confirmed deletion removed exactly one job,
  cancellation preserved it, and an explicitly confirmed restore recovered the
  complete allocation state.
- IndexedDB state survived normal reload and offline reload.
- The fourth free job opened the honest unavailable-checkout state; no checkout
  anchor or **Buy unlimited** control was rendered; restore remained usable.
- A real invalid return token was stripped from the URL, stored locally,
  verified once against the Sociobot endpoint, and reconciled to locked state
  without console/page errors.

Repository tests additionally cover blank required values, scientific notation,
fraction/grouping validation, malformed and unsafe backups, international PDF
text, and license-service reconciliation.

## Browser, accessibility, and visual checks

- Desktop 1440×900 and mobile 390×844 were inspected in populated states. The
  mobile document had `scrollWidth <= 390`; all visible populated-ledger and
  dialog controls measured at least 44×44 CSS px.
- Keyboard-only: the skip link was first, its designed focus indicator was
  visible, Enter moved focus to `main`, **New job** was Tab-reachable, Enter
  opened the dialog, Escape closed it, and focus returned to the trigger.
- `prefers-reduced-motion: reduce` matched and made dialog animation `none` and
  transition duration `0s`.
- Axe 4.10.2 found 0 serious/critical issues in empty light, populated light,
  populated dark, license-dialog, and populated mobile states. The one repeated
  moderate landmark issue is recorded above.
- No console errors or page errors occurred in desktop, mobile, invalid-license,
  offline, or service-worker-update runs.
- The visual system is product-specific and consistent with
  `.factory/design.md`; the generated hero is local, has meaningful alt text,
  and uses the documented provenance.

## PWA, privacy, requests, and response policy

- Production registered and controlled the page with cache
  `scope-ledger-shell-1.0.4`; manifest start URL is
  `/?source=installed&v=1.0.4` and includes 192, 512, and maskable icons.
- Chromium parsed the manifest with zero manifest errors. The only reported
  installability error was `in-incognito`, expected for the headless test
  context.
- After a first online load, offline mode plus reload retained the complete
  job. A derived clean `dist/` fixture with a changed worker installed the
  update and displayed **“A fresh version is ready. Reload to update.”** with
  no errors.
- Normal create/allocate/export/backup traffic remained entirely on the product
  origin. No analytics, tracking, CDN scripts/fonts, or job/client-data requests
  were observed. Only the explicit invalid-license action contacted
  `https://api.sociobot.in/.../verify`, and it sent the token—not job data.
- Live HTML carried HSTS, the repository CSP, strict-origin referrer policy, and
  `nosniff`. Documents, manifest, status, and worker use 30-second revalidation;
  hashed assets, fonts, and icons use `public, max-age=31536000, immutable`.
- Privacy and terms routes returned 200 and matched the local artifact.

## Deployment identity

This is a fresh deployed candidate, not the previously reported deployment-only
failure. Every checked runtime artifact matched the clean local production
build byte-for-byte: index, privacy, terms, offline page, checkout status,
manifest, service worker, all runtime JS/CSS, both hero images, all three fonts,
and all three icons.

Representative SHA-256 values:

| Artifact | Local and live SHA-256 |
| --- | --- |
| `index.html` | `dd727101b037130f4c4eab05cae573c969f55d85f66a239a7c95860e66499f10` |
| `assets/main-BHhrC2HH.js` | `e76148ce9ebb1eee80a2343f8af46627a09c913d80e42ba67640cb178cd4f06b` |
| `assets/styles-C_p6giJS.css` | `4e9ebf6944e3be5b072db582e1aaaf87e2b0a2f3e65ebecb77e60e5649f6d45c` |
| `manifest.webmanifest` | `8ae9c882641d9f5951e385f30613a4c1011995083d86ab5c37f1fa55f599008a` |
| `sw.js` | `262b1215d1cfc196ffe5f36470368858790f0cd9ed28ce9e9c0a3acd1e88833e` |

## Performance and budgets

Fresh Lighthouse 12.8.2 mobile, simulated throttling, production URL:

| Measure | Result |
| --- | --- |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| FCP / LCP | 1.1 s / 1.5 s |
| TBT / CLS | 0 ms / 0 |
| Total transfer | 141 KiB |

A synthetic mobile **Record a deposit** interaction recorded 72 ms event
duration, below the 200 ms interaction budget. Build budgets pass: initial main
JS 28,794 B (9.84 KB gzip), CSS 17,285 B (4.71 KB gzip), self-hosted fonts
102,036 B total, and mobile hero 24,070 B.

## Defect summary

| Severity | Count | Status |
| --- | ---: | --- |
| P1 | 1 | Silent cross-tab loss of allocations/history — release blocker |
| P2 | 1 | External one-time checkout remains disabled/404 |
| P3 | 1 | Moderate nested complementary-landmark warning |
