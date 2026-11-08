import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { PageHeader } from '../../components/ui/PageHeader'
import { displayNameOf, useAuth } from '../auth/authContext'

export function ProfilePage() {
  const { status, user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const name = displayNameOf(user)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    // The auth listener redirects to /entrar; nothing else to do here.
  }

  return (
    <>
      <PageHeader eyebrow="Compte i objectius" title={name ?? 'Perfil'} />

      <section aria-label="Compte" className="mx-6 mt-6 flex flex-col gap-1 rounded-tile bg-surface p-5">
        <span className="label-mono text-[10px]">Email</span>
        <span className="text-[15px] break-all">{status === 'demo' ? 'Mode demo (sense compte)' : user?.email}</span>
      </section>

      <p className="px-6 pt-5 text-[15px] text-muted">Els objectius de calories i macros arriben al pas 6 de la F1.</p>

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
