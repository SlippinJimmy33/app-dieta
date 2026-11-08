import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createFakeAuth, renderApp } from '../../test/renderApp'
import { createMemoryApi } from '../../app/memoryApi'
import { demoFoods } from './memoryPantryApi'
import { pantryKeys } from './usePantry'

function setup(path: string, api = createMemoryApi({ foods: demoFoods })) {
  const user = userEvent.setup()
  const view = renderApp(path, createFakeAuth({ signedIn: true }), { api })
  return { user, pantry: api.pantry, ...view }
}

const foodNames = () =>
  within(screen.getByRole('list', { name: 'Aliments' }))
    .getAllByRole('link')
    .map((l) => l.textContent ?? '')
    .filter((t) => !t.includes('Afegir aliment'))

describe('pantry list', () => {
  it('lists the active foods sorted by name, with their category', async () => {
    setup('/rebost')
    expect(await screen.findByRole('link', { name: /Arròs bullit/ })).toBeInTheDocument()
    expect(foodNames()).toHaveLength(5)
    expect(foodNames()[0]).toMatch(/^Cereals.*Arròs bullit.*130 kcal/)
    expect(screen.getByText('5 aliments')).toBeInTheDocument()
  })

  it('filters by category and by search text', async () => {
    const { user } = setup('/rebost')
    await screen.findByRole('link', { name: /Poma/ })

    await user.click(screen.getByRole('button', { name: 'Fruita' }))
    expect(foodNames()).toHaveLength(2)
    expect(screen.getByRole('link', { name: /^Fruita Plàtan/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Fruita Poma/ })).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Cerca un aliment' }), 'plà')
    expect(foodNames()).toHaveLength(1)

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'xocolata')
    expect(foodNames()).toHaveLength(0)
    expect(screen.getByText('Cap aliment coincideix amb la cerca.')).toBeInTheDocument()
  })

  it('shows an inviting empty state for a new account', async () => {
    setup('/rebost', createMemoryApi())
    expect(await screen.findByRole('link', { name: 'Afegir el primer aliment' })).toHaveAttribute('href', '/rebost/nou')
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('explains load errors and can retry', async () => {
    const api = createMemoryApi({ foods: demoFoods })
    const listFoods = vi.spyOn(api.pantry, 'listFoods').mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { user } = setup('/rebost', api)

    expect(await screen.findByRole('alert')).toHaveTextContent('Sense connexió')
    await user.click(screen.getByRole('button', { name: 'Tornar-ho a provar' }))
    expect(await screen.findByRole('link', { name: /Poma/ })).toBeInTheDocument()
    expect(listFoods).toHaveBeenCalledTimes(2)
  })
})

describe('creating a food', () => {
  it('validates, saves the parsed values and returns to the pantry', async () => {
    const { user, pantry } = setup('/rebost/nou')
    const createFood = vi.spyOn(pantry, 'createFood')

    await user.click(await screen.findByRole('button', { name: 'Afegir al rebost' }))
    expect(screen.getByText('Posa-li un nom.')).toBeInTheDocument()
    expect(screen.getByLabelText('Calories')).toHaveAttribute('aria-invalid', 'true')
    expect(createFood).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Nom'), 'Iogurt grec')
    await user.click(screen.getByRole('button', { name: 'Làctics' }))
    await user.type(screen.getByLabelText('Calories'), '97')
    await user.type(screen.getByLabelText('Proteïna'), '9')
    await user.type(screen.getByLabelText('Carbohidrats'), '3,6')
    await user.type(screen.getByLabelText('Greixos'), '5')
    // Errors clear live once fixed.
    expect(screen.queryByText('Posa-li un nom.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: /Té una ració habitual/ }))
    await user.type(screen.getByLabelText('Nom de la ració'), '1 iogurt')
    await user.type(screen.getByLabelText('Pes'), '125')
    await user.click(screen.getByRole('button', { name: 'Afegir al rebost' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Rebost' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Iogurt grec/ })).toHaveTextContent('Làctics')
    expect(createFood).toHaveBeenCalledWith({
      name: 'Iogurt grec',
      category_id: 'cat-5',
      kcal: 97,
      protein_g: 9,
      carbs_g: 3.6,
      fat_g: 5,
      unit_name: '1 iogurt',
      unit_grams: 125,
    })
  })

  it('reports a duplicate name from the database', async () => {
    const { user } = setup('/rebost/nou')
    await user.type(await screen.findByLabelText('Nom'), 'poma')
    for (const [label, value] of [['Calories', '52'], ['Proteïna', '0'], ['Carbohidrats', '14'], ['Greixos', '0']]) {
      await user.type(screen.getByLabelText(label), value)
    }
    await user.click(screen.getByRole('button', { name: 'Afegir al rebost' }))
    expect(await screen.findByText('Ja tens un aliment amb aquest nom.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nom')).toHaveFocus()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Nou aliment' })).toBeInTheDocument()
  })

  it('warns, without blocking, when calories do not match the macros', async () => {
    const { user } = setup('/rebost/nou')
    await user.type(await screen.findByLabelText('Calories'), '890')
    await user.type(screen.getByLabelText('Proteïna'), '1')
    await user.type(screen.getByLabelText('Carbohidrats'), '22')
    await user.type(screen.getByLabelText('Greixos'), '0')
    expect(screen.getByText(/no quadren gaire/)).toBeInTheDocument()
  })
})

describe('editing and archiving', () => {
  it('opens a food prefilled, saves changes and keeps the rest', async () => {
    const { user, pantry } = setup('/rebost')
    await user.click(await screen.findByRole('link', { name: /Plàtan/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Editar aliment' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toHaveValue('Plàtan')
    expect(screen.getByLabelText('Proteïna')).toHaveValue('1,1')
    expect(screen.getByRole('button', { name: 'Fruita' })).toHaveAttribute('aria-pressed', 'true')

    await user.clear(screen.getByLabelText('Calories'))
    await user.type(screen.getByLabelText('Calories'), '90')
    await user.click(screen.getByRole('button', { name: 'Desar canvis' }))

    expect(await screen.findByRole('link', { name: /Plàtan.*90 kcal/ })).toBeInTheDocument()
    const saved = (await pantry.listFoods()).find((f) => f.name === 'Plàtan')
    expect(saved).toMatchObject({ kcal: 90, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 })
  })

  it('archives only after confirming', async () => {
    const { user } = setup('/rebost')
    await user.click(await screen.findByRole('link', { name: /Mel/ }))
    await user.click(await screen.findByRole('button', { name: 'Arxivar aliment' }))
    await user.click(screen.getByRole('button', { name: 'Cancel·lar' }))
    await user.click(screen.getByRole('button', { name: 'Arxivar aliment' }))
    await user.click(screen.getByRole('button', { name: 'Sí, arxivar' }))

    await screen.findByRole('heading', { level: 1, name: 'Rebost' })
    await waitFor(() => expect(screen.queryByRole('link', { name: /Mel/ })).not.toBeInTheDocument())
    expect(screen.getByText('4 aliments')).toBeInTheDocument()
  })

  it('handles a link to a food that no longer exists', async () => {
    setup('/rebost/no-existeix')
    expect(await screen.findByRole('heading', { level: 1, name: 'Aliment no trobat' })).toBeInTheDocument()
  })
})

describe('account switching', () => {
  it('drops cached pantry data when the user signs out', async () => {
    const { user, queryClient } = setup('/rebost')
    await screen.findByRole('link', { name: /Poma/ })
    expect(queryClient.getQueryData(pantryKeys.foods)).toHaveLength(5)

    await user.click(screen.getByRole('link', { name: 'Perfil' }))
    await user.click(await screen.findByRole('button', { name: 'Tancar sessió' }))
    await screen.findByRole('heading', { level: 1, name: 'Entra' })
    expect(queryClient.getQueryData(pantryKeys.foods)).toBeUndefined()
  })
})
