import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { createDemoApi } from '../../app/memoryApi'
import { createFakeAuth, renderApp } from '../../test/renderApp'

afterEach(() => localStorage.clear())

describe('recommendations switch', () => {
  it('sits above the meals, starts off and toggles', async () => {
    const user = userEvent.setup()
    renderApp('/', createFakeAuth({ signedIn: true }), { api: createDemoApi() })

    const toggle = await screen.findByRole('switch', { name: /Recomanacions/ })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    // Rendered before the first meal heading.
    const breakfast = screen.getByRole('heading', { name: 'Esmorzar' })
    expect(toggle.compareDocumentPosition(breakfast) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('remembers the choice on this device', async () => {
    const user = userEvent.setup()
    const first = renderApp('/', createFakeAuth({ signedIn: true }), { api: createDemoApi() })
    await user.click(await screen.findByRole('switch', { name: /Recomanacions/ }))
    first.unmount()

    renderApp('/', createFakeAuth({ signedIn: true }), { api: createDemoApi() })
    expect(await screen.findByRole('switch', { name: /Recomanacions/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('still works when storage is unavailable or corrupted', async () => {
    localStorage.setItem('app-dieta:recommendations', '{no és json')
    renderApp('/', createFakeAuth({ signedIn: true }), { api: createDemoApi() })
    expect(await screen.findByRole('switch', { name: /Recomanacions/ })).toHaveAttribute('aria-checked', 'false')
  })
})
