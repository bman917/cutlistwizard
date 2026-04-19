import { CuttingParams } from '../lib/types'

interface CuttingParamsFormProps {
  params: CuttingParams
  onChange: (params: CuttingParams) => void
}

const KERF_PRESETS = [0, 1.6, 2.2, 2.4, 3.2, 3.8]

export default function CuttingParamsForm({ params, onChange }: CuttingParamsFormProps) {
  function update<K extends keyof CuttingParams>(field: K, value: CuttingParams[K]) {
    onChange({ ...params, [field]: value })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cutting Parameters</h2>

      {/* Kerf width */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Kerf width (mm)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.1"
            value={params.kerfWidth}
            onChange={e => update('kerfWidth', parseFloat(e.target.value) || 0)}
            className="w-24 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <select
            value={KERF_PRESETS.includes(params.kerfWidth) ? params.kerfWidth : ''}
            onChange={e => {
              if (e.target.value !== '') update('kerfWidth', parseFloat(e.target.value))
            }}
            className="border border-gray-200 rounded px-2 py-1 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Preset…</option>
            {KERF_PRESETS.map(v => (
              <option key={v} value={v}>{v === 0 ? '0 (no kerf)' : `${v} mm`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trim per edge */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Trim per edge (mm)</label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={params.trimPerEdge}
          onChange={e => update('trimPerEdge', parseFloat(e.target.value) || 0)}
          className="w-24 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Optimization goal */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Optimization goal</label>
        <div className="flex rounded-md overflow-hidden border border-gray-200 w-fit text-sm">
          <button
            type="button"
            onClick={() => update('optimizationGoal', 'minimize-sheets')}
            className={`px-3 py-1.5 transition-colors ${
              params.optimizationGoal === 'minimize-sheets'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Minimize Sheets
          </button>
          <button
            type="button"
            onClick={() => update('optimizationGoal', 'minimize-waste')}
            className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${
              params.optimizationGoal === 'minimize-waste'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Minimize Waste
          </button>
        </div>
      </div>

      {/* Allow rotation */}
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={params.allowRotation}
          onChange={e => update('allowRotation', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-400"
        />
        Allow rotation
      </label>
    </div>
  )
}
