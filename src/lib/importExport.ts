import type { Session } from './types'

export interface ImportResult {
  stocks: Session['stocks']
  parts: Session['parts']
  unit: 'mm' | 'in'
  unitMismatch: boolean
}

export function exportSession(session: Session): void {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const safeName = session.name.replace(/[^a-z0-9]/gi, '_')
  a.download = `${safeName}_${ts}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importJSON(file: File, activeUnit: 'mm' | 'in'): Promise<ImportResult> {
  const text = await file.text()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('File is not valid JSON.')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid file: expected a JSON object.')
  }

  const obj = parsed as Record<string, unknown>

  if (!Array.isArray(obj.stocks)) {
    throw new Error('Invalid file: missing or invalid "stocks" array.')
  }
  if (!Array.isArray(obj.parts)) {
    throw new Error('Invalid file: missing or invalid "parts" array.')
  }

  for (let i = 0; i < obj.stocks.length; i++) {
    const s = obj.stocks[i] as Record<string, unknown>
    if (typeof s.id !== 'string') throw new Error(`Stock[${i}]: "id" must be a string.`)
    if (typeof s.width !== 'number') throw new Error(`Stock[${i}]: "width" must be a number.`)
    if (typeof s.height !== 'number') throw new Error(`Stock[${i}]: "height" must be a number.`)
    if (typeof s.quantity !== 'number') throw new Error(`Stock[${i}]: "quantity" must be a number.`)
  }

  for (let i = 0; i < obj.parts.length; i++) {
    const p = obj.parts[i] as Record<string, unknown>
    if (typeof p.id !== 'string') throw new Error(`Part[${i}]: "id" must be a string.`)
    if (typeof p.label !== 'string') throw new Error(`Part[${i}]: "label" must be a string.`)
    if (typeof p.width !== 'number') throw new Error(`Part[${i}]: "width" must be a number.`)
    if (typeof p.height !== 'number') throw new Error(`Part[${i}]: "height" must be a number.`)
    if (typeof p.quantity !== 'number') throw new Error(`Part[${i}]: "quantity" must be a number.`)
  }

  const parsedUnit = (obj.unit === 'in' ? 'in' : 'mm') as 'mm' | 'in'

  return {
    stocks: obj.stocks as Session['stocks'],
    parts: obj.parts as Session['parts'],
    unit: parsedUnit,
    unitMismatch: parsedUnit !== activeUnit,
  }
}
