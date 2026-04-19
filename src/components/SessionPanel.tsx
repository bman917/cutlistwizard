import { useState } from 'react'
import { Session, SessionStore } from '../lib/types'

export interface SessionPanelProps {
  store: SessionStore
  onStoreChange: (store: SessionStore) => void
  onClose: () => void
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

export default function SessionPanel({ store, onStoreChange, onClose }: SessionPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  function handleLoad(id: string) {
    onStoreChange({ ...store, activeSessionId: id })
    onClose()
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
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 40 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: '52px',
        right: '16px',
        zIndex: 50,
        width: '300px',
        backgroundColor: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
            Sessions
          </h2>
          <button
            onClick={onClose}
            style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', transition: 'color 150ms ease', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Session list */}
        <ul style={{ maxHeight: '280px', overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
          {store.sessions.length === 0 && (
            <li style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              No sessions yet.
            </li>
          )}
          {store.sessions.map((session, idx) => {
            const isActive = session.id === store.activeSessionId
            return (
              <li
                key={session.id}
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  borderBottom: idx < store.sessions.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  backgroundColor: isActive ? 'rgba(212,160,66,0.07)' : 'transparent',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLLIElement).style.backgroundColor = 'rgba(255,255,255,0.03)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLLIElement).style.backgroundColor = 'transparent'
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
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-amber)'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(212,160,66,0.08)' }}
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

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)' }}>
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
    </>
  )
}
