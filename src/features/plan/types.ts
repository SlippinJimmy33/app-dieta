import type { MealSlot } from '../../lib/database.types'
import type { ISODate } from '../../lib/dates'

export type ActivityKind = 'deepwork' | 'forca' | 'cardio' | 'esport'

/** "HH:MM", 24 h. */
export type ClockTime = string

export type Activity = { kind: ActivityKind; start: ClockTime; minutes: number }

/** What a meal should prepare you for. */
export type MealMode = 'preRapid' | 'pre' | 'post' | 'focus' | 'dormir' | 'equilibrat'

export type PlannedMeal = Exclude<MealSlot, 'altres'>

export type DayPlan = {
  day: ISODate
  activities: Activity[]
  /** Only meals moved from their default time. */
  mealTimes: Partial<Record<PlannedMeal, ClockTime>>
  modeOverrides: Partial<Record<PlannedMeal, MealMode>>
  bedtime: ClockTime | null
}

export type PlanApi = {
  planFor(day: ISODate): Promise<DayPlan | null>
  savePlan(plan: DayPlan): Promise<DayPlan>
}
