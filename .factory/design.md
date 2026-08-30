# Visual thesis — The impossible escrow garden

## Direction and rationale

Scope Deposit Ledger uses **surreal editorial scenery**: a precise paper ledger
exists in a quiet, impossible landscape where a coral glass vessel pours one
golden deposit into several measured stone channels. The image turns an abstract
financial promise into a physical idea: one sum is held, then visibly directed
to named pieces of work. The scenery appears only where it explains the product;
the working ledger remains calm, typographic, and document-like.

The interface is intentionally unlike an accounting dashboard. It uses a warm
paper field, ink rules, offset shadows, ledger annotations, and an asymmetrical
masthead. No gradients, stock finance iconography, or decorative chart chrome.

## Palette

- `paper #F4F0E6`: warm document ground, not software white.
- `sheet #FFFDF7`: active writing surface.
- `ink #17211D`: near-black green, 15.2:1 on paper.
- `muted #56605B`: supporting copy, 6.1:1 on paper.
- `moss #11402E`: primary action and “earned”, white at 11.2:1.
- `coral #621C14`: editorial marker and danger, ≥4.5:1 on paper and sky surfaces.
- `gold #9B650B`: held value; paired with text/shape, never color alone.
- `sky #D9E7E2`: selected surfaces and focus accompaniment.
- `night #101713`, `night-sheet #18231E`, `night-text #F4F0E6`: explicit dark treatment.

## Type and spacing

Two self-hosted type families: **Fraunces** (variable display serif) for the
editorial title and monetary moments, and **Atkinson Hyperlegible** for forms,
tables, and prose. Both are SIL Open Font License and stored in the repository.
The type scale is 14 / 16 / 20 / 28 / 44 px; body never falls below 16 px.
Numbers use tabular figures. Spacing follows a 4 px base with core steps 8, 12,
16, 24, 32, 48, and 72 px. Reading measure tops out near 68 characters.

## Interaction grammar

- “Held”, “earned”, and “returned” are verbs and states everywhere.
- Primary actions are moss-filled with a crisp 2 px ink edge; secondary actions
  resemble annotated paper tabs.
- Editing happens in a native dialog that rises from the selected job; focus is
  trapped by the browser dialog primitive and returns to its trigger.
- The job rail is an index, not a card grid. On phones it becomes a horizontal
  job strip and the summary stacks before the milestone trail.
- Every mutation confirms in a live region. Deletion names the job and requires
  confirmation. Exports remain available in the free tier.

## Motion policy

New ledger rows settle from 6 px above over 180 ms; dialogs rise 8 px over 220 ms
without fading text through a low-contrast intermediate state; progress bars expand from their numerical origin over
260 ms. There is no looping motion. Under `prefers-reduced-motion: reduce`, all
movement and smooth scrolling become instant while hierarchy, outlines, and
labels remain unchanged.

## Asset plan and provenance

- `public/assets/ledger-garden.webp`: original generated landscape hero,
  responsive crop, high priority, ≤300 KB.
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`: original
  hand-authored compass/ledger mark rasterized from project SVG; no outside art.
- Interface icons are hand-authored inline SVG with accessible text labels.

### Hero prompt sheet

Use case: stylized-concept. Asset type: PWA editorial masthead. A silent surreal
escrow garden on warm uncoated paper: one translucent coral glass vessel pours a
single ribbon of muted gold sand into three precisely carved dark-green stone
channels, each channel ending at a small blank ivory ledger tile. Slightly
isometric wide composition, main sculptural scene on the right with calm negative
space on the left. Editorial cut-paper and matte 3D still-life hybrid, subtle
paper grain, long soft morning shadows, restrained moss green, coral, ochre,
ivory and ink palette. Meticulous, trustworthy, tactile, mature. No people, no
coins, no currency symbols, no readable text, no logos, no watermark, no neon,
no blue fintech gradient, no busy background, no photoreal brands.

Generated with the factory image deployment (`factory-image`, Azure AI Foundry)
on 2026-08-28 via `/opt/fleet/lib/gen-image.sh`. Generated imagery is original
for this product. The selected asset was visually reviewed for text artifacts,
seams, unintended symbols, and palette consistency, then optimized locally.
