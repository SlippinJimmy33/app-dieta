// Mirrors supabase/migrations. Once the Supabase project exists this can be regenerated with
// `npx supabase gen types typescript`; keep it in sync by hand until then.

export type MealSlot = 'esmorzar' | 'dinar' | 'berenar' | 'sopar' | 'altres'
export type FoodKind = 'simple' | 'recipe'
export type FoodSource = 'manual' | 'openfoodfacts'

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type ProfileRow = {
  id: string
  display_name: string | null
  time_zone: string
  created_at: string
  updated_at: string
}

export type NutritionGoalRow = {
  id: string
  user_id: string
  valid_from: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  created_at: string
}

export type FoodCategoryRow = {
  id: string
  user_id: string
  name: string
  sort_order: number
  created_at: string
}

export type FoodRow = {
  id: string
  user_id: string
  name: string
  category_id: string | null
  kind: FoodKind
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  sugar_g: number | null
  glycemic_index: number | null
  unit_name: string | null
  unit_grams: number | null
  photo_path: string | null
  barcode: string | null
  source: FoodSource
  notes: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type RecipeIngredientRow = {
  id: string
  user_id: string
  recipe_id: string
  ingredient_id: string
  grams: number
  position: number
  created_at: string
}

export type LogEntryRow = {
  id: string
  user_id: string
  eaten_on: string
  meal: MealSlot
  food_id: string | null
  food_name: string
  grams: number
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  created_at: string
  updated_at: string
}

export type DayPlanRow = {
  user_id: string
  day: string
  activities: unknown
  meal_times: unknown
  mode_overrides: unknown
  bedtime: string | null
  created_at: string
  updated_at: string
}

/** Insert shape: the listed columns are required, everything else (ids, owner, timestamps, defaults) optional. */
type InsertOf<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>

export type Database = {
  public: {
    Tables: {
      // Profiles are only created by the signup trigger.
      profiles: Table<ProfileRow, never, Partial<Pick<ProfileRow, 'display_name' | 'time_zone'>>>
      nutrition_goals: Table<NutritionGoalRow, InsertOf<NutritionGoalRow, 'valid_from' | 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g'>>
      food_categories: Table<FoodCategoryRow, InsertOf<FoodCategoryRow, 'name'>>
      foods: Table<FoodRow, InsertOf<FoodRow, 'name' | 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g'>>
      recipe_ingredients: Table<RecipeIngredientRow, InsertOf<RecipeIngredientRow, 'recipe_id' | 'ingredient_id' | 'grams'>>
      day_plans: Table<DayPlanRow, InsertOf<DayPlanRow, 'day'>>
      // Name and nutrients are a snapshot filled by a trigger, so clients only send these.
      log_entries: Table<
        LogEntryRow,
        Pick<LogEntryRow, 'eaten_on' | 'meal' | 'food_id' | 'grams'>,
        Partial<Pick<LogEntryRow, 'eaten_on' | 'meal' | 'food_id' | 'grams'>>
      >
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}