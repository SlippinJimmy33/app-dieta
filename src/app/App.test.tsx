import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createFakeAuth, renderApp } from '../test/renderApp'
import { createDemoApi } from './memoryApi'

function renderAt(path: string) {
  return renderApp(path, createFakeAuth({ signedIn: true }), { api: createDemoApi() })
}

describe('app routes', () => {
  it('shows today with the sample totals', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Avui' })).toBeInTheDocument()
    // 94 + 107 + 61 + 260 + 297 = 819 kcal from the demo day
    expect(await screen.findByText('819')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Avui' })).toHaveAttribute('aria-current', 'page')
  })

  it('navigates to the pantry from the tab bar', async () => {
    renderAt('/')
    await userEvent.click(await screen.findByRole('link', { name: 'Rebost' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Rebost' })).toBeInTheDocument()
  })

  it('redirects unknown paths to today', async () => {
    renderAt('/no-existeix')
    expect(await screen.findByRole('heading', { level: 1, name: 'Avui' })).toBeInTheDocument()
  })
})
