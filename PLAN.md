# CutList Wizard — Implementation Plan

## Context
Building a web-based cut list optimizer from scratch. The repo exists at `~/git/cutlistwizard` with only `CLAUDE.md` and `PRD.md` — no project scaffolded yet. Stack: Vite + React + TypeScript + Tailwind v4. Deploys to Vercel. No backend. Patterns follow `~/git/canada_study_guide`.

Layout: side-by-side — left panel (editor), right panel (cut layout output).

---

## Git & Deploy Strategy

- Commit at the end of every phase (one commit per phase minimum)
- Commit message format: `Phase N: <short description>`
- Do not push until the full verification checklist passes
- Push to `main` once — Vercel auto-deploys on push; a single clean push produces one deployment
- Expected end state: all source committed, `main` pushed, app live on Vercel

---

## Phase 1 — Scaffold Project

```bash
cd ~/git/cutlistwizard
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss @tailwindcss/postcss postcss
```

- Delete `src/App.css`, `src/assets/react.svg`, default counter in `App.tsx`
- Create `postcss.config.js` (same as canada_study_guide)
- Replace `src/index.css` with `@import "tailwindcss"`
- Update `index.html` title to "CutList Wizard"

No React Router — single-page app, no routes needed.

---

## Phase 2 — Types & Data Layer

### `src/lib/types.ts`
```ts
export interface Stock {
  id: string
  width: number
  height: number
  quantity: number // 0 = unlimited
}

export interface Part {
  id: string
  label: string
  width: number
  height: number
  quantity: number
}

export interface CuttingParams {
  kerfWidth: number       // default 1.6
  trimPerEdge: number     // default 0
  optimizationGoal: 'minimize-sheets' | 'minimize-waste'
  allowRotation: boolean  // default true
}

export interface Session {
  id: string
  name: string
  unit: 'mm' | 'in'
  updatedAt: string
  stocks: Stock[]
  parts: Part[]
  cuttingParams: CuttingParams
}

export interface SessionStore {
  activeSessionId: string | null
  sessions: Session[]
}
```

### `src/lib/storage.ts`
- `loadStore(): SessionStore`
- `saveStore(store: SessionStore): void`
- `getActiveSession(store): Session | null`
- Follows try/catch pattern from canada_study_guide `storage.js`
- localStorage key: `cutlistwizard_sessions`

### `src/lib/units.ts`
- `mmToIn(mm: number): number`
- `inToMm(inches: number): number`
- `convertSession(session: Session, toUnit: 'mm' | 'in'): Session` — converts all stock/part dimensions
- `formatDimension(value: number, unit: 'mm' | 'in'): string` — e.g. "600mm" or `3 1/2"`
- Fractional inches: round to nearest 1/32"

---

## Phase 3 — App Shell & Session Management

### `src/App.tsx`
```
┌─────────────────────────────────────────────────────┐
│  Header: "CutList Wizard"  [Session: Kitchen ▾]     │
├──────────────────────┬──────────────────────────────┤
│  Left panel          │  Right panel                 │
│  (editor)            │  (cut layout)                │
└──────────────────────┴──────────────────────────────┘
```
- State: `store: SessionStore`, derived `activeSession: Session`
- All mutations go through `updateActiveSession()` → saves to localStorage

### `src/components/SessionPanel.tsx`
- Dropdown/modal triggered from header
- Actions: New session, Rename, Load (switch), Delete
- Delete requires confirmation
- Shows session name + last modified

### Default session created on first load if none exists.

---

## Phase 4 — Editor Panel

### `src/components/StocksTable.tsx`
- Inline-editable table: width, height, quantity
- Add row button (appends blank row)
- Delete row button per row
- "Clear all" button with confirmation dialog
- Quantity field: "∞" display when 0

### `src/components/PartsTable.tsx`
- Same pattern as StocksTable
- Fields: label (optional), width, height, quantity

### `src/components/CuttingParamsForm.tsx`
- Kerf: text input + preset dropdown (0, 1.6, 2.2, 2.4, 3.2, 3.8 mm)
- Trim per edge: text input (applied to all 4 edges — reduces usable sheet area to `(width - 2×trim) × (height - 2×trim)` before packing)
- Optimization goal: radio/toggle — Minimize Sheets | Minimize Waste
- Allow rotation: checkbox (default checked)

