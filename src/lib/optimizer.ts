import type { Stock, Part, CuttingParams } from './types'

export interface PlacedPart {
  partId: string
  label: string
  x: number
  y: number
  width: number
  height: number
  rotated: boolean
}

export interface SheetResult {
  stockId: string
  sheetIndex: number
  stockWidth: number
  stockHeight: number
  placedParts: PlacedPart[]
  wastePercent: number
}

export interface OptimizeResult {
  sheets: SheetResult[]
  totalSheets: number
  overallWastePercent: number
  errors: string[]
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface ExpandedPart {
  partId: string
  label: string
  width: number
  height: number
}

interface OpenSheet {
  stockId: string
  sheetIndex: number
  stockWidth: number
  stockHeight: number
  usableW: number
  usableH: number
  trim: number
  freeRects: Rect[]
  placedParts: PlacedPart[]
}

interface Placement {
  sheetIdx: number
  rectIdx: number
  x: number
  y: number
  width: number
  height: number
  rotated: boolean
  shortSideFit: number
  longSideFit: number
}

const EPS = 1e-9

function isContained(a: Rect, b: Rect): boolean {
  // a is fully contained within b
  return (
    a.x >= b.x - EPS &&
    a.y >= b.y - EPS &&
    a.x + a.width <= b.x + b.width + EPS &&
    a.y + a.height <= b.y + b.height + EPS
  )
}

function pruneFreeRects(freeRects: Rect[]): Rect[] {
  const result: Rect[] = []
  for (let i = 0; i < freeRects.length; i++) {
    let contained = false
    for (let j = 0; j < freeRects.length; j++) {
      if (i === j) continue
      if (isContained(freeRects[i], freeRects[j])) {
        contained = true
        break
      }
    }
    if (!contained) result.push(freeRects[i])
  }
  return result
}

function splitFreeRect(freeRect: Rect, used: Rect): Rect[] {
  // If `used` does not intersect `freeRect`, return [freeRect]
  if (
    used.x >= freeRect.x + freeRect.width - EPS ||
    used.x + used.width <= freeRect.x + EPS ||
    used.y >= freeRect.y + freeRect.height - EPS ||
    used.y + used.height <= freeRect.y + EPS
  ) {
    return [freeRect]
  }

  const result: Rect[] = []

  // Left
  if (used.x > freeRect.x + EPS && used.x < freeRect.x + freeRect.width) {
    result.push({
      x: freeRect.x,
      y: freeRect.y,
      width: used.x - freeRect.x,
      height: freeRect.height,
    })
  }
  // Right
  if (used.x + used.width < freeRect.x + freeRect.width - EPS) {
    result.push({
      x: used.x + used.width,
      y: freeRect.y,
      width: freeRect.x + freeRect.width - (used.x + used.width),
      height: freeRect.height,
    })
  }
  // Top
  if (used.y > freeRect.y + EPS && used.y < freeRect.y + freeRect.height) {
    result.push({
      x: freeRect.x,
      y: freeRect.y,
      width: freeRect.width,
      height: used.y - freeRect.y,
    })
  }
  // Bottom
  if (used.y + used.height < freeRect.y + freeRect.height - EPS) {
    result.push({
      x: freeRect.x,
      y: used.y + used.height,
      width: freeRect.width,
      height: freeRect.y + freeRect.height - (used.y + used.height),
    })
  }

  return result
}

function placePartOnSheet(
  sheet: OpenSheet,
  rectIdx: number,
  x: number,
  y: number,
  pw: number,
  ph: number,
  rotated: boolean,
  kerfWidth: number,
  partId: string,
  label: string
) {
  // Record placement
  sheet.placedParts.push({
    partId,
    label,
    x: x + sheet.trim,
    y: y + sheet.trim,
    width: pw,
    height: ph,
    rotated,
  })

  // Compute kerf extension — don't extend past usable area
  const kerfX = x + pw + kerfWidth <= sheet.usableW + EPS ? kerfWidth : 0
  const kerfY = y + ph + kerfWidth <= sheet.usableH + EPS ? kerfWidth : 0

  const used: Rect = {
    x,
    y,
    width: pw + kerfX,
    height: ph + kerfY,
  }

  const newFreeRects: Rect[] = []
  for (const fr of sheet.freeRects) {
    const split = splitFreeRect(fr, used)
    for (const s of split) {
      if (s.width > EPS && s.height > EPS) newFreeRects.push(s)
    }
  }

  // Remove rectIdx slot marker — splitFreeRect already replaces the used rect
  sheet.freeRects = pruneFreeRects(newFreeRects)
  // Suppress unused parameter warning — rectIdx is part of the placement contract
  void rectIdx
}

function findBestPlacement(
  sheets: OpenSheet[],
  part: ExpandedPart,
  allowRotation: boolean
): Placement | null {
  let best: Placement | null = null

  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    const sheet = sheets[sIdx]
    for (let rIdx = 0; rIdx < sheet.freeRects.length; rIdx++) {
      const rect = sheet.freeRects[rIdx]

      // Try non-rotated
      if (part.width <= rect.width + EPS && part.height <= rect.height + EPS) {
        const leftoverHoriz = rect.width - part.width
        const leftoverVert = rect.height - part.height
        const shortSide = Math.min(leftoverHoriz, leftoverVert)
        const longSide = Math.max(leftoverHoriz, leftoverVert)
        if (
          best === null ||
          shortSide < best.shortSideFit - EPS ||
          (Math.abs(shortSide - best.shortSideFit) < EPS &&
            longSide < best.longSideFit - EPS)
        ) {
          best = {
            sheetIdx: sIdx,
            rectIdx: rIdx,
            x: rect.x,
            y: rect.y,
            width: part.width,
            height: part.height,
            rotated: false,
            shortSideFit: shortSide,
            longSideFit: longSide,
          }
        }
      }

      // Try rotated
      if (
        allowRotation &&
        part.width !== part.height &&
        part.height <= rect.width + EPS &&
        part.width <= rect.height + EPS
      ) {
        const leftoverHoriz = rect.width - part.height
        const leftoverVert = rect.height - part.width
        const shortSide = Math.min(leftoverHoriz, leftoverVert)
        const longSide = Math.max(leftoverHoriz, leftoverVert)
        if (
          best === null ||
          shortSide < best.shortSideFit - EPS ||
          (Math.abs(shortSide - best.shortSideFit) < EPS &&
            longSide < best.longSideFit - EPS)
        ) {
          best = {
            sheetIdx: sIdx,
            rectIdx: rIdx,
            x: rect.x,
            y: rect.y,
            width: part.height,
            height: part.width,
            rotated: true,
            shortSideFit: shortSide,
            longSideFit: longSide,
          }
        }
      }
    }
  }

