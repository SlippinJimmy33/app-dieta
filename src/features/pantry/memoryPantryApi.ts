import type { Food, FoodCategory, FoodInput, PantryApi } from './types'

const categoryNames = ['Fruita', 'Verdura', 'Cereals', 'Proteïna', 'Làctics', 'Greixos', 'Dolç', 'Begudes']

type Seed = Pick<FoodInput, 'name' | 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g'> & { category: string }

export const demoFoods: Seed[] = [
  { name: 'Poma', category: 'Fruita', kcal: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2 },
  { name: 'Plàtan', category: 'Fruita', kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
  { name: 'Arròs bullit', category: 'Cereals', kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { name: 'Pit de pollastre', category: 'Proteïna', kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { name: 'Mel', category: 'Dolç', kcal: 304, protein_g: 0.3, carbs_g: 82, fat_g: 0 },
]

/**
 * Pantry kept in memory: used in demo mode (no Supabase) and in tests.
 * Mirrors the database rules that matter to the UI, like unique active names.
 */
export function createMemoryPantryApi(seed: Seed[] = []): PantryApi {
  const now = () => new Date().toISOString()
  const categories: FoodCategory[] = categoryNames.map((name, i) => ({
    id: `cat-${i + 1}`,
    user_id: 'demo',
    name,
    sort_order: i + 1,
    created_at: now(),
  }))
  let foods: Food[] = []

  const toFood = (id: string, input: FoodInput, created = now()): Food => ({
    id,
    user_id: 'demo',
    kind: 'simple',
    fiber_g: null,
    sugar_g: null,
    glycemic_index: null,
    photo_path: null,
    barcode: null,
    source: 'manual',
    notes: null,
    archived_at: null,
    created_at: created,
    updated_at: now(),
    ...input,
  })

  function assertUniqueName(name: string, exceptId?: string) {
    const clash = foods.some((f) => f.id !== exceptId && !f.archived_at && f.name.toLowerCase() === name.toLowerCase())
    if (clash) throw { code: '23505', message: 'duplicate key value violates unique constraint "foods_unique_active_name"' }
  }

  for (const s of seed) {
    const { category, ...values } = s
    const categoryId = categories.find((c) => c.name === category)?.id ?? null
    foods.push(toFood(crypto.randomUUID(), { ...values, category_id: categoryId, unit_name: null, unit_grams: null }))
  }

  return {
    async listCategories() {
      return [...categories]
    },
    async listFoods() {
      return foods.filter((f) => !f.archived_at).sort((a, b) => a.name.localeCompare(b.name, 'ca'))
    },
    async createFood(input) {
      assertUniqueName(input.name)
      const food = toFood(crypto.randomUUID(), input)
      foods.push(food)
      return food
    },
    async updateFood(id, input) {
      const existing = foods.find((f) => f.id === id)
      if (!existing) throw { code: 'PGRST116', message: 'not found' }
      assertUniqueName(input.name, id)
      const updated = toFood(id, input, existing.created_at)
      foods = foods.map((f) => (f.id === id ? updated : f))
      return updated
    },
    async archiveFood(id) {
      foods = foods.map((f) => (f.id === id ? { ...f, archived_at: now() } : f))
    },
  }
}
