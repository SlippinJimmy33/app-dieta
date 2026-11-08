import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './authContext'

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Carregant">
        <span className="size-2 animate-pulse rounded-full bg-accent" />
      </div>
    )
  }

  if (status === 'unconfigured') {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col justify-center gap-3 px-6">
        <span className="label-mono">Configuració</span>
        <h1 className="m-0 text-4xl font-normal tracking-[-0.04em]">Falta connectar Supabase</h1>
        <p className="m-0 text-[15px] text-muted">
          Afegeix la URL i la clau pública del projecte a <code>.env.local</code> (mira <code>.env.example</code>).
        </p>
      </div>
    )
  }

  if (status === 'signedOut') {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
