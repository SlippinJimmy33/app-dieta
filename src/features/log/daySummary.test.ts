import { describe, expect, it } from 'vitest'
import type { MealSlot } from '../../lib/database.types'
import { summarizeDay } from './daySummary'
import { mealForTime } from './meals'
import type { LogEntry } from './types'

let seq = 0
function entry(meal: MealSlot, kcal: number, protein = 0, carbs = 0, fat = 0): LogEntry {
  seq += 1
  return {
    id: `e${seq}`,
    user_id: 'u',
    eaten_on: '2026-11-08',
    meal,
    food_id: 'f',
    food_name: `Aliment ${seq}`,
    grams: 100,
    kcal,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    created_at: `2026-11-08T10:00:${String(seq).padStart(2, '0')}Z`,
    updated_at: '',
  }
}

describe('summarizeDay', () => {
  it('always shows the four main meals, in order, even when empty', () => {
    const day = summarizeDay([])
    expect(day.meals.map((m) => m.slot)).toEqual(['esmorzar', 'dinar', 'berenar', 'sopar'])
    expect(day.total).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })

  it('adds "entre hores" only when it has entries', () => {
    const day = summarizeDay([entry('altres', 150)])
    expect(day.meals.map((m) => m.slot)).toEqual(['esmorzar', 'dinar', 'berenar', 'sopar', 'altres'])
  })

  it('totals match the rounded numbers shown per entry', () => {
    // Shown as 94 + 107 + 61 = 262, while the raw sum is 261.2.
    const day = summarizeDay([entry('esmorzar', 93.6, 0.54), entry('esmorzar', 106.8, 1.32), entry('esmorzar', 60.8, 0.06)])
    expect(day.meals[0].total.kcal).toBe(262)
    expect(day.total.kcal).toBe(262)
    expect(day.total.protein).toBeCloseTo(1.92)
  })

  it('keeps entries in the order they were added', () => {
    const a = entry('dinar', 1)
    const b = entry('dinar', 2)
    const day = summarizeDay([b, a])
    expect(day.meals[1].entries.map((e) => e.id)).toEqual([a.id, b.id])
  })
})

describe('mealForTime', () => {
  const at = (h: number, m = 0) => mealForTime(new Date(2026, 10, 8, h, m))

  it('picks the meal for the time of day', () => {
    expect(at(8)).toBe('esmorzar')
    expect(at(11, 29)).toBe('esmorzar')
    expect(at(11, 30)).toBe('dinar')
    expect(at(15, 59)).toBe('dinar')
    expect(at(17)).toBe('berenar')
    expect(at(19, 30)).toBe('sopar')
    expect(at(23, 59)).toBe('sopar')
    expect(at(2)).toBe('altres')
  })
})
