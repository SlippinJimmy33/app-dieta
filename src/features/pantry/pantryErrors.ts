import type { ApiError } from './types'

/** Translates database and network errors into Catalan for the pantry screens. */
export function pantryErrorMessage(error: unknown): string {
  const e = (error ?? {}) as ApiError
  switch (e.code) {
    case '23505':
      return 'Ja tens un aliment amb aquest nom.'
    case '23514':
      return 'Algun valor no és vàlid. Revisa les xifres.'
    case '23503':
      return 'La categoria triada ja no existeix. Tria’n una altra.'
    case '42501':
    case 'PGRST301':
      return 'La sessió ha caducat. Torna a entrar.'
  }
  if (error instanceof TypeError || /fetch|network/i.test(e.message ?? '')) {
    return 'Sense connexió. Revisa internet i torna-ho a provar.'
  }
  return 'Alguna cosa ha fallat. Torna-ho a provar.'
}
