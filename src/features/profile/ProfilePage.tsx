import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { PageHeader } from '../../components/ui/PageHeader'
import { formatInt } from '../../lib/format'
import { useToday } from '../../lib/useToday'
import { displayNameOf, useAuth } from '../auth/authContext'
import { useGoal } from '../log/useLog'

export function ProfilePage() {
  const { status, user, signOut } = useAuth()
  const today = useToday()
  const goalQuery = useGoal(today)
  const [signingOut, setSigningOut] = useState(false)
  const name = displayNameOf(user)
  const goal = goalQuery.data

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    // The auth listener redirects to /entrar; nothing else to do here.
  }

  return (
    <>
      <PageHeader eyebrow="Compte i objectius" title={name ?? 'Perfil'} />

      <section aria-labelledby="goals-title" className="mx-6 mt-6 flex flex-col gap-4 rounded-tile bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 id="goals-title" className="label-mono m-0 text-[10px] font-normal">
            Objectius diaris
          </h2>
          {goal && (
            <Link to="/perfil/objectius" className="text-sm font-medium text-accent">
              Editar
            </Link>
          )}
        </div>
        {goal ? (
          <dl className="m-0 grid grid-cols-4 gap-2">
            {[
              { label: 'kcal', value: goal.kcal },
              { label: 'Prot.', value: goal.protein_g },
              { label: 'Carb.', value: goal.carbs_g },
              { label: 'Greix', value: goal.fat_g },
            ].map((g) => (
              <div key={g.label} className="flex flex-col gap-0.5">
                <dd className="m-0 text-[22px] tracking-[-0.03em]">{formatInt(g.value)}</dd>
                <dt className="order-first text-xs text-muted">{g.label}</dt>
              </div>
            ))}
          </dl>
        ) : (
          goalQuery.isSuccess && (
            <Link
              to="/perfil/objectius"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-white no-underline"
            >
              Defineix els teus objectius
            </Link>
          )
        )}
      </section>

      <section aria-label="Compte" className="mx-6 mt-3 flex flex-col gap-1 rounded-tile bg-surface p-5">
        <span className="label-mono text-[10px]">Email</span>
        <span className="text-[15px] break-all">{status === 'demo' ? 'Mode demo (sense compte)' : user?.email}</span>
      </section>

      {status === 'signedIn' && (
        <div className="px-6 pt-6">
          <Button variant="soft" className="w-full" onClick={handleSignOut} disabled={signingOut}>
            <Icon name="logout" size={20} />
            {signingOut ? 'Tancant la sessió…' : 'Tancar sessió'}
          </Button>
        </div>
      )}
    </>
  )
}
