import { describe, expect, it } from 'vitest'
import { createMemoryGoalsApi } from './memoryLogApi'

const goal = (kcal: number) => ({ kcal, protein_g: 100, carbs_g: 200, fat_g: 60 })

describe('goal history', () => {
  it('uses the first goal for days before it was set', async () => {
    const goals = createMemoryGoalsApi()
    expect(await goals.goalFor('2026-11-01')).toBeNull()

    await goals.saveGoal('2026-11-08', goal(2000))
    expect((await goals.goalFor('2026-11-01'))?.kcal).toBe(2000)
    expect((await goals.goalFor('2026-11-08'))?.kcal).toBe(2000)
  })

  it('keeps each day on the goal it had once goals change', async () => {
    const goals = createMemoryGoalsApi()
    await goals.saveGoal('2026-11-08', goal(2000))
    await goals.saveGoal('2026-12-01', goal(1800))

    expect((await goals.goalFor('2026-11-01'))?.kcal).toBe(2000) // before the first: the first
    expect((await goals.goalFor('2026-11-30'))?.kcal).toBe(2000)
    expect((await goals.goalFor('2026-12-01'))?.kcal).toBe(1800)
    expect((await goals.goalFor('2027-01-15'))?.kcal).toBe(1800)
  })

  it('replaces the goal when saved twice on the same day', async () => {
    const goals = createMemoryGoalsApi()
    await goals.saveGoal('2026-11-08', goal(2000))
    await goals.saveGoal('2026-11-08', goal(2100))
    expect((await goals.goalFor('2026-11-08'))?.kcal).toBe(2100)
  })
})
