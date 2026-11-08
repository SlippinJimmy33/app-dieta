import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

/** The slice of supabase.auth the app uses; tests pass a fake with the same shape. */
export type AuthClient = Pick<SupabaseClient['auth'], 'onAuthStateChange' | 'signInWithPassword' | 'signUp' | 'signOut'>

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut' | 'demo' | 'unconfigured'

export type AuthResult = { ok: true; needsConfirmation: boolean } | { ok: false; message: string }

export type AuthContextValue = {
  status: AuthStatus
  user: User | null
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (displayName: string, email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function displayNameOf(user: User | null): string | null {
  const name: unknown = user?.user_metadata?.display_name
  return typeof name === 'string' && name.trim() !== '' ? name.trim() : null
}
