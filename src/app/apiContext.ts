import { createContext, useContext } from 'react'
import type { GoalsApi, LogApi } from '../features/log/types'
import type { PantryApi } from '../features/pantry/types'
import type { PlanApi } from '../features/plan/types'

export type Api = {
  pantry: PantryApi
  log: LogApi
  goals: GoalsApi
  plan: PlanApi
}

export const ApiContext = createContext<Api | null>(null)

export function useApi(): Api {
  const api = useContext(ApiContext)
  if (!api) throw new Error('useApi must be used inside <ApiContext>')
  return api
}
