import type { ReactNode } from 'react'
import { ringProgress } from '../../lib/progress'

type ProgressRingProps = {
  value: number
  max: number
  size?: number
  label: string
  children?: ReactNode
}

const STROKE = 2.5
const DOT = 6

export function ProgressRing({ value, max, size = 264, label, children }: ProgressRingProps) {
  const progress = ringProgress(value, max)
  const center = size / 2
  // Leave room for the end dot's halo so it never clips at the edge.
  const radius = center - DOT * 2
  const circumference = 2 * Math.PI * radius
  const angle = progress * 2 * Math.PI - Math.PI / 2
  const dotX = center + radius * Math.cos(angle)
  const dotY = center + radius * Math.sin(angle)

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(Math.min(Math.max(value, 0), max))}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden="true">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-track)" strokeWidth={2} />
        {progress > 0 && (
          <>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${progress * circumference} ${circumference}`}
              transform={`rotate(-90 ${center} ${center})`}
              className="transition-[stroke-dasharray] duration-700 ease-out"
            />
            <circle cx={dotX} cy={dotY} r={DOT * 2} fill="var(--color-accent)" opacity={0.15} />
            <circle cx={dotX} cy={dotY} r={DOT} fill="var(--color-accent)" />
          </>
        )}
      </svg>
      <div className="relative">{children}</div>
    </div>
  )
}