### `src/components/ConfirmDialog.tsx`
- Generic modal with `message`, `onConfirm`, `onCancel` props
- Used for: stock/part "Clear all", session delete, import unit-mismatch prompt

### `src/components/OptimizeButton.tsx`
- "Optimize" button — triggers algorithm
- Disabled when no stocks or no parts

---

## Phase 5 — Bin-Packing Algorithm

### `src/lib/optimizer.ts`

**Algorithm: Maximal Rectangles (MAXRECTS)**

```ts
export interface PlacedPart {
  partId: string
  label: string
  x: number
  y: number
  width: number   // actual part width (not including kerf)
  height: number
  rotated: boolean
}

export interface SheetResult {
  stockId: string
  sheetIndex: number  // which copy of this stock (for unlimited sheets)
  stockWidth: number
  stockHeight: number
  placedParts: PlacedPart[]
  wastePercent: number
}

export interface OptimizeResult {
  sheets: SheetResult[]
  totalSheets: number
  overallWastePercent: number
  errors: string[]  // e.g. "Part 'Side Panel' (600×400) is larger than all stock sheets"
}

export function optimize(
  stocks: Stock[],
  parts: Part[],
  params: CuttingParams
): OptimizeResult
```

**Steps:**
1. Expand parts list (multiply each Part by its quantity)
2. Sort parts: largest area first
3. Pre-check: if any part > all stock sheets after trim → add to errors, skip
4. For each part, find best placement across all open sheets using BSSF heuristic
5. If no fit, open new sheet (respecting quantity limits)
6. Kerf: placed part reserves `(width + kerfWidth) × (height + kerfWidth)` of free space when splitting rects (except at sheet boundary)
7. **Minimize sheets**: greedy fill (default — BSSF naturally does this)
8. **Minimize waste**: run optimizer 4 times with different sort orderings — area desc, area asc, perimeter desc, width desc — keep result with lowest `overallWastePercent`

**MAXRECTS core:**
- `freeRects: Rect[]` per sheet
- `placePart(rect, part) → splits freeRects, prunes contained rects`
- `scoreBSSF(rect, part) → [shortSideFit, longSideFit]`

---

## Phase 5b — Optimizer Unit Tests

### Setup
Vitest is included with Vite — no extra install needed. Add to `vite.config.ts`:
```ts
test: { environment: 'node' }
```

### `src/lib/optimizer.test.ts`

**Basic placement**
- 1 part, 1 stock, no kerf → part placed at (0,0), `sheets.length === 1`
- 2 identical parts side by side → fit on 1 sheet, no overlap

**Kerf**
- 2 parts each 490mm wide, 1.6mm kerf, 1000mm stock → both fit (490 + 1.6 + 490 = 981.6 ≤ 1000)
- 2 parts each 500mm wide, 1.6mm kerf, 1000mm stock → don't fit (500 + 1.6 + 500 = 1001.6 > 1000), second part goes to sheet 2

**Trim per edge**
- 1 part 980×980, stock 1000×1000, trim=10 → usable area 980×980, part fits exactly
- 1 part 981×981, stock 1000×1000, trim=10 → part oversized, appears in `errors`

**Rotation**
- Part 100×400, stock 200×300, rotation disabled → no fit (400 > 300), goes to errors
- Same inputs, rotation enabled → fits as 400×100 rotated, `placedParts[0].rotated === true`

**Quantity limits**
- Stock quantity=1, enough parts to need 2 sheets → `errors` contains unplaced parts, `sheets.length === 1`
- Stock quantity=0 (unlimited) → opens as many sheets as needed, no errors

**Oversized part**
- Part larger than all stocks after trim → appears in `errors`, not in any `placedParts`

**Minimize waste**
- Run with `optimizationGoal: 'minimize-waste'` vs `'minimize-sheets'` on a case where orderings differ → minimize-waste result has `overallWastePercent` ≤ minimize-sheets result

**No overlap invariant** (helper assertion reused across tests)
- For every `SheetResult`, assert no two `placedParts` rectangles intersect

