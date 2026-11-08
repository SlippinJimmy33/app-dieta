import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { FoodAvatar } from '../../components/food/FoodAvatar'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { ScreenShell } from '../../components/ui/ScreenShell'
import { dayTitle } from '../../lib/dates'
import { formatGrams, formatInt } from '../../lib/format'
import { pantryErrorMessage } from '../pantry/pantryErrors'
import { useFoods } from '../pantry/usePantry'
import { dayHref, dayQuery } from './dayQuery'
import { mealInfo, meals } from './meals'
import { useLogParams } from './useLogParams'

/** Step 1 of logging: pick a food from the pantry. */
export function AddFoodPage() {
  const navigate = useNavigate()
  const { today, day, meal } = useLogParams()
  const foodsQuery = useFoods()
  const [query, setQuery] = useState('')

  const foods = foodsQuery.data ?? []
  const needle = query.trim().toLocaleLowerCase('ca')
  const visible = needle ? foods.filter((f) => f.name.toLocaleLowerCase('ca').includes(needle)) : foods
  const params = (extra: Record<string, string> = {}) => dayQuery(day, today, { apat: meal, ...extra })

  return (
    <ScreenShell backTo={dayHref(day, today)} backLabel="Tornar al dia" title={`Afegir ${mealInfo(meal).target}`}>
      <div className="flex flex-col gap-4 px-6 pt-5 pb-10">
        {day !== today && <span className="label-mono">{dayTitle(day, today)}</span>}

        <div role="group" aria-label="Àpat" className="-mx-6 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none]">
          {meals.map((m) => (
            <Chip
              key={m.slot}
              active={m.slot === meal}
              onClick={() => navigate(`/afegir${dayQuery(day, today, { apat: m.slot })}`, { replace: true })}
            >
              {m.label}
            </Chip>
          ))}
        </div>

        {foodsQuery.isError ? (
          <div role="alert" className="flex flex-col items-start gap-4 rounded-tile bg-surface p-5">
            <p className="m-0 text-[15px]">{pantryErrorMessage(foodsQuery.error)}</p>
            <Button size="md" onClick={() => foodsQuery.refetch()}>
              Tornar-ho a provar
            </Button>
          </div>
        ) : foodsQuery.isSuccess && foods.length === 0 ? (
          <div className="flex flex-col items-start gap-3 pt-4">
            <p className="m-0 text-[15px] text-muted">El rebost és buit. Primer afegeix-hi els aliments que menges sovint.</p>
            <Link
              to="/rebost/nou"
              className="mt-2 inline-flex h-14 items-center gap-2.5 rounded-full bg-ink px-6 font-medium text-white no-underline"
            >
              <Icon name="plus" size={20} strokeWidth={2} />
              Crear un aliment
            </Link>
          </div>
        ) : (
          <>
            <label className="flex h-12 items-center gap-2.5 rounded-full bg-surface px-4 text-faint focus-within:ring-2 focus-within:ring-accent">
              <Icon name="search" size={18} strokeWidth={1.8} />
              <span className="sr-only">Cerca al rebost</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca al rebost"
                className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
              />
            </label>

            <ul aria-label="Aliments del rebost" aria-busy={foodsQuery.isPending} className="m-0 flex list-none flex-col p-0">
              {foodsQuery.isPending &&
                [0, 1, 2, 3].map((i) => <li key={i} className="my-1 h-16 animate-pulse rounded-2xl bg-surface" />)}
              {visible.map((food) => (
                <li key={food.id}>
                  <Link
                    to={`/afegir/${food.id}${params()}`}
                    className="-mx-2 flex items-center gap-3.5 rounded-2xl px-2 py-2 text-ink no-underline transition-colors hover:bg-surface"
                  >
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-surface">
                      <FoodAvatar name={food.name} size={38} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-medium">{food.name}</span>
                      <span className="truncate font-mono text-xs text-muted">{formatInt(food.kcal)} kcal · 100 g</span>
                      {food.unit_name && food.unit_grams && (
                        <span className="truncate font-mono text-xs text-muted">
                          {food.unit_name} = {formatGrams(food.unit_grams)} g
                        </span>
                      )}
                    </div>
                    <Icon name="plus" size={18} strokeWidth={2} className="shrink-0 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>

            {foodsQuery.isSuccess && visible.length === 0 && (
              <div className="flex flex-col items-start gap-2">
                <p className="m-0 text-sm text-muted">No tens cap “{query.trim()}” al rebost.</p>
                <Link to="/rebost/nou" className="text-sm font-medium text-accent">
                  Crear-lo ara
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </ScreenShell>
  )
}
