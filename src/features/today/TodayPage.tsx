import { useState } from 'react'
import { FoodIllustration } from '../../components/food/FoodIllustration'
import { IconButton } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { MacroStat } from '../../components/ui/MacroStat'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { formatDayLabel, formatInt } from '../../lib/format'
import { scaleNutrients, sumNutrients, withRoundedKcal } from '../../lib/nutrition'
import { sampleFoods, sampleGoals, sampleMeals } from '../../mocks/sampleData'

export function TodayPage() {
  const [today] = useState(() => new Date())
  const goals = sampleGoals
  const meals = sampleMeals.map((meal) => {
    const items = meal.items.flatMap((item) => {
      const food = sampleFoods.find((f) => f.kind === item.kind)
      return food ? [{ ...item, food, nutrients: withRoundedKcal(scaleNutrients(food.per100g, item.grams)) }] : []
    })
    return { ...meal, items, total: sumNutrients(items.map((i) => i.nutrients)) }
  })
  const total = sumNutrients(meals.map((m) => m.total))
  const remaining = Math.max(goals.kcal - total.kcal, 0)

  return (
    <>
      <PageHeader
        eyebrow={formatDayLabel(today)}
        title="Avui"
        size="compact"
        action={
          <IconButton label="Canviar de dia">
            <Icon name="calendar" size={20} strokeWidth={1.6} />
          </IconButton>
        }
      />

      <section aria-label="Calories del dia" className="relative mt-1 flex flex-col items-center">
        <ProgressRing value={total.kcal} max={goals.kcal} label="Calories consumides respecte a l'objectiu">
          <div className="-mt-2 flex flex-col items-center gap-1">
            <span className="label-mono">Consumides</span>
            <span className="text-[92px] leading-none font-light tracking-[-0.06em]">{formatInt(total.kcal)}</span>
            <span className="text-sm text-muted">de {formatInt(goals.kcal)} kcal</span>
          </div>
        </ProgressRing>
        <div className="-mt-3 flex h-8 items-center gap-2 rounded-full bg-surface px-3.5 text-[13px]">
          <span className="size-1.5 rounded-full bg-accent" />
          <span>
            Queden <strong className="font-semibold">{formatInt(remaining)}</strong> kcal
          </span>
        </div>
      </section>

      <section aria-label="Macronutrients" className="grid grid-cols-3 gap-4 px-6 pt-7">
        <MacroStat label="Proteïna" value={total.protein} goal={goals.protein} color="var(--color-accent)" />
        <MacroStat label="Carbohidrats" value={total.carbs} goal={goals.carbs} color="var(--color-ink)" />
        <MacroStat label="Greixos" value={total.fat} goal={goals.fat} color="var(--color-fat)" />
      </section>

      <section aria-label="Àpats d'avui" className="flex flex-col gap-5 px-6 pt-8">
        {meals.map((meal) => (
          <div key={meal.title} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 className="m-0 text-[15px] font-medium tracking-[-0.01em]">{meal.title}</h2>
              <span className="font-mono text-[11px] text-muted">{formatInt(meal.total.kcal)} kcal</span>
            </div>
            <ul className="m-0 flex list-none flex-col p-0">
              {meal.items.map((item) => (
                <li key={item.kind} className="flex items-center gap-3.5 py-1">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-surface">
                    <FoodIllustration kind={item.kind} size={44} label={item.food.name} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-medium">{item.food.name}</span>
                    <span className="font-mono text-xs text-muted">{formatInt(item.grams)} g</span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[17px] tracking-[-0.02em]">{formatInt(item.nutrients.kcal)}</span>
                    <span className="text-xs text-muted">kcal</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  )
}
