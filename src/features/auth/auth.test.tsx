import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createFakeAuth, renderApp, TEST_PASSWORD } from '../../test/renderApp'

describe('access control', () => {
  it('sends signed-out visitors to the login page', async () => {
    renderApp('/rebost', createFakeAuth())
    expect(await screen.findByRole('heading', { level: 1, name: 'Entra' })).toBeInTheDocument()
  })

  it('opens in demo mode when Supabase is not configured in development', () => {
    renderApp('/', null, { allowDemo: true })
    expect(screen.getByRole('heading', { level: 1, name: 'Avui' })).toBeInTheDocument()
    expect(screen.getByText(/Mode demo/)).toBeInTheDocument()
  })

  it('explains the missing configuration in production builds', () => {
    renderApp('/', null)
    expect(screen.getByRole('heading', { name: 'Falta connectar Supabase' })).toBeInTheDocument()
  })
})

describe('sign in', () => {
  it('shows a Catalan error for wrong credentials, then returns to the requested page', async () => {
    const user = userEvent.setup()
    const auth = createFakeAuth()
    renderApp('/rebost', auth)

    await user.type(await screen.findByLabelText('Email'), '  Anna@Example.com ')
    await user.type(screen.getByLabelText('Contrasenya'), 'dolenta')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('L’email o la contrasenya no són correctes.')

    await user.clear(screen.getByLabelText('Contrasenya'))
    await user.type(screen.getByLabelText('Contrasenya'), TEST_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Rebost' })).toBeInTheDocument()
    expect(auth.signInWithPassword).toHaveBeenLastCalledWith({ email: 'anna@example.com', password: TEST_PASSWORD })
  })

  it('validates the form before calling Supabase', async () => {
    const user = userEvent.setup()
    const auth = createFakeAuth()
    renderApp('/entrar', auth)

    await user.click(await screen.findByRole('button', { name: 'Entrar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escriu un email vàlid.')

    await user.type(screen.getByLabelText('Email'), 'anna@example.com')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escriu la contrasenya.')
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('can reveal the password', async () => {
    const user = userEvent.setup()
    renderApp('/entrar', createFakeAuth())
    const field = await screen.findByLabelText('Contrasenya')
    expect(field).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar la contrasenya' }))
    expect(field).toHaveAttribute('type', 'text')
  })
})

describe('sign up', () => {
  it('requires a name and an 8+ character password, then creates the account', async () => {
    const user = userEvent.setup()
    const auth = createFakeAuth()
    renderApp('/entrar', auth)

    await user.click(await screen.findByRole('button', { name: 'Sóc nou' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Crea el teu compte' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'nou@example.com')
    await user.type(screen.getByLabelText('Contrasenya'), 'curta')
    const submit = () => user.click(screen.getByRole('button', { name: 'Crear compte' }))

    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent('Escriu com et dius.')

    await user.type(screen.getByLabelText('Nom'), '  Marta ')
    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent('com a mínim 8 caràcters')
    expect(auth.signUp).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Contrasenya'), '-llarga')
    await submit()

    expect(await screen.findByRole('heading', { level: 1, name: 'Avui' })).toBeInTheDocument()
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'nou@example.com',
      password: 'curta-llarga',
      options: { data: { display_name: 'Marta' } },
    })
  })
})

describe('sign out', () => {
  it('returns to the login page', async () => {
    const user = userEvent.setup()
    const auth = createFakeAuth({ signedIn: true })
    renderApp('/perfil', auth)

    expect(await screen.findByRole('heading', { level: 1, name: 'Anna' })).toBeInTheDocument()
    expect(screen.getByText('anna@example.com')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tancar sessió' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Entra' })).toBeInTheDocument()
    expect(auth.signOut).toHaveBeenCalledOnce()
  })
})
