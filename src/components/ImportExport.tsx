import { useRef, useState } from 'react'
import type { Session } from '../lib/types'
import { exportSession, importJSON } from '../lib/importExport'
import { convertSession } from '../lib/units'
import ConfirmDialog from './ConfirmDialog'

interface ImportExportProps {
  session: Session
  onImport: (stocks: Session['stocks'], parts: Session['parts']) => void
}

const ghostBtnStyle: React.CSSProperties = {
  padding: '5px 14px',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-sans)',
  borderRadius: '4px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  transition: 'all 150ms ease',
}

export default function ImportExport({ session, onImport }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<{
    stocks: Session['stocks']
    parts: Session['parts']
    fileUnit: 'mm' | 'in'
  } | null>(null)

  function handleExport() {
    exportSession(session)
  }

  function handleImportClick() {
    setImportError(null)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      const result = await importJSON(file, session.unit)
      if (result.unitMismatch) {
        setPendingImport({ stocks: result.stocks, parts: result.parts, fileUnit: result.unit })
      } else {
        onImport(result.stocks, result.parts)
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Unknown error during import.')
    }
  }

  function handleConfirmConvert() {
    if (!pendingImport) return
    const tempSession: Session = {
      ...session,
      unit: pendingImport.fileUnit,
      stocks: pendingImport.stocks,
      parts: pendingImport.parts,
    }
    const converted = convertSession(tempSession, session.unit)
    onImport(converted.stocks, converted.parts)
    setPendingImport(null)
  }

  function handleCancelConvert() {
    setPendingImport(null)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleExport}
          style={ghostBtnStyle}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-amber)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'
          }}
        >
          Export
        </button>
        <button
          onClick={handleImportClick}
          style={ghostBtnStyle}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-amber)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'
          }}
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {importError && (
          <span style={{ fontSize: '0.75rem', color: '#e07070', fontFamily: 'var(--font-sans)' }}>{importError}</span>
        )}
      </div>

      {pendingImport && (
        <ConfirmDialog
          message={`This file uses ${pendingImport.fileUnit}, but your session uses ${session.unit}. Convert values?`}
          onConfirm={handleConfirmConvert}
          onCancel={handleCancelConvert}
        />
      )}
    </>
  )
}
