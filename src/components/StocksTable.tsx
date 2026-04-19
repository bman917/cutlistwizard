import { useState } from 'react'
import { Stock } from '../lib/types'
import ConfirmDialog from './ConfirmDialog'

interface StocksTableProps {
  stocks: Stock[]
  unit: 'mm' | 'in'
  onChange: (stocks: Stock[]) => void
}

export default function StocksTable({ stocks, unit, onChange }: StocksTableProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  function addRow() {
    onChange([...stocks, { id: crypto.randomUUID(), width: 0, height: 0, quantity: 1 }])
  }

  function deleteRow(id: string) {
    onChange(stocks.filter(s => s.id !== id))
  }

  function updateRow(id: string, field: keyof Omit<Stock, 'id'>, value: number) {
    onChange(stocks.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Stock Sheets</h2>
        {stocks.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {stocks.length > 0 && (
        <table className="w-full text-sm mb-2">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-200">
              <th className="text-left pb-1 font-medium">Width ({unit})</th>
              <th className="text-left pb-1 font-medium">Height ({unit})</th>
              <th className="text-left pb-1 font-medium">
                Qty
                <span className="ml-1 text-gray-400 font-normal">(0&nbsp;=&nbsp;∞)</span>
              </th>
              <th className="pb-1 w-6" />
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => (
              <tr key={stock.id} className="border-b border-gray-100 last:border-0">
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min="0"
                    value={stock.width}
                    onChange={e => updateRow(stock.id, 'width', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min="0"
                    value={stock.height}
                    onChange={e => updateRow(stock.id, 'height', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </td>
                <td className="py-1 pr-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={stock.quantity}
                      onChange={e => updateRow(stock.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    {stock.quantity === 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">∞</span>
                    )}
                  </div>
                </td>
                <td className="py-1 text-center">
                  <button
                    onClick={() => deleteRow(stock.id)}
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
        + Add sheet
      </button>

      {showConfirm && (
        <ConfirmDialog
          message="Remove all stock sheets?"
          onConfirm={() => { onChange([]); setShowConfirm(false) }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
