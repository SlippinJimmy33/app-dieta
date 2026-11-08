/** A calendar day in the user's local time zone, as stored in log_entries.eaten_on (YYYY-MM-DD). */
export type ISODate = string

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date — never toISOString(), which would use UTC and shift days near midnight. */
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function isISODate(value: string | null | undefined): value is ISODate {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return toISODate(fromISODate(value)) === value
}

/** Noon local time, so adding days is never confused by daylight-saving changes. */
export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(iso: ISODate, days: number): ISODate {
  const date = fromISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** "Avui", "Ahir", or "Dimarts 4" for other days. */
export function dayTitle(iso: ISODate, today: ISODate): string {
  if (iso === today) return 'Avui'
  if (iso === addDays(today, -1)) return 'Ahir'
  const date = fromISODate(iso)
  const weekday = new Intl.DateTimeFormat('ca-ES', { weekday: 'long' }).format(date)
  return `${weekday.charAt(0).toLocaleUpperCase('ca')}${weekday.slice(1)} ${date.getDate()}`
}
