import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { BottomBar, ScreenShell } from '../../components/ui/ScreenShell'
import { dayTitle, fromISODate, type ISODate } from '../../lib/dates'
import { formatDayLabel } from '../../lib/format'
import { dayHref } from '../log/dayQuery'
import { mealInfo } from '../log/meals'
import { useLogParams } from '../log/useLogParams'
import { pantryErrorMessage } from '../pantry/pantryErrors'
import { assignModes, toClock, toMinutes } from './engine'
import { activityLabel } from './modes'
import { ModeTag } from './ModeTag'
import {
  activitiesToAnswers,
  answersToActivities,
  deepWorkBlocks,
  trainingTimes,
  type DayAnswers,
  type DeepWork,
  type Training,
  type TrainingTime,
} from './simplePlan'
import type { DayPlan } from './types'
import { useDayPlan, useSavePlan } from './usePlan'

const emptyPlan = (day: ISODate): DayPlan => ({ day, activities: [], mealTimes: {}, modeOverrides: {}, bedtime: null })

/** /pla — two questions about the day, and each meal gets its mode. */
export function PlanDayPage() {
  const { today, day } = useLogParams()
  const planQuery = useDayPlan(day)

  return (
    <ScreenShell backTo={dayHref(day, today)} backLabel="Tornar al dia">
      {planQuery.isPending ? null : planQuery.isError ? (
        <p role="alert" className="m-0 px-6 pt-6 text-[15px] text-muted">
          {pantryErrorMessage(planQuery.error)}
        </p>
      ) : (
        <PlanForm key={day} initial={planQuery.data ?? emptyPlan(day)} today={today} />
      )}
    </ScreenShell>
  )
}

function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: [T, string][]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2.5">
      <span className="text-[13px] font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, text]) => (
          <Chip key={v} active={v === value} onClick={() => onChange(v)}>
            {text}
          </Chip>
        ))}
      </div>
    </div>
  )
}

function PlanForm({ initial, today }: { initial: DayPlan; today: ISODate }) {
  const navigate = useNavigate()
  const save = useSavePlan()
  const [answers, setAnswers] = useState<DayAnswers>(() => activitiesToAnswers(initial.activities))
  const set = (changes: Partial<DayAnswers>) => setAnswers((a) => ({ ...a, ...changes }))

  // Meal times, bedtime and manual modes stay as they were; only the activities come from the answers.
  const plan: DayPlan = { ...initial, activities: answersToActivities(answers) }
  const timeline = [
    ...assignModes(plan).map((info) => ({ at: toMinutes(info.time), kind: 'meal' as const, info })),
    ...plan.activities.map((activity) => ({ at: toMinutes(activity.start), kind: 'activity' as const, activity })),
  ].sort((a, b) => a.at - b.at)

  return (
    <div className="flex flex-col gap-6 pt-5 pb-[calc(120px+env(safe-area-inset-bottom))]">
      <div className="flex flex-col gap-1.5 px-6">
        <span className="label-mono">{formatDayLabel(fromISODate(plan.day))}</span>
        <h1 className="m-0 text-[40px] leading-none font-normal tracking-[-0.05em]">
          {plan.day === today ? 'Com serà el dia?' : `${dayTitle(plan.day, today)}: com va anar?`}
        </h1>
      </div>

      <div className="flex flex-col gap-5 px-6">
        <ChoiceRow<Training>
          label="Entrenes avui?"
          options={[
            ['no', 'No'],
            ['forca', 'Força'],
            ['cardio', 'Cardio'],
          ]}
          value={answers.training}
          onChange={(training) => set({ training })}
        />
        {answers.training !== 'no' && (
          <ChoiceRow<TrainingTime>
            label="Quan?"
            options={Object.entries(trainingTimes).map(([k, t]) => [k as TrainingTime, t.label])}
            value={answers.trainingTime}
            onChange={(trainingTime) => set({ trainingTime })}
          />
        )}
        <ChoiceRow<DeepWork>
          label="Deep work?"
          options={[['no', 'No'], ...Object.entries(deepWorkBlocks).map(([k, b]) => [k as DeepWork, b.label] as [DeepWork, string])]}
          value={answers.deepWork}
          onChange={(deepWork) => set({ deepWork })}
        />
      </div>

      <section aria-labelledby="preview-title" className="mx-4 flex flex-col rounded-tile bg-surface px-4 py-[18px]">
        <h2 id="preview-title" className="label-mono m-0 mb-2.5 font-normal">
          El teu dia
        </h2>
        <ol className="m-0 list-none p-0">
          {timeline.map((row) => (
            <li key={row.kind === 'meal' ? `m-${row.info.meal}` : `a-${row.activity.kind}`} className="flex gap-3">
              <span className="w-11 shrink-0 pt-3 font-mono text-[11px] text-muted">
                {row.kind === 'meal' ? row.info.time : row.activity.start}
              </span>
              <span aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center">
                <span className="h-3.5 w-0.5 bg-line" />
                <span
                  className={`size-2.5 shrink-0 rounded-full ${
                    row.kind === 'meal' ? 'bg-ink' : row.activity.kind === 'deepwork' ? 'bg-go' : 'bg-accent'
                  }`}
                />
                <span className="w-0.5 flex-1 bg-line" />
              </span>
              {row.kind === 'meal' ? (
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 py-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] font-medium">{mealInfo(row.info.meal).label}</span>
                    <span className="text-[11px] text-muted">{row.info.reason}</span>
                  </div>
                  <ModeTag mode={row.info.mode} size="sm" />
                </div>
              ) : (
                <div className="flex flex-col gap-0.5 py-2">
                  <span className="text-[15px] text-ink-soft">{activityLabel(row.activity.kind)}</span>
                  <span className="text-[11px] text-muted">
                    fins a les {toClock(toMinutes(row.activity.start) + row.activity.minutes)}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      {save.error != null && (
        <p role="alert" className="mx-6 my-0 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {pantryErrorMessage(save.error)}
        </p>
      )}

      <BottomBar>
        <Button
          className="w-full"
          disabled={save.isPending}
          onClick={() => save.mutate(plan, { onSuccess: () => navigate(dayHref(plan.day, today)) })}
        >
          {save.isPending ? 'Desant…' : 'Fet, recomana’m els àpats'}
        </Button>
      </BottomBar>
    </div>
  )
}
