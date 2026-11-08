import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../app/apiContext'
import type { ISODate } from '../../lib/dates'
import type { DayPlan } from './types'

export const planKey = (day: ISODate) => ['plan', day] as const

export function useDayPlan(day: ISODate, enabled = true) {
  const { plan } = useApi()
  return useQuery({ queryKey: planKey(day), queryFn: () => plan.planFor(day), enabled })
}

export function useSavePlan() {
  const { plan } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (next: DayPlan) => plan.savePlan(next),
    onSuccess: (saved) => queryClient.setQueryData(planKey(saved.day), saved),
  })
}