  return best
}

function partFitsOnStock(
  partW: number,
  partH: number,
  usableW: number,
  usableH: number,
  allowRotation: boolean
): boolean {
  if (partW <= usableW + EPS && partH <= usableH + EPS) return true
  if (allowRotation && partH <= usableW + EPS && partW <= usableH + EPS) return true
  return false
}

interface StockBudget {
  stock: Stock
  used: number
}

function openNewSheet(
  budgets: StockBudget[],
  part: ExpandedPart,
  trim: number,
  allowRotation: boolean,
  sheetCounts: Map<string, number>
): OpenSheet | null {
  // Prefer smallest stock that fits — minimizes waste. Ties broken by area ascending.
  const candidates: { idx: number; area: number }[] = []
  for (let i = 0; i < budgets.length; i++) {
    const b = budgets[i]
    if (b.stock.quantity !== 0 && b.used >= b.stock.quantity) continue
    const usableW = Math.max(0, b.stock.width - 2 * trim)
    const usableH = Math.max(0, b.stock.height - 2 * trim)
    if (!partFitsOnStock(part.width, part.height, usableW, usableH, allowRotation)) continue
    candidates.push({ idx: i, area: b.stock.width * b.stock.height })
  }
  if (candidates.length === 0) return null

  // Pick smallest-area that fits (minimize waste). If tied, pick the one with fewest used.
  candidates.sort((a, b) => a.area - b.area)
  const pick = candidates[0]
  const b = budgets[pick.idx]
  b.used += 1

  const usableW = Math.max(0, b.stock.width - 2 * trim)
  const usableH = Math.max(0, b.stock.height - 2 * trim)

  const sheetIndex = sheetCounts.get(b.stock.id) ?? 0
  sheetCounts.set(b.stock.id, sheetIndex + 1)

  return {
    stockId: b.stock.id,
    sheetIndex,
    stockWidth: b.stock.width,
    stockHeight: b.stock.height,
    usableW,
    usableH,
    trim,
    freeRects: [{ x: 0, y: 0, width: usableW, height: usableH }],
    placedParts: [],
  }
}

interface RunResult {
  sheets: SheetResult[]
  overallWastePercent: number
  errors: string[]
  unplacedCount: number
}

