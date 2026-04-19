import { useState } from 'react'
import type { OptimizeResult, SheetResult } from '../lib/optimizer'

interface CutLayoutProps {
  result: OptimizeResult | null
}

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#84cc16',
]

function buildColorMap(sheet: SheetResult): Map<string, string> {
  const map = new Map<string, string>()
  let idx = 0
  for (const p of sheet.placedParts) {
    const key = p.label || p.partId
    if (!map.has(key)) {
      map.set(key, PALETTE[idx % PALETTE.length])
      idx++
    }
  }
  return map
}

function SheetDiagram({ sheet }: { sheet: SheetResult }) {
  const { stockWidth, stockHeight, placedParts } = sheet
  const colorMap = buildColorMap(sheet)

  return (
    <svg
      viewBox={`0 0 ${stockWidth} ${stockHeight}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Waste background */}
      <rect x={0} y={0} width={stockWidth} height={stockHeight} fill="#e5e7eb" />

      {/* Placed parts */}
      {placedParts.map((p, i) => {
        const key = p.label || p.partId
        const fill = colorMap.get(key) ?? PALETTE[0]
        const minDim = Math.min(p.width, p.height)
        // Font size: ~12% of the min dimension, clamped between small values
        const fontSize = Math.max(6, Math.min(minDim * 0.12, 28))
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
              stroke="#fff"
              strokeWidth={Math.max(0.5, stockWidth * 0.001)}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={fontSize}
              fontFamily="sans-serif"
            >
              <tspan x={cx} dy={`-${fontSize * 0.6}px`}>{label}</tspan>
              <tspan x={cx} dy={`${fontSize * 1.3}px`}>{dims}</tspan>
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
        stroke="#374151"
        strokeWidth={Math.max(1, stockWidth * 0.002)}
      />
    </svg>
  )
}

export default function CutLayout({ result }: CutLayoutProps) {
  const [page, setPage] = useState(0)

  // Empty state
  if (!result || (result.sheets.length === 0 && result.errors.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Add stocks and parts, then click Optimize.
      </div>
    )
  }

  // Error-only state (no sheets placed at all)
  if (result.sheets.length === 0 && result.errors.length > 0) {
    return (
      <div className="p-4">
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-semibold text-red-700 mb-2">Optimization failed</p>
          <ul className="list-disc list-inside space-y-1">
            {result.errors.map((e, i) => (
              <li key={i} className="text-sm text-red-600">{e}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  // Normal state — has sheets
  const totalSheets = result.sheets.length
  const currentPage = Math.min(page, totalSheets - 1)
  const currentSheet = result.sheets[currentPage]

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Summary bar */}
      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
        <span>{totalSheets} {totalSheets === 1 ? 'sheet' : 'sheets'}</span>
        <span className="text-gray-300">·</span>
        <span>{result.overallWastePercent.toFixed(1)}% waste</span>
      </div>

      {/* Partial errors warning */}
      {result.errors.length > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-sm font-semibold text-yellow-700 mb-1">Some parts could not be placed</p>
          <ul className="list-disc list-inside space-y-1">
            {result.errors.map((e, i) => (
              <li key={i} className="text-sm text-yellow-600">{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          aria-label="Previous sheet"
        >
          ◀
        </button>
        <span className="text-sm text-gray-600">
          Sheet {currentPage + 1} of {totalSheets}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalSheets - 1, p + 1))}
          disabled={currentPage === totalSheets - 1}
          className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          aria-label="Next sheet"
        >
          ▶
        </button>
        <span className="text-xs text-gray-400 ml-auto">
          {currentSheet.stockWidth} × {currentSheet.stockHeight} · {currentSheet.wastePercent.toFixed(1)}% waste
        </span>
      </div>

      {/* SVG diagram */}
      <div className="flex-1 min-h-0">
        <SheetDiagram sheet={currentSheet} />
      </div>
    </div>
  )
}
