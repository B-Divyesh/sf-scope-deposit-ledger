# Scope Deposit Ledger

Scope Deposit Ledger is a private, offline-first record for solo trades and
professional-service operators who take deposits or retainers. It answers one
practical question clearly: **what agreed work is this money held against, and
when did it become billable?**

Live: <https://scope-deposit-ledger.sociobot.in>

## What it does

- Records a client, scope, deposit, received date, currency, and explicit tax
  jurisdiction assumption.
- Allocates the deposit across milestones without allowing over-allocation.
- Marks each amount held, earned/billable, or returned with a dated trail.
- Downloads a client-readable PDF or CSV for each job.
- Exports and restores the complete ledger as JSON.
- Stores all job data in IndexedDB and works after the network disappears.
- Includes three jobs free; a $29 one-time Sociobot license unlocks unlimited
  jobs. Exports, accessibility, backups, and offline use are never gated.

It is deliberately not an invoicing system, payment processor, tax calculator,
general ledger, or CRM.

## Run and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

For the complete local gate:

```sh
npm test
npm run build
npm run test:e2e
```

`npm run build` is the deployment command. It creates `dist/` with
`dist/index.html` at its root. The Playwright suite uses Chromium 1.58.2 and
checks the primary workflow, exports, persistence, offline reload, direct legal
routes, console errors, and serious/critical axe violations.

## Data and privacy

Job records never leave the browser unless the operator downloads or shares an
export. The only optional network data is a purchased license token sent to the
Sociobot verification API. See the in-product [privacy policy](privacy/index.html)
and [terms](terms/index.html).

Back up regularly with **Back up all**. Browser storage can be cleared by the
user, the browser, private-browsing rules, or device loss.

## Implementation

The product uses Vite, strict vanilla TypeScript, IndexedDB, a hand-written
service worker, and no runtime dependencies or third-party CDN resources. The
calculation/export core is isolated in `src/core.ts`; PDF generation is local in
`src/pdf.ts`.

The researched product brief is in `.factory/brief.json`; the original visual
system and generated-asset provenance are in `.factory/design.md`.

## License

MIT. See [LICENSE](LICENSE).
