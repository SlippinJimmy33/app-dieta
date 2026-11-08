import { describe, expect, it } from 'vitest'
import { emptyFoodForm, energyLooksOff, foodToForm, parseDecimal, validateFoodForm, type FoodFormValues } from './foodForm'
import type { Food } from './types'

const banana: FoodFormValues = {
  ...emptyFoodForm,
  name: '  Plàtan ',
  kcal: '89',
  protein: '1,1',
  carbs: '22.8',
  fat: '0,3',
}

describe('parseDecimal', () => {
  it('accepts comma and dot decimals', () => {
    expect(parseDecimal('1,5')).toBe(1.5)
    expect(parseDecimal(' 22.8 ')).toBe(22.8)
    expect(parseDecimal('0')).toBe(0)
    expect(parseDecimal(',5')).toBe(0.5)
  })

  it('rejects anything that is not a plain non-negative number', () => {
    for (const bad of ['', 'abc', '-3', '1,2,3', '1e3', '1.', ' ', 'Infinity']) {
      expect(parseDecimal(bad), bad).toBeNull()
    }
  })
})

describe('validateFoodForm', () => {
  it('returns a clean, trimmed input for valid values', () => {
    const result = validateFoodForm(banana)
    expect(result).toEqual({
      ok: true,
      input: {
        name: 'Plàtan',
        category_id: null,
        kcal: 89,
        protein_g: 1.1,
        carbs_g: 22.8,
        fat_g: 0.3,
        unit_name: null,
        unit_grams: null,
      },
    })
  })

  it('requires every nutrient and the name', () => {
    const result = validateFoodForm(emptyFoodForm)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['carbs', 'fat', 'kcal', 'name', 'protein'])
  })

  it('rejects values the database would reject', () => {
    const tooMuch = validateFoodForm({ ...banana, kcal: '901', protein: '101' })
    expect(tooMuch.ok).toBe(false)
    if (!tooMuch.ok) {
      expect(tooMuch.errors.kcal).toMatch(/900/)
      expect(tooMuch.errors.protein).toMatch(/100/)
    }

    const sum = validateFoodForm({ ...banana, protein: '60', carbs: '30', fat: '20' })
    expect(sum.ok).toBe(false)
    if (!sum.ok) expect(sum.errors.macros).toBeDefined()

    const longName = validateFoodForm({ ...banana, name: 'x'.repeat(81) })
    expect(longName.ok).toBe(false)
  })

  it('rounds to the stored precision before checking', () => {
    // 33.334 * 3 = 100.002 but stored values are 33.33 each, which the database accepts.
    const result = validateFoodForm({ ...banana, protein: '33,334', carbs: '33,334', fat: '33,334' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.input.protein_g).toBe(33.33)
  })

  it('needs both name and grams when a portion is enabled', () => {
    const missing = validateFoodForm({ ...banana, hasUnit: true })
    expect(missing.ok).toBe(false)
    if (!missing.ok) {
      expect(missing.errors.unitName).toBeDefined()
      expect(missing.errors.unitGrams).toBeDefined()
    }

    const zero = validateFoodForm({ ...banana, hasUnit: true, unitName: '1 unitat', unitGrams: '0,01' })
    expect(zero.ok).toBe(false)

    const ok = validateFoodForm({ ...banana, hasUnit: true, unitName: ' 1 unitat ', unitGrams: '120' })
    expect(ok.ok && ok.input.unit_name === '1 unitat' && ok.input.unit_grams === 120).toBe(true)
  })

  it('ignores portion fields when the portion is turned off', () => {
    const result = validateFoodForm({ ...banana, hasUnit: false, unitName: 'restes', unitGrams: 'x' })
    expect(result.ok && result.input.unit_name === null && result.input.unit_grams === null).toBe(true)
  })
})

describe('foodToForm', () => {
  it('round-trips through validation unchanged', () => {
    const food = {
      id: '1',
      name: 'Mel',
      category_id: 'c',
      kcal: 304,
      protein_g: 0.3,
      carbs_g: 82,
      fat_g: 0,
      unit_name: '1 cullerada',
      unit_grams: 21,
    } as Food
    const result = validateFoodForm(foodToForm(food))
    expect(result).toEqual({
      ok: true,
      input: {
        name: 'Mel',
        category_id: 'c',
        kcal: 304,
        protein_g: 0.3,
        carbs_g: 82,
        fat_g: 0,
        unit_name: '1 cullerada',
        unit_grams: 21,
      },
    })
  })
})

describe('energyLooksOff', () => {
  it('accepts real labels', () => {
    expect(energyLooksOff(89, 1.1, 22.8, 0.3)).toBe(false) // banana
    expect(energyLooksOff(165, 31, 0, 3.6)).toBe(false) // chicken breast
    expect(energyLooksOff(52, 0.3, 14, 0.2)).toBe(false) // apple (fibre gap)
  })

  it('flags obvious typos', () => {
    expect(energyLooksOff(890, 1.1, 22.8, 0.3)).toBe(true)
    expect(energyLooksOff(16, 31, 0, 3.6)).toBe(true)
  })
})
