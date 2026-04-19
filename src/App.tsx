import { useState, useEffect } from 'react'
import { useIsMobile } from './hooks/useIsMobile'
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
  const [mobileTab, setMobileTab] = useState<'editor' | 'sessions' | 'layout'>('editor')
  const isMobile = useIsMobile()
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
    setMobileTab('editor')
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--color-panel)', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 16px', height: '48px', flexShrink: 0 }}>
        {/* Left — logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="20" height="20" rx="3" stroke="var(--color-amber)" strokeWidth="1.5" fill="none" />
            <rect x="5" y="5" width="6" height="8" rx="1" fill="var(--color-amber)" opacity="0.85" />
            <rect x="13" y="5" width="4" height="5" rx="1" fill="var(--color-amber)" opacity="0.5" />
            <rect x="5" y="15" width="12" height="2" rx="0.5" fill="var(--color-amber)" opacity="0.3" />
          </svg>
          {!isMobile && (
            <h1 style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', letterSpacing: '0.02em', fontSize: '1rem', fontWeight: 500, margin: 0 }}>
              CutList<span style={{ color: 'var(--color-amber)' }}>Wizard</span>
            </h1>
          )}
        </div>

        {/* Center — active session name */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 500, color: 'var(--color-text-primary)', letterSpacing: '0.01em' }}>
            {activeSession?.name ?? '—'}
          </span>
        </div>

        {/* Right — theme toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'inline-flex', borderRadius: '4px', border: '1px solid var(--color-border)', overflow: 'hidden', fontSize: '0.7rem', fontFamily: 'var(--font-sans)' }}>
            {(isMobile ? ['L', 'G', 'D'] : ['Light', 'Grey', 'Dark']).map((label, i) => {
              const val = (['light', 'grey', 'dark'] as const)[i]
              const active = theme === val
              return (
                <button
                  key={val}
                  onClick={() => setTheme(val)}
                  style={{
                    padding: isMobile ? '4px 8px' : '4px 10px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: active ? 'var(--color-amber)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--color-text-muted)',
                    fontWeight: active ? 500 : 400,
                    transition: 'all 150ms ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>

        {isMobile ? (
          <>
            {/* Mobile: single full-width panel based on mobileTab */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: mobileTab === 'layout' ? 'var(--color-cutting-mat)' : 'var(--color-panel)' }}>
              {mobileTab === 'editor' && activeSession && (
                <div className="p-5 overflow-auto flex flex-col gap-6" style={{ flex: 1 }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Units</span>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', display: 'inline-flex', fontSize: '0.75rem' }}>
                      {(['mm', 'in'] as const).map(u => (
                        <button key={u} onClick={() => handleUnitToggle(u)} style={{ fontFamily: 'var(--font-mono)', transition: 'all 150ms ease', backgroundColor: activeSession.unit === u ? 'var(--color-amber)' : 'transparent', color: activeSession.unit === u ? '#ffffff' : 'var(--color-text-secondary)', fontWeight: activeSession.unit === u ? '600' : '400', padding: '6px 16px', border: 'none', cursor: 'pointer' }}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ImportExport session={activeSession} onImport={(stocks, parts) => updateActiveSession({ stocks, parts })} />
                  <hr style={{ borderColor: 'var(--color-border-subtle)', margin: 0 }} />
                  <StocksTable stocks={activeSession.stocks} unit={activeSession.unit} onChange={stocks => updateActiveSession({ stocks })} />
                  <hr style={{ borderColor: 'var(--color-border-subtle)', margin: 0 }} />
                  <PartsTable parts={activeSession.parts} unit={activeSession.unit} onChange={parts => updateActiveSession({ parts })} />
                  <hr style={{ borderColor: 'var(--color-border-subtle)', margin: 0 }} />
                  <CuttingParamsForm params={activeSession.cuttingParams} onChange={cuttingParams => updateActiveSession({ cuttingParams })} unit={activeSession.unit} />
                  <div className="pt-2 pb-4">
                    <OptimizeButton stocks={activeSession.stocks} parts={activeSession.parts} onOptimize={() => { handleOptimize(); setMobileTab('layout') }} />
                  </div>
                </div>
              )}
              {mobileTab === 'sessions' && (
                <div className="p-5" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <SessionPanel store={store} onStoreChange={handleStoreChange} />
                </div>
              )}
              {mobileTab === 'layout' && (
                <div className="cutting-mat p-5 overflow-auto flex flex-col" style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px', flexShrink: 0 }}>
                    Cut Layout
                  </div>
                  <div style={{ flex: 1 }}>
                    <CutLayout result={optimizeResult} unit={activeSession?.unit ?? 'mm'} />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile bottom nav */}
            <nav style={{ display: 'flex', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-panel)', flexShrink: 0 }}>
              {([
                { id: 'editor', label: 'Editor', icon: '✏️' },
                { id: 'sessions', label: 'Sessions', icon: '📁' },
                { id: 'layout', label: 'Cut Layout', icon: '📐' },
              ] as const).map(tab => {
                const active = mobileTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMobileTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      border: 'none',
                      borderTop: active ? '2px solid var(--color-amber)' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      color: active ? 'var(--color-amber)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                    <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </>
        ) : (
          <>
            {/* Desktop: side-by-side */}
            <div style={{ borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-panel)', width: '50%', minWidth: '320px', maxWidth: '520px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
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

              {activeTab === 'editor' && activeSession && (
                <div className="p-5 overflow-auto flex flex-col gap-6" style={{ flex: 1 }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em' }} className="uppercase">Units</span>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }} className="inline-flex text-xs">
                      {(['mm', 'in'] as const).map(u => (
                        <button key={u} onClick={() => handleUnitToggle(u)} style={{ fontFamily: 'var(--font-mono)', transition: 'all 150ms ease', backgroundColor: activeSession.unit === u ? 'var(--color-amber)' : 'transparent', color: activeSession.unit === u ? '#ffffff' : 'var(--color-text-secondary)', fontWeight: activeSession.unit === u ? '600' : '400', padding: '4px 12px', border: 'none', cursor: 'pointer' }}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ImportExport session={activeSession} onImport={(stocks, parts) => updateActiveSession({ stocks, parts })} />
                  <hr style={{ borderColor: 'var(--color-border-subtle)', margin: 0 }} />
                  <StocksTable stocks={activeSession.stocks} unit={activeSession.unit} onChange={stocks => updateActiveSession({ stocks })} />
                  <hr style={{ borderColor: 'var(--color-border-subtle)', margin: 0 }} />
                  <PartsTable parts={activeSession.parts} unit={activeSession.unit} onChange={parts => updateActiveSession({ parts })} />
                  <hr style={{ borderColor: 'var(--color-border-subtle)', margin: 0 }} />
                  <CuttingParamsForm params={activeSession.cuttingParams} onChange={cuttingParams => updateActiveSession({ cuttingParams })} unit={activeSession.unit} />
                  <div className="pt-2 pb-4">
                    <OptimizeButton stocks={activeSession.stocks} parts={activeSession.parts} onOptimize={handleOptimize} />
                  </div>
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="p-5" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <SessionPanel store={store} onStoreChange={handleStoreChange} />
                </div>
              )}
            </div>

            {/* Right panel — Cut Layout */}
            <div className="cutting-mat p-5 overflow-auto flex flex-col" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px', flexShrink: 0 }}>
                Cut Layout
              </div>
              <div className="flex-1">
                <CutLayout result={optimizeResult} unit={activeSession?.unit ?? 'mm'} />
              </div>
            </div>
          </>
        )}
      </main>

    </div>
  )
}

export default App
