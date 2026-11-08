import { describe, expect, it } from 'vitest'
import { activitiesToAnswers, answersToActivities, defaultAnswers, type DayAnswers } from './simplePlan'

describe('day answers ↔ activities', () => {
  it('a quiet day has no activities', () => {
    expect(answersToActivities(defaultAnswers)).toEqual([])
    expect(activitiesToAnswers([])).toEqual(defaultAnswers)
  })

  it('distinguishes strength and cardio training', () => {
    expect(answersToActivities({ training: 'forca', trainingTime: 'tarda', deepWork: 'no' })).toEqual([
      { kind: 'forca', start: '18:30', minutes: 60 },
    ])
    expect(answersToActivities({ training: 'cardio', trainingTime: 'mati', deepWork: 'no' })).toEqual([
      { kind: 'cardio', start: '10:00', minutes: 45 },
    ])
  })

  it('round-trips every combination of answers', () => {
    for (const training of ['no', 'forca', 'cardio'] as const) {
      for (const trainingTime of ['mati', 'tarda', 'vespre'] as const) {
        for (const deepWork of ['no', 'mati', 'tarda', 'tot'] as const) {
          const answers: DayAnswers = { training, trainingTime: training === 'no' ? 'tarda' : trainingTime, deepWork }
          expect(activitiesToAnswers(answersToActivities(answers))).toEqual(answers)
        }
      }
    }
  })

  it('reads plans saved with the older, detailed screen', () => {
    expect(
      activitiesToAnswers([
        { kind: 'deepwork', start: '09:00', minutes: 240 },
        { kind: 'deepwork', start: '15:00', minutes: 180 },
        { kind: 'esport', start: '19:00', minutes: 90 },
      ]),
    ).toEqual({ training: 'forca', trainingTime: 'tarda', deepWork: 'tot' })
  })
})
