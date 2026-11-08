import type { ISODate } from '../../lib/dates'

/** Query string that keeps the selected day (omitted for today) plus any extra params. */
export function dayQuery(day: ISODate, today: ISODate, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ ...extra, ...(day !== today ? { dia: day } : {}) })
  const query = params.toString()
  return query ? `?${query}` : ''
}

/** Where to return after logging: the day view, on the day being edited. */
export function dayHref(day: ISODate, today: ISODate): string {
  return `/${dayQuery(day, today)}`
}