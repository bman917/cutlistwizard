import { useState } from 'react'
import type { Part } from '../lib/types'
import ConfirmDialog from './ConfirmDialog'

interface PartsTableProps {
  parts: Part[]
  unit: 'mm' | 'in'
  onChange: (parts: Part[]) => void
}

const baseInputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  borderRadius: '3px',
  padding: '4px 8px',
  fontSize: '0.8125rem',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'border-color 150ms ease, background-color 150ms ease',
}

function TableInput(props: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  const [focused, setFocused] = useState(false)
  const { mono, ...rest } = props
  return (
    <input
      {...rest}
      style={{
        ...baseInputStyle,
        fontFamily: mono !== false ? 'var(--font-mono)' : 'var(--font-sans)',
        borderColor: focused ? 'var(--color-amber)' : 'transparent',
        backgroundColor: focused ? 'var(--color-panel-alt)' : 'transparent',
      }}
      onFocus={e => { setFocused(true); e.target.select(); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
    />
  )
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
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: '0.625rem', letterSpacing: '0.12em' }} className="uppercase">
          Parts
        </h2>
        {parts.length > 0 && (
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

      {parts.length > 0 && (
        <table className="w-full mb-2" style={{ borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 500, textAlign: 'left', paddingBottom: '6px', paddingRight: '8px' }}>Label</th>
              <th style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 500, textAlign: 'left', paddingBottom: '6px', paddingRight: '8px' }}>
                Length <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>({unit})</span>
              </th>
              <th style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 500, textAlign: 'left', paddingBottom: '6px', paddingRight: '8px' }}>
                Width <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>({unit})</span>
              </th>
              <th style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 500, textAlign: 'left', paddingBottom: '6px', paddingRight: '8px' }}>Qty</th>
              <th style={{ paddingBottom: '6px', width: '24px' }} />
            </tr>
          </thead>
          <tbody>
            {parts.map((part, idx) => (
              <tr
                key={part.id}
                style={{
                  borderBottom: idx < parts.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td style={{ paddingTop: '3px', paddingBottom: '3px', paddingRight: '6px' }}>
                  <TableInput
                    type="text"
                    mono={false}
                    value={part.label}
                    placeholder="—"
                    onChange={e => updateField(part.id, 'label', e.target.value)}
                    style={{
                      ...baseInputStyle,
                      fontFamily: 'var(--font-sans)',
                    }}
                  />
                </td>
                <td style={{ paddingTop: '3px', paddingBottom: '3px', paddingRight: '6px' }}>
                  <TableInput
                    type="number"
                    min="0"
                    value={part.width}
                    onChange={e => updateField(part.id, 'width', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td style={{ paddingTop: '3px', paddingBottom: '3px', paddingRight: '6px' }}>
                  <TableInput
                    type="number"
                    min="0"
                    value={part.height}
                    onChange={e => updateField(part.id, 'height', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td style={{ paddingTop: '3px', paddingBottom: '3px', paddingRight: '6px' }}>
                  <TableInput
                    type="number"
                    min="1"
                    value={part.quantity}
                    onChange={e => updateField(part.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                  />
                </td>
                <td style={{ paddingTop: '3px', paddingBottom: '3px', textAlign: 'center' }}>
                  <button
                    onClick={() => deleteRow(part.id)}
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
