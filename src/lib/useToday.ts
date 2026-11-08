import { useEffect, useState } from 'react'
import { toISODate, type ISODate } from './dates'

/** Minutes since local midnight, refreshed every minute. */
export function useClockMinutes(): number {
  const read = () => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  }
  const [minutes, setMinutes] = useState(read)

  useEffect(() => {
    const timer = window.setInterval(() => setMinutes(read()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return minutes
}

/** Today's local date, kept current when the app stays open past midnight or comes back from the background. */
export function useToday(): ISODate {
  const [today, setToday] = useState(() => toISODate(new Date()))

  useEffect(() => {
    const refresh = () => setToday(toISODate(new Date()))
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return today
}
