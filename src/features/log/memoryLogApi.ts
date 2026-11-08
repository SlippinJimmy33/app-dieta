import type { ISODate } from '../../lib/dates'
import type { Food } from '../pantry/types'
import type { GoalValues, GoalsApi, LogApi, LogEntry, NutritionGoal } from './types'

const round = (n: number, decimals: number) => Math.round(n * 10 ** decimals) / 10 ** decimals

/** Same rules as the database snapshot trigger, so demo mode and tests behave like the real thing. */
function snapshot(food: Pick<Food, 'name' | 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g'>, grams: number) {
  const f = grams / 100
  return {
    food_name: food.name,
    kcal: round(food.kcal * f, 1),
    protein_g: round(food.protein_g * f, 2),
    carbs_g: round(food.carbs_g * f, 2),
    fat_g: round(food.fat_g * f, 2),
  }
}

export function createMemoryLogApi(getFood: (id: string) => Food | undefined): LogApi {
  let entries: LogEntry[] = []
  let tick = 0
  // Strictly increasing timestamps keep "order added" stable even within one millisecond.
  const stamp = () => new Date(Date.now() + tick++).toISOString()

  return {
    async listEntries(day) {
      return entries.filter((e) => e.eaten_on === day).sort((a, b) => a.created_at.localeCompare(b.created_at))
    },

    async addEntry({ eaten_on, meal, food_id, grams }) {
      const food = getFood(food_id)
      if (!food) throw { code: '23503', message: `Food ${food_id} not found for this user` }
      const created = stamp()
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        user_id: 'demo',
        eaten_on,
        meal,
        food_id,
        grams,
        ...snapshot(food, grams),
        created_at: created,
        updated_at: created,
      }
      entries.push(entry)
      return entry
    },

    async updateEntry(id, { meal, grams }) {
      const existing = entries.find((e) => e.id === id)
      if (!existing) throw { code: 'PGRST116', message: 'not found' }
      let values = {}
      if (grams !== existing.grams) {
        const food = existing.food_id ? getFood(existing.food_id) : undefined
        // Deleted food: rescale the old snapshot, like the trigger does.
        values = food
          ? snapshot(food, grams)
          : snapshot(
              {
                name: existing.food_name,
                kcal: (existing.kcal * 100) / existing.grams,
                protein_g: (existing.protein_g * 100) / existing.grams,
                carbs_g: (existing.carbs_g * 100) / existing.grams,
                fat_g: (existing.fat_g * 100) / existing.grams,
              },
              grams,
            )
      }
      const updated = { ...existing, ...values, meal, grams, updated_at: stamp() }
      entries = entries.map((e) => (e.id === id ? updated : e))
      return updated
    },

    async deleteEntry(id) {
      entries = entries.filter((e) => e.id !== id)
    },
  }
}

export function createMemoryGoalsApi(initial?: { from: ISODate; values: GoalValues }): GoalsApi {
  let goals: NutritionGoal[] = []

  const api: GoalsApi = {
    async goalFor(day) {
      return goals.filter((g) => g.valid_from <= day).sort((a, b) => b.valid_from.localeCompare(a.valid_from))[0] ?? null
    },
    async saveGoal(from, values) {
      const goal: NutritionGoal = {
        id: crypto.randomUUID(),
        user_id: 'demo',
        valid_from: from,
        created_at: new Date().toISOString(),
        ...values,
      }
      goals = [...goals.filter((g) => g.valid_from !== from), goal]
      return goal
    },
  }

  if (initial) {
    goals.push({ id: 'goal-initial', user_id: 'demo', valid_from: initial.from, created_at: '', ...initial.values })
  }
  return api
}
