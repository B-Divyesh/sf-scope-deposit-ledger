# Scope Deposit Ledger

Track client deposits against agreed work. This offline PWA is for solo trades
and service operators who need a dated balance trail.

Live: <https://scope-deposit-ledger.sociobot.in>

Try the isolated sample: <https://scope-deposit-ledger.sociobot.in/demo>

## What it does

- Records the client, scope, deposit, date, currency, and tax assumption.
- Prevents allocations above the deposit balance.
- Keeps dated held, earned, and returned history.
- Exports each job as client-readable PDF or CSV.
- Exports and restores the complete ledger as JSON.
- Keeps job and client records in the browser.
- Works offline after the first visit.
- Preserves newer allocation history when a stale tab saves job details.

The free version includes three jobs and every export. A $29 one-time Unlimited
license removes the job limit when hosted checkout is available. New purchases
are currently unavailable because the factory billing product is not enabled.
Existing licenses can still be restored.

This is not an invoice, payment processor, tax calculator, general ledger, or
CRM.

## Sample data

The **Try it with sample data** link opens a separate demo database. The sample
contains a CAD 4,250.75 kitchen deposit with held, earned, and returned scope.

**Reset demo** restores the original sample. **Start for real** clears demo data
and returns to the normal ledger. Demo actions do not change normal records.
See [.factory/demo.md](.factory/demo.md) for the storage boundary.

## Run and verify

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Run the complete local gate:

```sh
npm audit --audit-level=moderate
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
npm run test:claims
```

The tagged public-claim commands are declared in
[.factory/claims.json](.factory/claims.json). Each uses the isolated demo entry.

`npm run build` creates `dist/` with `dist/index.html` at its root. That
directory is the static deployment artifact.

## Data and privacy

Normal job records stay in the browser unless the operator exports them. The
app has no analytics, advertising cookies, CDN fonts, or tracking scripts.

A restored license token goes only to the Sociobot verification API. The app
checks a stored token no more than once per day. See the
[privacy policy](https://scope-deposit-ledger.sociobot.in/privacy/) and
[terms](https://scope-deposit-ledger.sociobot.in/terms/).

Browser storage can be cleared by settings, private-browsing rules, or device
loss. Use **Back up all** to keep a separate JSON copy.

## Implementation

The product uses Vite, strict TypeScript, IndexedDB, and a hand-written service
worker. The production build targets modern browsers and contains the local
fonts and original product artwork.

The researched brief is in `.factory/brief.json`. The visual system and asset
provenance are in `.factory/design.md`.

## License

MIT. See [LICENSE](LICENSE).
