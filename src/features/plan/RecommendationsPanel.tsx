import { useState } from 'react'
import { Link } from 'react-router'
import { FoodAvatar } from '../../components/food/FoodAvatar'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import type { MealSlot } from '../../lib/database.types'
import type { ISODate } from '../../lib/dates'
import { formatGrams, formatInt } from '../../lib/format'
import { useClockMinutes } from '../../lib/useToday'
import { dayQuery } from '../log/dayQuery'
import { mealInfo } from '../log/meals'
import { useAddEntry } from '../log/useLog'
import { pantryErrorMessage } from '../pantry/pantryErrors'
import { useCategories, useFoods } from '../pantry/usePantry'
import { assignModes, buildPlate, mealTargets, toClock, toMinutes, type MealPlanInfo, type Plate } from './engine'
import { activityLabel, modeOrder, modeProfiles } from './modes'
import type { DayPlan, MealMode } from './types'
import { useSavePlan } from './usePlan'

type RecommendationsPanelProps = {
  day: ISODate
  today: ISODate
  plan: DayPlan | null
  goalKcal: number | null
  eatenKcal: Partial<Record<MealSlot, number>>
}

/** A meal still counts as "next" for a while after its planned time. */
const LATE_ALLOWANCE = 90

export function RecommendationsPanel({ day, today, plan, goalKcal, eatenKcal }: RecommendationsPanelProps) {
  const now = useClockMinutes()
  const planHref = `/pla${dayQuery(day, today)}`

  if (!plan) {
    return (
      <Link
        to={planHref}
        className="flex items-center gap-4 rounded-[24px] border border-go/25 bg-go-soft p-5 text-ink no-underline"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[17px] font-medium tracking-[-0.01em]">{day === today ? 'Com serà el dia?' : 'Com va anar el dia?'}</span>
          <span className="text-[13px] text-ink-soft">
            Digues si fas deep work, entrenes o descanses, i cada àpat tindrà la seva recomanació.
          </span>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-go text-white">
          <Icon name="back" size={18} strokeWidth={2} className="rotate-180" />
        </span>
      </Link>
    )
  }

  const infos = assignModes(plan)
  // Today, a meal long past with nothing logged was skipped; earlier days are planned as a whole.
  const skipped =
    day === today ? infos.filter((i) => !eatenKcal[i.meal] && toMinutes(i.time) < now - LATE_ALLOWANCE).map((i) => i.meal) : []
  const targets = mealTargets(infos, goalKcal, eatenKcal, skipped)
  const next = day === today ? infos.find((i) => targets[i.meal] !== null) : undefined
  const activities = [...plan.activities].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))

  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Pla del dia" className="flex items-center gap-3 rounded-[24px] bg-surface py-3 pr-3 pl-4">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {activities.length === 0 ? (
            <span className="text-[13px] text-ink-soft">Dia tranquil</span>
          ) : (
            activities.map((a) => (
              <span key={`${a.kind}-${a.start}`} className="rounded-full bg-white px-2.5 py-1 text-xs whitespace-nowrap">
                {activityLabel(a.kind)}{' '}
                <span className="font-mono text-muted">
                  {a.start}–{toClock(toMinutes(a.start) + a.minutes)}
                </span>
              </span>
            ))
          )}
        </div>
        <Link to={planHref} className="shrink-0 px-2 text-sm font-medium text-accent">
          Editar
        </Link>
      </section>

      {next && (
        <NextMealCard
          key={`${next.meal}-${next.mode}`}
          info={next}
          targetKcal={targets[next.meal] ?? 0}
          plan={plan}
          day={day}
          today={today}
        />
      )}
    </div>
  )
}

const missingHint: Record<Plate['missing'][number], string> = {
  proteïna: 'una font de proteïna (pollastre, ous, iogurt grec, llegums…)',
  carbohidrats: 'una font d’energia (arròs, pa, pasta, patata, fruita…)',
  greixos: 'un greix saludable (oli d’oliva, fruits secs, alvocat…)',
}

