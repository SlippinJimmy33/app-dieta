import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Api } from '../../app/apiContext'
import { createDemoApi, createMemoryApi } from '../../app/memoryApi'
import { addDays, toISODate } from '../../lib/dates'
import { createFakeAuth, renderApp } from '../../test/renderApp'
import { demoFoods } from '../pantry/memoryPantryApi'

function setup(path: string, api: Api = createDemoApi()) {
  const user = userEvent.setup()
  renderApp(path, createFakeAuth({ signedIn: true }), { api })
  return { user, api }
}

const meal = (name: string) => screen.getByRole('region', { name })
const findMeal = (name: string) => screen.findByRole('region', { name })

describe('day view', () => {
  it('shows totals against the goal and the meals of the day', async () => {
    setup('/')
    expect(await screen.findByText('819')).toBeInTheDocument()
    expect(screen.getByText('de 2.100 kcal')).toBeInTheDocument()
    expect(screen.getByText(/Queden/)).toHaveTextContent('Queden 1.281 kcal')

    const breakfast = await within(await findMeal('Esmorzar')).findAllByRole('link', { name: /kcal/ })
    expect(breakfast.map((l) => l.textContent)).toEqual([
      expect.stringMatching(/^PPoma180 g94/),
      expect.stringMatching(/^PPlàtan120 g107/),
      expect.stringMatching(/^MMel20 g61/),
    ])
    // An empty meal offers both the + button and a dashed add row.
    expect(within(meal('Sopar')).getAllByRole('link', { name: 'Afegir al sopar' })).toHaveLength(2)
  })

  it('invites to set a goal when there is none', async () => {
    setup('/', createMemoryApi({ foods: demoFoods }))
    expect(await screen.findByRole('link', { name: /Defineix el teu objectiu/ })).toHaveAttribute('href', '/perfil/objectius')
  })

  it('says how much over the goal you are', async () => {
    const api = createMemoryApi({ foods: demoFoods, goal: { from: '2026-01-01', values: { kcal: 500, protein_g: 50, carbs_g: 50, fat_g: 10 } } })
    const honey = (await api.pantry.listFoods()).find((f) => f.name === 'Mel')!
    await api.log.addEntry({ eaten_on: toISODate(new Date()), meal: 'altres', food_id: honey.id, grams: 200 })
    setup('/', api)
    expect(await screen.findByText(/T’has passat/)).toHaveTextContent('T’has passat 108 kcal')
    // "Entre hores" only appears once it has something.
    expect(meal('Entre hores')).toBeInTheDocument()
  })

  it('moves between days and never into the future', async () => {
    const { user } = setup('/')
    await screen.findByText('819')
    expect(screen.getByRole('button', { name: 'Dia següent' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Dia anterior' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Ahir' })).toBeInTheDocument()
    expect(await within(await findMeal('Esmorzar')).findAllByRole('link', { name: 'Afegir a l’esmorzar' })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Dia següent' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Avui' })).toBeInTheDocument()
  })

  it('ignores a future date in the address', async () => {
    setup(`/?dia=${addDays(toISODate(new Date()), 3)}`)
    expect(await screen.findByRole('heading', { level: 1, name: 'Avui' })).toBeInTheDocument()
  })
})

