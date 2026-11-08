import type { User } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AuthContext,
  normalizeEmail,
  type AuthClient,
  type AuthContextValue,
  type AuthResult,
  type AuthStatus,
} from './authContext'
import { authErrorMessage } from './authErrors'

type AuthProviderProps = {
  client: AuthClient | null
  /** Without Supabase configured, development builds open in demo mode with sample data. */
  allowDemo?: boolean
  children: ReactNode
}

export function AuthProvider({ client, allowDemo = false, children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (client) return 'loading'
    return allowDemo ? 'demo' : 'unconfigured'
  })
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!client) return
    // Fires INITIAL_SESSION right away, then every sign-in, sign-out and token refresh.
    // Keep the callback synchronous: calling other auth methods inside it can deadlock supabase-js.
    const { data } = client.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setStatus(session ? 'signedIn' : 'signedOut')
    })
    return () => data.subscription.unsubscribe()
  }, [client])

  const value = useMemo<AuthContextValue>(() => {
    const notConfigured: AuthResult = { ok: false, message: 'L’app encara no està connectada a Supabase.' }

    return {
      status,
      user,
      async signIn(email, password) {
        if (!client) return notConfigured
        try {
          const { error } = await client.signInWithPassword({ email: normalizeEmail(email), password })
          return error ? { ok: false, message: authErrorMessage(error) } : { ok: true, needsConfirmation: false }
        } catch {
          return { ok: false, message: authErrorMessage({ status: 0 }) }
        }
      },
      async signUp(displayName, email, password) {
        if (!client) return notConfigured
        try {
          const { data, error } = await client.signUp({
            email: normalizeEmail(email),
            password,
            options: { data: { display_name: displayName.trim() } },
          })
          if (error) return { ok: false, message: authErrorMessage(error) }
          // With email confirmation on, Supabase creates the user but returns no session yet.
          return { ok: true, needsConfirmation: !data.session }
        } catch {
          return { ok: false, message: authErrorMessage({ status: 0 }) }
        }
      },
      async signOut() {
        if (!client) return
        // A global sign-out fails offline and keeps the session; fall back to forgetting it on this device.
        const { error } = await client.signOut()
        if (error) await client.signOut({ scope: 'local' })
      },
    }
  }, [client, status, user])

  return <AuthContext value={value}>{children}</AuthContext>
}
