import { describe, expect, it } from 'vitest'
import { goalToForm, kcalFromMacros, validateGoalForm } from './goalsForm'

describe('validateGoalForm', () => {
  it('parses comma decimals and rounds to what the database stores', () => {
    expect(validateGoalForm({ kcal: '2100,4', protein: '140', carbs: '230,25', fat: '70' })).toEqual({
      ok: true,
      values: { kcal: 2100, protein_g: 140, carbs_g: 230.3, fat_g: 70 },
    })
  })

  it('rejects out-of-range and missing values', () => {
    const result = validateGoalForm({ kcal: '300', protein: '', carbs: 'molts', fat: '1200' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.kcal).toMatch(/500/)
      expect(result.errors.protein).toBeDefined()
      expect(result.errors.carbs).toMatch(/número/)
      expect(result.errors.fat).toMatch(/1\.000/)
    }
  })

  it('round-trips a saved goal', () => {
    const goal = { id: 'g', user_id: 'u', valid_from: '2026-11-08', created_at: '', kcal: 1900, protein_g: 120.5, carbs_g: 200, fat_g: 65 }
    expect(validateGoalForm(goalToForm(goal))).toEqual({
      ok: true,
      values: { kcal: 1900, protein_g: 120.5, carbs_g: 200, fat_g: 65 },
    })
  })
})

describe('kcalFromMacros', () => {
  it('uses 4/4/9 kcal per gram', () => {
    expect(kcalFromMacros(140, 230, 70)).toBe(2110)
  })
})