describe('logging a food', () => {
  it('adds a portion in units to the chosen meal', async () => {
    const { user, api } = setup('/')
    const addEntry = vi.spyOn(api.log, 'addEntry')

    await user.click(await within(await findMeal('Dinar')).findByRole('link', { name: 'Afegir al dinar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Afegir al dinar' })).toBeInTheDocument()

    await user.click(await screen.findByRole('link', { name: /Poma/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Poma' })).toBeInTheDocument()
    // Defaults to its portion: 1 unit = 180 g = 94 kcal.
    expect(screen.getByRole('button', { name: /Afegir al dinar/ })).toHaveTextContent('94 kcal')

    await user.click(screen.getByRole('button', { name: 'Mitja unitat més' }))
    expect(screen.getByText('270 g')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Afegir al dinar/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Avui' })).toBeInTheDocument()
    expect(await within(await findMeal('Dinar')).findByRole('link', { name: /Poma.*270 g.*140/ })).toBeInTheDocument()
    expect(addEntry).toHaveBeenCalledWith({ eaten_on: toISODate(new Date()), meal: 'dinar', food_id: expect.any(String), grams: 270 })
  })

  it('accepts typed grams, validates them, and lets you change the meal', async () => {
    const { user, api } = setup('/afegir?apat=esmorzar')
    const addEntry = vi.spyOn(api.log, 'addEntry')

    await user.click(await screen.findByRole('link', { name: /Mel/ }))
    const grams = await screen.findByRole('textbox', { name: 'Grams' })
    await user.clear(grams)
    const submit = screen.getByRole('button', { name: /Afegir a l’esmorzar/ })
    expect(submit).toBeDisabled()
    expect(screen.getByText(/Escriu una quantitat/)).toBeInTheDocument()

    await user.type(grams, '15')
    await user.click(screen.getByRole('button', { name: 'Berenar' }))
    expect(screen.getByRole('button', { name: /Afegir al berenar/ })).toHaveTextContent('46 kcal')
    await user.click(screen.getByRole('button', { name: /Afegir al berenar/ }))

    await screen.findByRole('heading', { level: 1, name: 'Avui' })
    expect(addEntry).toHaveBeenCalledWith(expect.objectContaining({ meal: 'berenar', grams: 15 }))
  })

  it('logs to the past day you were looking at', async () => {
    const { user, api } = setup('/')
    const addEntry = vi.spyOn(api.log, 'addEntry')
    await screen.findByText('819')
    await user.click(screen.getByRole('button', { name: 'Dia anterior' }))
    await screen.findByRole('heading', { level: 1, name: 'Ahir' })

    await user.click(screen.getByRole('link', { name: 'Afegir' }))
    await user.click(await screen.findByRole('link', { name: /Plàtan/ }))
    await user.click(await screen.findByRole('button', { name: /^Afegir/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Ahir' })).toBeInTheDocument()
    expect(addEntry).toHaveBeenCalledWith(expect.objectContaining({ eaten_on: addDays(toISODate(new Date()), -1) }))
  })

  it('points to the pantry when it is empty', async () => {
    setup('/afegir', createMemoryApi())
    expect(await screen.findByRole('link', { name: 'Crear un aliment' })).toHaveAttribute('href', '/rebost/nou')
  })
})

describe('editing the log', () => {
  it('changes grams and meal of an entry', async () => {
    const { user } = setup('/')
    await user.click(await within(await findMeal('Esmorzar')).findByRole('link', { name: /Plàtan/ }))
    expect(await screen.findByRole('button', { name: /Desar canvis/ })).toHaveTextContent('107 kcal')

    await user.click(screen.getByRole('button', { name: 'Mitja unitat menys' }))
    await user.click(screen.getByRole('button', { name: 'Sopar' }))
    await user.click(screen.getByRole('button', { name: /Desar canvis/ }))

    await screen.findByRole('heading', { level: 1, name: 'Avui' })
    expect(await within(await findMeal('Sopar')).findByRole('link', { name: /Plàtan.*60 g.*53/ })).toBeInTheDocument()
    expect(within(meal('Esmorzar')).queryByRole('link', { name: /Plàtan/ })).not.toBeInTheDocument()
  })

  it('removes an entry after confirming', async () => {
    const { user } = setup('/')
    await user.click(await within(await findMeal('Dinar')).findByRole('link', { name: /Arròs bullit/ }))
    await user.click(await screen.findByRole('button', { name: 'Treure del registre' }))
    await user.click(screen.getByRole('button', { name: 'Sí, treure-ho' }))

    expect(await screen.findByText('559')).toBeInTheDocument() // 819 − 260
    expect(within(meal('Dinar')).queryByRole('link', { name: /Arròs/ })).not.toBeInTheDocument()
  })
})

describe('goals', () => {
  it('sets the first goal from the profile and shows it on the day view', async () => {
    const { user } = setup('/perfil', createMemoryApi({ foods: demoFoods }))
    await user.click(await screen.findByRole('link', { name: 'Defineix els teus objectius' }))

    await user.click(await screen.findByRole('button', { name: 'Desar objectius' }))
    expect(screen.getByText('Escriu les calories diàries.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Calories'), '2000')
    await user.type(screen.getByLabelText('Proteïna'), '150')
    await user.type(screen.getByLabelText('Carbohidrats'), '200')
    await user.type(screen.getByLabelText('Greixos'), '67')
    expect(screen.getByText(/sumen/)).toHaveTextContent('Aquests macros sumen 2.003 kcal, quadra amb l’objectiu de calories.')
    await user.click(screen.getByRole('button', { name: 'Desar objectius' }))

    const goals = await screen.findByRole('region', { name: 'Objectius diaris' })
    expect(within(goals).getByText('2.000')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Avui' }))
    expect(await screen.findByText('de 2.000 kcal')).toBeInTheDocument()
  })

  it('flags macros that do not add up to the calorie goal', async () => {
    const { user } = setup('/perfil/objectius')
    const kcal = await screen.findByLabelText('Calories')
    expect(kcal).toHaveValue('2100')
    await user.clear(kcal)
    await user.type(kcal, '1500')
    expect(screen.getByText(/sumen/)).toHaveTextContent('2.110 kcal, 610 més que l’objectiu de calories.')
  })
})
