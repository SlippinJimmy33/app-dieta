import type { ActivityKind, MealMode, PlannedMeal } from './types'

export const activityKinds: { kind: ActivityKind; label: string; physical: boolean }[] = [
  { kind: 'deepwork', label: 'Deep work', physical: false },
  { kind: 'forca', label: 'Força', physical: true },
  { kind: 'cardio', label: 'Cardio', physical: true },
  { kind: 'esport', label: 'Esport', physical: true },
]

export const activityLabel = (kind: ActivityKind) => activityKinds.find((a) => a.kind === kind)?.label ?? kind
export const isPhysical = (kind: ActivityKind) => activityKinds.find((a) => a.kind === kind)?.physical ?? false

/** Share of the day's energy (kcal) as carbohydrate, protein and fat. */
export type MacroSplit = { carbs: number; protein: number; fat: number }

export type ModeProfile = {
  mode: MealMode
  label: string
  split: MacroSplit
  /** Portion size relative to a normal meal of that time of day. */
  size: number
  /** What the plate builder should favour or avoid. */
  prefer: { lowFat?: boolean; lowFiber?: boolean; lowGlycemic?: boolean; fastCarbs?: boolean }
  /** Short summary of the idea behind the mode. */
  idea: string
}

export const modeProfiles: Record<MealMode, ModeProfile> = {
  preRapid: {
    mode: 'preRapid',
    label: 'Pre-entrenament ràpid',
    split: { carbs: 0.8, protein: 0.12, fat: 0.08 },
    size: 0.45,
    prefer: { fastCarbs: true, lowFat: true, lowFiber: true },
    idea: 'Una cosa petita i ràpida de pair: carbohidrats que arribin a temps.',
  },
  pre: {
    mode: 'pre',
    label: 'Pre-entrenament',
    split: { carbs: 0.55, protein: 0.27, fat: 0.18 },
    size: 1,
    prefer: { lowFat: true, lowFiber: true },
    idea: 'Carbohidrats per rendir, proteïna, i poc greix i fibra perquè es pairà bé.',
  },
  post: {
    mode: 'post',
    label: 'Recuperació',
    split: { carbs: 0.45, protein: 0.35, fat: 0.2 },
    size: 1.1,
    prefer: {},
    idea: 'Proteïna per reparar el múscul i carbohidrats per reomplir l’energia.',
  },
  focus: {
    mode: 'focus',
    label: 'Focus',
    split: { carbs: 0.35, protein: 0.35, fat: 0.3 },
    size: 0.9,
    prefer: { lowGlycemic: true },
    idea: 'Energia estable sense pics de glucosa, i una ració que no et deixi endormiscat.',
  },
  dormir: {
    mode: 'dormir',
    label: 'Dormir',
    split: { carbs: 0.3, protein: 0.4, fat: 0.3 },
    size: 0.85,
    prefer: { lowGlycemic: true },
    idea: 'Lleuger i sense sucres ràpids, perquè el cos descansi.',
  },
  equilibrat: {
    mode: 'equilibrat',
    label: 'Equilibrat',
    split: { carbs: 0.45, protein: 0.3, fat: 0.25 },
    size: 1,
    prefer: {},
    idea: 'Un plat equilibrat segons el que et queda per arribar a l’objectiu.',
  },
}

export const modeOrder: MealMode[] = ['equilibrat', 'focus', 'pre', 'preRapid', 'post', 'dormir']

export const plannedMeals: PlannedMeal[] = ['esmorzar', 'dinar', 'berenar', 'sopar']

export const defaultMealTimes: Record<PlannedMeal, string> = {
  esmorzar: '08:30',
  dinar: '14:00',
  berenar: '17:30',
  sopar: '21:00',
}

/** How a normal day's energy is spread across meals. */
export const mealShare: Record<PlannedMeal, number> = { esmorzar: 0.25, dinar: 0.35, berenar: 0.12, sopar: 0.28 }

export const DEFAULT_BEDTIME = '23:30'
