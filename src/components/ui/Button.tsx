import type { ButtonHTMLAttributes } from 'react'

// Variants and sizes are props, never className overrides: two Tailwind classes for the same
// property (h-12 vs h-14, bg-ink vs bg-danger) on one element resolve unpredictably.
type Variant = 'primary' | 'soft' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft shadow-[0_10px_30px_rgb(10_10_10/0.2)]',
  soft: 'bg-surface text-ink hover:bg-line',
  ghost: 'bg-transparent text-ink hover:bg-surface',
  danger: 'bg-danger text-white hover:opacity-90',
}

const sizes: Record<Size, string> = {
  md: 'h-12 px-5 text-[15px]',
  lg: 'h-14 px-6 text-base',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'primary', size = 'lg', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}

const iconVariants: Record<Variant, string> = { ...variants, primary: 'bg-ink text-white hover:bg-ink-soft' }

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: Variant
  size?: Size
}

export function IconButton({ label, variant = 'soft', size = 'md', className = '', type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`inline-flex ${size === 'lg' ? 'size-12' : 'size-11'} shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${iconVariants[variant]} ${className}`}
      {...rest}
    />
  )
}
