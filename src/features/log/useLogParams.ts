import { useState } from 'react'
import { useSearchParams } from 'react-router'
import type { MealSlot } from '../../lib/database.types'
import { isISODate, type ISODate } from '../../lib/dates'
import { useToday } from '../../lib/useToday'
import { isMealSlot, mealForTime } from './meals'

/** Day (?dia=, default today, never in the future) and meal (?apat=, default by time of day) for logging screens. */
export function useLogParams(): { today: ISODate; day: ISODate; meal: MealSlot } {
  const today = useToday()
  const [params] = useSearchParams()
  const [timeMeal] = useState(() => mealForTime(new Date()))
  const requestedDay = params.get('dia')
  const requestedMeal = params.get('apat')
  return {
    today,
    day: isISODate(requestedDay) && requestedDay <= today ? requestedDay : today,
    meal: isMealSlot(requestedMeal) ? requestedMeal : timeMeal,
  }
}
