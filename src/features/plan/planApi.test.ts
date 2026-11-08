import { describe, expect, it } from 'vitest'
import { createMemoryPlanApi, planFromRow } from './planApi'

describe('planFromRow', () => {
  it('reads a well-formed row and trims the seconds off bedtime', () => {
    const plan = planFromRow({
      day: '2026-11-08',
      activities: [{ kind: 'forca', start: '18:30', minutes: 60 }],
      meal_times: { dinar: '15:00' },
      mode_overrides: { sopar: 'dormir' },
      bedtime: '23:30:00',
    })
    expect(plan).toEqual({
      day: '2026-11-08',
      activities: [{ kind: 'forca', start: '18:30', minutes: 60 }],
      mealTimes: { dinar: '15:00' },
      modeOverrides: { sopar: 'dormir' },
      bedtime: '23:30',
    })
  })

  it('drops anything malformed instead of failing', () => {
    const plan = planFromRow({
      day: '2026-11-08',
      activities: [{ kind: 'ioga', start: '18:30', minutes: 60 }, { kind: 'cardio', start: '25:00', minutes: 30 }, 'x', null],
      meal_times: { dinar: 'migdia', altres: '11:00' },
      mode_overrides: { sopar: 'festa' },
      bedtime: null,
    })
    expect(plan).toEqual({ day: '2026-11-08', activities: [], mealTimes: {}, modeOverrides: {}, bedtime: null })
  })
})

describe('memory plan api', () => {
  it('saves and replaces a day plan', async () => {
    const api = createMemoryPlanApi()
    expect(await api.planFor('2026-11-08')).toBeNull()
    const base = { day: '2026-11-08', activities: [], mealTimes: {}, modeOverrides: {}, bedtime: '23:00' }
    await api.savePlan(base)
    await api.savePlan({ ...base, bedtime: '00:30' })
    expect((await api.planFor('2026-11-08'))?.bedtime).toBe('00:30')
  })
})
