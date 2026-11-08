import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'

// ComponentPropsWithRef: React 19 passes ref as a prop, so callers can focus the input.
type TextFieldProps = Omit<ComponentPropsWithRef<'input'>, 'id'> & {
  label: string
  hint?: string
  error?: string
  /** Unit shown inside the field, e.g. "kcal" or "g". */
  suffix?: string
  /** Optional control rendered inside the field on the right (e.g. show password). */
  trailing?: ReactNode
}

export function TextField({ label, hint, error, suffix, trailing, className = '', ...rest }: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <div
        className={`flex h-14 items-center rounded-2xl bg-surface pr-1.5 transition-shadow focus-within:ring-2 ${
          error ? 'ring-2 ring-danger focus-within:ring-danger' : 'focus-within:ring-accent'
        }`}
      >
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 border-none bg-transparent px-5 text-base text-ink outline-none placeholder:text-faint"
          {...rest}
        />
        {suffix && (
          <span aria-hidden="true" className="pr-3.5 font-mono text-xs text-muted">
            {suffix}
          </span>
        )}
        {trailing}
      </div>
      {error && (
        <span id={errorId} className="text-xs text-danger">
          {error}
        </span>
      )}
      {hint && (
        <span id={hintId} className="text-xs text-muted">
          {hint}
        </span>
      )}
    </div>
  )
}
