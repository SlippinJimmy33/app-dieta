import { describe, expect, it } from 'vitest'
import { addDays, dayTitle, fromISODate, isISODate, toISODate } from './dates'

describe('toISODate', () => {
  it('uses the local calendar day, not UTC', () => {
    // 00:30 local on 9 Nov: in UTC (for Europe) this is still 8 Nov.
    expect(toISODate(new Date(2026, 10, 9, 0, 30))).toBe('2026-11-09')
    expect(toISODate(new Date(2026, 10, 8, 23, 59))).toBe('2026-11-08')
  })
})

describe('isISODate', () => {
  it('accepts real dates only', () => {
    expect(isISODate('2026-11-08')).toBe(true)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('2026-1-8')).toBe(false)
    expect(isISODate('ahir')).toBe(false)
    expect(isISODate(null)).toBe(false)
  })
})

describe('addDays', () => {
  it('crosses months, years and daylight-saving changes', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
    // Europe switches to winter time on 25 Oct 2026.
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
  })

  it('round-trips through fromISODate', () => {
    expect(toISODate(fromISODate('2026-11-08'))).toBe('2026-11-08')
  })
})

describe('dayTitle', () => {
  it('names today and yesterday, and spells out other days', () => {
    expect(dayTitle('2026-11-08', '2026-11-08')).toBe('Avui')
    expect(dayTitle('2026-11-07', '2026-11-08')).toBe('Ahir')
    expect(dayTitle('2026-11-03', '2026-11-08')).toBe('Dimarts 3')
  })
})
