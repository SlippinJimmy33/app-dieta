import { describe, expect, it } from 'vitest'
import type { Food, FoodCategory } from '../pantry/types'
import { assignModes, buildPlate, formatDuration, mealTargets, roundPortion, toClock, toMinutes } from './engine'
import type { DayPlan, MealMode } from './types'

const plan = (over: Partial<DayPlan> = {}): DayPlan => ({
  day: '2026-11-08',
  activities: [],
  mealTimes: {},
  modeOverrides: {},
  bedtime: null,
  ...over,
})

const modes = (p: DayPlan | null) => Object.fromEntries(assignModes(p).map((i) => [i.meal, i.mode]))

describe('time helpers', () => {
  it('converts and formats', () => {
    expect(toMinutes('18:30')).toBe(1110)
    expect(toClock(1110)).toBe('18:30')
    expect(toClock(1500)).toBe('01:00')
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(60)).toBe('1 h')
    expect(formatDuration(150)).toBe('2 h 30 min')
  })
})

describe('assignModes', () => {
  it('without a plan: balanced meals, and dinner prepares for sleep', () => {
    expect(modes(null)).toEqual({ esmorzar: 'equilibrat', dinar: 'equilibrat', berenar: 'equilibrat', sopar: 'dormir' })
  })

  it('afternoon gym: snack before, dinner after', () => {
    const p = plan({ activities: [{ kind: 'forca', start: '18:30', minutes: 60 }] })
    const infos = assignModes(p)
    expect(modes(p)).toMatchObject({ berenar: 'pre', sopar: 'post' })
    expect(infos.find((i) => i.meal === 'berenar')!.reason).toBe('Força a les 18:30, d’aquí 1 h.')
    expect(infos.find((i) => i.meal === 'sopar')!.reason).toBe('Força fins a les 19:30: toca recuperar.')
  })

  it('training less than an hour after eating asks for something quick', () => {
    const p = plan({ activities: [{ kind: 'cardio', start: '09:15', minutes: 45 }] })
    expect(modes(p).esmorzar).toBe('preRapid')
    expect(modes(p).dinar).toBe('equilibrat') // ended 10:00, lunch at 14:00 is too late to count as recovery
  })

  it('deep work starting soon, or under way, means focus', () => {
    const p = plan({ activities: [{ kind: 'deepwork', start: '09:00', minutes: 240 }, { kind: 'deepwork', start: '15:00', minutes: 180 }] })
    expect(modes(p)).toMatchObject({ esmorzar: 'focus', dinar: 'focus', berenar: 'focus' })
  })

  it('training beats deep work when both are close', () => {
    const p = plan({
      activities: [
        { kind: 'deepwork', start: '15:00', minutes: 180 },
        { kind: 'esport', start: '17:00', minutes: 90 },
      ],
    })
    expect(modes(p).dinar).toBe('pre')
  })

  it('uses moved meal times and bedtimes after midnight', () => {
    const p = plan({ mealTimes: { sopar: '22:30' }, bedtime: '00:30' })
    const sopar = assignModes(p).find((i) => i.meal === 'sopar')!
    expect(sopar).toMatchObject({ time: '22:30', mode: 'dormir', reason: 'A dormir cap a les 00:30.' })
  })

  it('manual choices win', () => {
    const p = plan({ activities: [{ kind: 'forca', start: '18:30', minutes: 60 }], modeOverrides: { berenar: 'focus' } })
    expect(assignModes(p).find((i) => i.meal === 'berenar')).toMatchObject({ mode: 'focus', manual: true })
  })
})

describe('mealTargets', () => {
  const infos = (m: Partial<Record<string, MealMode>> = {}) =>
    assignModes(plan({ modeOverrides: { esmorzar: 'equilibrat', dinar: 'equilibrat', berenar: 'equilibrat', sopar: 'equilibrat', ...m } }))

  it('splits the whole goal by the usual meal shares', () => {
    expect(mealTargets(infos(), 2000, {})).toEqual({ esmorzar: 500, dinar: 700, berenar: 240, sopar: 560 })
  })

  it('shares what is left among the meals not logged yet', () => {
    const t = mealTargets(infos(), 2000, { esmorzar: 600 })
    expect(t.esmorzar).toBeNull()
    // Each meal is rounded to tens, so the sum can be a few kcal off.
    expect(Math.abs((t.dinar ?? 0) + (t.berenar ?? 0) + (t.sopar ?? 0) - 1400)).toBeLessThanOrEqual(20)
  })

  it('makes a quick pre-workout snack smaller', () => {
    const normal = mealTargets(infos(), 2000, {})
    const quick = mealTargets(infos({ berenar: 'preRapid' }), 2000, {})
    expect(quick.berenar!).toBeLessThan(normal.berenar! * 0.6)
  })

  it('moves a skipped meal’s share to the meals still ahead', () => {
    const t = mealTargets(infos(), 2000, { esmorzar: 500, dinar: 700 }, ['berenar'])
    expect(t.berenar).toBeNull()
    expect(t.sopar).toBe(800)
  })

  it('never goes negative once the goal is reached', () => {
    expect(mealTargets(infos(), 2000, { esmorzar: 2500 }).sopar).toBe(0)
  })
})

