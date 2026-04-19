import LZString from 'lz-string'
import type { Session } from './types'

export function encodeSession(session: Session): string {
  const json = JSON.stringify(session)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeSession(encoded: string): Session | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const parsed = JSON.parse(json)
    // Basic shape validation
    if (!parsed.id || !parsed.name || !Array.isArray(parsed.stocks) || !Array.isArray(parsed.parts)) return null
    return parsed as Session
  } catch {
    return null
  }
}

export function buildShareUrl(session: Session): string {
  const encoded = encodeSession(session)
  const url = new URL(window.location.href)
  url.hash = `s=${encoded}`
  return url.toString()
}

export function readShareHash(): Session | null {
  const hash = window.location.hash
  if (!hash.startsWith('#s=')) return null
  return decodeSession(hash.slice(3))
}

export function clearShareHash(): void {
  history.replaceState(null, '', window.location.pathname + window.location.search)
}
