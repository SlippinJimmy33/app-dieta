import { describe, expect, it } from 'vitest'
import { formatUnits, initialMode, parseGrams, stepGrams, stepUnits } from './portion'

const unit = { name: '1 unitat', grams: 120 }

describe('stepUnits', () => {
  it('moves in half units and never goes below half', () => {
    expect(stepUnits(1, 1)).toBe(1.5)
    expect(stepUnits(1, -1)).toBe(0.5)
    expect(stepUnits(0.5, -1)).toBe(0.5)
    expect(stepUnits(1.3, 1)).toBe(2) // snaps 1.3 → 1.5 first
  })
})

describe('stepGrams', () => {
  it('lands on round tens', () => {
    expect(stepGrams(123, 1)).toBe(130)
    expect(stepGrams(123, -1)).toBe(120)
    expect(stepGrams(120, 1)).toBe(130)
    expect(stepGrams(120, -1)).toBe(110)
  })

  it('stays within limits', () => {
    expect(stepGrams(10, -1)).toBe(5)
    expect(stepGrams(5, -1)).toBe(5)
    expect(stepGrams(4995, 1)).toBe(5000)
  })
})

describe('initialMode', () => {
  it('uses units only for whole half-units', () => {
    expect(initialMode(120, unit)).toBe('unit')
    expect(initialMode(180, unit)).toBe('unit')
    expect(initialMode(100, unit)).toBe('grams')
    expect(initialMode(120, null)).toBe('grams')
  })
})

describe('parseGrams', () => {
  it('accepts sensible amounts', () => {
    expect(parseGrams('37')).toBe(37)
    expect(parseGrams('12,55')).toBe(12.6)
  })

  it('rejects empty, zero, too much and garbage', () => {
    for (const bad of ['', '0', '0,01', '5001', 'molt']) expect(parseGrams(bad), bad).toBeNull()
  })
})

describe('formatUnits', () => {
  it('uses a decimal comma', () => {
    expect(formatUnits(1.5)).toBe('1,5')
    expect(formatUnits(2)).toBe('2')
  })
})
