import { Icon } from '../../components/ui/Icon'

type RecommendationsToggleProps = {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

/** Turns smart-eating recommendations on or off for the day view. Green when on, grey when off. */
export function RecommendationsToggle({ enabled, onChange }: RecommendationsToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`flex w-full items-center gap-3.5 rounded-[24px] border px-4 py-3.5 text-left transition-colors duration-300 ${
        enabled ? 'border-go/25 bg-go-soft' : 'border-transparent bg-surface'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
          enabled ? 'bg-go text-white' : 'bg-white text-faint'
        }`}
      >
        <Icon name="sparkle" size={20} strokeWidth={1.6} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium text-ink">Recomanacions</span>
        <span className="truncate text-xs text-muted">Alimentació intel·ligent</span>
      </span>
      <span
        aria-hidden="true"
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${
          enabled ? 'bg-go' : 'bg-line'
        }`}
      >
        <span
          className={`size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(10_10_10/0.2)] transition-transform duration-300 ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </span>
    </button>
  )
}
