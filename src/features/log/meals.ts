import type { MealSlot } from '../../lib/database.types'

type MealInfo = {
  slot: MealSlot
  label: string
  /** Completes "Afegir …": "a l’esmorzar", "al dinar"… */
  target: string
}

export const meals: readonly MealInfo[] = [
  { slot: 'esmorzar', label: 'Esmorzar', target: 'a l’esmorzar' },
  { slot: 'dinar', label: 'Dinar', target: 'al dinar' },
  { slot: 'berenar', label: 'Berenar', target: 'al berenar' },
  { slot: 'sopar', label: 'Sopar', target: 'al sopar' },
  { slot: 'altres', label: 'Entre hores', target: 'entre hores' },
]

/** Always shown on the day view; "Entre hores" only appears once it has something. */
export const mainMeals: readonly MealSlot[] = ['esmorzar', 'dinar', 'berenar', 'sopar']

export function mealInfo(slot: MealSlot): MealInfo {
  return meals.find((m) => m.slot === slot) ?? meals[meals.length - 1]
}

export function isMealSlot(value: string | null | undefined): value is MealSlot {
  return meals.some((m) => m.slot === value)
}

/** The meal someone is most likely logging at this time of day. */
export function mealForTime(date: Date): MealSlot {
  const minutes = date.getHours() * 60 + date.getMinutes()
  if (minutes < 5 * 60) return 'altres' // late-night snack
  if (minutes < 11 * 60 + 30) return 'esmorzar'
  if (minutes < 16 * 60) return 'dinar'
  if (minutes < 19 * 60 + 30) return 'berenar'
  return 'sopar'
}
