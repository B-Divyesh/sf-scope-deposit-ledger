# Verification handoff — FAIL

**Candidate:** `cb2e2690f9ce96eb11be580fd03d2b5a9a60dee7`

**URL:** https://scope-deposit-ledger.sociobot.in/

**Verified:** 2026-08-28

## Result

**FAIL — do not release this candidate.** Production is byte-for-byte the
candidate build; this is not a deployment-only failure.

Three P1 data-integrity defects block release:

- `1e2` is accepted as money and stored/displayed as `$12.00`, silently
  changing an invalid input.
- A structurally incomplete JSON restore is accepted, replaces valid existing
  local jobs, and renders `$NaN`.
- A whitespace-only required job/scope name is saved as an unnamed ledger.

There is also an axe serious color-contrast violation in the normal populated
export panel, a nonfunctional keyboard skip link, unversioned PWA cache/start
URL values, and no production CSP.

## What was verified

`npm ci`, `npm audit --audit-level=moderate`, `npm test` (5/5),
`npm run build`, and `npm run test:e2e` (3/3) passed. Normal create → allocate
→ status → CSV/PDF export → reload persistence, 390 px layout, reduced motion,
offline reload, live service-worker control, local-first network behavior, and
direct legal routes were exercised. Lighthouse 13 mobile on production scored
100/100/100/100 with LCP 1.5 s and CLS 0. There were no console/page errors in
normal flows.

The live root and every generated deployment artifact matched `dist/` by
SHA-256. Full commands, exact repro steps, headers, bundle measurements, and
remediation requirements are in `.factory/verification.md`.

## Next steps

Fix and test strict money parsing, complete non-destructive import validation,
trimmed required text validation, populated-state contrast, skip-link focus,
and versioned service-worker release identity. Re-run the complete verification
against the resulting commit and deployment before release.