function runGreedy(
  stocks: Stock[],
  expandedParts: ExpandedPart[],
  params: CuttingParams
): RunResult {
  const { kerfWidth, trimPerEdge, allowRotation } = params
  const errors: string[] = []
  const budgets: StockBudget[] = stocks.map((s) => ({ stock: s, used: 0 }))
  const openSheets: OpenSheet[] = []
  const sheetCounts = new Map<string, number>()

  // Pre-check unfittable parts across ALL stocks
  const fittable: ExpandedPart[] = []
  const reportedUnfit = new Set<string>()
  for (const part of expandedParts) {
    let fitsAny = false
    for (const s of stocks) {
      const usableW = Math.max(0, s.width - 2 * trimPerEdge)
      const usableH = Math.max(0, s.height - 2 * trimPerEdge)
      if (partFitsOnStock(part.width, part.height, usableW, usableH, allowRotation)) {
        fitsAny = true
        break
      }
    }
    if (!fitsAny) {
      const key = `${part.partId}-${part.width}x${part.height}`
      if (!reportedUnfit.has(key)) {
        errors.push(
          `Part '${part.label}' (${part.width}x${part.height}) is larger than all stock sheets`
        )
        reportedUnfit.add(key)
      }
    } else {
      fittable.push(part)
    }
  }

  let unplacedCount = 0

  for (const part of fittable) {
    let placement = findBestPlacement(openSheets, part, allowRotation)

    if (placement === null) {
      // Try opening a new sheet
      const newSheet = openNewSheet(budgets, part, trimPerEdge, allowRotation, sheetCounts)
      if (newSheet === null) {
        unplacedCount++
        errors.push(
          `Part '${part.label}' (${part.width}x${part.height}) could not be placed — out of stock`
        )
        continue
      }
      openSheets.push(newSheet)
      placement = findBestPlacement(openSheets, part, allowRotation)
      if (placement === null) {
        unplacedCount++
        errors.push(
          `Part '${part.label}' (${part.width}x${part.height}) could not be placed on new sheet`
        )
        continue
      }
    }

    const sheet = openSheets[placement.sheetIdx]
    placePartOnSheet(
      sheet,
      placement.rectIdx,
      placement.x,
      placement.y,
      placement.width,
      placement.height,
      placement.rotated,
      kerfWidth,
      part.partId,
      part.label
    )
  }

  // Build SheetResult list
  const sheetResults: SheetResult[] = openSheets.map((s) => {
    const usableArea = s.usableW * s.usableH
    const usedArea = s.placedParts.reduce((sum, p) => sum + p.width * p.height, 0)
    const wastePercent = usableArea > 0 ? ((usableArea - usedArea) / usableArea) * 100 : 0
    return {
      stockId: s.stockId,
      sheetIndex: s.sheetIndex,
      stockWidth: s.stockWidth,
      stockHeight: s.stockHeight,
      placedParts: s.placedParts,
      wastePercent,
    }
  })

  let totalUsableArea = 0
  let totalUsedArea = 0
  for (const s of openSheets) {
    totalUsableArea += s.usableW * s.usableH
    for (const p of s.placedParts) totalUsedArea += p.width * p.height
  }
  const overallWastePercent =
    totalUsableArea > 0 ? ((totalUsableArea - totalUsedArea) / totalUsableArea) * 100 : 0

  return {
    sheets: sheetResults,
    overallWastePercent,
    errors,
    unplacedCount,
  }
}

function sortParts(parts: ExpandedPart[], strategy: number): ExpandedPart[] {
  const copy = parts.slice()
  switch (strategy) {
    case 0:
      // Area descending
      copy.sort((a, b) => b.width * b.height - a.width * a.height)
      break
    case 1:
      // Area ascending
      copy.sort((a, b) => a.width * a.height - b.width * b.height)
      break
    case 2:
      // Perimeter descending
      copy.sort((a, b) => 2 * (b.width + b.height) - 2 * (a.width + a.height))
      break
    case 3:
      // Width descending
      copy.sort((a, b) => b.width - a.width)
      break
  }
  return copy
}

export function optimize(
  stocks: Stock[],
  parts: Part[],
  params: CuttingParams
): OptimizeResult {
  // Expand parts
  const expanded: ExpandedPart[] = []
  for (const p of parts) {
    for (let i = 0; i < p.quantity; i++) {
      expanded.push({
        partId: p.id,
        label: p.label,
        width: p.width,
        height: p.height,
      })
    }
  }

  if (expanded.length === 0) {
    return {
      sheets: [],
      totalSheets: 0,
      overallWastePercent: 0,
      errors: [],
    }
  }

  if (stocks.length === 0) {
    return {
      sheets: [],
      totalSheets: 0,
      overallWastePercent: 0,
      errors: ['No stock sheets defined'],
    }
  }

  const strategies =
    params.optimizationGoal === 'minimize-waste' ? [0, 1, 2, 3] : [0]

  let best: RunResult | null = null

  for (const strat of strategies) {
    const sorted = sortParts(expanded, strat)
    const result = runGreedy(stocks, sorted, params)

    if (best === null) {
      best = result
      continue
    }

    // Prefer fewer unplaced parts, then lower waste, then fewer sheets
    if (result.unplacedCount < best.unplacedCount) {
      best = result
    } else if (result.unplacedCount === best.unplacedCount) {
      if (
        params.optimizationGoal === 'minimize-waste' &&
        result.overallWastePercent < best.overallWastePercent
      ) {
        best = result
      } else if (
        params.optimizationGoal === 'minimize-sheets' &&
        result.sheets.length < best.sheets.length
      ) {
        best = result
      }
    }
  }

  const finalResult = best!

  return {
    sheets: finalResult.sheets,
    totalSheets: finalResult.sheets.length,
    overallWastePercent: finalResult.overallWastePercent,
    errors: finalResult.errors,
  }
}