// The five test foods, as the app stores them.
const cat = (id: string, name: string): FoodCategory => ({ id, name, user_id: 'u', sort_order: 0, created_at: '' })
const categories = [cat('fruita', 'Fruita'), cat('cereals', 'Cereals'), cat('proteina', 'Proteïna'), cat('dolc', 'Dolç')]
const food = (name: string, category: string, kcal: number, p: number, c: number, f: number, unit?: number): Food =>
  ({
    id: name,
    name,
    category_id: category,
    kcal,
    protein_g: p,
    carbs_g: c,
    fat_g: f,
    fiber_g: null,
    sugar_g: null,
    glycemic_index: null,
    unit_name: unit ? '1 unitat' : null,
    unit_grams: unit ?? null,
    archived_at: null,
  }) as Food
const pantry = [
  food('Poma', 'fruita', 52, 0.3, 14, 0.2, 180),
  food('Plàtan', 'fruita', 89, 1.1, 22.8, 0.3, 120),
  food('Arròs bullit', 'cereals', 130, 2.7, 28, 0.3),
  food('Pit de pollastre', 'proteina', 165, 31, 0, 3.6),
  food('Mel', 'dolc', 304, 0.3, 82, 0),
]
const names = (p: ReturnType<typeof buildPlate>) => p.items.map((i) => i.food.name)

describe('buildPlate', () => {
  it('pre-workout: chicken and rice, no fibre-heavy extras, close to the target', () => {
    const p = buildPlate(pantry, categories, 'pre', 700)
    expect(names(p)).toEqual(['Pit de pollastre', 'Arròs bullit'])
    expect(p.total.kcal).toBeGreaterThan(600)
    expect(p.total.kcal).toBeLessThan(800)
  })

  it('quick pre-workout: only fast carbs, banana over apple, honey capped as a topping', () => {
    const p = buildPlate(pantry, categories, 'preRapid', 250)
    expect(p.items.every((i) => i.role === 'carbs')).toBe(true)
    const honey = p.items.find((i) => i.food.name === 'Mel')
    expect(honey?.grams ?? 0).toBeLessThanOrEqual(40)
    expect(p.items.map((i) => i.tag)).toContain('Energia ràpida')
    expect(p.items.map((i) => i.food.name)).not.toContain('Poma')
  })

  it('keeps each mode close to its macro split when a healthy fat is available', () => {
    const oil = food('Oli d’oliva', 'greixos', 884, 0, 0, 100)
    const p = buildPlate([...pantry, oil], [...categories, cat('greixos', 'Greixos')], 'focus', 600)
    const share = (g: number, kcalPerG: number) => (g * kcalPerG) / p.total.kcal
    expect(share(p.total.carbs, 4)).toBeLessThan(0.42)
    expect(share(p.total.fat, 9)).toBeGreaterThan(0.2)
    expect(p.items.find((i) => i.role === 'fat')?.food.name).toBe('Oli d’oliva')
    expect(Math.abs(p.total.kcal - 600)).toBeLessThan(60)
  })

  it('focus: protein, a slow carb base and a fruit, never honey as the base', () => {
    const p = buildPlate(pantry, categories, 'focus', 600)
    expect(names(p)).toContain('Pit de pollastre')
    expect(names(p)).toContain('Arròs bullit')
    expect(names(p)).not.toContain('Mel')
    expect(p.items.find((i) => i.role === 'complement')?.food.name).toMatch(/Poma|Plàtan/)
  })

  it('rounds foods with a portion to half units', () => {
    const apple = pantry[0]
    expect(roundPortion(apple, 200)).toBe(180)
    expect(roundPortion(apple, 60)).toBe(90)
    expect(roundPortion(pantry[2], 137)).toBe(140)
    expect(roundPortion(pantry[2], 33)).toBe(35)
  })

  it('says what the pantry lacks', () => {
    const fruitOnly = pantry.filter((f) => f.category_id === 'fruita')
    expect(buildPlate(fruitOnly, categories, 'post', 600).missing).toEqual(['proteïna', 'greixos'])
    expect(buildPlate([], categories, 'equilibrat', 600).missing).toEqual(['proteïna', 'carbohidrats', 'greixos'])
    // Pre-workout wants little fat, so no fat hint there.
    expect(buildPlate(pantry, categories, 'pre', 700).missing).toEqual([])
  })

  it('returns an empty plate when there is nothing left to eat', () => {
    expect(buildPlate(pantry, categories, 'equilibrat', 0).items).toEqual([])
  })
})
