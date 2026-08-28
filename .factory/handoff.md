# Handoff — Scope Deposit Ledger v1

## Shipped

- A responsive, installable offline PWA for recording deposits against named
  scope and milestones.
- Exact integer-cent calculations with over-allocation prevention; each
  allocation can move between held, earned/billable, and returned with a visible
  status date.
- IndexedDB persistence, complete JSON backup/restore, client-readable CSV, and
  locally generated downloadable PDF.
- Explicit jurisdiction/tax assumptions and “not accounting advice” language in
  both the working record and exports.
- Free three-job tier plus the required $29 one-time Sociobot checkout, license
  return capture, daily verification cache, optimistic offline unlock, revocation
  handling, and paste-to-restore path. No product ID is hardcoded.
- Original surreal editorial hero generated with `factory-image`, reviewed and
  optimized to 24 KB mobile / 80 KB desktop WebP. Prompt and provenance are in
  `.factory/design.md` and `assets/src/`.
- Light/dark treatments, responsive 390 px layout, keyboard-native controls,
  focus styling, reduced-motion behavior, offline/error/empty states, privacy
  and terms pages, manifest, icons, and service-worker update notice.

## Verification (2026-08-28)

Commands run from a clean working tree dependency install:

```sh
npm audit --audit-level=moderate  # 0 vulnerabilities
npm test                         # 5 passed
npm run build                    # pass; output in dist/
npm run test:e2e                 # 3 passed
```

Playwright covers create → allocate → status change → CSV/PDF export → reload,
direct legal routes, browser console errors, offline reload, and axe. Axe found
0 serious or critical violations.

The factory `verify-url.sh` smoke check passed against the production preview:
HTTP 200, 591 ms load, zero console/page errors, one `<h1>`, `lang="en"`, a
`<main>` landmark, no missing image alt text, and no unlabeled buttons.

Lighthouse 13 mobile run against the production preview:

- Performance: 92
- Accessibility: 100
- Best practices: 100
- SEO: 92
- FCP: 1.2 s; LCP: 1.8 s; CLS: 0; TBT: 320 ms

Production bundles: 23.70 KB JavaScript (8.27 KB gzip), 16.73 KB CSS (4.60 KB
gzip), 108 KB total font files, and 24 KB mobile hero. There are no runtime
third-party requests unless a user explicitly buys or verifies a license.

## Known gaps and next steps

- The factory still needs to register `scope-deposit-ledger` in the Sociobot
  billing engine before checkout can complete in production.
- The compact PDF writer uses a built-in PDF font; accented Latin characters
  are transliterated and unsupported non-Latin glyphs become `?`. CSV and JSON
  preserve full Unicode and are the recommended archival formats.
- Lighthouse cannot report lab INP without interaction data; TBT is recorded as
  the lab responsiveness proxy. Real-user INP can be checked after deployment
  without adding analytics to the product.
