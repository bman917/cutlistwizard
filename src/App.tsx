import { useState } from 'react'
import { Session, SessionStore } from './lib/types'
import { loadStore, saveStore, getActiveSession } from './lib/storage'
import { optimize, OptimizeResult } from './lib/optimizer'
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

  const [sessionPanelOpen, setSessionPanelOpen] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null)

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

  function handleStoreChange(updatedStore: SessionStore): void {
    saveStore(updatedStore)
    setStore(updatedStore)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">CutList Wizard</h1>
        <button
          onClick={() => setSessionPanelOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <span>Session: {activeSession?.name ?? 'None'}</span>
          <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left panel — Editor */}
        <div className="w-1/2 border-r border-gray-200 p-4 overflow-auto flex flex-col gap-6">
          {activeSession && (
            <>
              <ImportExport
                session={activeSession}
                onImport={(stocks, parts) => updateActiveSession({ stocks, parts })}
              />
              <hr className="border-gray-200" />
              <StocksTable
                stocks={activeSession.stocks}
                unit={activeSession.unit}
                onChange={stocks => updateActiveSession({ stocks })}
              />
              <hr className="border-gray-200" />
              <PartsTable
                parts={activeSession.parts}
                unit={activeSession.unit}
                onChange={parts => updateActiveSession({ parts })}
              />
              <hr className="border-gray-200" />
              <CuttingParamsForm
                params={activeSession.cuttingParams}
                onChange={cuttingParams => updateActiveSession({ cuttingParams })}
              />
              <div className="pt-2">
                <OptimizeButton
                  stocks={activeSession.stocks}
                  parts={activeSession.parts}
                  onOptimize={handleOptimize}
                />
              </div>
            </>
          )}
        </div>

        {/* Right panel — Cut Layout */}
        <div className="w-1/2 p-4 overflow-auto flex flex-col">
          <div className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-4">Cut Layout</div>
          <div className="flex-1">
            <CutLayout result={optimizeResult} />
          </div>
        </div>
      </main>

      {/* Session panel overlay */}
      {sessionPanelOpen && (
        <SessionPanel
          store={store}
          onStoreChange={handleStoreChange}
          onClose={() => setSessionPanelOpen(false)}
        />
      )}
    </div>
  )
}

export default App
