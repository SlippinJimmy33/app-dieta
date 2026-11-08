import { Link, useSearchParams } from 'react-router'
import { FoodAvatar } from '../../components/food/FoodAvatar'
import { Button, IconButton } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { MacroStat } from '../../components/ui/MacroStat'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressRing } from '../../components/ui/ProgressRing'
import type { MealSlot } from '../../lib/database.types'
import { addDays, dayTitle, fromISODate, isISODate, type ISODate } from '../../lib/dates'
import { formatDayLabel, formatGrams, formatInt } from '../../lib/format'
import { useStoredState } from '../../lib/useStoredState'
import { useToday } from '../../lib/useToday'
import { dayQuery } from '../log/dayQuery'
import { entryNutrients, summarizeDay } from '../log/daySummary'
import { mealInfo } from '../log/meals'
import { useDayEntries, useGoal } from '../log/useLog'
import { pantryErrorMessage } from '../pantry/pantryErrors'
import { assignModes, isPlannedMeal } from '../plan/engine'
import { ModeTag } from '../plan/ModeTag'
import { RecommendationsPanel } from '../plan/RecommendationsPanel'
import { useDayPlan } from '../plan/usePlan'
import { RecommendationsToggle } from '../recommendations/RecommendationsToggle'

export function TodayPage() {
  const today = useToday()
  const [params, setParams] = useSearchParams()
  const requested = params.get('dia')
  // Unknown or future dates fall back to today: you log what you have eaten.
  const day = isISODate(requested) && requested <= today ? requested : today

  const entriesQuery = useDayEntries(day)
  const goalQuery = useGoal(day)
  const summary = summarizeDay(entriesQuery.data ?? [])
  const goal = goalQuery.data ?? null
  const total = summary.total
  const loaded = entriesQuery.isSuccess

  const goTo = (target: ISODate) => setParams(target === today ? {} : { dia: target }, { replace: true })
  const addHref = (slot: MealSlot) => `/afegir${dayQuery(day, today, { apat: slot })}`

  const overBy = goal ? Math.round(total.kcal) - goal.kcal : 0
  // Off by default; when on, the day plan drives a mode and a suggested plate for each meal.
  const [recommendations, setRecommendations] = useStoredState('app-dieta:recommendations', false)
  const planQuery = useDayPlan(day, recommendations)
  const plan = recommendations ? (planQuery.data ?? null) : null
  const modeOf = (slot: MealSlot) => (plan && isPlannedMeal(slot) ? assignModes(plan).find((i) => i.meal === slot)?.mode : undefined)
  const eatenKcal = Object.fromEntries(summary.meals.map((m) => [m.slot, m.total.kcal]))

  return (
    <>
      <PageHeader
        eyebrow={formatDayLabel(fromISODate(day))}
        title={dayTitle(day, today)}
        size="compact"
        action={
          <div className="flex gap-2">
            <IconButton label="Dia anterior" onClick={() => goTo(addDays(day, -1))}>
              <Icon name="back" size={20} strokeWidth={1.8} />
            </IconButton>
            <IconButton label="Dia següent" onClick={() => goTo(addDays(day, 1))} disabled={day === today}>
              <Icon name="back" size={20} strokeWidth={1.8} className="rotate-180" />
            </IconButton>
          </div>
        }
      />

      <section aria-label="Calories del dia" className="relative mt-1 flex flex-col items-center">
        <ProgressRing value={total.kcal} max={goal?.kcal ?? 0} label="Calories consumides respecte a l’objectiu">
          <div className="-mt-2 flex flex-col items-center gap-1">
            <span className="label-mono">Consumides</span>
            <span className="text-[92px] leading-none font-light tracking-[-0.06em]">{loaded ? formatInt(total.kcal) : '—'}</span>
            <span className="text-sm text-muted">{goal ? `de ${formatInt(goal.kcal)} kcal` : 'kcal'}</span>
          </div>
        </ProgressRing>

        {goal ? (
          <div className="-mt-3 flex h-8 items-center gap-2 rounded-full bg-surface px-3.5 text-[13px]">
            <span className={`size-1.5 rounded-full ${overBy > 0 ? 'bg-danger' : 'bg-accent'}`} />
            {overBy > 0 ? (
              <span>
                T’has passat <strong className="font-semibold">{formatInt(overBy)}</strong> kcal
              </span>
            ) : (
              <span>
                Queden <strong className="font-semibold">{formatInt(-overBy)}</strong> kcal
              </span>
            )}
          </div>
        ) : (
          goalQuery.isSuccess && (
            <Link
              to="/perfil/objectius"
              className="-mt-3 flex h-8 items-center gap-2 rounded-full bg-ink px-3.5 text-[13px] text-white no-underline"
            >
              Defineix el teu objectiu
              <Icon name="back" size={14} strokeWidth={2} className="rotate-180" />
            </Link>
          )
        )}
      </section>

      <section aria-label="Macronutrients" className="grid grid-cols-3 gap-4 px-6 pt-7">
        <MacroStat label="Proteïna" value={total.protein} goal={goal?.protein_g} color="var(--color-accent)" />
        <MacroStat label="Carbohidrats" value={total.carbs} goal={goal?.carbs_g} color="var(--color-ink)" />
        <MacroStat label="Greixos" value={total.fat} goal={goal?.fat_g} color="var(--color-fat)" />
      </section>

      <div className="px-6 pt-8">
        <RecommendationsToggle enabled={recommendations} onChange={setRecommendations} />
        {recommendations && planQuery.isSuccess && loaded && (
          <div className="pt-3">
            <RecommendationsPanel day={day} today={today} plan={plan} goalKcal={goal?.kcal ?? null} eatenKcal={eatenKcal} />
          </div>
        )}
      </div>

      {entriesQuery.isError ? (
        <div role="alert" className="mx-6 mt-8 flex flex-col items-start gap-4 rounded-tile bg-surface p-5">
          <p className="m-0 text-[15px]">{pantryErrorMessage(entriesQuery.error)}</p>
          <Button size="md" onClick={() => entriesQuery.refetch()}>
            Tornar-ho a provar
          </Button>
        </div>
      ) : (
        <div aria-busy={!loaded} className="flex flex-col gap-6 px-6 pt-7">
          {summary.meals.map((meal) => {
            const info = mealInfo(meal.slot)
            return (
              <section key={meal.slot} aria-labelledby={`meal-${meal.slot}`} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 id={`meal-${meal.slot}`} className="m-0 text-[15px] font-medium tracking-[-0.01em]">
                      {info.label}
                    </h2>
                    {modeOf(meal.slot) && <ModeTag mode={modeOf(meal.slot)!} size="sm" />}
                  </div>
                  <div className="flex items-center gap-3">
                    {meal.entries.length > 0 && (
                      <span className="font-mono text-[11px] text-muted">{formatInt(meal.total.kcal)} kcal</span>
                    )}
                    <Link
                      to={addHref(meal.slot)}
                      aria-label={`Afegir ${info.target}`}
                      className="flex size-8 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-line"
                    >
                      <Icon name="plus" size={16} strokeWidth={2} />
                    </Link>
                  </div>
                </div>

                {meal.entries.length > 0 ? (
                  <ul className="m-0 flex list-none flex-col p-0">
                    {meal.entries.map((entry) => (
                      <li key={entry.id}>
                        <Link
                          to={`/registre/${entry.id}${dayQuery(day, today)}`}
                          className="-mx-2 flex items-center gap-3.5 rounded-2xl px-2 py-1.5 text-ink no-underline transition-colors hover:bg-surface"
                        >
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-surface">
                            <FoodAvatar name={entry.food_name} size={38} />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-[15px] font-medium">{entry.food_name}</span>
                            <span className="font-mono text-xs text-muted">{formatGrams(entry.grams)} g</span>
                          </div>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-[17px] tracking-[-0.02em]">{formatInt(entryNutrients(entry).kcal)}</span>
                            <span className="text-xs text-muted">kcal</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  loaded && (
                    <Link
                      to={addHref(meal.slot)}
                      className="flex h-14 items-center rounded-2xl border border-dashed border-line px-4 text-sm text-muted no-underline transition-colors hover:bg-surface"
                    >
                      Afegir {info.target}
                    </Link>
                  )
                )}
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
