import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { FoodIllustration } from '../../components/food/FoodIllustration'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from './authContext'

type Mode = 'signIn' | 'signUp'

const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const copy = {
  signIn: { title: 'Entra', subtitle: 'El teu rebost t’espera.', submit: 'Entrar', busy: 'Entrant…' },
  signUp: { title: 'Crea el teu compte', subtitle: 'Guarda els teus aliments i porta el compte del dia.', submit: 'Crear compte', busy: 'Creant el compte…' },
} as const

function redirectTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  // Only same-app paths: never bounce to /entrar again or to another site.
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && from !== '/entrar' ? from : '/'
}

export function LoginPage() {
  const { status, signIn, signUp } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>('signIn')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)

  // Demo mode still shows the form (handy for design work); submitting explains Supabase is missing.
  if (status === 'signedIn') {
    return <Navigate to={redirectTarget(location.state)} replace />
  }

  const text = copy[mode]

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Escriu un email vàlid.')
      return
    }
    if (password === '') {
      setError('Escriu la contrasenya.')
      return
    }
    if (mode === 'signUp' && name.trim() === '') {
      setError('Escriu com et dius.')
      return
    }
    if (mode === 'signUp' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contrasenya ha de tenir com a mínim ${MIN_PASSWORD_LENGTH} caràcters.`)
      return
    }

    setBusy(true)
    setError(null)
    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(name, email, password)
    setBusy(false)

    if (!result.ok) {
      setError(result.message)
    } else if (result.needsConfirmation) {
      setConfirmationSentTo(email.trim())
    }
    // On success the auth listener flips status to signedIn and the redirect above takes over.
  }

  if (confirmationSentTo) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col justify-center gap-4 px-6">
        <span className="label-mono">Gairebé ja hi som</span>
        <h1 className="m-0 text-4xl font-normal tracking-[-0.04em]">Revisa el correu</h1>
        <p className="m-0 text-[15px] text-muted">
          Hem enviat un enllaç de confirmació a <strong className="font-medium text-ink">{confirmationSentTo}</strong>.
          Obre’l i després entra amb la teva contrasenya.
        </p>
        <Button
          variant="soft"
          className="mt-4"
          onClick={() => {
            setConfirmationSentTo(null)
            switchMode('signIn')
          }}
        >
          Tornar a entrar
        </Button>
      </div>
    )
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col overflow-hidden px-6 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(32px+env(safe-area-inset-bottom))]">
      <div aria-hidden="true" className="relative mx-auto h-[220px] w-full max-w-[320px]">
        <div className="absolute top-2 left-[22%] size-[200px] rounded-full border border-line" />
        <div className="absolute top-16 left-2 animate-[float_6s_ease-in-out_infinite]">
          <FoodIllustration kind="poma" size={112} label="" />
        </div>
        <div className="absolute top-0 right-6 animate-[float_7s_ease-in-out_infinite_0.8s]">
          <FoodIllustration kind="platan" size={128} label="" />
        </div>
        <div className="absolute right-[34%] bottom-0 animate-[float_8s_ease-in-out_infinite_1.6s]">
          <FoodIllustration kind="mel" size={96} label="" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <span className="label-mono">App Dieta</span>
        <h1 className="m-0 text-5xl leading-none font-normal tracking-[-0.05em]">{text.title}</h1>
        <p className="m-0 text-[15px] text-muted">{text.subtitle}</p>
      </div>

      <div role="group" aria-label="Accés" className="mt-7 grid grid-cols-2 rounded-full bg-surface p-1">
        {(['signIn', 'signUp'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => switchMode(m)}
            className={`h-10 rounded-full text-sm transition-all ${
              mode === m ? 'bg-white font-medium text-ink shadow-[0_1px_4px_rgb(10_10_10/0.1)]' : 'text-muted hover:text-ink'
            }`}
          >
            {m === 'signIn' ? 'Tinc compte' : 'Sóc nou'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-1 flex-col gap-4">
        {mode === 'signUp' && (
          <TextField
            label="Nom"
            name="name"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        )}
        <TextField
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Contrasenya"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={mode === 'signUp' ? MIN_PASSWORD_LENGTH : undefined}
          hint={mode === 'signUp' ? `Mínim ${MIN_PASSWORD_LENGTH} caràcters.` : undefined}
          required
          trailing={
            <button
              type="button"
              aria-label={showPassword ? 'Amagar la contrasenya' : 'Mostrar la contrasenya'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              className="flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-line hover:text-ink"
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} />
            </button>
          }
        />

        {error && (
          <p role="alert" className="m-0 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy || status === 'loading'} className="mt-auto w-full">
          {busy ? text.busy : text.submit}
        </Button>
      </form>
    </div>
  )
}
