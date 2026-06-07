# cutlistwizard

A web-based cut list optimizer for woodworkers and fabricators.

## Stack

- **Vite** + React + TypeScript
- **Tailwind CSS**
- **Vercel** for deployment (static site, no backend)
- Optimizer algorithm runs entirely client-side

## Dev

```bash
npm install
npm run dev
```

## Build & Deploy

**Before every push**, run a clean build to catch TypeScript errors that the local cache may hide:

```bash
rm -rf node_modules/.tmp && npm run build
```

If the build fails, fix all errors before pushing. Vercel deploys from the committed git files on push to `main` — errors invisible locally (due to stale `.tsbuildinfo` cache) will fail the Vercel build.

Deploys automatically via Vercel on push to `main`.

## Project Structure

```
src/
  components/   UI components
  lib/          Optimizer algorithm and utilities
  pages/        Route-level components (if using react-router)
```

## Analyzing a JSON Export

When given a `.json` session export and asked to analyze how the algorithm performs, run the optimizer directly with `npx tsx` — don't do theoretical analysis first:

```bash
cat > /tmp/run_optimizer.ts << 'EOF'
import { optimize } from '/Users/jchan/git/cutlistwizard/src/lib/optimizer.ts'
import session from '/path/to/file.json' assert { type: 'json' }

const result = optimize(session.stocks, session.parts, session.cuttingParams)
console.log(`Sheets: ${result.totalSheets}`)
console.log(`Waste: ${result.overallWastePercent.toFixed(1)}%`)
console.log(`Errors: ${result.errors.length > 0 ? result.errors.join(', ') : 'none'}`)
for (const sheet of result.sheets) {
  console.log(`\nSheet ${sheet.sheetIndex + 1} — waste: ${sheet.wastePercent.toFixed(1)}%`)
  for (const p of sheet.placedParts)
    console.log(`  ${p.label.padEnd(12)} ${p.width}×${p.height} at (${p.x.toFixed(2)}, ${p.y.toFixed(2)})${p.rotated ? ' [rotated]' : ''}`)
}
const placed = result.sheets.reduce((s, sh) => s + sh.placedParts.length, 0)
const total = session.parts.reduce((s, p) => s + p.quantity, 0)
console.log(`\nPlaced: ${placed} / ${total}`)
EOF
npx tsx /tmp/run_optimizer.ts
```

Report the actual output (sheet count, waste %, placements), then analyze from there.

## Algorithm

Guillotine 2D bin-packing (cutting stock problem). Pieces are rectangular; stock sheets are fixed size.

Runs a 12-combination matrix (4 sort strategies × 3 fit rules) and picks the best result per the `optimizationGoal` (`minimize-sheets` or `minimize-waste`):

- **Sort strategies:** largest area first, smallest area first, largest perimeter first, widest first
- **Fit rules:** BSSF (best short-side fit), BAF (best area fit), BLSF (best long-side fit)

Each placement uses a Guillotine split with the Shorter Leftover Axis (SLA) rule — the remaining L-shaped space is divided into exactly two rectangles by one straight cut, matching how a table saw works. Adjacent free sections are merged after each placement to recover fragmented space.

When `groupParts` is on, the matrix expands with grouped variants (a same-label placement bias plus a 5th family-first sort) and uses a grouping score to cluster identical parts onto as few sheets as possible. Grouping is a tie-breaker *below* the primary objective, so it never increases the sheet count (or waste).

Constraints: `kerfWidth` (blade thickness consumed between parts), `trimPerEdge` (edge waste subtracted from usable area), `allowRotation` (global toggle — no per-part grain direction), `groupParts` (keep identical parts together).
