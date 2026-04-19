import { useState } from 'react'
import { Part } from '../lib/types'
import ConfirmDialog from './ConfirmDialog'

interface PartsTableProps {
  parts: Part[]
  unit: 'mm' | 'in'
  onChange: (parts: Part[]) => void
}

export default function PartsTable({ parts, unit, onChange }: PartsTableProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  function addRow() {
    onChange([...parts, { id: crypto.randomUUID(), label: '', width: 0, height: 0, quantity: 1 }])
  }

  function deleteRow(id: string) {
    onChange(parts.filter(p => p.id !== id))
  }

  function updateField<K extends keyof Omit<Part, 'id'>>(id: string, field: K, value: Part[K]) {
    onChange(parts.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Parts</h2>
        {parts.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {parts.length > 0 && (
        <table className="w-full text-sm mb-2">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-200">
              <th className="text-left pb-1 font-medium">Label</th>
              <th className="text-left pb-1 font-medium">Width ({unit})</th>
              <th className="text-left pb-1 font-medium">Height ({unit})</th>
              <th className="text-left pb-1 font-medium">Qty</th>
              <th className="pb-1 w-6" />
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id} className="border-b border-gray-100 last:border-0">
                <td className="py-1 pr-2">
                  <input
                    type="text"
                    value={part.label}
                    placeholder="—"
                    onChange={e => updateField(part.id, 'label', e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min="0"
                    value={part.width}
                    onChange={e => updateField(part.id, 'width', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min="0"
                    value={part.height}
                    onChange={e => updateField(part.id, 'height', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min="1"
                    value={part.quantity}
                    onChange={e => updateField(part.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="py-1 text-center">
                  <button
                    onClick={() => deleteRow(part.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors leading-none"
                    title="Remove"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        onClick={addRow}
        className="mt-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
      >
        + Add part
      </button>

      {showConfirm && (
        <ConfirmDialog
          message="Remove all parts?"
          onConfirm={() => { onChange([]); setShowConfirm(false) }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
