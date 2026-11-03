import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'mercury-favorites'
const EVENT = 'mercury-favorites-change'

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

function write(slugs: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
  window.dispatchEvent(new Event(EVENT))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(read)

  useEffect(() => {
    const sync = () => setFavorites(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites])

  const toggle = useCallback((slug: string) => {
    const current = read()
    write(current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug])
  }, [])

  return { favorites, isFavorite, toggle }
}
