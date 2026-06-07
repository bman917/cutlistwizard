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

interface FreeSection {
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
  freeSections: FreeSection[]
  placedParts: PlacedPart[]
}

type FitRule = 'bssf' | 'baf' | 'blsf'

interface Placement {
  sheetIdx: number
  sectionIdx: number
  x: number
  y: number
  width: number
  height: number
  rotated: boolean
  primaryFit: number
  secondaryFit: number
}

const EPS = 1e-9

function scoreFit(
  rule: FitRule,
  leftoverW: number,
  leftoverH: number,
  sectionArea: number,
  partArea: number
): { primary: number; secondary: number } {
  const shortSide = Math.min(leftoverW, leftoverH)
  const longSide = Math.max(leftoverW, leftoverH)
  switch (rule) {
    case 'bssf': return { primary: shortSide, secondary: longSide }
    case 'blsf': return { primary: longSide, secondary: shortSide }
    case 'baf':  return { primary: sectionArea - partArea, secondary: shortSide }
  }
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

function findBestPlacement(
  sheets: OpenSheet[],
  part: ExpandedPart,
  allowRotation: boolean,
  rule: FitRule
): Placement | null {
  let best: Placement | null = null

  function consider(
    sIdx: number,
    rIdx: number,
    section: FreeSection,
    placedW: number,
    placedH: number,
    rotated: boolean
  ) {
    const leftoverW = section.width - placedW
    const leftoverH = section.height - placedH
    const sectionArea = section.width * section.height
    const partArea = placedW * placedH
    const { primary, secondary } = scoreFit(rule, leftoverW, leftoverH, sectionArea, partArea)
    if (
      best === null ||
      primary < best.primaryFit - EPS ||
      (Math.abs(primary - best.primaryFit) < EPS && secondary < best.secondaryFit - EPS)
    ) {
      best = {
        sheetIdx: sIdx,
        sectionIdx: rIdx,
        x: section.x,
        y: section.y,
        width: placedW,
        height: placedH,
        rotated,
        primaryFit: primary,
        secondaryFit: secondary,
      }
    }
  }

  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    const sheet = sheets[sIdx]
    for (let rIdx = 0; rIdx < sheet.freeSections.length; rIdx++) {
      const section = sheet.freeSections[rIdx]

      if (part.width <= section.width + EPS && part.height <= section.height + EPS) {
        consider(sIdx, rIdx, section, part.width, part.height, false)
      }

      if (
        allowRotation &&
        part.width !== part.height &&
        part.height <= section.width + EPS &&
        part.width <= section.height + EPS
      ) {
        consider(sIdx, rIdx, section, part.height, part.width, true)
      }
    }
  }

  return best
}

// Guillotine split using the Shorter Leftover Axis (SLA) rule.
//
// After placing a part at the top-left of `section`, the remaining L-shaped
// space is divided into exactly two rectangles by a single straight cut:
//
//   dw < dh  →  horizontal cut at y+ph+kerfY:
//     right  = (x+pw+kerfX, y,          dw, ph)
//     bottom = (section.x,  y+ph+kerfY, section.width, dh)
//
//   dw >= dh →  vertical cut at x+pw+kerfX:
//     right  = (x+pw+kerfX, section.y, dw, section.height)
//     below  = (x,          y+ph+kerfY, pw, dh)
//
// This matches how a table saw works: every cut runs edge-to-edge across the
// current piece, so every resulting rectangle is independently accessible.
function placePartOnSheet(
  sheet: OpenSheet,
  placement: Placement,
  kerfWidth: number,
  partId: string,
  label: string
) {
  const { sectionIdx, x, y, width: pw, height: ph, rotated } = placement
  const section = sheet.freeSections[sectionIdx]

  sheet.placedParts.push({
    partId,
    label,
    x: x + sheet.trim,
    y: y + sheet.trim,
    width: pw,
    height: ph,
    rotated,
  })

  // Don't extend kerf past the section edge
  const kerfX = x + pw + kerfWidth <= section.x + section.width + EPS ? kerfWidth : 0
  const kerfY = y + ph + kerfWidth <= section.y + section.height + EPS ? kerfWidth : 0

  const dw = section.width - pw - kerfX
  const dh = section.height - ph - kerfY

  sheet.freeSections.splice(sectionIdx, 1)

  if (dw < dh) {
    // Horizontal guillotine cut
    if (dw > EPS && ph > EPS) {
      sheet.freeSections.push({ x: x + pw + kerfX, y: section.y, width: dw, height: ph })
    }
    if (section.width > EPS && dh > EPS) {
      sheet.freeSections.push({ x: section.x, y: y + ph + kerfY, width: section.width, height: dh })
    }
  } else {
    // Vertical guillotine cut
    if (dw > EPS && section.height > EPS) {
      sheet.freeSections.push({ x: x + pw + kerfX, y: section.y, width: dw, height: section.height })
    }
    if (pw > EPS && dh > EPS) {
      sheet.freeSections.push({ x: section.x, y: y + ph + kerfY, width: pw, height: dh })
    }
  }

  mergeFreeSections(sheet.freeSections)
}

