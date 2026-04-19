import type { Session, SessionStore } from './types'

const STORAGE_KEY = 'cutlistwizard_sessions'

export function loadStore(): SessionStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { activeSessionId: null, sessions: [] }
    return JSON.parse(raw) as SessionStore
  } catch {
    return { activeSessionId: null, sessions: [] }
  }
}

export function saveStore(store: SessionStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Silently ignore storage errors (e.g. private browsing quota exceeded)
  }
}

export function getActiveSession(store: SessionStore): Session | null {
  if (!store.activeSessionId) return null
  return store.sessions.find(s => s.id === store.activeSessionId) ?? null
}
