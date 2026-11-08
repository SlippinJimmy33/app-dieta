import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string
  hint?: string
  /** Optional control rendered inside the field on the right (e.g. show password). */
  trailing?: ReactNode
}

export function TextField({ label, hint, trailing, className = '', ...rest }: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <div className="flex h-14 items-center rounded-2xl bg-surface pr-1.5 transition-shadow focus-within:ring-2 focus-within:ring-accent">
        <input
          id={id}
          aria-describedby={hint ? hintId : undefined}
          className="h-full min-w-0 flex-1 border-none bg-transparent px-5 text-base text-ink outline-none placeholder:text-faint"
          {...rest}
        />
        {trailing}
      </div>
      {hint && (
        <span id={hintId} className="text-xs text-muted">
          {hint}
        </span>
      )}
    </div>
  )
}
