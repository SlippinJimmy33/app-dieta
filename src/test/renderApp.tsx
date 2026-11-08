import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { AppRoutes } from '../app/App'
import { DataProvider } from '../app/DataProvider'
import type { AuthClient } from '../features/auth/authContext'
import { AuthProvider } from '../features/auth/AuthProvider'
import { createMemoryPantryApi } from '../features/pantry/memoryPantryApi'
import type { PantryApi } from '../features/pantry/types'

export const TEST_PASSWORD = 'contrasenya-correcta'

function makeUser(email: string, displayName?: string): User {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    email,
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: displayName ? { display_name: displayName } : {},
    created_at: '2026-01-01T00:00:00Z',
  } as User
}

function makeSession(user: User): Session {
  return { access_token: 'token', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600, user } as Session
}

/** In-memory stand-in for supabase.auth that behaves like the real one for the calls the app makes. */
export function createFakeAuth({ signedIn = false } = {}) {
  let session: Session | null = signedIn ? makeSession(makeUser('anna@example.com', 'Anna')) : null
  const listeners = new Set<(event: AuthChangeEvent, session: Session | null) => void>()
  const emit = (event: AuthChangeEvent) => listeners.forEach((l) => l(event, session))

  const client = {
    onAuthStateChange: vi.fn((callback: (event: AuthChangeEvent, session: Session | null) => void) => {
      listeners.add(callback)
      queueMicrotask(() => callback('INITIAL_SESSION', session))
      return { data: { subscription: { id: 'sub', callback, unsubscribe: () => listeners.delete(callback) } } }
    }),
    signInWithPassword: vi.fn(async ({ email, password }: { email: string; password: string }) => {
      if (password !== TEST_PASSWORD) {
        return {
          data: { user: null, session: null },
          error: { name: 'AuthApiError', code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' },
        }
      }
      session = makeSession(makeUser(email))
      emit('SIGNED_IN')
      return { data: { user: session.user, session }, error: null }
    }),
    signUp: vi.fn(async ({ email, options }: { email: string; password: string; options?: { data?: { display_name?: string } } }) => {
      session = makeSession(makeUser(email, options?.data?.display_name))
      emit('SIGNED_IN')
      return { data: { user: session.user, session }, error: null }
    }),
    signOut: vi.fn(async () => {
      session = null
      emit('SIGNED_OUT')
      return { error: null }
    }),
  }

  return client as typeof client & AuthClient
}

type RenderOptions = { allowDemo?: boolean; pantry?: PantryApi }

export function renderApp(path: string, client: AuthClient | null, { allowDemo = false, pantry }: RenderOptions = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = render(
    <AuthProvider client={client} allowDemo={allowDemo}>
      <DataProvider api={{ pantry: pantry ?? createMemoryPantryApi() }} queryClient={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </DataProvider>
    </AuthProvider>,
  )
  return { ...view, queryClient }
}
