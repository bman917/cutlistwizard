import { useRef, useState } from 'react'
import type { Session } from '../lib/types'
import { exportSession, importJSON } from '../lib/importExport'
import { convertSession } from '../lib/units'
import ConfirmDialog from './ConfirmDialog'

interface ImportExportProps {
  session: Session
  onImport: (stocks: Session['stocks'], parts: Session['parts']) => void
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
    // Reset so the same file can be re-selected after cancel
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
    // Build a minimal session-shaped object so convertSession can convert dimensions
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
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
        >
          Export
        </button>
        <button
          onClick={handleImportClick}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
        {importError && (
          <span className="text-sm text-red-600">{importError}</span>
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
