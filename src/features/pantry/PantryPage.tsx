import { useState } from 'react'
import { Link } from 'react-router'
import { FoodAvatar } from '../../components/food/FoodAvatar'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { PageHeader } from '../../components/ui/PageHeader'
import { formatInt } from '../../lib/format'
import { pantryErrorMessage } from './pantryErrors'
import { useCategories, useFoods } from './usePantry'

const ALL = 'all'
const NONE = 'none'

export function PantryPage() {
  const foodsQuery = useFoods()
  const categoriesQuery = useCategories()
  const [selected, setSelected] = useState(ALL)
  const [query, setQuery] = useState('')

  const foods = foodsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))

  // Only offer categories that currently hold foods; a stale selection falls back to "Tots".
  const chips = [
    { id: ALL, label: 'Tots' },
    ...categories.filter((c) => foods.some((f) => f.category_id === c.id)).map((c) => ({ id: c.id, label: c.name })),
    ...(foods.some((f) => f.category_id === null) ? [{ id: NONE, label: 'Sense categoria' }] : []),
  ]
  const active = chips.some((c) => c.id === selected) ? selected : ALL

  const needle = query.trim().toLocaleLowerCase('ca')
  const visible = foods.filter(
    (f) =>
      (active === ALL || (active === NONE ? f.category_id === null : f.category_id === active)) &&
      (needle === '' || f.name.toLocaleLowerCase('ca').includes(needle)),
  )

  const count = foodsQuery.isSuccess ? (
    <span className="pb-1.5 font-mono text-xs text-muted">
      {foods.length} {foods.length === 1 ? 'aliment' : 'aliments'}
    </span>
  ) : undefined

  return (
    <>
      <PageHeader eyebrow="El teu rebost" title="Rebost" action={count} />

      {foodsQuery.isError ? (
        <div role="alert" className="mx-6 mt-8 flex flex-col items-start gap-4 rounded-tile bg-surface p-5">
          <p className="m-0 text-[15px]">{pantryErrorMessage(foodsQuery.error)}</p>
          <Button size="md" onClick={() => foodsQuery.refetch()}>
            Tornar-ho a provar
          </Button>
        </div>
      ) : foodsQuery.isSuccess && foods.length === 0 ? (
        <div className="mx-6 mt-8 flex flex-col items-start gap-3">
          <p className="m-0 text-[15px] text-muted">
            Encara no hi ha res. Afegeix els aliments que menges sovint i després només caldrà triar-los.
          </p>
          <Link
            to="/rebost/nou"
            className="mt-2 inline-flex h-14 items-center gap-2.5 rounded-full bg-ink px-6 font-medium text-white no-underline shadow-[0_10px_30px_rgb(10_10_10/0.2)]"
          >
            <Icon name="plus" size={20} strokeWidth={2} />
            Afegir el primer aliment
          </Link>
        </div>
      ) : (
        <>
          {foodsQuery.isSuccess && (
          <div className="px-6 pt-6">
            <label className="flex h-12 items-center gap-2.5 rounded-full bg-surface px-4 text-faint focus-within:ring-2 focus-within:ring-accent">
              <Icon name="search" size={18} strokeWidth={1.8} />
              <span className="sr-only">Cerca un aliment</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca un aliment"
                className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
              />
            </label>
          </div>
          )}

          {chips.length > 2 && (
            <div role="group" aria-label="Categories" className="flex gap-2 overflow-x-auto px-6 pt-4 [scrollbar-width:none]">
              {chips.map((c) => (
                <Chip key={c.id} active={c.id === active} onClick={() => setSelected(c.id)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          )}

          <ul aria-label="Aliments" aria-busy={foodsQuery.isPending} className="m-0 grid list-none grid-cols-2 gap-3 px-6 pt-5">
            {foodsQuery.isPending &&
              [0, 1, 2, 3].map((i) => <li key={i} className="h-[196px] animate-pulse rounded-tile bg-surface" />)}

            {visible.map((f) => (
              <li key={f.id}>
                <Link
                  to={`/rebost/${f.id}`}
                  className="flex h-[196px] flex-col rounded-tile bg-surface p-4 text-ink no-underline transition-transform active:scale-[0.98]"
                >
                  <span className="label-mono truncate text-[10px]">
                    {(f.category_id && categoryName.get(f.category_id)) ?? 'Sense categoria'}
                  </span>
                  <div className="flex flex-1 items-center justify-center">
                    <FoodAvatar name={f.name} size={84} />
                  </div>
                  <span className="truncate text-[15px] font-medium">{f.name}</span>
                  <span className="mt-0.5 font-mono text-[11px] text-muted">{formatInt(f.kcal)} kcal · 100 g</span>
                </Link>
              </li>
            ))}

            {foodsQuery.isSuccess && (
              <li>
                <Link
                  to="/rebost/nou"
                  className="flex h-[196px] w-full flex-col items-center justify-center gap-2.5 rounded-tile border-[1.5px] border-dashed border-[#c7c7cc] bg-white p-4 text-ink no-underline transition-colors hover:bg-surface"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-accent text-white">
                    <Icon name="plus" size={20} strokeWidth={2} />
                  </span>
                  <span className="text-[15px] font-medium">Afegir aliment</span>
                </Link>
              </li>
            )}
          </ul>

          {foodsQuery.isSuccess && visible.length === 0 && (
            <p className="px-6 pt-2 text-sm text-muted">Cap aliment coincideix amb la cerca.</p>
          )}
        </>
      )}
    </>
  )
}
