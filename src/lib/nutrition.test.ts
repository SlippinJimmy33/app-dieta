import { describe, expect, it } from 'vitest'
import { scaleNutrients, sumNutrients, withRoundedKcal, zeroNutrients } from './nutrition'

const banana = { kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 }

describe('scaleNutrients', () => {
  it('scales per-100 g values to the portion', () => {
    const r = scaleNutrients(banana, 120)
    expect(r.kcal).toBeCloseTo(106.8)
    expect(r.protein).toBeCloseTo(1.32)
    expect(r.carbs).toBeCloseTo(27.36)
    expect(r.fat).toBeCloseTo(0.36)
  })

  it('returns zeros for invalid or non-positive portions', () => {
    expect(scaleNutrients(banana, 0)).toEqual(zeroNutrients)
    expect(scaleNutrients(banana, -50)).toEqual(zeroNutrients)
    expect(scaleNutrients(banana, Number.NaN)).toEqual(zeroNutrients)
  })
})

describe('withRoundedKcal', () => {
  it('keeps the visible list and the total consistent', () => {
    // 93.6 + 106.8 + 60.8 = 261.2 raw, but the list shows 94 + 107 + 61 = 262
    const entries = [
      scaleNutrients({ kcal: 52, protein: 0, carbs: 0, fat: 0 }, 180),
      scaleNutrients(banana, 120),
      scaleNutrients({ kcal: 304, protein: 0, carbs: 0, fat: 0 }, 20),
    ].map(withRoundedKcal)
    expect(sumNutrients(entries).kcal).toBe(262)
  })
})

describe('sumNutrients', () => {
  it('adds every field', () => {
    const r = sumNutrients([banana, banana])
    expect(r).toEqual({ kcal: 178, protein: 2.2, carbs: 45.6, fat: 0.6 })
  })

  it('returns zeros for an empty list without mutating the shared constant', () => {
    expect(sumNutrients([])).toEqual(zeroNutrients)
    sumNutrients([banana])
    expect(zeroNutrients).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
})
