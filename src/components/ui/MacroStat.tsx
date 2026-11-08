import { formatInt } from '../../lib/format'
import { ringProgress } from '../../lib/progress'

type MacroStatProps = {
  label: string
  value: number
  goal: number
  color: string
}

export function MacroStat({ label, value, goal, color }: MacroStatProps) {
  const pct = ringProgress(value, goal) * 100

  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-mono text-[10px]">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-[26px] tracking-[-0.03em]">{formatInt(value)}</span>
        <span className="text-xs text-muted">/ {formatInt(goal)} g</span>
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
