export interface Stock {
  id: string
  width: number
  height: number
  quantity: number // 0 = unlimited
}

export interface Part {
  id: string
  label: string
  width: number
  height: number
  quantity: number
}

export interface CuttingParams {
  kerfWidth: number       // default 1.6
  trimPerEdge: number     // default 0
  optimizationGoal: 'minimize-sheets' | 'minimize-waste'
  allowRotation: boolean  // default true
}

export interface Session {
  id: string
  name: string
  unit: 'mm' | 'in'
  updatedAt: string
  stocks: Stock[]
  parts: Part[]
  cuttingParams: CuttingParams
}

export interface SessionStore {
  activeSessionId: string | null
  sessions: Session[]
}