function NextMealCard({
  info,
  targetKcal,
  plan,
  day,
  today,
}: {
  info: MealPlanInfo
  targetKcal: number
  plan: DayPlan
  day: ISODate
  today: ISODate
}) {
  const foods = useFoods().data ?? []
  const categories = useCategories().data ?? []
  const add = useAddEntry()
  const savePlan = useSavePlan()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [choosingMode, setChoosingMode] = useState(false)

  const profile = modeProfiles[info.mode]
  const plate = buildPlate(foods, categories, info.mode, targetKcal)
  const meal = mealInfo(info.meal)
  const pct = (n: number) => Math.round(n * 100)

  async function addPlate() {
    setAdding(true)
    setError(null)
    try {
      // One after another, so the day keeps the plate's order.
      for (const item of plate.items) {
        await add.mutateAsync({ eaten_on: day, meal: info.meal, food_id: item.food.id, grams: item.grams })
      }
    } catch (e) {
      setError(e)
    } finally {
      setAdding(false)
    }
  }

  function chooseMode(mode: MealMode | null) {
    const modeOverrides = { ...plan.modeOverrides }
    if (mode) modeOverrides[info.meal] = mode
    else delete modeOverrides[info.meal]
    savePlan.mutate({ ...plan, modeOverrides }, { onSuccess: () => setChoosingMode(false) })
  }

  return (
    <section
      aria-labelledby="next-meal-title"
      className="glass relative flex flex-col gap-4 rounded-[28px] p-5 shadow-[0_16px_48px_rgb(10_10_10/0.08)]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 -top-4 -z-10 h-40 rounded-full bg-go opacity-15 blur-[60px]" />

      <div className="flex flex-col gap-2">
        <span className="label-mono">
          Següent · {meal.label} · {info.time}
        </span>
        <div className="flex items-center justify-between gap-3">
          <h2 id="next-meal-title" className="m-0 text-[26px] leading-tight font-normal tracking-[-0.03em]">
            {profile.label}
          </h2>
          <button type="button" onClick={() => setChoosingMode((v) => !v)} aria-expanded={choosingMode} className="shrink-0 text-sm font-medium text-accent">
            Canviar
          </button>
        </div>
        <p className="m-0 text-[13px] text-ink-soft">
          {info.reason} {profile.idea}
        </p>
      </div>

      {choosingMode && (
        <div role="group" aria-label="Mode de l’àpat" className="flex flex-wrap gap-2">
          <Chip active={!info.manual} onClick={() => chooseMode(null)} disabled={savePlan.isPending}>
            Automàtic
          </Chip>
          {modeOrder.map((m) => (
            <Chip key={m} active={info.manual && info.mode === m} onClick={() => chooseMode(m)} disabled={savePlan.isPending}>
              {modeProfiles[m].label}
            </Chip>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium">Plat ideal</span>
          <span className="font-mono text-[11px] text-muted">~{formatInt(targetKcal)} kcal</span>
        </div>
        <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          <div className="bg-ink" style={{ width: `${pct(profile.split.carbs)}%` }} />
          <div className="bg-accent" style={{ width: `${pct(profile.split.protein)}%` }} />
          <div className="bg-fat" style={{ width: `${pct(profile.split.fat)}%` }} />
        </div>
        <p className="m-0 flex flex-wrap gap-x-3.5 text-[11px] text-ink-soft">
          <span>Carbohidrats {pct(profile.split.carbs)}%</span>
          <span>Proteïna {pct(profile.split.protein)}%</span>
          <span>Greixos {pct(profile.split.fat)}%</span>
        </p>
      </div>

      {targetKcal <= 0 ? (
        <p className="m-0 text-sm text-ink-soft">Ja has arribat a l’objectiu d’avui.</p>
      ) : (
        <>
          {plate.items.length > 0 && (
            <ul aria-label="Plat suggerit" className="m-0 flex list-none flex-col p-0">
              {plate.items.map((item) => (
                <li key={item.food.id}>
                  <Link
                    to={`/afegir/${item.food.id}${dayQuery(day, today, { apat: info.meal, g: String(item.grams) })}`}
                    className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-1.5 text-ink no-underline transition-colors hover:bg-white/60"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-white">
                      <FoodAvatar name={item.food.name} size={32} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-medium">{item.food.name}</span>
                      <span className="truncate text-[11px] text-[#0b6b35]">
                        {item.tag} · {formatGrams(item.grams)} g
                      </span>
                    </div>
                    <span className="shrink-0 text-sm">
                      {formatInt(item.kcal)} <span className="text-xs text-muted">kcal</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {plate.missing.length > 0 && (
            <p className="m-0 rounded-2xl bg-white/70 px-4 py-3 text-xs text-ink-soft">
              Per a un plat millor, afegeix al <Link to="/rebost/nou" className="font-medium text-accent">rebost</Link>{' '}
              {plate.missing.map((m) => missingHint[m]).join(' i ')}.
            </p>
          )}

          {error != null && (
            <p role="alert" className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {pantryErrorMessage(error)}
            </p>
          )}

          {plate.items.length > 0 && (
            <Button size="md" onClick={addPlate} disabled={adding}>
              {adding ? 'Afegint…' : `Afegir el plat ${meal.target} · ${formatInt(plate.total.kcal)} kcal`}
            </Button>
          )}
        </>
      )}

      {savePlan.error != null && (
        <p role="alert" className="m-0 text-sm text-danger">
          {pantryErrorMessage(savePlan.error)}
        </p>
      )}
    </section>
  )
}

