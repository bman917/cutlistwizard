import { useState, useEffect } from 'react'
import type { Session, SessionStore } from './lib/types'
import { loadStore, saveStore, getActiveSession } from './lib/storage'
import { optimize } from './lib/optimizer'
import type { OptimizeResult } from './lib/optimizer'
import { convertSession } from './lib/units'
import SessionPanel from './components/SessionPanel'
import StocksTable from './components/StocksTable'
import PartsTable from './components/PartsTable'
import CuttingParamsForm from './components/CuttingParamsForm'
import OptimizeButton from './components/OptimizeButton'
import CutLayout from './components/CutLayout'
import ImportExport from './components/ImportExport'

const DEFAULT_CUTTING_PARAMS = {
  kerfWidth: 1.6,
  trimPerEdge: 0,
  optimizationGoal: 'minimize-sheets' as const,
  allowRotation: true,
}

function createDefaultSession(): Session {
  return {
    id: crypto.randomUUID(),
    name: 'My Project',
    unit: 'mm',
    updatedAt: new Date().toISOString(),
    stocks: [],
    parts: [],
    cuttingParams: { ...DEFAULT_CUTTING_PARAMS },
  }
}

function App() {
  const [store, setStore] = useState<SessionStore>(() => {
    const loaded = loadStore()
    if (loaded.sessions.length === 0) {
      const session = createDefaultSession()
      const initialized: SessionStore = {
        activeSessionId: session.id,
        sessions: [session],
      }
      saveStore(initialized)
      return initialized
    }
    return loaded
  })

  const [activeTab, setActiveTab] = useState<'editor' | 'sessions'>('editor')
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null)
  const [theme, setTheme] = useState<'dark' | 'grey' | 'light'>(() => {
    return (localStorage.getItem('cutlistwizard_theme') as 'dark' | 'grey' | 'light') ?? 'grey'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cutlistwizard_theme', theme)
  }, [theme])

  const activeSession = getActiveSession(store)

  function updateActiveSession(updates: Partial<Session>): void {
    if (!store.activeSessionId) return
    const updatedSessions = store.sessions.map(s =>
      s.id === store.activeSessionId
        ? { ...s, ...updates, updatedAt: new Date().toISOString() }
        : s
    )
    const updatedStore: SessionStore = { ...store, sessions: updatedSessions }
    saveStore(updatedStore)
    setStore(updatedStore)
    setOptimizeResult(null)
  }

  function handleOptimize(): void {
    if (!activeSession) return
    const result = optimize(activeSession.stocks, activeSession.parts, activeSession.cuttingParams)
    setOptimizeResult(result)
  }

  function handleUnitToggle(newUnit: 'mm' | 'in'): void {
    if (!activeSession || activeSession.unit === newUnit) return
    const converted = convertSession(activeSession, newUnit)
    updateActiveSession({ ...converted })
  }

  function handleStoreChange(updatedStore: SessionStore): void {
    saveStore(updatedStore)
    setStore(updatedStore)
    setOptimizeResult(null)
    setActiveTab('editor')
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--color-panel)', borderBottom: '1px solid var(--color-border)' }} className="flex items-center justify-between px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Small logo mark */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="20" height="20" rx="3" stroke="var(--color-amber)" strokeWidth="1.5" fill="none" />
            <rect x="5" y="5" width="6" height="8" rx="1" fill="var(--color-amber)" opacity="0.85" />
            <rect x="13" y="5" width="4" height="5" rx="1" fill="var(--color-amber)" opacity="0.5" />
            <rect x="5" y="15" width="12" height="2" rx="0.5" fill="var(--color-amber)" opacity="0.3" />
          </svg>
          <h1 style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', letterSpacing: '0.02em' }} className="text-base font-medium">
            CutList<span style={{ color: 'var(--color-amber)' }}>Wizard</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'inline-flex', borderRadius: '4px', border: '1px solid var(--color-border)', overflow: 'hidden', fontSize: '0.7rem', fontFamily: 'var(--font-sans)' }}>
            {(['Light', 'Grey', 'Dark'] as const).map(t => {
              const val = t.toLowerCase() as 'light' | 'grey' | 'dark'
              const active = theme === val
              return (
                <button
                  key={t}
                  onClick={() => setTheme(val)}
                  style={{
                    padding: '4px 10px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: active ? 'var(--color-amber)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--color-text-muted)',
                    fontWeight: active ? 500 : 400,
                    transition: 'all 150ms ease',
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {activeSession?.name ?? '—'}
        </span>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left panel — Editor + Sessions */}
        <div
          style={{ borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-panel)', width: '50%', minWidth: '320px', maxWidth: '520px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            {(['editor', 'sessions'] as const).map(tab => {
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderBottom: active ? '2px solid var(--color-amber)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    marginBottom: '-1px',
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Editor tab */}
          {activeTab === 'editor' && activeSession && (
            <div className="p-5 overflow-auto flex flex-col gap-6" style={{ flex: 1 }}>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em' }} className="uppercase">Units</span>
                <div
                  style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}
                  className="inline-flex text-xs"
                >
                  {(['mm', 'in'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => handleUnitToggle(u)}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        transition: 'all 150ms ease',
                        backgroundColor: activeSession.unit === u ? 'var(--color-amber)' : 'transparent',
                        color: activeSession.unit === u ? '#ffffff' : 'var(--color-text-secondary)',
                        fontWeight: activeSession.unit === u ? '600' : '400',
                        padding: '4px 12px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <ImportExport
                session={activeSession}
                onImport={(stocks, parts) => updateActiveSession({ stocks, parts })}
              />
              <hr style={{ borderColor: 'var(--color-border-subtle)', margin: 0 }} />
              <StocksTable
                stocks={activeSession.stocks}
                unit={activeSession.unit}
                onChange={stocks => updateActiveSession({ stocks })}
              />
              <hr style={{ borderColor: 'var(--color-border-subtle)', margin: 0 }} />
              <PartsTable
                parts={activeSession.parts}
                unit={activeSession.unit}
                onChange={parts => updateActiveSession({ parts })}
              />
              <hr style={{ borderColor: 'var(--color-border-subtle)', margin: 0 }} />
              <CuttingParamsForm
                params={activeSession.cuttingParams}
                onChange={cuttingParams => updateActiveSession({ cuttingParams })}
                unit={activeSession.unit}
              />
              <div className="pt-2 pb-4">
                <OptimizeButton
                  stocks={activeSession.stocks}
                  parts={activeSession.parts}
                  onOptimize={handleOptimize}
                />
              </div>
            </div>
          )}

          {/* Sessions tab */}
          {activeTab === 'sessions' && (
            <div className="p-5" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <SessionPanel
                store={store}
                onStoreChange={handleStoreChange}
              />
            </div>
          )}
        </div>

        {/* Right panel — Cut Layout (cutting mat) */}
        <div className="cutting-mat p-5 overflow-auto flex flex-col" style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
              fontSize: '0.625rem',
              letterSpacing: '0.12em',
            }}
            className="uppercase mb-4 shrink-0"
          >
            Cut Layout
          </div>
          <div className="flex-1">
            <CutLayout result={optimizeResult} unit={activeSession?.unit ?? 'mm'} />
          </div>
        </div>
      </main>

    </div>
  )
}

export default App
