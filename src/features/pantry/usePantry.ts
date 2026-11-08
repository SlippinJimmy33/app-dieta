import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../app/apiContext'
import type { Food, FoodInput } from './types'

export const pantryKeys = {
  categories: ['pantry', 'categories'] as const,
  foods: ['pantry', 'foods'] as const,
}

export function useCategories() {
  const { pantry } = useApi()
  return useQuery({ queryKey: pantryKeys.categories, queryFn: () => pantry.listCategories() })
}

export function useFoods() {
  const { pantry } = useApi()
  return useQuery({ queryKey: pantryKeys.foods, queryFn: () => pantry.listFoods() })
}

export function useSaveFood() {
  const { pantry } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: FoodInput }): Promise<Food> =>
      id ? pantry.updateFood(id, input) : pantry.createFood(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pantryKeys.foods }),
  })
}

export function useArchiveFood() {
  const { pantry } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pantry.archiveFood(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pantryKeys.foods }),
  })
}
