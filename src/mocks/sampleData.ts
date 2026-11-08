// Sample content for the design phase only. Replaced by the user's real data once the database exists (F1, step 2+).
import type { IllustratedFood } from '../components/food/illustrations'
import type { Nutrients } from '../lib/nutrition'

export type SampleFood = {
  kind: IllustratedFood
  name: string
  category: string
  per100g: Nutrients
}

export const sampleFoods: SampleFood[] = [
  { kind: 'poma', name: 'Poma', category: 'Fruita', per100g: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 } },
  { kind: 'platan', name: 'Plàtan', category: 'Fruita', per100g: { kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 } },
  { kind: 'arros', name: 'Arròs bullit', category: 'Cereals', per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 } },
  { kind: 'pollastre', name: 'Pit de pollastre', category: 'Proteïna', per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 } },
  { kind: 'mel', name: 'Mel', category: 'Dolç', per100g: { kcal: 304, protein: 0.3, carbs: 82, fat: 0 } },
]

export const sampleGoals: Nutrients = { kcal: 2100, protein: 140, carbs: 230, fat: 70 }

export const sampleMeals: { title: string; items: { kind: IllustratedFood; grams: number }[] }[] = [
  {
    title: 'Esmorzar',
    items: [
      { kind: 'poma', grams: 180 },
      { kind: 'platan', grams: 120 },
      { kind: 'mel', grams: 20 },
    ],
  },
  {
    title: 'Dinar',
    items: [
      { kind: 'arros', grams: 200 },
      { kind: 'pollastre', grams: 180 },
    ],
  },
]
