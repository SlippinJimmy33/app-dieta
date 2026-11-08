import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDemoApi } from '../../app/memoryApi'
import { createFakeAuth, renderApp } from '../../test/renderApp'

// Sunday 8 Nov 2026, 12:00 local: breakfast and lunch of the demo day are already logged.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 8, 12, 0))
  localStorage.setItem('app-dieta:recommendations', 'true')
})

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

function setup(path = '/') {
  const user = userEvent.setup()
  const api = createDemoApi()
  renderApp(path, createFakeAuth({ signedIn: true }), { api })
  return { user, api }
}

async function planWorkAndGym(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('link', { name: /Com serà el dia\?/ }))
  await user.click(await screen.findByRole('button', { name: 'Feina + gimnàs' }))
  await user.click(screen.getByRole('button', { name: 'Desar el pla del dia' }))
  await screen.findByRole('heading', { level: 1, name: 'Avui' })
}

describe('planning the day', () => {
  it('invites to plan the day when recommendations are on', async () => {
    setup()
    expect(await screen.findByRole('link', { name: /Com serà el dia\?/ })).toHaveAttribute('href', '/pla')
  })

  it('previews the mode of each meal while you describe the day', async () => {
    const { user } = setup('/pla')
    await user.click(await screen.findByRole('button', { name: 'Feina + gimnàs' }))
    const day = screen.getByRole('region', { name: 'El teu dia' })
    const snack = within(day).getByText('Berenar').closest('li')!
    expect(snack).toHaveTextContent('Pre-entrenament')
    expect(snack).toHaveTextContent('Força a les 18:30, d’aquí 1 h.')
    expect(within(day).getByText('Sopar').closest('li')).toHaveTextContent('Recuperació')
    expect(within(day).getByText('Esmorzar').closest('li')).toHaveTextContent('Focus')
  })

  it('adds, edits and removes activities', async () => {
    const { user } = setup('/pla')
    await user.click(await screen.findByRole('button', { name: 'Afegir activitat' }))
    await user.click(screen.getByRole('button', { name: 'Cardio' }))
    expect(screen.getByRole('button', { name: 'Treure Cardio de les 07:30' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'El teu dia' })).getByText('Esmorzar').closest('li')).toHaveTextContent(
      'Recuperació',
    )
    await user.click(screen.getByRole('button', { name: 'Treure Cardio de les 07:30' }))
    expect(screen.getByText('Cap activitat: un dia tranquil.')).toBeInTheDocument()
  })

  it('saves the plan and shows it on the day, with each meal’s mode', async () => {
    const { user } = setup()
    await planWorkAndGym(user)

    const summary = await screen.findByRole('region', { name: 'Pla del dia' })
    expect(summary).toHaveTextContent('Deep work 09:00–13:00')
    expect(summary).toHaveTextContent('Força 18:30–19:30')
    expect(screen.getByRole('region', { name: 'Berenar' })).toHaveTextContent('Pre-entrenament')
  })
})

describe('next meal card', () => {
  it('suggests a plate for the next meal and adds it in one tap', async () => {
    const { user, api } = setup()
    const addEntry = vi.spyOn(api.log, 'addEntry')
    await planWorkAndGym(user)

    const card = await screen.findByRole('region', { name: 'Pre-entrenament' })
    expect(card).toHaveTextContent('Següent · Berenar · 17:30')
    const plate = within(card).getByRole('list', { name: 'Plat suggerit' })
    const items = within(plate).getAllByRole('link').map((l) => l.textContent)
    expect(items[0]).toMatch(/Pit de pollastre/)
    expect(items[1]).toMatch(/Arròs bullit/)
    // Pre-workout skips fibre-heavy extras.
    expect(items.join(' ')).not.toMatch(/Poma/)

    await user.click(within(card).getByRole('button', { name: /Afegir el plat al berenar/ }))

    expect(await within(screen.getByRole('region', { name: 'Berenar' })).findByRole('link', { name: /Pit de pollastre/ })).toBeInTheDocument()
    expect(addEntry).toHaveBeenCalledWith(expect.objectContaining({ meal: 'berenar', eaten_on: '2026-11-08' }))
    // With the snack logged, the card moves on to dinner.
    expect(await screen.findByRole('region', { name: 'Recuperació' })).toHaveTextContent('Següent · Sopar · 21:00')
  })

  it('lets you pick a different mode, and go back to automatic', async () => {
    const { user } = setup()
    await planWorkAndGym(user)

    const card = await screen.findByRole('region', { name: 'Pre-entrenament' })
    await user.click(within(card).getByRole('button', { name: 'Canviar' }))
    await user.click(within(card).getByRole('button', { name: 'Focus' }))

    const focus = await screen.findByRole('region', { name: 'Focus' })
    expect(focus).toHaveTextContent('Triat per tu.')
    await user.click(within(focus).getByRole('button', { name: 'Canviar' }))
    await user.click(within(focus).getByRole('button', { name: 'Automàtic' }))
    expect(await screen.findByRole('region', { name: 'Pre-entrenament' })).toBeInTheDocument()
  })

  it('opens a suggested food with its amount already set', async () => {
    const { user } = setup()
    await planWorkAndGym(user)
    const card = await screen.findByRole('region', { name: 'Pre-entrenament' })
    const chicken = within(card).getByRole('link', { name: /Pit de pollastre/ })
    const grams = chicken.getAttribute('href')!.match(/g=([\d.]+)/)![1]

    await user.click(chicken)
    expect(await screen.findByRole('heading', { level: 1, name: 'Pit de pollastre' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Grams' })).toHaveValue(grams)
  })

  it('stays hidden when recommendations are off', async () => {
    localStorage.setItem('app-dieta:recommendations', 'false')
    setup()
    await screen.findByText('819')
    expect(screen.queryByRole('link', { name: /Com serà el dia\?/ })).not.toBeInTheDocument()
  })
})
