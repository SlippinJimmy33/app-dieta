import type { ButtonHTMLAttributes } from 'react'

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  active?: boolean
}

export function Chip({ active = false, className = '', type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm transition-colors ${
        active ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-line'
      } ${className}`}
      {...rest}
    />
  )
}
