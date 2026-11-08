import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'soft' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft',
  soft: 'bg-surface text-ink hover:bg-line',
  ghost: 'bg-transparent text-ink hover:bg-surface',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-6 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${variant === 'primary' ? 'shadow-[0_10px_30px_rgb(10_10_10/0.2)]' : ''} ${className}`}
      {...rest}
    />
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: Variant
  // A prop instead of a className override: two Tailwind size classes on one element conflict unpredictably.
  size?: 'md' | 'lg'
}

export function IconButton({ label, variant = 'soft', size = 'md', className = '', type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`inline-flex ${size === 'lg' ? 'size-12' : 'size-11'} shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}
