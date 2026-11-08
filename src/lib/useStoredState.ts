import { useState } from 'react'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    // Private mode, blocked storage or corrupted value: behave as if nothing was saved.
    return fallback
  }
}

/** useState that survives reloads on this device. Only for small per-device preferences. */
export function useStoredState<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback))

  function update(next: T) {
    setValue(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Not persisted, but the toggle still works for this session.
    }
  }

  return [value, update]
}
