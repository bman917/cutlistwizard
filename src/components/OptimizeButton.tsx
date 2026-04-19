import { Stock, Part } from '../lib/types'

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
      className={`w-full py-2.5 rounded-md text-sm font-semibold transition-colors ${
        disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      Optimize
    </button>
  )
}
