type MaybeAuthError = { code?: string; status?: number; name?: string } | null | undefined

const messages: Record<string, string> = {
  invalid_credentials: 'L’email o la contrasenya no són correctes.',
  user_already_exists: 'Ja hi ha un compte amb aquest email. Prova d’entrar-hi.',
  email_exists: 'Ja hi ha un compte amb aquest email. Prova d’entrar-hi.',
  weak_password: 'La contrasenya és massa feble. Fes-la més llarga o barreja lletres, números i símbols.',
  email_address_invalid: 'Aquest email no sembla vàlid.',
  email_not_confirmed: 'Encara has de confirmar l’email. Revisa la safata d’entrada.',
  over_request_rate_limit: 'Massa intents seguits. Espera un moment i torna-ho a provar.',
  over_email_send_rate_limit: 'Massa intents seguits. Espera un moment i torna-ho a provar.',
  signup_disabled: 'Ara mateix no s’accepten comptes nous.',
}

export const networkErrorMessage = 'Sense connexió. Revisa internet i torna-ho a provar.'
export const genericErrorMessage = 'Alguna cosa ha fallat. Torna-ho a provar.'

/** Translates Supabase auth errors into Catalan messages for the user. */
export function authErrorMessage(error: MaybeAuthError): string {
  if (!error) return genericErrorMessage
  if (error.code && messages[error.code]) return messages[error.code]
  // Retryable fetch errors come without a code and status 0 when the request never reached Supabase.
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return networkErrorMessage
  if (error.status === 429) return messages.over_request_rate_limit
  return genericErrorMessage
}
