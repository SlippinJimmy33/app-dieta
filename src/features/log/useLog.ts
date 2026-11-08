import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../app/apiContext'
import type { ISODate } from '../../lib/dates'
import type { GoalValues, LogEntryChanges, NewLogEntry } from './types'

export const logKeys = {
  day: (day: ISODate) => ['log', day] as const,
  goal: (day: ISODate) => ['goals', day] as const,
  allGoals: ['goals'] as const,
}

export function useDayEntries(day: ISODate) {
  const { log } = useApi()
  return useQuery({ queryKey: logKeys.day(day), queryFn: () => log.listEntries(day) })
}

export function useGoal(day: ISODate) {
  const { goals } = useApi()
  return useQuery({ queryKey: logKeys.goal(day), queryFn: () => goals.goalFor(day) })
}

export function useAddEntry() {
  const { log } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entry: NewLogEntry) => log.addEntry(entry),
    onSuccess: (entry) => queryClient.invalidateQueries({ queryKey: logKeys.day(entry.eaten_on) }),
  })
}

export function useUpdateEntry() {
  const { log } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: LogEntryChanges }) => log.updateEntry(id, changes),
    onSuccess: (entry) => queryClient.invalidateQueries({ queryKey: logKeys.day(entry.eaten_on) }),
  })
}

export function useDeleteEntry() {
  const { log } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; day: ISODate }) => log.deleteEntry(id),
    onSuccess: (_, { day }) => queryClient.invalidateQueries({ queryKey: logKeys.day(day) }),
  })
}

export function useSaveGoal() {
  const { goals } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ from, values }: { from: ISODate; values: GoalValues }) => goals.saveGoal(from, values),
    // A new goal can change any day from `from` onwards: refetch every cached goal.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logKeys.allGoals }),
  })
}
