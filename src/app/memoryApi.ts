import { toISODate, type ISODate } from '../lib/dates'
import { createMemoryGoalsApi, createMemoryLogApi } from '../features/log/memoryLogApi'
import type { GoalValues } from '../features/log/types'
import type { MealSlot } from '../lib/database.types'
import { createMemoryPantryApi, demoFoods } from '../features/pantry/memoryPantryApi'
import type { Api } from './apiContext'

type MemoryApiOptions = {
  foods?: Parameters<typeof createMemoryPantryApi>[0]
  goal?: { from: ISODate; values: GoalValues }
}

/** Everything in memory: demo mode without Supabase, and tests. */
export function createMemoryApi({ foods = [], goal }: MemoryApiOptions = {}): Api {
  const pantry = createMemoryPantryApi(foods)
  return {
    pantry,
    log: createMemoryLogApi((id) => pantry.getFood(id)),
    goals: createMemoryGoalsApi(goal),
  }
}

/** Demo mode: the sample foods, a goal, and today's breakfast and lunch already logged. */
export function createDemoApi(today: Date = new Date()): Api {
  const pantry = createMemoryPantryApi(demoFoods)
  const log = createMemoryLogApi((id) => pantry.getFood(id))
  const plan: [MealSlot, string, number][] = [
    ['esmorzar', 'Poma', 180],
    ['esmorzar', 'Plàtan', 120],
    ['esmorzar', 'Mel', 20],
    ['dinar', 'Arròs bullit', 200],
    ['dinar', 'Pit de pollastre', 180],
  ]
  for (const [meal, name, grams] of plan) {
    const food = pantry.findFoodByName(name)
    // The in-memory addEntry stores the entry synchronously; nothing to await.
    if (food) void log.addEntry({ eaten_on: toISODate(today), meal, food_id: food.id, grams })
  }
  return {
    pantry,
    log,
    goals: createMemoryGoalsApi({ from: '2026-01-01', values: { kcal: 2100, protein_g: 140, carbs_g: 230, fat_g: 70 } }),
  }
}