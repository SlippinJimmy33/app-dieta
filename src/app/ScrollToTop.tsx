import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Each new screen starts at the top; changing only the query (e.g. the day) keeps the position. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
