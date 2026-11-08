import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createFakeAuth, renderApp } from '../test/renderApp'

function renderAt(path: string) {
  return renderApp(path, createFakeAuth({ signedIn: true }))
}

describe('app routes', () => {
  it('shows today with the sample totals', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Avui' })).toBeInTheDocument()
    // 94 + 107 + 61 + 260 + 297 = 819 kcal from the sample day
    expect(screen.getByText('819')).toBeInTheDocument()
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

describe('pantry filters', () => {
  it('filters by category and by search text', async () => {
    const user = userEvent.setup()
    renderAt('/rebost')
    expect(await screen.findAllByRole('img')).toHaveLength(5)

    await user.click(screen.getByRole('button', { name: 'Fruita' }))
    expect(screen.getByRole('button', { name: 'Fruita' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('img').map((i) => i.getAttribute('aria-label'))).toEqual(['Poma', 'Plàtan'])

    await user.type(screen.getByRole('searchbox', { name: 'Cerca un aliment' }), 'plà')
    expect(screen.getAllByRole('img').map((i) => i.getAttribute('aria-label'))).toEqual(['Plàtan'])

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'xocolata')
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    expect(screen.getByText('Cap aliment coincideix amb la cerca.')).toBeInTheDocument()
  })
})
