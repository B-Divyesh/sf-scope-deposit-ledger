# Repair handoff — Scope Deposit Ledger 1.0.5

**Work order:** `scope-deposit-ledger-repair-4`

**Base verified candidate:** `f554088c444fb05d89072568883d548f3a79f087`
**Repair target:** P1 stale cross-tab whole-record overwrite in verification 4

## Result

**PASS locally.** The stale-tab reproduction from verification 4 was first run
against the candidate and failed: after a second tab saved only a scope note,
the newer `Materials` allocation disappeared. The regression now passes with
both the allocation and its `held → earned` status history intact in IndexedDB.

## Repair

- Added a monotonic per-job revision while keeping schema-1 backups without a
  revision importable.
- Replaced cached whole-record writes with IndexedDB read-modify-write
  transactions. Job-detail edits read the current stored record, retain its
  allocations/status histories, check the deposit boundary against that current
  record, then increment `revision` and `updatedAt` atomically.
- Routed allocation edits, status transitions, allocation deletion, new jobs,
  deletion, and restore through refresh/notification paths so a stale in-memory
  snapshot is not written back over another tab.
- Added `BroadcastChannel` notification with a `localStorage` event fallback.
  A receiving tab refreshes its ledger and announces the update.
- A conflicting job-detail save keeps the newest allocation trail and displays
  an on-screen recovery notice with **Review latest trail**.
- Added a deterministic two-page Playwright regression: tab B opens a
  job-detail form before tab A creates `Materials` and changes it from held to
  earned; tab B then saves only a scope note. It asserts the cross-tab notice,
  recovery action, rendered allocation/history, scope note, and stored IndexedDB
  record.
- Removed the nested app-region landmark that caused the verifier’s moderate
  axe warning. Dialog motion now translates without an opacity phase that could
  temporarily lower contrast; the motion policy documents this refinement.
- Bumped the PWA release to `1.0.5`, producing a new installed start URL and
  service-worker cache (`scope-ledger-shell-1.0.5`).

## Verification evidence

Performed from a clean dependency install on 2026-08-30 UTC:

```text
npm ci                              PASS — 60 packages, 0 vulnerabilities
npm audit --audit-level=moderate    PASS — 0 vulnerabilities
npm test                            PASS — 11/11 Vitest tests
npx tsc --noEmit                    PASS
npm run build                       PASS — dist/ generated
npm run test:e2e                    PASS — 11/11 Playwright tests
```

- The full browser suite covers desktop, 390 px mobile layout/touch targets,
  keyboard skip-link/dialog flow, reduced motion, light/dark/populated/dialog
  axe scans, offline reload, service-worker cache version, legal routes,
  checkout availability, persistence, exports, and the new cross-tab case.
  Axe is run through `@axe-core/playwright` 4.10.2 and now asserts **zero
  violations**, not merely zero serious/critical findings.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ <temp-dir>` passed after
  the production build: 200 response, title/lang/one h1/main/alt checks pass,
  desktop and 390 px screenshots complete, and there were zero page or console
  errors.
- A fresh Playwright context loaded the local production build, observed no
  external origins during normal load, went offline, reloaded successfully, and
  reported `scope-ledger-shell-1.0.5`.
- Build budgets: main JS 32.62 kB (10.95 kB gzip), CSS 17.44 kB (4.73 kB gzip),
  under the static-product budgets. Lighthouse 12.8.2 could not attach to the
  container’s preinstalled Chromium; the browser and axe checks above completed
  with that Chromium instead.

## Known product constraint

The factory’s hosted one-time checkout is still disabled upstream (the existing
honest unavailable state remains; no broken purchase action is shown). Enabling
the Sociobot catalog item is a factory billing action and is intentionally not
performed from this repository.

## Deployment

This static build is ready in `dist/` and is pushed to `main` for the factory
static deployment path. Verify the deployed identity after the deployment worker
publishes release 1.0.5 by checking `/manifest.webmanifest` for
`v=1.0.5` and the active worker cache for `scope-ledger-shell-1.0.5`.
