import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../features/auth/authContext'
import { ApiContext, type Api } from './apiContext'

type DataProviderProps = {
  api: Api
  /** Tests pass their own client (no retries); the app creates one. */
  queryClient?: QueryClient
  children: ReactNode
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  })
}

export function DataProvider({ api, queryClient, children }: DataProviderProps) {
  const [client] = useState(() => queryClient ?? createQueryClient())
  const { user } = useAuth()
  const userId = user?.id ?? null
  const previousUser = useRef(userId)

  // Never show one account's cached data to the next account on the same device.
  // Only clear when a signed-in user leaves or changes: clearing on sign-in would wipe the
  // queries the first screen has just started (children's effects run before this one).
  useEffect(() => {
    if (previousUser.current !== null && previousUser.current !== userId) client.clear()
    previousUser.current = userId
  }, [client, userId])

  return (
    <QueryClientProvider client={client}>
      <ApiContext value={api}>{children}</ApiContext>
    </QueryClientProvider>
  )
}
