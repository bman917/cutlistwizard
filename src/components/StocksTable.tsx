import { useState } from 'react'
import type { Stock } from '../lib/types'
import ConfirmDialog from './ConfirmDialog'

interface StocksTableProps {
  stocks: Stock[]
  unit: 'mm' | 'in'
  onChange: (stocks: Stock[]) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  borderRadius: '3px',
  padding: '4px 8px',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'border-color 150ms ease, background-color 150ms ease',
}

function TableInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        borderColor: focused ? 'var(--color-amber)' : 'transparent',
        backgroundColor: focused ? 'var(--color-panel-alt)' : 'transparent',
      }}
      onFocus={e => { setFocused(true); e.target.select(); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
    />
  )
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
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: '0.625rem', letterSpacing: '0.12em' }} className="uppercase">
          Stock Sheets
        </h2>
        {stocks.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            style={{ color: 'var(--color-danger)', fontSize: '0.7rem', transition: 'color 150ms ease', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger-hover)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-danger)')}
          >
            Clear all
          </button>
        )}
      </div>

      {stocks.length > 0 && (
        <div className="table-scroll">
        <table className="w-full mb-2" style={{ borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 500, textAlign: 'left', paddingBottom: '6px', paddingRight: '8px' }}>
                Length <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>({unit})</span>
              </th>
              <th style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 500, textAlign: 'left', paddingBottom: '6px', paddingRight: '8px' }}>
                Width <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>({unit})</span>
              </th>
              <th style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 500, textAlign: 'left', paddingBottom: '6px', paddingRight: '8px' }}>
                Qty <span style={{ opacity: 0.5, fontWeight: 400 }}>(0&nbsp;=&nbsp;∞)</span>
              </th>
              <th style={{ paddingBottom: '6px', width: '24px' }} />
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, idx) => (
              <tr
                key={stock.id}
                style={{
                  borderBottom: idx < stocks.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ paddingTop: '3px', paddingBottom: '3px', paddingRight: '6px' }}>
                  <TableInput
                    type="number"
                    min="0"
                    value={stock.width}
                    onChange={e => updateRow(stock.id, 'width', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td style={{ paddingTop: '3px', paddingBottom: '3px', paddingRight: '6px' }}>
                  <TableInput
                    type="number"
                    min="0"
                    value={stock.height}
                    onChange={e => updateRow(stock.id, 'height', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td style={{ paddingTop: '3px', paddingBottom: '3px', paddingRight: '6px' }}>
                  <div style={{ position: 'relative' }}>
                    <TableInput
                      type="number"
                      min="0"
                      value={stock.quantity}
                      onChange={e => updateRow(stock.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                    />
                    {stock.quantity === 0 && (
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-amber)', fontSize: '0.75rem', pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>∞</span>
                    )}
                  </div>
                </td>
                <td style={{ paddingTop: '3px', paddingBottom: '3px', textAlign: 'center' }}>
                  <button
                    onClick={() => deleteRow(stock.id)}
                    style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 4px', transition: 'color 150ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                    title="Remove"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <button
        onClick={addRow}
        style={{
          marginTop: '4px',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'color 150ms ease',
          padding: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-amber)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
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
