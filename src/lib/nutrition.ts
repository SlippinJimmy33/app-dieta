export type Nutrients = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export const zeroNutrients: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

/** Values are stored per 100 g; this returns them for an actual portion. */
export function scaleNutrients(per100g: Nutrients, grams: number): Nutrients {
  const factor = Number.isFinite(grams) && grams > 0 ? grams / 100 : 0
  return {
    kcal: per100g.kcal * factor,
    protein: per100g.protein * factor,
    carbs: per100g.carbs * factor,
    fat: per100g.fat * factor,
  }
}

/**
 * Each logged entry shows whole kcal, so round per entry before summing:
 * the day total then always equals the numbers the user sees in the list.
 */
export function withRoundedKcal(n: Nutrients): Nutrients {
  return { ...n, kcal: Math.round(n.kcal) }
}

export function sumNutrients(items: readonly Nutrients[]): Nutrients {
  return items.reduce<Nutrients>(
    (acc, n) => ({
      kcal: acc.kcal + n.kcal,
      protein: acc.protein + n.protein,
      carbs: acc.carbs + n.carbs,
      fat: acc.fat + n.fat,
    }),
    zeroNutrients,
  )
}
