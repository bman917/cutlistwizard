import type { CuttingParams } from '../lib/types'
import { mmToIn } from '../lib/units'

interface CuttingParamsFormProps {
  params: CuttingParams
  onChange: (params: CuttingParams) => void
  unit: 'mm' | 'in'
}

const KERF_PRESETS_MM = [0, 1.6, 2.2, 2.4, 3.2, 3.8]

const fieldInputStyle: React.CSSProperties = {
  width: '6rem',
  backgroundColor: 'var(--color-panel-alt)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  padding: '5px 10px',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-mono)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  transition: 'border-color 150ms ease',
}

const selectStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-panel-alt)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  padding: '5px 10px',
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text-secondary)',
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 150ms ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text-muted)',
  marginBottom: '6px',
  letterSpacing: '0.02em',
}

export default function CuttingParamsForm({ params, onChange, unit }: CuttingParamsFormProps) {
  function update<K extends keyof CuttingParams>(field: K, value: CuttingParams[K]) {
    onChange({ ...params, [field]: value })
  }

  const kerfPresets = unit === 'in'
    ? KERF_PRESETS_MM.map(v => ({ raw: mmToIn(v), label: v === 0 ? '0 (no kerf)' : `${mmToIn(v)}" (${v}mm)` }))
    : KERF_PRESETS_MM.map(v => ({ raw: v, label: v === 0 ? '0 (no kerf)' : `${v} mm` }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
        Cutting Parameters
      </h2>

      {/* Kerf width */}
      <div>
        <label style={labelStyle}>Kerf width ({unit})</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            min="0"
            step={unit === 'in' ? '0.001' : '0.1'}
            value={params.kerfWidth}
            onChange={e => update('kerfWidth', parseFloat(e.target.value) || 0)}
            style={fieldInputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-amber)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
          <select
            value=""
            onChange={e => {
              if (e.target.value !== '') update('kerfWidth', parseFloat(e.target.value))
            }}
            style={selectStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-amber)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <option value="">Preset…</option>
            {kerfPresets.map(p => (
              <option key={p.raw} value={p.raw}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trim per edge */}
      <div>
        <label style={labelStyle}>Trim per edge ({unit})</label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={params.trimPerEdge}
          onChange={e => update('trimPerEdge', parseFloat(e.target.value) || 0)}
          style={fieldInputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-amber)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        />
      </div>

      {/* Optimization goal */}
      <div>
        <label style={labelStyle}>Optimization goal</label>
        <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--color-border)', width: 'fit-content' }}>
          {(['minimize-sheets', 'minimize-waste'] as const).map((goal, idx) => {
            const active = params.optimizationGoal === goal
            return (
              <button
                key={goal}
                type="button"
                onClick={() => update('optimizationGoal', goal)}
                style={{
                  padding: '5px 14px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: active ? 500 : 400,
                  backgroundColor: active ? 'var(--color-amber)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderLeft: idx > 0 ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(91,141,184,0.1)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                }}
              >
                {goal === 'minimize-sheets' ? 'Minimize Sheets' : 'Minimize Waste'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Allow rotation */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={params.allowRotation}
          onChange={e => update('allowRotation', e.target.checked)}
          style={{
            width: '14px',
            height: '14px',
            accentColor: 'var(--color-amber)',
            cursor: 'pointer',
          }}
        />
        Allow rotation
      </label>
    </div>
  )
}
