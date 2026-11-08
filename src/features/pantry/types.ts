import type { FoodCategoryRow, FoodRow } from '../../lib/database.types'

export type Food = FoodRow
export type FoodCategory = FoodCategoryRow

/** What the user edits in the food form; values are per 100 g. */
export type FoodInput = {
  name: string
  category_id: string | null
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  unit_name: string | null
  unit_grams: number | null
}

/** Data access for the pantry. Supabase in the app, in-memory in demo mode and tests. */
export type PantryApi = {
  listCategories(): Promise<FoodCategory[]>
  /** Active (not archived) foods, sorted by name. */
  listFoods(): Promise<Food[]>
  createFood(input: FoodInput): Promise<Food>
  updateFood(id: string, input: FoodInput): Promise<Food>
  archiveFood(id: string): Promise<void>
}

/** Error shape shared by Supabase (PostgrestError) and the in-memory API. */
export type ApiError = { code?: string; message?: string }