### Run
```bash
npx vitest run
```
All tests must pass before proceeding to Phase 6.

---

## Phase 6 — Cut Layout Visualization

### `src/components/CutLayout.tsx`
- SVG rendering, scaled to fit panel width
- Each `SheetResult` renders as one SVG diagram
- Color palette: assign one color per unique part label (cycle through 10+ distinct colors)
- Placed parts: filled rect + label (part label + dimensions)
- Waste areas: light gray fill
- Sheet border: dark stroke
- SVG viewBox is sized to each sheet's actual dimensions; rendered at a fixed pixel width (panel width) — each sheet scales independently so a 1200×600mm sheet and an 800×400mm sheet appear the same display width but correct aspect ratio
- Pagination: "Sheet 2 of 5  ◀ ▶"
- Summary bar above: "5 sheets used · 18.3% waste"
- Error state: red alert listing oversized parts (no diagram shown)
- Empty state: placeholder text when no optimization run yet

---

## Phase 7 — Import / Export

### `src/lib/importExport.ts`
- `exportSession(session: Session): void` — triggers JSON download as `cutlistwizard.json`
- `importJSON(file: File, activeUnit: 'mm' | 'in'): Promise<ImportResult>` — parses file, validates schema, returns stocks/parts
- Import replaces current session's stocks and parts entirely (not merge); on unit mismatch, return a flag so UI shows ConfirmDialog ("File uses mm, your session uses inches — convert values?"); if user declines, import is cancelled

### `src/components/ImportExport.tsx`
- Hidden `<input type="file">` triggered by "Import" button
- "Export" button calls `exportSession()`
- Error display for invalid rows

---

## Phase 8 — Units UI

- Unit toggle (mm / in) shown in editor header or CuttingParams section
- On toggle: call `convertSession()` → updates all dimension values in active session
- All dimension inputs/displays use `formatDimension()` from `units.ts`

---

## File Tree (final)

```
src/
  App.tsx
  main.tsx
  index.css
  components/
    SessionPanel.tsx
    StocksTable.tsx
    PartsTable.tsx
    CuttingParamsForm.tsx
    OptimizeButton.tsx
    CutLayout.tsx
    ImportExport.tsx
    ConfirmDialog.tsx     — reusable confirmation modal
  lib/
    types.ts
    storage.ts
    units.ts
    optimizer.ts
    optimizer.test.ts
    importExport.ts
```

---

## Critical Files to Create

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/optimizer.ts` | MAXRECTS bin-packing algorithm |
| `src/lib/storage.ts` | localStorage wrapper |
| `src/lib/units.ts` | Unit conversion + formatting |
| `src/lib/importExport.ts` | JSON import/export logic |
| `src/lib/optimizer.test.ts` | Vitest unit tests for optimizer |
| `src/App.tsx` | App shell + state management |
| `src/components/CutLayout.tsx` | SVG cut diagram renderer |

---

## Phase 9 — UI Polish

Invoke the `frontend-design` skill as a polish pass over all built components. Focus areas:
- Color palette and Tailwind theme tokens
- Typography scale and spacing consistency
- Table and input field visual refinement
- SVG cut layout diagram styling
- Responsive behavior of the side-by-side layout

No new functionality — visual improvements only.

---

## Verification

1. `npm run dev` — app loads, no errors
2. Create a session, add stocks + parts, hit Optimize — layout renders
3. Kerf: add 1.6mm kerf, verify parts don't overlap in SVG output
4. Rotation: disable rotation, verify parts stay in original orientation
5. Unit switch: enter 600mm part, switch to inches — verify converts to ~23.622"
6. Import: load a valid JSON file, verify stocks/parts replace correctly
7. Export: verify downloaded JSON matches active session schema including `unit`
8. Session persistence: refresh page — last session auto-restores
9. No-fit error: add a part larger than all stock sheets — verify error message, no layout
10. `npx vitest run` — all optimizer unit tests pass
11. `npm run build` — production build succeeds

---

## Deploy

Once all verification steps pass:

```bash
git push origin main
```

Vercel auto-deploys on push. Confirm deployment completes successfully in Vercel dashboard and the live URL loads the app.
