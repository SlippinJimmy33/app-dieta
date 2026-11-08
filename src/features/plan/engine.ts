import type { MealSlot } from '../../lib/database.types'
import type { Food, FoodCategory } from '../pantry/types'
import {
  activityLabel,
  DEFAULT_BEDTIME,
  defaultMealTimes,
  isPhysical,
  mealShare,
  modeProfiles,
  plannedMeals,
  type ModeProfile,
} from './modes'
import type { ClockTime, DayPlan, MealMode, PlannedMeal } from './types'

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

export function toMinutes(time: ClockTime): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function toClock(minutes: number): ClockTime {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** "45 min", "1 h", "2 h 30 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function isClockTime(value: unknown): value is ClockTime {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export const mealTime = (plan: DayPlan | null, meal: PlannedMeal): ClockTime =>
  plan?.mealTimes[meal] ?? defaultMealTimes[meal]

// ---------------------------------------------------------------------------
// Which mode each meal gets
// ---------------------------------------------------------------------------

export type MealPlanInfo = {
  meal: PlannedMeal
  time: ClockTime
  mode: MealMode
  /** One line saying why, shown to the user. */
  reason: string
  manual: boolean
}

const PRE_RAPID_WINDOW = 60 // physical activity starts in less than an hour
const PRE_WINDOW = 240 // … or within four hours
const POST_WINDOW = 120 // physical activity finished up to two hours before
const FOCUS_LEAD = 120 // deep work starts within two hours (or is under way)
const SLEEP_WINDOW = 180 // bedtime within three hours

/**
 * Derives each meal's mode from the day plan. Priority: about to train > just trained >
 * training later > deep work > going to sleep > balanced. Manual choices always win.
 */
export function assignModes(plan: DayPlan | null): MealPlanInfo[] {
  const activities = [...(plan?.activities ?? [])].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const bedtime = plan?.bedtime ?? DEFAULT_BEDTIME
  // A bedtime after midnight belongs to the same evening.
  const bed = toMinutes(bedtime) < 12 * 60 ? toMinutes(bedtime) + 1440 : toMinutes(bedtime)

  return plannedMeals.map((meal) => {
    const time = mealTime(plan, meal)
    const t = toMinutes(time)
    const info = (mode: MealMode, reason: string, manual = false): MealPlanInfo => ({ meal, time, mode, reason, manual })

    const override = plan?.modeOverrides[meal]
    if (override) return info(override, 'Triat per tu.', true)

    const nextPhysical = activities.find((a) => isPhysical(a.kind) && toMinutes(a.start) > t)
    const gapToNext = nextPhysical ? toMinutes(nextPhysical.start) - t : Infinity
    const justDone = [...activities]
      .reverse()
      .find((a) => isPhysical(a.kind) && t >= toMinutes(a.start) + a.minutes && t - (toMinutes(a.start) + a.minutes) <= POST_WINDOW)
    const deepWork = activities.find(
      (a) =>
        a.kind === 'deepwork' &&
        ((toMinutes(a.start) >= t && toMinutes(a.start) - t <= FOCUS_LEAD) ||
          (toMinutes(a.start) <= t && t < toMinutes(a.start) + a.minutes)),
    )

    if (nextPhysical && gapToNext < PRE_RAPID_WINDOW) {
      return info('preRapid', `${activityLabel(nextPhysical.kind)} a les ${nextPhysical.start}: falta ${formatDuration(gapToNext)}.`)
    }
    if (justDone) {
      const end = toClock(toMinutes(justDone.start) + justDone.minutes)
      return info('post', `${activityLabel(justDone.kind)} fins a les ${end}: toca recuperar.`)
    }
    if (nextPhysical && gapToNext <= PRE_WINDOW) {
      return info('pre', `${activityLabel(nextPhysical.kind)} a les ${nextPhysical.start}, d’aquí ${formatDuration(gapToNext)}.`)
    }
    if (deepWork) {
      const end = toClock(toMinutes(deepWork.start) + deepWork.minutes)
      return toMinutes(deepWork.start) <= t
        ? info('focus', `Deep work fins a les ${end}.`)
        : info('focus', `Deep work de ${deepWork.start} a ${end}.`)
    }
    if (bed - t >= 0 && bed - t <= SLEEP_WINDOW) {
      return info('dormir', `A dormir cap a les ${bedtime}.`)
    }
    return info('equilibrat', 'Cap activitat a prop.')
  })
}

// ---------------------------------------------------------------------------
// How much energy each remaining meal gets
// ---------------------------------------------------------------------------

export const FALLBACK_DAILY_KCAL = 2000

/**
 * Splits what is left of the day's goal across the meals not logged yet, weighted by the usual
 * share of each meal and its mode (a pre-workout snack is small). Logged and skipped meals get null.
 */
export function mealTargets(
  infos: MealPlanInfo[],
  goalKcal: number | null,
  eatenKcal: Partial<Record<MealSlot, number>>,
  /** Meals whose time has long passed with nothing logged: their share goes to the others. */
  skipped: readonly PlannedMeal[] = [],
): Record<PlannedMeal, number | null> {
  const totalEaten = Object.values(eatenKcal).reduce<number>((sum, k) => sum + (k ?? 0), 0)
  const remaining = Math.max((goalKcal ?? FALLBACK_DAILY_KCAL) - totalEaten, 0)
  const open = infos.filter((i) => !(eatenKcal[i.meal] && eatenKcal[i.meal]! > 0) && !skipped.includes(i.meal))
  const weight = (i: MealPlanInfo) => mealShare[i.meal] * modeProfiles[i.mode].size
  const total = open.reduce((sum, i) => sum + weight(i), 0)

  const targets = { esmorzar: null, dinar: null, berenar: null, sopar: null } as Record<PlannedMeal, number | null>
  for (const i of open) targets[i.meal] = total > 0 ? Math.round((remaining * weight(i)) / total / 10) * 10 : 0
  return targets
}

// ---------------------------------------------------------------------------
// The suggested plate
// ---------------------------------------------------------------------------

export type PlateRole = 'protein' | 'carbs' | 'fat' | 'complement'

export type PlateItem = {
  food: Food
  grams: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  role: PlateRole
  tag: string
}

export type Plate = {
  items: PlateItem[]
  target: { kcal: number; protein: number; carbs: number; fat: number }
  total: { kcal: number; protein: number; carbs: number; fat: number }
  /** What the pantry is missing to build a good plate for this mode. */
  missing: ('proteïna' | 'carbohidrats' | 'greixos')[]
}

type Metrics = { food: Food; pS: number; cS: number; fS: number; fastness: number; fiber: number; maxGrams: number }

/** Share of a food's energy from each macro, plus how quickly its carbs hit (0–1) and fibre per 100 g. */
function metrics(food: Food, category: string | undefined): Metrics {
  const energy = Math.max(food.kcal, food.protein_g * 4 + food.carbs_g * 4 + food.fat_g * 9, 1)
  const sweet = category === 'Dolç'
  const fruit = category === 'Fruita'
  // Best evidence first: glycemic index, then sugar share, then what kind of food it is.
  const fastness =
    food.glycemic_index !== null
      ? food.glycemic_index / 100
      : food.sugar_g !== null && food.carbs_g > 0
        ? food.sugar_g / food.carbs_g
        : sweet
          ? 0.9
          : fruit
            ? 0.75
            : category === 'Begudes'
              ? 0.6
              : 0.35
  const fiber = food.fiber_g ?? (fruit || category === 'Verdura' ? 2.5 : 0.5)
  return {
    food,
    pS: Math.min((food.protein_g * 4) / energy, 1),
    cS: Math.min((food.carbs_g * 4) / energy, 1),
    fS: Math.min((food.fat_g * 9) / energy, 1),
    fastness: Math.min(Math.max(fastness, 0), 1),
    fiber,
    // Sugary foods are a topping, never the base of a plate.
    maxGrams: fastness >= 0.85 ? 40 : 400,
  }
}

function carbScore(m: Metrics, p: ModeProfile['prefer']): number {
  const speed = p.fastCarbs ? m.fastness * 0.6 : -m.fastness * (p.lowGlycemic ? 0.8 : 0.4)
  // Right before training, denser carbs mean less in the stomach (banana over apple).
  const density = p.fastCarbs ? Math.min(m.food.kcal / 300, 0.3) : 0
  return m.cS + speed + density - (p.lowFiber ? Math.min(m.fiber / 10, 0.5) : 0) - (p.lowFat ? m.fS : 0)
}

function proteinScore(m: Metrics, p: ModeProfile['prefer']): number {
  return m.pS * 2 - (p.lowFat ? m.fS : m.fS * 0.3)
}

function complementScore(m: Metrics, p: ModeProfile['prefer']): number {
  return (p.lowGlycemic ? 1 - m.fastness : 0.5) + m.fiber / 10 - m.food.kcal / 300
}

/** Grams that read well: whole or half portions when the food has one, otherwise round numbers. */
export function roundPortion(food: Food, grams: number): number {
  if (food.unit_grams) {
    const units = Math.max(0.5, Math.round((grams / food.unit_grams) * 2) / 2)
    return Math.round(units * food.unit_grams * 10) / 10
  }
  const step = grams < 100 ? 5 : 10
  return Math.max(5, Math.round(grams / step) * step)
}

function item(food: Food, grams: number, role: PlateRole, tag: string): PlateItem {
  const f = grams / 100
  return {
    food,
    grams,
    kcal: food.kcal * f,
    protein: food.protein_g * f,
    carbs: food.carbs_g * f,
    fat: food.fat_g * f,
    role,
    tag,
  }
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

/** Builds a plate from the pantry that fits the meal's energy and the mode's macro split. */
export function buildPlate(foods: Food[], categories: FoodCategory[], mode: MealMode, targetKcal: number): Plate {
  const profile = modeProfiles[mode]
  const prefer = profile.prefer
  const target = {
    kcal: targetKcal,
    carbs: (targetKcal * profile.split.carbs) / 4,
    protein: (targetKcal * profile.split.protein) / 4,
    fat: (targetKcal * profile.split.fat) / 9,
  }
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))
  const all = foods
    .filter((f) => f.kcal > 0 && !f.archived_at)
    .map((f) => metrics(f, f.category_id ? categoryName.get(f.category_id) : undefined))

  const best = (list: Metrics[], score: (m: Metrics) => number) =>
    [...list].sort((a, b) => score(b) - score(a))[0] as Metrics | undefined

  const carbCandidates = all.filter((m) => m.cS >= 0.55 && m.food.carbs_g >= 10)
  const proteinCandidates = all.filter((m) => m.pS >= 0.35 && m.food.protein_g >= 8)
  const carbTag = prefer.fastCarbs ? 'Energia ràpida' : prefer.lowGlycemic ? 'Energia estable' : 'Energia'

  const items: PlateItem[] = []
  const missing: Plate['missing'] = []
  const sum = () =>
    items.reduce(
      (t, i) => ({ kcal: t.kcal + i.kcal, protein: t.protein + i.protein, carbs: t.carbs + i.carbs, fat: t.fat + i.fat }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    )

  if (targetKcal <= 0) return { items, target, total: sum(), missing }

  if (mode === 'preRapid') {
    // Just fast carbs: the best one, topped up with a second if the first is capped (e.g. honey).
    const ranked = [...carbCandidates].sort((a, b) => carbScore(b, prefer) - carbScore(a, prefer))
    for (const m of ranked.slice(0, 2)) {
      const gap = targetKcal - sum().kcal
      if (gap < 40) break
      const grams = roundPortion(m.food, clamp((gap / m.food.kcal) * 100, 10, m.maxGrams))
      items.push(item(m.food, grams, 'carbs', carbTag))
    }
    if (items.length === 0) missing.push('carbohidrats')
    return { items, target, total: sum(), missing }
  }

  const proteinSource = best(proteinCandidates, (m) => proteinScore(m, prefer))
  const carbSource = best(
    carbCandidates.filter((m) => m !== proteinSource),
    (m) => carbScore(m, prefer),
  )
  const complement =
    prefer.lowFiber
      ? undefined
      : best(
          all.filter((m) => m !== proteinSource && m !== carbSource && m.food.kcal <= 90 && m.cS >= 0.5),
          (m) => complementScore(m, prefer),
        )

  if (proteinSource) {
    // Most of the protein from the protein source; the rest comes along with the other foods.
    const grams = clamp(((target.protein * 0.85) / proteinSource.food.protein_g) * 100, 40, 300)
    items.push(item(proteinSource.food, roundPortion(proteinSource.food, grams), 'protein', 'Proteïna'))
  } else {
    missing.push('proteïna')
  }

  if (complement) {
    const portion = complement.food.unit_grams ?? 120
    const grams = Math.min(portion, ((targetKcal * 0.2) / complement.food.kcal) * 100)
    if (grams >= 30) {
      items.push(item(complement.food, roundPortion(complement.food, grams), 'complement', prefer.lowGlycemic ? 'Fibra' : 'Complement'))
    }
  }

  if (carbSource) {
    // The energy source fills the remaining calories, but never past the mode's carbohydrate share.
    const gap = targetKcal - sum().kcal
    const carbsLeft = target.carbs - sum().carbs
    const grams = Math.min((gap / carbSource.food.kcal) * 100, (carbsLeft / carbSource.food.carbs_g) * 100)
    if (gap > 30 && grams >= 20) {
      items.splice(1, 0, item(carbSource.food, roundPortion(carbSource.food, Math.min(grams, carbSource.maxGrams)), 'carbs', carbTag))
    }
  } else {
    missing.push('carbohidrats')
  }

  // A healthy fat (oil, nuts, avocado…) when the mode wants fat and the pantry has one.
  const fatSource = prefer.lowFat
    ? undefined
    : best(
        all.filter((m) => m.fS >= 0.6 && m.food.fat_g >= 10 && !items.some((i) => i.food === m.food)),
        (m) => m.fS - m.fastness,
      )
  const fatLeft = target.fat - sum().fat
  if (fatSource && fatLeft > 4) {
    const grams = Math.min((fatLeft / fatSource.food.fat_g) * 100, ((targetKcal * 0.25) / fatSource.food.kcal) * 100)
    if (grams >= 5) items.push(item(fatSource.food, roundPortion(fatSource.food, grams), 'fat', 'Greix saludable'))
  } else if (!prefer.lowFat && fatLeft > 10) {
    missing.push('greixos')
  }

  // Still short (no fat source, carbs capped): a bigger protein portion closes the gap.
  const protein = items.find((i) => i.role === 'protein')
  const shortBy = targetKcal - sum().kcal
  if (protein && shortBy > 60) {
    const grams = Math.min(protein.grams + (shortBy / protein.food.kcal) * 100, 300)
    items[items.indexOf(protein)] = item(protein.food, roundPortion(protein.food, grams), 'protein', 'Proteïna')
  }

  return { items, target, total: sum(), missing }
}

/** Mode and reason for a meal that is not part of the plan ("entre hores"). */
export function isPlannedMeal(slot: MealSlot): slot is PlannedMeal {
  return slot !== 'altres'
}
