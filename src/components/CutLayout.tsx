import { useState } from 'react'
import type { OptimizeResult, SheetResult } from '../lib/optimizer'

interface CutLayoutProps {
  result: OptimizeResult | null
}

const PALETTE = [
  '#4a90c4', '#5bb89a', '#c4913d', '#b85b5b', '#8a6fc4',
  '#3aacca', '#c47a3d', '#c45b8a', '#3ab8a8', '#8ac43d',
]

function buildColorMap(sheets: SheetResult[]): Map<string, string> {
  const map = new Map<string, string>()
  let idx = 0
  for (const sheet of sheets) {
    for (const p of sheet.placedParts) {
      const key = p.label || p.partId
      if (!map.has(key)) {
        map.set(key, PALETTE[idx % PALETTE.length])
        idx++
      }
    }
  }
  return map
}

function SheetDiagram({ sheet, colorMap }: { sheet: SheetResult; colorMap: Map<string, string> }) {
  const { stockWidth, stockHeight, placedParts } = sheet

  return (
    <svg
      viewBox={`0 0 ${stockWidth} ${stockHeight}`}
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px', overflow: 'hidden' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Waste background */}
      <rect x={0} y={0} width={stockWidth} height={stockHeight} fill="var(--color-cutting-mat)" />

      {/* Subtle dot grid on waste area */}
      <defs>
        <pattern id="dotgrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"
          patternTransform={`scale(${stockWidth / 400})`}>
          <circle cx="10" cy="10" r="0.8" fill="var(--color-cutting-mat-dot)" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={stockWidth} height={stockHeight} fill="url(#dotgrid)" />

      {/* Placed parts */}
      {placedParts.map((p, i) => {
        const key = p.label || p.partId
        const fill = colorMap.get(key) ?? PALETTE[0]
        const minDim = Math.min(p.width, p.height)
        const maxFont = Math.min(stockWidth, stockHeight) * 0.08
        const fontSize = Math.min(minDim * 0.12, maxFont)
        const cx = p.x + p.width / 2
        const cy = p.y + p.height / 2
        const label = p.label || 'Part'
        const dims = `${p.width}×${p.height}`

        return (
          <g key={i}>
            <rect
              x={p.x}
              y={p.y}
              width={p.width}
              height={p.height}
              fill={fill}
              fillOpacity={0.82}
              stroke="#1a1d23"
              strokeWidth={Math.max(1, stockWidth * 0.0015)}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.92)"
              fontSize={fontSize}
              fontFamily="'DM Mono', monospace"
            >
              <tspan x={cx} dy={`-${fontSize * 0.6}px`}>{label}</tspan>
              <tspan x={cx} dy={`${fontSize * 1.3}px`} fillOpacity={0.7}>{dims}</tspan>
            </text>
          </g>
        )
      })}

      {/* Sheet border */}
      <rect
        x={0}
        y={0}
        width={stockWidth}
        height={stockHeight}
        fill="none"
        stroke="var(--color-amber)"
        strokeWidth={Math.max(1, stockWidth * 0.002)}
        strokeOpacity={0.5}
      />
    </svg>
  )
}

export default function CutLayout({ result }: CutLayoutProps) {
  const [page, setPage] = useState(0)
  const [showAll, setShowAll] = useState(true)

  // Empty state
  if (!result || (result.sheets.length === 0 && result.errors.length === 0)) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '200px',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
        }}
      >
        Add stocks and parts, then click Optimize.
      </div>
    )
  }

  // Error-only state
  if (result.sheets.length === 0 && result.errors.length > 0) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          borderRadius: '5px',
          backgroundColor: 'rgba(192, 57, 43, 0.12)',
          border: '1px solid rgba(192, 57, 43, 0.4)',
          padding: '14px 16px',
        }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e07070', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>
            Optimization failed
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {result.errors.map((e, i) => (
              <li key={i} style={{ fontSize: '0.8rem', color: '#c07070', fontFamily: 'var(--font-sans)' }}>{e}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  const totalSheets = result.sheets.length
  const currentPage = Math.min(page, totalSheets - 1)
  const currentSheet = result.sheets[currentPage]
  const colorMap = buildColorMap(result.sheets)

  const paginationBtnStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    borderRadius: '3px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    opacity: disabled ? 0.35 : 1,
    transition: 'all 150ms ease',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--color-amber)', fontWeight: 500 }}>
          {totalSheets} {totalSheets === 1 ? 'sheet' : 'sheets'}
        </span>
        <span style={{ color: 'var(--color-border)' }}>·</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {result.overallWastePercent.toFixed(1)}% waste
        </span>
      </div>

      {/* Partial errors warning */}
      {result.errors.length > 0 && (
        <div style={{
          borderRadius: '5px',
          backgroundColor: 'rgba(212,160,66,0.08)',
          border: '1px solid rgba(212,160,66,0.3)',
          padding: '10px 14px',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-amber)', fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>
            Some parts could not be placed
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {result.errors.map((e, i) => (
              <li key={i} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination / view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {!showAll && (
          <>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              style={paginationBtnStyle(currentPage === 0)}
              onMouseEnter={e => { if (currentPage !== 0) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-amber)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)' }}
              aria-label="Previous sheet"
            >
              ◀
            </button>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
              {currentPage + 1} / {totalSheets}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalSheets - 1, p + 1))}
              disabled={currentPage === totalSheets - 1}
              style={paginationBtnStyle(currentPage === totalSheets - 1)}
              onMouseEnter={e => { if (currentPage !== totalSheets - 1) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-amber)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)' }}
              aria-label="Next sheet"
            >
              ▶
            </button>
          </>
        )}
        <button
          onClick={() => setShowAll(v => !v)}
          style={{ ...paginationBtnStyle(false), marginLeft: showAll ? '0' : 'auto', padding: '4px 12px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-amber)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)' }}
        >
          {showAll ? 'Paginate' : 'Show all'}
        </button>
        {!showAll && (
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
            {currentSheet.stockWidth} × {currentSheet.stockHeight} · {currentSheet.wastePercent.toFixed(1)}% waste
          </span>
        )}
      </div>

      {/* SVG diagram(s) */}
      {showAll ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {result.sheets.map((sheet, i) => (
            <div key={i}>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                Sheet {i + 1} · {sheet.stockWidth} × {sheet.stockHeight} · {sheet.wastePercent.toFixed(1)}% waste
              </div>
              <SheetDiagram sheet={sheet} colorMap={colorMap} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <SheetDiagram sheet={currentSheet} colorMap={colorMap} />
        </div>
      )}
    </div>
  )
}
