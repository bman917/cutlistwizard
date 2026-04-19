import type { Stock, Part } from '../lib/types'

interface OptimizeButtonProps {
  stocks: Stock[]
  parts: Part[]
  onOptimize: () => void
}

export default function OptimizeButton({ stocks, parts, onOptimize }: OptimizeButtonProps) {
  const disabled = stocks.length === 0 || parts.length === 0

  return (
    <button
      onClick={onOptimize}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '12px 0',
        borderRadius: '5px',
        fontSize: '0.875rem',
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        letterSpacing: '0.06em',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 180ms ease',
        ...(disabled
          ? {
              backgroundColor: 'var(--color-panel-alt)',
              color: 'var(--color-text-muted)',
              boxShadow: 'none',
            }
          : {
              backgroundColor: 'var(--color-amber)',
              color: '#ffffff',
              boxShadow: '0 0 0 0 var(--color-amber-glow)',
            }),
      }}
      onMouseEnter={e => {
        if (!disabled) {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.backgroundColor = 'var(--color-amber-hover)'
          btn.style.boxShadow = '0 0 20px 4px var(--color-amber-glow)'
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.backgroundColor = 'var(--color-amber)'
          btn.style.boxShadow = '0 0 0 0 var(--color-amber-glow)'
        }
      }}
    >
      Optimize
    </button>
  )
}
