import { toMinutes } from './engine'
import type { Activity } from './types'

/** The planning screen asks two questions; these are the answers and the activities they stand for. */
export type Training = 'no' | 'forca' | 'cardio'
export type TrainingTime = 'mati' | 'tarda' | 'vespre'
export type DeepWork = 'no' | 'mati' | 'tarda' | 'tot'

export type DayAnswers = { training: Training; trainingTime: TrainingTime; deepWork: DeepWork }

export const trainingTimes: Record<TrainingTime, { label: string; start: string }> = {
  mati: { label: 'Matí', start: '10:00' },
  tarda: { label: 'Tarda', start: '18:30' },
  vespre: { label: 'Vespre', start: '20:00' },
}

export const deepWorkBlocks: Record<Exclude<DeepWork, 'no'>, { label: string; start: string; minutes: number }> = {
  mati: { label: 'Matí', start: '09:00', minutes: 240 },
  tarda: { label: 'Tarda', start: '15:00', minutes: 240 },
  tot: { label: 'Tot el dia', start: '09:00', minutes: 540 },
}

const trainingMinutes: Record<Exclude<Training, 'no'>, number> = { forca: 60, cardio: 45 }

export const defaultAnswers: DayAnswers = { training: 'no', trainingTime: 'tarda', deepWork: 'no' }

export function answersToActivities(a: DayAnswers): Activity[] {
  const activities: Activity[] = []
  if (a.deepWork !== 'no') {
    const block = deepWorkBlocks[a.deepWork]
    activities.push({ kind: 'deepwork', start: block.start, minutes: block.minutes })
  }
  if (a.training !== 'no') {
    activities.push({ kind: a.training, start: trainingTimes[a.trainingTime].start, minutes: trainingMinutes[a.training] })
  }
  return activities
}

/** Reads a saved plan back into answers, picking the closest option for anything else. */
export function activitiesToAnswers(activities: Activity[]): DayAnswers {
  const training = activities.find((a) => a.kind === 'forca' || a.kind === 'cardio' || a.kind === 'esport')
  const work = activities.filter((a) => a.kind === 'deepwork')

  let trainingTime: TrainingTime = defaultAnswers.trainingTime
  if (training) {
    const t = toMinutes(training.start)
    trainingTime = t < 14 * 60 ? 'mati' : t < 19 * 60 + 15 ? 'tarda' : 'vespre'
  }

  let deepWork: DeepWork = 'no'
  if (work.length > 0) {
    const start = Math.min(...work.map((w) => toMinutes(w.start)))
    const end = Math.max(...work.map((w) => toMinutes(w.start) + w.minutes))
    deepWork = start < 12 * 60 && end > 16 * 60 ? 'tot' : start < 12 * 60 ? 'mati' : 'tarda'
  }

  return {
    training: training ? (training.kind === 'cardio' ? 'cardio' : 'forca') : 'no',
    trainingTime,
    deepWork,
  }
}
