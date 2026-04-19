import type { Session } from './types'

export function mmToIn(mm: number): number {
  return Math.round((mm / 25.4) * 10000) / 10000
}

export function inToMm(inches: number): number {
  return Math.round(inches * 25.4 * 100) / 100
}

export function convertSession(session: Session, toUnit: 'mm' | 'in'): Session {
  if (session.unit === toUnit) return session

  const convert = toUnit === 'in' ? mmToIn : inToMm

  return {
    ...session,
    unit: toUnit,
    stocks: session.stocks.map(s => ({
      ...s,
      width: convert(s.width),
      height: convert(s.height),
    })),
    parts: session.parts.map(p => ({
      ...p,
      width: convert(p.width),
      height: convert(p.height),
    })),
  }
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export function formatDimension(value: number, unit: 'mm' | 'in'): string {
  if (unit === 'mm') {
    return `${Math.round(value)}mm`
  }

  const thirtySeconds = Math.round(value * 32)
  const whole = Math.floor(thirtySeconds / 32)
  const remainder = thirtySeconds % 32

  if (remainder === 0) {
    return `${whole}"`
  }

  const divisor = gcd(remainder, 32)
  const num = remainder / divisor
  const den = 32 / divisor

  if (whole === 0) {
    return `${num}/${den}"`
  }

  return `${whole} ${num}/${den}"`
}
