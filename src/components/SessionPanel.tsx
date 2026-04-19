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
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-12 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Sessions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
          {store.sessions.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-400">No sessions yet.</li>
          )}
          {store.sessions.map(session => {
            const isActive = session.id === store.activeSessionId
            return (
              <li
                key={session.id}
                className={`px-4 py-3 flex items-start gap-2 ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex-1 min-w-0">
                  {renamingId === session.id ? (
                    <input
                      autoFocus
                      className="w-full text-sm border border-blue-400 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-blue-300"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameCommit(session.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameCommit(session.id)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {session.name}
                      {isActive && (
                        <span className="ml-1.5 text-xs font-normal text-blue-500">active</span>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(session.updatedAt)}</div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isActive && (
                    <button
                      onClick={() => handleLoad(session.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                    >
                      Load
                    </button>
                  )}
                  <button
                    onClick={() => handleStartRename(session)}
                    className="text-xs text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(session.id, session.name)}
                    className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleNewSession}
            className="w-full text-sm text-center py-1.5 rounded-md border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            + New session
          </button>
        </div>
      </div>
    </>
  )
}
