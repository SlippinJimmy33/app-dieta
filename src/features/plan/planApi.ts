import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, DayPlanRow } from '../../lib/database.types'
import { isClockTime } from './engine'
import { activityKinds, modeOrder, plannedMeals } from './modes'
import type { Activity, DayPlan, MealMode, PlanApi, PlannedMeal } from './types'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * The JSON columns are only shape-checked by the database, so read them defensively:
 * anything unexpected is dropped instead of breaking the day view.
 */
export function planFromRow(row: Pick<DayPlanRow, 'day' | 'activities' | 'meal_times' | 'mode_overrides' | 'bedtime'>): DayPlan {
  const activities = (Array.isArray(row.activities) ? row.activities : []).filter(
    (a): a is Activity =>
      isRecord(a) &&
      activityKinds.some((k) => k.kind === a.kind) &&
      isClockTime(a.start) &&
      typeof a.minutes === 'number' &&
      a.minutes >= 15 &&
      a.minutes <= 600,
  )
  const mealTimes: DayPlan['mealTimes'] = {}
  const modeOverrides: DayPlan['modeOverrides'] = {}
  for (const meal of plannedMeals) {
    const time = isRecord(row.meal_times) ? row.meal_times[meal] : undefined
    if (isClockTime(time)) mealTimes[meal] = time
    const mode = isRecord(row.mode_overrides) ? row.mode_overrides[meal] : undefined
    if (modeOrder.includes(mode as MealMode)) modeOverrides[meal as PlannedMeal] = mode as MealMode
  }
  // Postgres returns time as "23:30:00".
  const bedtime = row.bedtime ? row.bedtime.slice(0, 5) : null
  return { day: row.day, activities, mealTimes, modeOverrides, bedtime: isClockTime(bedtime) ? bedtime : null }
}

export function createSupabasePlanApi(client: SupabaseClient<Database>): PlanApi {
  return {
    async planFor(day) {
      const { data, error } = await client.from('day_plans').select('*').eq('day', day).maybeSingle()
      if (error) throw error
      return data ? planFromRow(data) : null
    },

    async savePlan(plan) {
      const { data, error } = await client
        .from('day_plans')
        .upsert(
          {
            day: plan.day,
            activities: plan.activities,
            meal_times: plan.mealTimes,
            mode_overrides: plan.modeOverrides,
            bedtime: plan.bedtime,
          },
          { onConflict: 'user_id,day' },
        )
        .select()
        .single()
      if (error) throw error
      return planFromRow(data)
    },
  }
}

export function createMemoryPlanApi(): PlanApi {
  const plans = new Map<string, DayPlan>()
  return {
    async planFor(day) {
      return plans.get(day) ?? null
    },
    async savePlan(plan) {
      // Round-trip through the same reader the database path uses.
      const saved = planFromRow({
        day: plan.day,
        activities: plan.activities,
        meal_times: plan.mealTimes,
        mode_overrides: plan.modeOverrides,
        bedtime: plan.bedtime ? `${plan.bedtime}:00` : null,
      })
      plans.set(plan.day, saved)
      return saved
    },
  }
}