function mergeFreeSections(sections: FreeSection[]): void {
  let merged = true
  while (merged) {
    merged = false
    outer: for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        const a = sections[i]
        const b = sections[j]
        // Vertical stack: same x/width, a directly above b
        if (
          Math.abs(a.x - b.x) < EPS &&
          Math.abs(a.width - b.width) < EPS &&
          Math.abs(a.y + a.height - b.y) < EPS
        ) {
          sections.splice(j, 1)
          sections.splice(i, 1)
          sections.push({ x: a.x, y: a.y, width: a.width, height: a.height + b.height })
          merged = true
          break outer
        }
        // Vertical stack: b directly above a
        if (
          Math.abs(a.x - b.x) < EPS &&
          Math.abs(a.width - b.width) < EPS &&
          Math.abs(b.y + b.height - a.y) < EPS
        ) {
          sections.splice(j, 1)
          sections.splice(i, 1)
          sections.push({ x: a.x, y: b.y, width: a.width, height: a.height + b.height })
          merged = true
          break outer
        }
        // Horizontal join: same y/height, a directly left of b
        if (
          Math.abs(a.y - b.y) < EPS &&
          Math.abs(a.height - b.height) < EPS &&
          Math.abs(a.x + a.width - b.x) < EPS
        ) {
          sections.splice(j, 1)
          sections.splice(i, 1)
          sections.push({ x: a.x, y: a.y, width: a.width + b.width, height: a.height })
          merged = true
          break outer
        }
        // Horizontal join: b directly left of a
        if (
          Math.abs(a.y - b.y) < EPS &&
          Math.abs(a.height - b.height) < EPS &&
          Math.abs(b.x + b.width - a.x) < EPS
        ) {
          sections.splice(j, 1)
          sections.splice(i, 1)
          sections.push({ x: b.x, y: a.y, width: a.width + b.width, height: a.height })
          merged = true
          break outer
        }
      }
    }
  }
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
    freeSections: [{ x: 0, y: 0, width: usableW, height: usableH }],
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
  params: CuttingParams,
  rule: FitRule
): RunResult {
  const { kerfWidth, trimPerEdge, allowRotation } = params
  const errors: string[] = []
  const budgets: StockBudget[] = stocks.map((s) => ({ stock: s, used: 0 }))
  const openSheets: OpenSheet[] = []
  const sheetCounts = new Map<string, number>()

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
        errors.push(`Part '${part.label}' (${part.width}x${part.height}) is larger than all stock sheets`)
        reportedUnfit.add(key)
      }
    } else {
      fittable.push(part)
    }
  }

  let unplacedCount = 0

  for (const part of fittable) {
    let placement = findBestPlacement(openSheets, part, allowRotation, rule)

    if (placement === null) {
      const newSheet = openNewSheet(budgets, part, trimPerEdge, allowRotation, sheetCounts)
      if (newSheet === null) {
        unplacedCount++
        errors.push(`Part '${part.label}' (${part.width}x${part.height}) could not be placed — out of stock`)
        continue
      }
      openSheets.push(newSheet)
      placement = findBestPlacement(openSheets, part, allowRotation, rule)
      if (placement === null) {
        unplacedCount++
        errors.push(`Part '${part.label}' (${part.width}x${part.height}) could not be placed on new sheet`)
        continue
      }
    }

    const sheet = openSheets[placement.sheetIdx]
    placePartOnSheet(sheet, placement, kerfWidth, part.partId, part.label)
  }

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

  return { sheets: sheetResults, overallWastePercent, errors, unplacedCount }
}

function sortParts(parts: ExpandedPart[], strategy: number): ExpandedPart[] {
  const copy = parts.slice()
  switch (strategy) {
    case 0:
      copy.sort((a, b) => b.width * b.height - a.width * a.height)
      break
    case 1:
      copy.sort((a, b) => a.width * a.height - b.width * b.height)
      break
    case 2:
      copy.sort((a, b) => 2 * (b.width + b.height) - 2 * (a.width + a.height))
      break
    case 3:
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
  const expanded: ExpandedPart[] = []
  for (const p of parts) {
    for (let i = 0; i < p.quantity; i++) {
      expanded.push({ partId: p.id, label: p.label, width: p.width, height: p.height })
    }
  }

  if (expanded.length === 0) {
    return { sheets: [], totalSheets: 0, overallWastePercent: 0, errors: [] }
  }

  if (stocks.length === 0) {
    return { sheets: [], totalSheets: 0, overallWastePercent: 0, errors: ['No stock sheets defined'] }
  }

  const sortStrategies = [0, 1, 2, 3]
  const fitRules: FitRule[] = ['bssf', 'baf', 'blsf']

  let best: RunResult | null = null

  for (const strat of sortStrategies) {
    const sorted = sortParts(expanded, strat)
    for (const rule of fitRules) {
      const result = runGreedy(stocks, sorted, params, rule)

      if (best === null) {
        best = result
        continue
      }

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
  }

  const finalResult = best!
  return {
    sheets: finalResult.sheets,
    totalSheets: finalResult.sheets.length,
    overallWastePercent: finalResult.overallWastePercent,
    errors: finalResult.errors,
  }
}
