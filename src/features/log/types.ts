import type { LogEntryRow, MealSlot, NutritionGoalRow } from '../../lib/database.types'
import type { ISODate } from '../../lib/dates'

export type LogEntry = LogEntryRow
export type NutritionGoal = NutritionGoalRow

export type NewLogEntry = { eaten_on: ISODate; meal: MealSlot; food_id: string; grams: number }
export type LogEntryChanges = { meal: MealSlot; grams: number }

export type GoalValues = { kcal: number; protein_g: number; carbs_g: number; fat_g: number }

/** Name and nutrients of an entry are computed by the server from the food (see the snapshot trigger). */
export type LogApi = {
  listEntries(day: ISODate): Promise<LogEntry[]>
  addEntry(entry: NewLogEntry): Promise<LogEntry>
  updateEntry(id: string, changes: LogEntryChanges): Promise<LogEntry>
  deleteEntry(id: string): Promise<void>
}

export type GoalsApi = {
  /** The goal in force on that day: the latest one set on or before it, or the first goal for earlier days. */
  goalFor(day: ISODate): Promise<NutritionGoal | null>
  /** Sets the goal from that day on; setting it twice on the same day replaces it. */
  saveGoal(from: ISODate, values: GoalValues): Promise<NutritionGoal>
}
