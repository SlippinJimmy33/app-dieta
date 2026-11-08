import { formatGrams } from '../../lib/format'
import { parseDecimal } from '../pantry/foodForm'

export const MAX_GRAMS = 5000
const HALF = 0.5

export type PortionUnit = { name: string; grams: number }
export type PortionMode = 'unit' | 'grams'

/** Rounds to the 0.1 g the database keeps. */
export const roundGrams = (g: number) => Math.round(g * 10) / 10

/** Half units, never below half a unit. */
export function stepUnits(units: number, delta: number): number {
  const snapped = Math.round(units / HALF) * HALF
  return Math.max(HALF, snapped + delta * HALF)
}

/** Grams in steps of 10 that land on round numbers (123 → 130, not 133), never below 5 g. */
export function stepGrams(grams: number, delta: 1 | -1): number {
  const next = delta > 0 ? Math.floor(grams / 10) * 10 + 10 : Math.ceil(grams / 10) * 10 - 10
  return Math.min(MAX_GRAMS, Math.max(5, next))
}

/** Unit mode only when the amount is a whole number of half units. */
export function initialMode(grams: number, unit: PortionUnit | null): PortionMode {
  if (!unit) return 'grams'
  const halves = grams / unit.grams / HALF
  return Math.abs(halves - Math.round(halves)) < 1e-6 ? 'unit' : 'grams'
}

/** "1", "1,5", "2". */
export function formatUnits(units: number): string {
  return formatGrams(units)
}

/** Typed grams → a valid amount, or null (empty, malformed, zero or too much). */
export function parseGrams(text: string): number | null {
  const n = parseDecimal(text)
  if (n === null) return null
  const g = roundGrams(n)
  return g > 0 && g <= MAX_GRAMS ? g : null
}
