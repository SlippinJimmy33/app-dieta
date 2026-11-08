import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ringProgress } from '../../lib/progress'
import { ProgressRing } from './ProgressRing'

describe('ringProgress', () => {
  it('clamps between 0 and 1', () => {
    expect(ringProgress(819, 2100)).toBeCloseTo(0.39, 2)
    expect(ringProgress(3000, 2100)).toBe(1)
    expect(ringProgress(-10, 2100)).toBe(0)
  })

  it('is 0 when the goal is missing or invalid', () => {
    expect(ringProgress(500, 0)).toBe(0)
    expect(ringProgress(500, Number.NaN)).toBe(0)
    expect(ringProgress(Number.POSITIVE_INFINITY, 2100)).toBe(0)
  })
})

describe('ProgressRing', () => {
  it('exposes progress to assistive tech, clamped to the max', () => {
    render(<ProgressRing value={2500} max={2100} label="Calories" />)
    const bar = screen.getByRole('progressbar', { name: 'Calories' })
    expect(bar).toHaveAttribute('aria-valuenow', '2100')
    expect(bar).toHaveAttribute('aria-valuemax', '2100')
  })
})
