import { useState } from 'react'
import type { Session, SessionStore } from '../lib/types'

export interface SessionPanelProps {
  store: SessionStore
  onStoreChange: (store: SessionStore) => void
}

const DEFAULT_CUTTING_PARAMS = {
  kerfWidth: 1.6,
  trimPerEdge: 0,
  optimizationGoal: 'minimize-sheets' as const,
  allowRotation: true,
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function SessionPanel({ store, onStoreChange }: SessionPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  function handleLoad(id: string) {
    onStoreChange({ ...store, activeSessionId: id })
  }

  function handleStartRename(session: Session) {
    setRenamingId(session.id)
    setRenameValue(session.name)
  }

  function handleRenameCommit(id: string) {
    const trimmed = renameValue.trim()
    if (!trimmed) {
      setRenamingId(null)
      return
    }
    const updatedSessions = store.sessions.map(s =>
      s.id === id ? { ...s, name: trimmed, updatedAt: new Date().toISOString() } : s
    )
    onStoreChange({ ...store, sessions: updatedSessions })
    setRenamingId(null)
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete session "${name}"?`)) return
    const updatedSessions = store.sessions.filter(s => s.id !== id)
    let activeSessionId = store.activeSessionId
    if (activeSessionId === id) {
      activeSessionId = updatedSessions.length > 0 ? updatedSessions[0].id : null
    }
    onStoreChange({ activeSessionId, sessions: updatedSessions })
  }

  function handleNewSession() {
    const session: Session = {
      id: crypto.randomUUID(),
      name: 'New Project',
      unit: 'mm',
      updatedAt: new Date().toISOString(),
      stocks: [],
      parts: [],
      cuttingParams: { ...DEFAULT_CUTTING_PARAMS },
    }
    onStoreChange({
      activeSessionId: session.id,
      sessions: [...store.sessions, session],
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Session list */}
      <ul style={{ flex: 1, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
        {store.sessions.length === 0 && (
          <li style={{ padding: '12px 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            No sessions yet.
          </li>
        )}
        {store.sessions.map((session, idx) => {
          const isActive = session.id === store.activeSessionId
          return (
            <li
              key={session.id}
              style={{
                padding: '10px 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                borderBottom: idx < store.sessions.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                backgroundColor: isActive ? 'rgba(212,160,66,0.07)' : 'transparent',
                borderRadius: '4px',
                paddingLeft: isActive ? '8px' : '0',
                transition: 'background-color 150ms ease',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {renamingId === session.id ? (
                  <input
                    autoFocus
                    style={{
                      width: '100%',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-sans)',
                      backgroundColor: 'var(--color-panel-alt)',
                      border: '1px solid var(--color-amber)',
                      borderRadius: '3px',
                      padding: '3px 8px',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameCommit(session.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameCommit(session.id)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.name}
                    {isActive && (
                      <span style={{ marginLeft: '8px', fontSize: '0.65rem', fontWeight: 400, color: 'var(--color-amber)', fontFamily: 'var(--font-mono)' }}>
                        active
                      </span>
                    )}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  {formatDate(session.updatedAt)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                {!isActive && (
                  <button
                    onClick={() => handleLoad(session.id)}
                    style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: '3px', transition: 'all 150ms ease', fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-amber)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(91,141,184,0.1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                  >
                    Load
                  </button>
                )}
                <button
                  onClick={() => handleStartRename(session)}
                  style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: '3px', transition: 'all 150ms ease', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(session.id, session.name)}
                  style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: '3px', transition: 'all 150ms ease', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(192,57,43,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                >
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* New session button */}
      <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border)', marginTop: '8px' }}>
        <button
          onClick={handleNewSession}
          style={{
            width: '100%',
            fontSize: '0.75rem',
            textAlign: 'center',
            padding: '7px 0',
            borderRadius: '4px',
            border: '1px dashed var(--color-border)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.borderColor = 'var(--color-amber)'
            btn.style.color = 'var(--color-amber)'
            btn.style.backgroundColor = 'rgba(212,160,66,0.05)'
          }}
          onMouseLeave={e => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.borderColor = 'var(--color-border)'
            btn.style.color = 'var(--color-text-muted)'
            btn.style.backgroundColor = 'transparent'
          }}
        >
          + New session
        </button>
      </div>
    </div>
  )
}
