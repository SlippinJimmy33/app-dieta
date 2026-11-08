import type { MealSlot } from '../../lib/database.types'
import { sumNutrients, withRoundedKcal, type Nutrients } from '../../lib/nutrition'
import { mainMeals, meals } from './meals'
import type { LogEntry } from './types'

export type MealGroup = { slot: MealSlot; entries: LogEntry[]; total: Nutrients }
export type DaySummary = { total: Nutrients; meals: MealGroup[] }

export function entryNutrients(entry: LogEntry): Nutrients {
  return withRoundedKcal({ kcal: entry.kcal, protein: entry.protein_g, carbs: entry.carbs_g, fat: entry.fat_g })
}

/**
 * Groups a day's entries by meal in the usual order. Main meals are always present (empty ones
 * show an "add" row); "Entre hores" only when it has entries.
 */
export function summarizeDay(entries: readonly LogEntry[]): DaySummary {
  const groups = meals
    .map(({ slot }) => {
      const mealEntries = entries
        .filter((e) => e.meal === slot)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
      return { slot, entries: mealEntries, total: sumNutrients(mealEntries.map(entryNutrients)) }
    })
    .filter((g) => mainMeals.includes(g.slot) || g.entries.length > 0)

  return { total: sumNutrients(groups.map((g) => g.total)), meals: groups }
}
