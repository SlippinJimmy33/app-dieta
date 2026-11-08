import { formatInt } from '../../lib/format'
import { ringProgress } from '../../lib/progress'

type MacroStatProps = {
  label: string
  value: number
  /** Without a goal only the amount is shown. */
  goal?: number
  color: string
}

export function MacroStat({ label, value, goal, color }: MacroStatProps) {
  const pct = goal ? ringProgress(value, goal) * 100 : 0

  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-mono truncate text-[10px]">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-[26px] tracking-[-0.03em]">{formatInt(value)}</span>
        <span className="text-xs text-muted">{goal ? `/ ${formatInt(goal)} g` : 'g'}</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}
