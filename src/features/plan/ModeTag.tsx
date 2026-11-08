import { modeProfiles } from './modes'
import type { MealMode } from './types'

// Colour per mode: training in ink, recovery in accent blue, focus in green, sleep and balanced quiet.
const styles: Record<MealMode, string> = {
  preRapid: 'bg-ink text-white',
  pre: 'bg-ink text-white',
  post: 'bg-accent text-white',
  focus: 'bg-go text-white',
  dormir: 'bg-line text-ink',
  equilibrat: 'bg-white text-ink ring-1 ring-line',
}

export function ModeTag({ mode, size = 'md' }: { mode: MealMode; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-medium whitespace-nowrap ${
        size === 'sm' ? 'h-6 px-2.5 text-[11px]' : 'h-7 px-3 text-xs'
      } ${styles[mode]}`}
    >
      {modeProfiles[mode].label}
    </span>
  )
}
