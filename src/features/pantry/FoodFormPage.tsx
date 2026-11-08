import { useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { FoodAvatar } from '../../components/food/FoodAvatar'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { BottomBar, ScreenShell } from '../../components/ui/ScreenShell'
import { TextField } from '../../components/ui/TextField'
import { formatInt } from '../../lib/format'
import {
  emptyFoodForm,
  energyLooksOff,
  foodToForm,
  parseDecimal,
  validateFoodForm,
  type FoodFormErrors,
  type FoodFormValues,
} from './foodForm'
import { pantryErrorMessage } from './pantryErrors'
import type { ApiError, Food } from './types'
import { useArchiveFood, useCategories, useFoods, useSaveFood } from './usePantry'

const isDuplicateName = (error: unknown) => (error as ApiError | null)?.code === '23505'

/** /rebost/nou creates a food; /rebost/:id edits one. */
export function FoodFormPage() {
  const { id } = useParams()
  const foodsQuery = useFoods()

  if (!id) return <FoodForm key="new" />

  if (foodsQuery.isPending) {
    return <ScreenShell backTo="/rebost" backLabel="Tornar al rebost" title="Editar aliment">{null}</ScreenShell>
  }

  const food = foodsQuery.data?.find((f) => f.id === id)
  if (!food) {
    return (
      <ScreenShell backTo="/rebost" backLabel="Tornar al rebost" title="Aliment no trobat">
        <p className="m-0 px-6 pt-6 text-[15px] text-muted">
          {foodsQuery.isError ? pantryErrorMessage(foodsQuery.error) : 'Potser l’has arxivat o l’enllaç no és correcte.'}
        </p>
      </ScreenShell>
    )
  }

  // Keyed so the form state starts fresh from this food's saved values.
  return <FoodForm key={food.id} food={food} />
}

function FoodForm({ food }: { food?: Food }) {
  const navigate = useNavigate()
  const categoriesQuery = useCategories()
  const save = useSaveFood()
  const archive = useArchiveFood()
  const [values, setValues] = useState<FoodFormValues>(() => (food ? foodToForm(food) : emptyFoodForm))
  const [errors, setErrors] = useState<FoodFormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const alertRef = useRef<HTMLParagraphElement>(null)

  function set<K extends keyof FoodFormValues>(key: K, value: FoodFormValues[K]) {
    const next = { ...values, [key]: value }
    setValues(next)
    // After a first submit attempt, errors update live as the user fixes them.
    if (submitted) {
      const result = validateFoodForm(next)
      setErrors(result.ok ? {} : result.errors)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const result = validateFoodForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    save.mutate(
      { id: food?.id, input: result.input },
      {
        onSuccess: () => navigate('/rebost'),
        onError: (error) => {
          // A duplicate name belongs next to the name field; anything else is shown above the save button.
          if (isDuplicateName(error)) {
            setErrors({ name: pantryErrorMessage(error) })
            nameRef.current?.focus()
          } else {
            requestAnimationFrame(() => alertRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' }))
          }
        },
      },
    )
  }

  function handleArchive() {
    if (!food) return
    archive.mutate(food.id, {
      onSuccess: () => navigate('/rebost'),
      onError: () => requestAnimationFrame(() => alertRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })),
    })
  }

  const kcal = parseDecimal(values.kcal)
  const protein = parseDecimal(values.protein)
  const carbs = parseDecimal(values.carbs)
  const fat = parseDecimal(values.fat)
  const showEnergyHint =
    kcal !== null && protein !== null && carbs !== null && fat !== null && energyLooksOff(kcal, protein, carbs, fat)

  const serverError = (isDuplicateName(save.error) ? null : save.error) ?? archive.error
  const busy = save.isPending || archive.isPending

  return (
    <ScreenShell backTo="/rebost" backLabel="Tornar al rebost" title={food ? 'Editar aliment' : 'Nou aliment'}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7 px-6 pt-6 pb-[calc(120px+env(safe-area-inset-bottom))]">
        <div aria-hidden="true" className="flex items-center gap-4 rounded-tile bg-surface p-4">
          <FoodAvatar name={values.name || '·'} size={64} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[17px] font-medium">{values.name.trim() || 'Nom de l’aliment'}</span>
            <span className="font-mono text-xs text-muted">{kcal === null ? '— kcal' : `${formatInt(kcal)} kcal`} · 100 g</span>
          </div>
        </div>

        <TextField
          label="Nom"
          name="name"
          ref={nameRef}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          maxLength={80}
          autoComplete="off"
          error={errors.name}
        />

        <fieldset className="m-0 flex flex-col gap-3 border-none p-0">
          <legend className="mb-3 p-0 text-[13px] font-medium text-ink-soft">Categoria</legend>
          <div className="flex flex-wrap gap-2">
            <Chip active={values.categoryId === null} onClick={() => set('categoryId', null)}>
              Cap
            </Chip>
            {categoriesQuery.data?.map((c) => (
              <Chip key={c.id} active={values.categoryId === c.id} onClick={() => set('categoryId', c.id)}>
                {c.name}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="m-0 flex flex-col gap-4 border-none p-0">
          <legend className="mb-4 p-0">
            <span className="label-mono">Valors per cada 100 g</span>
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Calories" suffix="kcal" inputMode="decimal" value={values.kcal} onChange={(e) => set('kcal', e.target.value)} error={errors.kcal} />
            <TextField label="Proteïna" suffix="g" inputMode="decimal" value={values.protein} onChange={(e) => set('protein', e.target.value)} error={errors.protein} />
            <TextField label="Carbohidrats" suffix="g" inputMode="decimal" value={values.carbs} onChange={(e) => set('carbs', e.target.value)} error={errors.carbs} />
            <TextField label="Greixos" suffix="g" inputMode="decimal" value={values.fat} onChange={(e) => set('fat', e.target.value)} error={errors.fat} />
          </div>
          {errors.macros && <p className="m-0 text-xs text-danger">{errors.macros}</p>}
          {showEnergyHint && !errors.macros && (
            <p className="m-0 rounded-2xl bg-surface px-4 py-3 text-xs text-ink-soft">
              Les calories no quadren gaire amb els macros. Revisa-ho, però si l’etiqueta ho diu així, pots desar igualment.
            </p>
          )}
        </fieldset>

        <fieldset className="m-0 flex flex-col gap-4 border-none p-0">
          <legend className="sr-only">Ració habitual</legend>
          <button
            type="button"
            role="switch"
            aria-checked={values.hasUnit}
            onClick={() => set('hasUnit', !values.hasUnit)}
            className="flex items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-4 text-left"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium text-ink">Té una ració habitual</span>
              <span className="text-xs text-muted">Per afegir-lo amb un toc: “1 unitat = 120 g”.</span>
            </span>
            <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${values.hasUnit ? 'bg-accent' : 'bg-line'}`}>
              <span className={`size-6 rounded-full bg-white shadow transition-transform ${values.hasUnit ? 'translate-x-5' : ''}`} />
            </span>
          </button>
          {values.hasUnit && (
            <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
              <TextField
                label="Nom de la ració"
                placeholder="1 unitat"
                value={values.unitName}
                onChange={(e) => set('unitName', e.target.value)}
                maxLength={30}
                error={errors.unitName}
              />
              <TextField
                label="Pes"
                suffix="g"
                inputMode="decimal"
                value={values.unitGrams}
                onChange={(e) => set('unitGrams', e.target.value)}
                error={errors.unitGrams}
              />
            </div>
          )}
        </fieldset>

        {serverError && (
          <p ref={alertRef} role="alert" className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {pantryErrorMessage(serverError)}
          </p>
        )}

        {food && (
          <div className="flex flex-col gap-3 border-t border-line pt-6">
            {confirmArchive ? (
              <>
                <p className="m-0 text-sm text-ink-soft">
                  L’aliment desapareixerà del rebost. Els dies on ja l’has registrat es mantenen igual.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="soft" size="md" onClick={() => setConfirmArchive(false)} disabled={busy}>
                    Cancel·lar
                  </Button>
                  <Button variant="danger" size="md" onClick={handleArchive} disabled={busy}>
                    {archive.isPending ? 'Arxivant…' : 'Sí, arxivar'}
                  </Button>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmArchive(true)} className="h-11 self-start text-[15px] font-medium text-danger">
                Arxivar aliment
              </button>
            )}
          </div>
        )}

        <BottomBar>
          <Button type="submit" className="w-full" disabled={busy}>
            {save.isPending ? 'Desant…' : food ? 'Desar canvis' : 'Afegir al rebost'}
          </Button>
        </BottomBar>
      </form>
    </ScreenShell>
  )
}
