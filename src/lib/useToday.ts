import { useEffect, useState } from 'react'
import { toISODate, type ISODate } from './dates'

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
