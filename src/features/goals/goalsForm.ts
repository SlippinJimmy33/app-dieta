import { parseDecimal } from '../pantry/foodForm'
import type { GoalValues, NutritionGoal } from '../log/types'

export type GoalFormValues = { kcal: string; protein: string; carbs: string; fat: string }
export type GoalFormErrors = Partial<Record<keyof GoalFormValues, string>>
export type GoalFormResult = { ok: true; values: GoalValues } | { ok: false; errors: GoalFormErrors }

export const emptyGoalForm: GoalFormValues = { kcal: '', protein: '', carbs: '', fat: '' }

const text = (n: number) => String(n).replace('.', ',')

export function goalToForm(goal: NutritionGoal | null): GoalFormValues {
  if (!goal) return emptyGoalForm
  return { kcal: text(goal.kcal), protein: text(goal.protein_g), carbs: text(goal.carbs_g), fat: text(goal.fat_g) }
}

/** Mirrors the nutrition_goals checks: kcal 500–10000 (whole), macros 0–1000 g (one decimal). */
export function validateGoalForm(values: GoalFormValues): GoalFormResult {
  const errors: GoalFormErrors = {}

  const kcal = parseDecimal(values.kcal)
  if (values.kcal.trim() === '') errors.kcal = 'Escriu les calories diàries.'
  else if (kcal === null) errors.kcal = 'Ha de ser un número.'
  else if (kcal < 500 || kcal > 10000) errors.kcal = 'Entre 500 i 10.000 kcal.'

  function grams(key: 'protein' | 'carbs' | 'fat', label: string) {
    const n = parseDecimal(values[key])
    if (values[key].trim() === '') errors[key] = `Escriu ${label}.`
    else if (n === null) errors[key] = 'Ha de ser un número (pots fer servir coma).'
    else if (n > 1000) errors[key] = 'Com a màxim 1.000 g.'
    return n === null ? 0 : Math.round(n * 10) / 10
  }

  const protein_g = grams('protein', 'la proteïna')
  const carbs_g = grams('carbs', 'els carbohidrats')
  const fat_g = grams('fat', 'els greixos')

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, values: { kcal: Math.round(kcal ?? 0), protein_g, carbs_g, fat_g } }
}

/** Calories implied by the macro goals (4/4/9 kcal per g), to compare with the calorie goal. */
export function kcalFromMacros(protein: number, carbs: number, fat: number): number {
  return Math.round(protein * 4 + carbs * 4 + fat * 9)
}
