import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { BottomBar, ScreenShell } from '../../components/ui/ScreenShell'
import { dayTitle, fromISODate, type ISODate } from '../../lib/dates'
import { formatDayLabel } from '../../lib/format'
import { dayHref } from '../log/dayQuery'
import { mealInfo } from '../log/meals'
import { useLogParams } from '../log/useLogParams'
import { pantryErrorMessage } from '../pantry/pantryErrors'
import { assignModes, formatDuration, mealTime, toClock, toMinutes } from './engine'
import { activityKinds, activityLabel, DEFAULT_BEDTIME, defaultMealTimes, plannedMeals } from './modes'
import { ModeTag } from './ModeTag'
import type { Activity, ActivityKind, DayPlan } from './types'
import { useDayPlan, useSavePlan } from './usePlan'

const durations = [30, 45, 60, 90, 120, 180, 240]

const defaultActivity: Record<ActivityKind, Activity> = {
  deepwork: { kind: 'deepwork', start: '09:00', minutes: 240 },
  forca: { kind: 'forca', start: '18:30', minutes: 60 },
  cardio: { kind: 'cardio', start: '07:30', minutes: 45 },
  esport: { kind: 'esport', start: '19:00', minutes: 90 },
}

const presets: { label: string; activities: Activity[] }[] = [
  { label: 'Dia de feina', activities: [defaultActivity.deepwork, { kind: 'deepwork', start: '15:00', minutes: 180 }] },
  { label: 'Feina + gimnàs', activities: [defaultActivity.deepwork, defaultActivity.forca] },
  { label: 'Dia de descans', activities: [] },
]

const emptyPlan = (day: ISODate): DayPlan => ({ day, activities: [], mealTimes: {}, modeOverrides: {}, bedtime: null })

/** /pla — describe the day so each meal gets the right mode. */
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

// Background chosen per use (white on grey cards, grey on the page): two bg classes on one element would clash.
const timeInputClass = 'h-11 rounded-full border-none px-3 font-mono text-sm text-ink outline-none focus:ring-2 focus:ring-accent'

