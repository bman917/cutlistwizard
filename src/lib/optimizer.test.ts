import { describe, it, expect } from 'vitest'
import { optimize, type SheetResult } from './optimizer'
import type { Stock, Part, CuttingParams } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStock(width: number, height: number, quantity = 0): Stock {
  return { id: crypto.randomUUID(), width, height, quantity }
}

function makePart(width: number, height: number, quantity = 1, label = ''): Part {
  return { id: crypto.randomUUID(), label, width, height, quantity }
}

const defaultParams: CuttingParams = {
  kerfWidth: 0,
  trimPerEdge: 0,
  optimizationGoal: 'minimize-sheets',
  allowRotation: false,
}

function assertNoOverlap(sheets: SheetResult[]) {
  for (const sheet of sheets) {
    const parts = sheet.placedParts
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const a = parts[i]
        const b = parts[j]
        const overlapX = a.x < b.x + b.width && a.x + a.width > b.x
        const overlapY = a.y < b.y + b.height && a.y + a.height > b.y
        expect(overlapX && overlapY).toBe(false)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('optimizer', () => {
  it('1. basic placement — single part', () => {
    const stock = makeStock(200, 200)
    const part = makePart(100, 100)
    const result = optimize([stock], [part], defaultParams)

    expect(result.sheets.length).toBe(1)
    expect(result.errors.length).toBe(0)
    const placed = result.sheets[0].placedParts[0]
    expect(placed.x).toBe(0)
    expect(placed.y).toBe(0)
  })

  it('2. basic placement — two parts side by side, no overlap', () => {
    const stock = makeStock(200, 200)
    const part = makePart(100, 200, 2)
    const result = optimize([stock], [part], defaultParams)

    expect(result.sheets.length).toBe(1)
    expect(result.errors.length).toBe(0)
    assertNoOverlap(result.sheets)
  })

  it('3. kerf — two parts fit with kerf', () => {
    const stock = makeStock(1000, 200)
    const part = makePart(490, 200, 2)
    const params: CuttingParams = { ...defaultParams, kerfWidth: 1.6 }
    const result = optimize([stock], [part], params)

    // 490 + 1.6 kerf + 490 = 981.6 <= 1000, should fit on 1 sheet
    expect(result.sheets.length).toBe(1)
    expect(result.errors.length).toBe(0)
  })

  it('4. kerf — second part overflows to sheet 2', () => {
    const stock = makeStock(1000, 200)
    const part = makePart(500, 200, 2)
    const params: CuttingParams = { ...defaultParams, kerfWidth: 1.6 }
    const result = optimize([stock], [part], params)

    // 500 + 1.6 + 500 = 1001.6 > 1000, second part needs a new sheet
    expect(result.sheets.length).toBe(2)
  })

  it('5. trim — part fits exactly after trim', () => {
    const stock = makeStock(1000, 1000)
    const part = makePart(980, 980)
    const params: CuttingParams = { ...defaultParams, trimPerEdge: 10 }
    const result = optimize([stock], [part], params)

    // usable = 1000 - 2*10 = 980×980, part fits exactly
    expect(result.errors.length).toBe(0)
    expect(result.sheets.length).toBe(1)
  })

  it('6. trim — part oversized after trim', () => {
    const stock = makeStock(1000, 1000)
    const part = makePart(981, 981)
    const params: CuttingParams = { ...defaultParams, trimPerEdge: 10 }
    const result = optimize([stock], [part], params)

    // usable = 980×980, part 981×981 doesn't fit
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('7. rotation disabled — no fit', () => {
    const stock = makeStock(200, 300)
    const part = makePart(100, 400) // 400 > 300, won't fit without rotation
    const params: CuttingParams = { ...defaultParams, allowRotation: false }
    const result = optimize([stock], [part], params)

    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('8. rotation enabled — fits when rotated', () => {
    const stock = makeStock(200, 300)
    const part = makePart(100, 400) // rotate to 400×100, fits in 200×300? No: 400>200.
    // Better: part 300×100 rotated to 100×300 fits in 200×300
    // Actually use: stock 400×200, part 100×400 → rotated: 400×100 fits in 400×200
    const stock2 = makeStock(400, 200)
    const params: CuttingParams = { ...defaultParams, allowRotation: true }
    const result = optimize([stock2], [part], params)

    expect(result.errors.length).toBe(0)
    expect(result.sheets.length).toBe(1)
    expect(result.sheets[0].placedParts[0].rotated).toBe(true)
  })

  it('9. quantity limit — stock exhausted', () => {
    // Stock quantity=1: only 1 sheet allowed. Each 600×600 part needs its own sheet.
    const stock = makeStock(800, 800, 1)
    const parts = [makePart(600, 600), makePart(600, 600)]
    const result = optimize([stock], parts, defaultParams)

    // Only 1 sheet can be opened; second part can't be placed
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.sheets.length).toBe(1)
  })

  it('10. quantity unlimited — stock quantity=0', () => {
    const stock = makeStock(1000, 1000, 0)
    // 3 parts each 900×900, each needing its own sheet
    const parts = [makePart(900, 900), makePart(900, 900), makePart(900, 900)]
    const result = optimize([stock], parts, defaultParams)

    expect(result.sheets.length).toBe(3)
    expect(result.errors.length).toBe(0)
  })

  it('11. oversized part — error, not placed', () => {
    const stock = makeStock(1000, 1000)
    const part = makePart(2000, 2000)
    const result = optimize([stock], [part], defaultParams)

    expect(result.errors.length).toBeGreaterThan(0)
    const totalPlaced = result.sheets.reduce((sum, s) => sum + s.placedParts.length, 0)
    expect(totalPlaced).toBe(0)
  })

  it('12. minimize-waste produces <= waste compared to minimize-sheets', () => {
    const stock = makeStock(1000, 1000, 0)
    // Mix of sizes where ordering matters
    const parts = [
      makePart(600, 600, 2),
      makePart(400, 400, 3),
      makePart(200, 800, 2),
    ]

    const paramsSheets: CuttingParams = { ...defaultParams, optimizationGoal: 'minimize-sheets' }
    const paramsWaste: CuttingParams = { ...defaultParams, optimizationGoal: 'minimize-waste' }

    const resultSheets = optimize([stock], parts, paramsSheets)
    const resultWaste = optimize([stock], parts, paramsWaste)

    // minimize-waste should produce waste <= minimize-sheets waste (or at most equal)
    expect(resultWaste.overallWastePercent).toBeLessThanOrEqual(
      resultSheets.overallWastePercent + 0.01
    )
  })

  it('13. no overlap invariant — complex case with kerf', () => {
    const stock = makeStock(1000, 1000, 0)
    const params: CuttingParams = { ...defaultParams, kerfWidth: 3, allowRotation: true }
    const parts = [
      makePart(300, 500, 1, 'A'),
      makePart(200, 400, 1, 'B'),
      makePart(450, 250, 1, 'C'),
      makePart(150, 600, 1, 'D'),
      makePart(380, 380, 1, 'E'),
    ]
    const result = optimize([stock], parts, params)

    expect(result.errors.length).toBe(0)
    assertNoOverlap(result.sheets)
  })
})
