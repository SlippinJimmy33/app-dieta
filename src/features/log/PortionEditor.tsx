import { useState, type FormEvent } from 'react'
import { FoodAvatar } from '../../components/food/FoodAvatar'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { BottomBar } from '../../components/ui/ScreenShell'
import type { MealSlot } from '../../lib/database.types'
import { formatGrams, formatInt } from '../../lib/format'
import { scaleNutrients, type Nutrients } from '../../lib/nutrition'
import { pantryErrorMessage } from '../pantry/pantryErrors'
import { meals } from './meals'
import { formatUnits, initialMode, parseGrams, roundGrams, stepGrams, stepUnits, type PortionMode, type PortionUnit } from './portion'

type PortionEditorProps = {
  name: string
  /** Small line above the name, e.g. "Fruita · 89 kcal / 100 g". */
  eyebrow: string
  per100g: Nutrients
  unit: PortionUnit | null
  initialGrams: number
  initialMeal: MealSlot
  submitLabel: (meal: MealSlot) => string
  busy: boolean
  error: unknown
  onSubmit: (meal: MealSlot, grams: number) => void
  /** Edit mode: offers removing the entry. */
  onDelete?: () => void
}

/** Choose how much and for which meal, with calories and macros updating live. */
export function PortionEditor({
  name,
  eyebrow,
  per100g,
  unit,
  initialGrams,
  initialMeal,
  submitLabel,
  busy,
  error,
  onSubmit,
  onDelete,
}: PortionEditorProps) {
  const [mode, setMode] = useState<PortionMode>(() => initialMode(initialGrams, unit))
  const [gramsText, setGramsText] = useState(() => formatGrams(initialGrams))
  const [meal, setMeal] = useState(initialMeal)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const grams = parseGrams(gramsText)
  const n = scaleNutrients(per100g, grams ?? 0)
  const kcal = Math.round(n.kcal)
  const units = unit && grams ? grams / unit.grams : 0

  const setGrams = (g: number) => setGramsText(formatGrams(roundGrams(g)))

  function step(delta: 1 | -1) {
    if (mode === 'unit' && unit) setGrams(stepUnits(units, delta) * unit.grams)
    else setGrams(stepGrams(grams ?? 0, delta))
  }

  function switchMode(next: PortionMode) {
    // Entering unit mode snaps to the nearest half unit so the stepper reads cleanly.
    if (next === 'unit' && unit) setGrams(stepUnits(units || 1, 0) * unit.grams)
    setMode(next)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (grams !== null && !busy) onSubmit(meal, grams)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-[calc(120px+env(safe-area-inset-bottom))]">
      <div className="relative">
        {/* Soft accent glow behind the glass card, and the thin orbit from the approved design. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[300px] left-1/2 size-[300px] -translate-x-1/2 rounded-full bg-accent opacity-[0.16] blur-[70px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-[46%] size-[260px] rounded-full border border-line"
        />

        <div className="relative flex h-[230px] items-center justify-center">
          <FoodAvatar name={name} size={156} />
        </div>

        <div className="relative flex flex-col gap-1.5 px-6">
          <span className="label-mono">{eyebrow}</span>
          <h1 className="m-0 text-[44px] leading-[1.05] font-normal tracking-[-0.05em] break-words">{name}</h1>
        </div>

        <section
          aria-label="Valors de la ració"
          aria-live="polite"
          className="glass relative mx-6 mt-5 flex flex-col gap-4 rounded-tile p-5 shadow-[0_12px_40px_rgb(10_10_10/0.07)]"
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[56px] leading-none font-light tracking-[-0.05em]">{grams === null ? '—' : formatInt(kcal)}</span>
              <span className="text-[15px] text-ink-soft">kcal</span>
            </div>
            <span className="label-mono text-ink-soft">{grams === null ? '' : `per ${formatGrams(grams)} g`}</span>
          </div>
          <dl className="m-0 grid grid-cols-3 gap-3">
            {[
              { label: 'Proteïna', value: n.protein, color: 'bg-accent' },
              { label: 'Carbohidrats', value: n.carbs, color: 'bg-ink' },
              { label: 'Greixos', value: n.fat, color: 'bg-fat' },
            ].map((m) => (
              <div key={m.label} className="flex flex-col gap-1">
                <dt className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <span className={`size-1.5 rounded-full ${m.color}`} />
                  {m.label}
                </dt>
                <dd className="m-0 text-xl tracking-[-0.02em]">{formatGrams(m.value)} g</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="flex flex-col gap-6 px-6 pt-7">
        <fieldset className="m-0 flex flex-col gap-3 border-none p-0">
          <legend className="mb-3 flex w-full items-center justify-between p-0">
            <span className="text-[15px] font-medium">Quantitat</span>
          </legend>

          {unit && (
            <div role="group" aria-label="Unitat de mesura" className="grid grid-cols-2 rounded-full bg-surface p-1">
              {(['unit', 'grams'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => switchMode(m)}
                  className={`h-10 truncate rounded-full px-3 text-sm transition-all ${
                    mode === m ? 'bg-white font-medium text-ink shadow-[0_1px_4px_rgb(10_10_10/0.1)]' : 'text-muted hover:text-ink'
                  }`}
                >
                  {m === 'unit' ? `Per ${unit.name.replace(/^1\s+/, '')}` : 'Grams'}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-[24px] bg-surface p-1.5">
            <button
              type="button"
              aria-label={mode === 'unit' ? 'Mitja unitat menys' : '10 grams menys'}
              onClick={() => step(-1)}
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-[0_1px_3px_rgb(10_10_10/0.08)]"
            >
              <Icon name="minus" size={18} strokeWidth={2} />
            </button>

            {mode === 'unit' && unit ? (
              <div className="flex min-w-0 flex-col items-center" aria-live="polite">
                <span className="text-2xl tracking-[-0.03em]">
                  {formatUnits(units)} <span className="text-base text-muted">× {unit.name}</span>
                </span>
                <span className="font-mono text-xs text-muted">{grams === null ? '' : `${formatGrams(grams)} g`}</span>
              </div>
            ) : (
              <label className="flex min-w-0 items-baseline justify-center gap-1">
                <span className="sr-only">Grams</span>
                <input
                  value={gramsText}
                  onChange={(e) => setGramsText(e.target.value)}
                  inputMode="decimal"
                  aria-invalid={grams === null ? true : undefined}
                  className="w-24 border-none bg-transparent text-center text-2xl tracking-[-0.03em] text-ink outline-none"
                />
                <span aria-hidden="true" className="text-base text-muted">
                  g
                </span>
              </label>
            )}

            <button
              type="button"
              aria-label={mode === 'unit' ? 'Mitja unitat més' : '10 grams més'}
              onClick={() => step(1)}
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-[0_1px_3px_rgb(10_10_10/0.08)]"
            >
              <Icon name="plus" size={18} strokeWidth={2} />
            </button>
          </div>
          {grams === null && <p className="m-0 text-xs text-danger">Escriu una quantitat entre 0 i 5.000 g.</p>}
        </fieldset>

        <fieldset className="m-0 flex flex-col gap-3 border-none p-0">
          <legend className="mb-3 p-0 text-[15px] font-medium">Àpat</legend>
          <div className="flex flex-wrap gap-2">
            {meals.map((m) => (
              <Chip key={m.slot} active={m.slot === meal} onClick={() => setMeal(m.slot)}>
                {m.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        {error != null && (
          <p role="alert" className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {pantryErrorMessage(error)}
          </p>
        )}

        {onDelete && (
          <div className="flex flex-col gap-3 border-t border-line pt-6">
            {confirmDelete ? (
              <>
                <p className="m-0 text-sm text-ink-soft">Es traurà del registre d’aquest dia.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="soft" size="md" onClick={() => setConfirmDelete(false)} disabled={busy}>
                    Cancel·lar
                  </Button>
                  <Button variant="danger" size="md" onClick={onDelete} disabled={busy}>
                    Sí, treure-ho
                  </Button>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="h-11 self-start text-[15px] font-medium text-danger">
                Treure del registre
              </button>
            )}
          </div>
        )}
      </div>

      <BottomBar>
        <Button type="submit" className="w-full" disabled={busy || grams === null}>
          <span className="truncate">{submitLabel(meal)}</span>
          {grams !== null && (
            <>
              <span className="opacity-50">·</span>
              <span className="shrink-0 font-mono text-sm">{formatInt(kcal)} kcal</span>
            </>
          )}
        </Button>
      </BottomBar>
    </form>
  )
}
