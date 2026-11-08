import { describe, expect, it } from 'vitest'
import { formatDayLabel, formatGrams, formatInt } from './format'

describe('formatInt', () => {
  it('groups thousands with a dot, even for 4 digits', () => {
    expect(formatInt(2100)).toBe('2.100')
    expect(formatInt(12345)).toBe('12.345')
  })

  it('rounds to an integer', () => {
    expect(formatInt(106.8)).toBe('107')
    expect(formatInt(0)).toBe('0')
  })
})

describe('formatGrams', () => {
  it('uses a decimal comma and at most one decimal', () => {
    expect(formatGrams(1.32)).toBe('1,3')
    expect(formatGrams(27.36)).toBe('27,4')
    expect(formatGrams(63)).toBe('63')
  })
})

describe('formatDayLabel', () => {
  it('renders weekday, day and short month in Catalan', () => {
    const label = formatDayLabel(new Date(2026, 9, 9))
    expect(label).toMatch(/^divendres · 9 /)
    expect(label).not.toContain('.')
  })
})
