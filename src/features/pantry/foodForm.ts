import type { Food, FoodInput } from './types'

/** Raw text of every field, exactly as typed. */
export type FoodFormValues = {
  name: string
  categoryId: string | null
  kcal: string
  protein: string
  carbs: string
  fat: string
  hasUnit: boolean
  unitName: string
  unitGrams: string
}

export type FoodFormField = 'name' | 'kcal' | 'protein' | 'carbs' | 'fat' | 'macros' | 'unitName' | 'unitGrams'
export type FoodFormErrors = Partial<Record<FoodFormField, string>>

export type FoodFormResult = { ok: true; input: FoodInput } | { ok: false; errors: FoodFormErrors }

export const emptyFoodForm: FoodFormValues = {
  name: '',
  categoryId: null,
  kcal: '',
  protein: '',
  carbs: '',
  fat: '',
  hasUnit: false,
  unitName: '',
  unitGrams: '',
}

const decimalText = (n: number) => String(n).replace('.', ',')

export function foodToForm(food: Food): FoodFormValues {
  return {
    name: food.name,
    categoryId: food.category_id,
    kcal: decimalText(food.kcal),
    protein: decimalText(food.protein_g),
    carbs: decimalText(food.carbs_g),
    fat: decimalText(food.fat_g),
    hasUnit: food.unit_name !== null,
    unitName: food.unit_name ?? '',
    unitGrams: food.unit_grams === null ? '' : decimalText(food.unit_grams),
  }
}

/** Accepts "1,5" and "1.5". Returns null for empty or malformed text (never NaN). */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(normalized)) return null
  return Number(normalized)
}

/** Rounds to the precision the database stores, so what is saved equals what was validated. */
const round = (n: number, decimals: number) => Math.round(n * 10 ** decimals) / 10 ** decimals

/** Mirrors the database checks so the user sees problems before saving. */
export function validateFoodForm(values: FoodFormValues): FoodFormResult {
  const errors: FoodFormErrors = {}

  const name = values.name.trim()
  if (name === '') errors.name = 'Posa-li un nom.'
  else if (name.length > 80) errors.name = 'Màxim 80 caràcters.'

  function amount(field: FoodFormField, text: string, max: number, decimals: number, label: string) {
    if (text.trim() === '') {
      errors[field] = `Escriu ${label}.`
      return 0
    }
    const n = parseDecimal(text)
    if (n === null) {
      errors[field] = 'Ha de ser un número (pots fer servir coma).'
      return 0
    }
    if (n > max) {
      errors[field] = `Com a màxim ${max} per cada 100 g.`
      return 0
    }
    return round(n, decimals)
  }

  const kcal = amount('kcal', values.kcal, 900, 1, 'les calories')
  const protein = amount('protein', values.protein, 100, 2, 'la proteïna')
  const carbs = amount('carbs', values.carbs, 100, 2, 'els carbohidrats')
  const fat = amount('fat', values.fat, 100, 2, 'els greixos')

  if (!errors.protein && !errors.carbs && !errors.fat && protein + carbs + fat > 100) {
    errors.macros = 'Proteïna, carbohidrats i greixos no poden sumar més de 100 g per cada 100 g.'
  }

  let unitName: string | null = null
  let unitGrams: number | null = null
  if (values.hasUnit) {
    unitName = values.unitName.trim()
    if (unitName === '') errors.unitName = 'Posa nom a la ració (p. ex. “1 unitat”).'
    else if (unitName.length > 30) errors.unitName = 'Màxim 30 caràcters.'

    const grams = parseDecimal(values.unitGrams)
    if (values.unitGrams.trim() === '') errors.unitGrams = 'Quants grams fa la ració?'
    else if (grams === null) errors.unitGrams = 'Ha de ser un número (pots fer servir coma).'
    else if (grams <= 0 || grams > 10000) errors.unitGrams = 'Entre 0 i 10.000 g.'
    else unitGrams = round(grams, 1)
    if (unitGrams === 0) errors.unitGrams = 'Entre 0 i 10.000 g.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    input: {
      name,
      category_id: values.categoryId,
      kcal,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      unit_name: unitName,
      unit_grams: unitGrams,
    },
  }
}

/**
 * Soft check, never blocks saving: calories from macros (4/4/9 kcal per g) far from the label
 * usually means a typo. Fibre and alcohol explain small gaps, so only big ones are flagged.
 */
export function energyLooksOff(kcal: number, protein: number, carbs: number, fat: number): boolean {
  const estimated = protein * 4 + carbs * 4 + fat * 9
  const gap = Math.abs(kcal - estimated)
  return gap > 40 && gap > estimated * 0.25
}
