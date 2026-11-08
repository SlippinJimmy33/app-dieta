import { describe, expect, it } from 'vitest'
import { authErrorMessage, genericErrorMessage, networkErrorMessage } from './authErrors'

describe('authErrorMessage', () => {
  it('translates known Supabase error codes', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', status: 400 })).toBe(
      'L’email o la contrasenya no són correctes.',
    )
    expect(authErrorMessage({ code: 'user_already_exists', status: 422 })).toMatch(/Ja hi ha un compte/)
  })

  it('detects network failures', () => {
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })).toBe(networkErrorMessage)
  })

  it('treats any 429 as rate limiting', () => {
    expect(authErrorMessage({ code: 'something_new', status: 429 })).toMatch(/Massa intents/)
  })

  it('falls back to a generic message', () => {
    expect(authErrorMessage({ code: 'unexpected_failure', status: 500 })).toBe(genericErrorMessage)
    expect(authErrorMessage(null)).toBe(genericErrorMessage)
  })
})
