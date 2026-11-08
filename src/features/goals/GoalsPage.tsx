import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { BottomBar, ScreenShell } from '../../components/ui/ScreenShell'
import { TextField } from '../../components/ui/TextField'
import { formatInt } from '../../lib/format'
import { useToday } from '../../lib/useToday'
import { parseDecimal } from '../pantry/foodForm'
import { pantryErrorMessage } from '../pantry/pantryErrors'
import type { NutritionGoal } from '../log/types'
import { useGoal, useSaveGoal } from '../log/useLog'
import { goalToForm, kcalFromMacros, validateGoalForm, type GoalFormErrors, type GoalFormValues } from './goalsForm'

export function GoalsPage() {
  const today = useToday()
  const goalQuery = useGoal(today)

  return (
    <ScreenShell backTo="/perfil" backLabel="Tornar al perfil" title="Objectius diaris">
      {goalQuery.isPending ? null : goalQuery.isError ? (
        <p role="alert" className="m-0 px-6 pt-6 text-[15px] text-muted">
          {pantryErrorMessage(goalQuery.error)}
        </p>
      ) : (
        <GoalsForm key={goalQuery.data?.id ?? 'new'} goal={goalQuery.data} today={today} />
      )}
    </ScreenShell>
  )
}

function GoalsForm({ goal, today }: { goal: NutritionGoal | null; today: string }) {
  const navigate = useNavigate()
  const save = useSaveGoal()
  const [values, setValues] = useState<GoalFormValues>(() => goalToForm(goal))
  const [errors, setErrors] = useState<GoalFormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function set(key: keyof GoalFormValues, value: string) {
    const next = { ...values, [key]: value }
    setValues(next)
    if (submitted) {
      const result = validateGoalForm(next)
      setErrors(result.ok ? {} : result.errors)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const result = validateGoalForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    save.mutate({ from: today, values: result.values }, { onSuccess: () => navigate('/perfil') })
  }

  const kcal = parseDecimal(values.kcal)
  const protein = parseDecimal(values.protein)
  const carbs = parseDecimal(values.carbs)
  const fat = parseDecimal(values.fat)
  const fromMacros = protein !== null && carbs !== null && fat !== null ? kcalFromMacros(protein, carbs, fat) : null
  const gap = fromMacros !== null && kcal !== null ? fromMacros - Math.round(kcal) : null

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7 px-6 pt-6 pb-[calc(120px+env(safe-area-inset-bottom))]">
      <p className="m-0 text-[15px] text-muted">
        {goal
          ? 'S’apliquen des d’avui. Els dies anteriors conserven l’objectiu que tenien.'
          : 'Són els teus primers objectius: també s’aplicaran als dies anteriors.'}
      </p>

      <TextField
        label="Calories"
        suffix="kcal / dia"
        inputMode="numeric"
        value={values.kcal}
        onChange={(e) => set('kcal', e.target.value)}
        error={errors.kcal}
      />

      <fieldset className="m-0 flex flex-col gap-4 border-none p-0">
        <legend className="mb-4 p-0">
          <span className="label-mono">Macros per dia</span>
        </legend>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Proteïna" suffix="g" inputMode="decimal" value={values.protein} onChange={(e) => set('protein', e.target.value)} error={errors.protein} />
          <TextField label="Carbohidrats" suffix="g" inputMode="decimal" value={values.carbs} onChange={(e) => set('carbs', e.target.value)} error={errors.carbs} />
          <TextField label="Greixos" suffix="g" inputMode="decimal" value={values.fat} onChange={(e) => set('fat', e.target.value)} error={errors.fat} />
        </div>

        {fromMacros !== null && (
          <p aria-live="polite" className="m-0 rounded-2xl bg-surface px-4 py-3 text-sm text-ink-soft">
            Aquests macros sumen <strong className="font-semibold text-ink">{formatInt(fromMacros)} kcal</strong>
            {gap !== null && Math.abs(gap) > Math.max(50, (kcal ?? 0) * 0.05)
              ? `, ${formatInt(Math.abs(gap))} ${gap > 0 ? 'més' : 'menys'} que l’objectiu de calories.`
              : gap !== null
                ? ', quadra amb l’objectiu de calories.'
                : '.'}
          </p>
        )}
      </fieldset>

      {save.error != null && (
        <p role="alert" className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {pantryErrorMessage(save.error)}
        </p>
      )}

      <BottomBar>
        <Button type="submit" className="w-full" disabled={save.isPending}>
          {save.isPending ? 'Desant…' : 'Desar objectius'}
        </Button>
      </BottomBar>
    </form>
  )
}
