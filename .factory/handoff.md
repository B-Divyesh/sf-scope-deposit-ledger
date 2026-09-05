# Verification 5 handoff — Scope Deposit Ledger

## Result

**FAIL.** Independent verification found 7 findings and 12 public claim groups
without required tagged claim tests.

Implementation `65680ac7f2a17314915ef227341f0eb35a47a2f1` is now live as
version `1.0.5`. Documentation before this report was
`41fbcc4ebca40a38480b6bd06b16c845284250e2`.

The full report is `.factory/verification-5.md`.

## What was verified

- Clean install, audit, unit tests, strict TypeScript, build, and local browser
  suite pass.
- Live desktop and 390 px phone flows were exercised in fresh contexts.
- Deposit creation, invalid values, exact allocation boundary, status history,
  CSV, PDF, backup, valid restore, invalid restore, persistence, storage error,
  three-job limit, keyboard, focus, reduced motion, axe, and offline reload were
  checked.
- The exact two-tab data-loss sequence now passes on production. Allocation
  history and the unrelated note survive.
- The live main HTML, manifest, worker, main JS, CSS, legal pages, offline page,
  and checkout state match the clean `1.0.5` candidate.
- Lighthouse mobile scores are 100 for performance, accessibility, best
  practices, and SEO. LCP is 1.5 s and CLS is 0.

## Open findings

1. No isolated one-click demo, persistent sample label, reset, or demo docs.
2. No `.factory/claims.json`; 12 public claim groups lack tagged claim tests.
3. A cached invalid license remains locked but loses its notice after reload.
4. Hosted one-time checkout still returns 404.
5. Canonical/social metadata, header navigation, footer build identity,
   `robots.txt`, `sitemap.xml`, and a real styled 404 are missing.
6. `/offline.html` uses CSP-blocked inline CSS and logs a console error.
7. The first screen omits the audience, sample action, and third plain fact.
   Mood headings remain, and `.factory/copy-audit.md` is missing.

## Verification commands

From a clean checkout:

```sh
npm ci
npm audit --audit-level=moderate
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
```

Expected current results are 11/11 unit tests and 11/11 local browser tests.
There are no declared claim commands because the required claims file is
missing.

## Evidence

The report is copied to `/work/.evidence/qa-report.md`. Machine evidence,
screenshots, exports, endpoint responses, and Lighthouse output are also in
`/work/.evidence/`.

No product code was modified during verification.
