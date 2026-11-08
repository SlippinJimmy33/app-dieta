import { useNavigate, useParams } from 'react-router'
import { ScreenShell } from '../../components/ui/ScreenShell'
import { dayTitle, type ISODate } from '../../lib/dates'
import { formatInt } from '../../lib/format'
import type { Nutrients } from '../../lib/nutrition'
import { pantryErrorMessage } from '../pantry/pantryErrors'
import type { Food } from '../pantry/types'
import { useCategories, useFoods } from '../pantry/usePantry'
import { dayHref, dayQuery } from './dayQuery'
import { mealInfo } from './meals'
import { PortionEditor } from './PortionEditor'
import type { LogEntry } from './types'
import { useAddEntry, useDayEntries, useDeleteEntry, useUpdateEntry } from './useLog'
import { useLogParams } from './useLogParams'

const per100gOf = (food: Food): Nutrients => ({ kcal: food.kcal, protein: food.protein_g, carbs: food.carbs_g, fat: food.fat_g })

/** Per-100 g values implied by an entry's snapshot (works even if the food was deleted since). */
const per100gOfEntry = (entry: LogEntry): Nutrients => {
  const f = 100 / entry.grams
  return { kcal: entry.kcal * f, protein: entry.protein_g * f, carbs: entry.carbs_g * f, fat: entry.fat_g * f }
}

const unitOf = (food: Food | undefined) =>
  food?.unit_name && food.unit_grams ? { name: food.unit_name, grams: food.unit_grams } : null

function useEyebrow(food: Food | undefined, day: ISODate, today: ISODate) {
  const categories = useCategories().data ?? []
  const category = categories.find((c) => c.id === food?.category_id)?.name
  const parts = [day !== today ? dayTitle(day, today) : null, category, food ? `${formatInt(food.kcal)} kcal / 100 g` : null]
  return parts.filter(Boolean).join(' · ')
}

function Missing({ backTo, title, message }: { backTo: string; title: string; message: string }) {
  return (
    <ScreenShell backTo={backTo} backLabel="Tornar" title={title}>
      <p className="m-0 px-6 pt-6 text-[15px] text-muted">{message}</p>
    </ScreenShell>
  )
}

/** /afegir/:foodId — step 2 of logging. */
export function AddPortionPage() {
  const { foodId } = useParams()
  const navigate = useNavigate()
  const { today, day, meal } = useLogParams()
  const foodsQuery = useFoods()
  const add = useAddEntry()
  const food = foodsQuery.data?.find((f) => f.id === foodId)
  const eyebrow = useEyebrow(food, day, today)
  const backTo = `/afegir${dayQuery(day, today, { apat: meal })}`

  if (foodsQuery.isPending) return <ScreenShell backTo={backTo} backLabel="Tornar a la llista">{null}</ScreenShell>
  if (!food) {
    return (
      <Missing
        backTo={backTo}
        title="Aliment no trobat"
        message={foodsQuery.isError ? pantryErrorMessage(foodsQuery.error) : 'Potser l’has arxivat del rebost.'}
      />
    )
  }

  const unit = unitOf(food)
  return (
    <ScreenShell backTo={backTo} backLabel="Tornar a la llista">
      <PortionEditor
        key={food.id}
        name={food.name}
        eyebrow={eyebrow}
        per100g={per100gOf(food)}
        unit={unit}
        initialGrams={unit?.grams ?? 100}
        initialMeal={meal}
        submitLabel={(m) => `Afegir ${mealInfo(m).target}`}
        busy={add.isPending}
        error={add.error}
        onSubmit={(m, grams) =>
          add.mutate({ eaten_on: day, meal: m, food_id: food.id, grams }, { onSuccess: () => navigate(dayHref(day, today)) })
        }
      />
    </ScreenShell>
  )
}

/** /registre/:entryId — change or remove something already logged. */
export function EditEntryPage() {
  const { entryId } = useParams()
  const navigate = useNavigate()
  const { today, day } = useLogParams()
  const entriesQuery = useDayEntries(day)
  const foodsQuery = useFoods()
  const update = useUpdateEntry()
  const remove = useDeleteEntry()
  const entry = entriesQuery.data?.find((e) => e.id === entryId)
  const food = foodsQuery.data?.find((f) => f.id === entry?.food_id)
  const eyebrow = useEyebrow(food, day, today)
  const backTo = dayHref(day, today)
  const done = () => navigate(backTo)

  if (entriesQuery.isPending || foodsQuery.isPending) return <ScreenShell backTo={backTo} backLabel="Tornar al dia">{null}</ScreenShell>
  if (!entry) {
    return (
      <Missing
        backTo={backTo}
        title="Registre no trobat"
        message={entriesQuery.isError ? pantryErrorMessage(entriesQuery.error) : 'Potser ja l’has tret del registre.'}
      />
    )
  }

  return (
    <ScreenShell backTo={backTo} backLabel="Tornar al dia">
      <PortionEditor
        key={entry.id}
        name={entry.food_name}
        eyebrow={eyebrow || dayTitle(day, today)}
        // From the entry's own snapshot, so the numbers match the day view. (If the food was edited
        // after logging and the grams change, the server re-prices from the food's current values.)
        per100g={per100gOfEntry(entry)}
        unit={unitOf(food)}
        initialGrams={entry.grams}
        initialMeal={entry.meal}
        submitLabel={() => 'Desar canvis'}
        busy={update.isPending || remove.isPending}
        error={update.error ?? remove.error}
        onSubmit={(meal, grams) => update.mutate({ id: entry.id, changes: { meal, grams } }, { onSuccess: done })}
        onDelete={() => remove.mutate({ id: entry.id, day }, { onSuccess: done })}
      />
    </ScreenShell>
  )
}
