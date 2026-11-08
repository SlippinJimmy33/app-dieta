import { useState } from 'react'
import { FoodIllustration } from '../../components/food/FoodIllustration'
import { IconButton } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { PageHeader } from '../../components/ui/PageHeader'
import { formatInt } from '../../lib/format'
import { sampleFoods } from '../../mocks/sampleData'

const ALL = 'Tots'

export function PantryPage() {
  const [category, setCategory] = useState(ALL)
  const [query, setQuery] = useState('')

  const categories = [ALL, ...new Set(sampleFoods.map((f) => f.category))]
  const needle = query.trim().toLocaleLowerCase('ca')
  const foods = sampleFoods.filter(
    (f) =>
      (category === ALL || f.category === category) &&
      (needle === '' || f.name.toLocaleLowerCase('ca').includes(needle)),
  )

  return (
    <>
      <PageHeader
        eyebrow="El teu rebost"
        title="Rebost"
        action={<span className="pb-1.5 font-mono text-xs text-muted">{sampleFoods.length} aliments</span>}
      />

      <div className="flex gap-2.5 px-6 pt-6">
        <label className="flex h-12 flex-1 items-center gap-2.5 rounded-full bg-surface px-4 text-faint focus-within:ring-2 focus-within:ring-accent">
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
        <IconButton label="Escanejar codi de barres" variant="primary" size="lg">
          <Icon name="barcode" size={20} />
        </IconButton>
      </div>

      <div role="group" aria-label="Categories" className="flex gap-2 overflow-x-auto px-6 pt-4 [scrollbar-width:none]">
        {categories.map((c) => (
          <Chip key={c} active={c === category} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <ul className="m-0 grid list-none grid-cols-2 gap-3 px-6 pt-5">
        {foods.map((f) => (
          <li key={f.kind} className="flex h-[196px] flex-col rounded-tile bg-surface p-4">
            <span className="label-mono text-[10px]">{f.category}</span>
            <div className="flex flex-1 items-center justify-center">
              <FoodIllustration kind={f.kind} size={108} label={f.name} />
            </div>
            <span className="text-[15px] font-medium">{f.name}</span>
            <span className="mt-0.5 font-mono text-[11px] text-muted">{formatInt(f.per100g.kcal)} kcal · 100 g</span>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="flex h-[196px] w-full flex-col items-center justify-center gap-2.5 rounded-tile border-[1.5px] border-dashed border-[#c7c7cc] bg-white p-4 transition-colors hover:bg-surface"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-accent text-white">
              <Icon name="plus" size={20} strokeWidth={2} />
            </span>
            <span className="text-[15px] font-medium">Afegir aliment</span>
            <span className="text-center text-xs leading-snug text-muted">
              Fes una foto i<br />
              en traiem el fons
            </span>
          </button>
        </li>
      </ul>
      {foods.length === 0 && <p className="px-6 pt-2 text-sm text-muted">Cap aliment coincideix amb la cerca.</p>}
    </>
  )
}