function PlanForm({ initial, today }: { initial: DayPlan; today: ISODate }) {
  const navigate = useNavigate()
  const save = useSavePlan()
  const [plan, setPlan] = useState<DayPlan>(initial)
  const [showMealTimes, setShowMealTimes] = useState(Object.keys(initial.mealTimes).length > 0)
  const [adding, setAdding] = useState(false)

  const sorted = [...plan.activities].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const update = (changes: Partial<DayPlan>) => setPlan((p) => ({ ...p, ...changes }))
  // The list keeps the order things were added (so editing a time never makes rows jump); the preview is sorted.
  const setActivity = (index: number, changes: Partial<Activity>) =>
    update({ activities: plan.activities.map((a, i) => (i === index ? { ...a, ...changes } : a)) })

  function addActivity(kind: ActivityKind) {
    update({ activities: [...plan.activities, defaultActivity[kind]] })
    setAdding(false)
  }

  function setMealTime(meal: (typeof plannedMeals)[number], value: string) {
    const mealTimes = { ...plan.mealTimes }
    if (!value || value === defaultMealTimes[meal]) delete mealTimes[meal]
    else mealTimes[meal] = value
    update({ mealTimes })
  }

  const infos = assignModes(plan)
  const timeline = [
    ...infos.map((i) => ({ at: toMinutes(i.time), kind: 'meal' as const, info: i })),
    ...sorted.map((a) => ({ at: toMinutes(a.start), kind: 'activity' as const, activity: a })),
  ].sort((a, b) => a.at - b.at)

  return (
    <div className="flex flex-col gap-7 px-6 pt-5 pb-[calc(120px+env(safe-area-inset-bottom))]">
      <div className="flex flex-col gap-1.5">
        <span className="label-mono">{formatDayLabel(fromISODate(plan.day))}</span>
        <h1 className="m-0 text-[40px] leading-none font-normal tracking-[-0.05em]">
          {plan.day === today ? 'Com serà el dia?' : `${dayTitle(plan.day, today)}: com va anar?`}
        </h1>
      </div>

      <div role="group" aria-label="Dies tipus" className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none]">
        {presets.map((p) => (
          <Chip key={p.label} onClick={() => update({ activities: p.activities })}>
            {p.label}
          </Chip>
        ))}
      </div>

      <section aria-labelledby="activities-title" className="flex flex-col gap-3">
        <h2 id="activities-title" className="m-0 text-[15px] font-medium">
          Activitats
        </h2>
        {plan.activities.length === 0 && <p className="m-0 text-sm text-muted">Cap activitat: un dia tranquil.</p>}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {plan.activities.map((a, i) => (
            <li key={i} className="flex flex-col gap-3 rounded-[24px] bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium">{activityLabel(a.kind)}</span>
                <button
                  type="button"
                  aria-label={`Treure ${activityLabel(a.kind)} de les ${a.start}`}
                  onClick={() => update({ activities: plan.activities.filter((_, j) => j !== i) })}
                  className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink"
                >
                  <Icon name="close" size={16} strokeWidth={2} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted">
                  Hora
                  <input
                    type="time"
                    value={a.start}
                    onChange={(e) => e.target.value && setActivity(i, { start: e.target.value })}
                    className={`${timeInputClass} bg-white`}
                  />
                </label>
                <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted">
                  Durada
                  <select
                    value={a.minutes}
                    onChange={(e) => setActivity(i, { minutes: Number(e.target.value) })}
                    className={`${timeInputClass} min-w-0 flex-1 bg-white`}
                  >
                    {[...new Set([...durations, a.minutes])].sort((x, y) => x - y).map((m) => (
                      <option key={m} value={m}>
                        {formatDuration(m)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ul>

        {adding ? (
          <div role="group" aria-label="Tipus d’activitat" className="flex flex-wrap gap-2">
            {activityKinds.map((k) => (
              <Chip key={k.kind} onClick={() => addActivity(k.kind)}>
                {k.label}
              </Chip>
            ))}
            <Chip onClick={() => setAdding(false)}>Cancel·lar</Chip>
          </div>
        ) : (
          <Button variant="soft" size="md" className="self-start" onClick={() => setAdding(true)} disabled={plan.activities.length >= 12}>
            <Icon name="plus" size={18} strokeWidth={2} />
            Afegir activitat
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="bedtime" className="text-[15px] font-medium">
            A dormir cap a les
          </label>
          <input
            id="bedtime"
            type="time"
            value={plan.bedtime ?? DEFAULT_BEDTIME}
            onChange={(e) => update({ bedtime: e.target.value || null })}
            className={`${timeInputClass} bg-surface`}
          />
        </div>

        <button
          type="button"
          aria-expanded={showMealTimes}
          onClick={() => setShowMealTimes((v) => !v)}
          className="flex items-center justify-between py-1 text-left text-[15px] font-medium"
        >
          Hores dels àpats
          <Icon name="back" size={16} strokeWidth={2} className={`text-muted transition-transform ${showMealTimes ? 'rotate-90' : '-rotate-90'}`} />
        </button>
        {showMealTimes && (
          <div className="grid grid-cols-2 gap-2">
            {plannedMeals.map((meal) => (
              <label key={meal} className="flex items-center justify-between gap-2 rounded-2xl bg-surface py-1.5 pr-1.5 pl-4 text-sm">
                {mealInfo(meal).label}
                <input
                  type="time"
                  value={mealTime(plan, meal)}
                  onChange={(e) => setMealTime(meal, e.target.value)}
                  className={`${timeInputClass} bg-white`}
                />
              </label>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="preview-title" className="flex flex-col rounded-tile bg-surface p-4">
        <h2 id="preview-title" className="label-mono m-0 mb-3 font-normal">
          El teu dia
        </h2>
        <ol className="m-0 list-none p-0">
          {timeline.map((row) =>
            row.kind === 'meal' ? (
              <li key={`m-${row.info.meal}`} className="flex gap-3">
                <span className="w-11 shrink-0 pt-3 font-mono text-[11px] text-muted">{row.info.time}</span>
                <span aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center">
                  <span className="h-3.5 w-0.5 bg-line" />
                  <span className="size-2.5 shrink-0 rounded-full bg-ink" />
                  <span className="w-0.5 flex-1 bg-line" />
                </span>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 py-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] font-medium">{mealInfo(row.info.meal).label}</span>
                    <span className="text-[11px] text-muted">{row.info.reason}</span>
                  </div>
                  <ModeTag mode={row.info.mode} size="sm" />
                </div>
              </li>
            ) : (
              <li key={`a-${row.activity.kind}-${row.activity.start}`} className="flex gap-3">
                <span className="w-11 shrink-0 pt-3 font-mono text-[11px] text-muted">{row.activity.start}</span>
                <span aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center">
                  <span className="h-3.5 w-0.5 bg-line" />
                  <span className={`size-2.5 shrink-0 rounded-full ${row.activity.kind === 'deepwork' ? 'bg-go' : 'bg-accent'}`} />
                  <span className="w-0.5 flex-1 bg-line" />
                </span>
                <div className="flex flex-col gap-0.5 py-2">
                  <span className="text-[15px] text-ink-soft">{activityLabel(row.activity.kind)}</span>
                  <span className="text-[11px] text-muted">
                    fins a les {toClock(toMinutes(row.activity.start) + row.activity.minutes)}
                  </span>
                </div>
              </li>
            ),
          )}
        </ol>
      </section>

      {save.error != null && (
        <p role="alert" className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {pantryErrorMessage(save.error)}
        </p>
      )}

      <BottomBar>
        <Button
          className="w-full"
          disabled={save.isPending}
          onClick={() => save.mutate({ ...plan, activities: sorted }, { onSuccess: () => navigate(dayHref(plan.day, today)) })}
        >
          {save.isPending ? 'Desant…' : 'Desar el pla del dia'}
        </Button>
      </BottomBar>
    </div>
  )
}
