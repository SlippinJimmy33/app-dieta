// Catalan locale skips grouping for 4-digit numbers by default ("2100"); force it so kcal read "2.100".
const integerFormat = new Intl.NumberFormat('ca-ES', {
  maximumFractionDigits: 0,
  useGrouping: 'always',
})

const decimalFormat = new Intl.NumberFormat('ca-ES', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
  useGrouping: 'always',
})

export function formatInt(value: number): string {
  return integerFormat.format(Math.round(value))
}

export function formatGrams(value: number): string {
  return decimalFormat.format(value)
}

export function formatDayLabel(date: Date): string {
  const weekday = new Intl.DateTimeFormat('ca-ES', { weekday: 'long' }).format(date)
  const day = date.getDate()
  const month = new Intl.DateTimeFormat('ca-ES', { month: 'short' })
    .format(date)
    .replace('.', '')
  return `${weekday} · ${day} ${month}`
}
