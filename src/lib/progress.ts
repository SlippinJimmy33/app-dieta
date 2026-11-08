/** Fraction of a goal reached, clamped to 0..1; 0 when the goal is missing or invalid. */
export function ringProgress(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
  return Math.min(Math.max(value / max, 0), 1)
}
