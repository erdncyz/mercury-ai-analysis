import { useCallback, useEffect, useState } from 'react'
import type { PulsePayload } from '../../shared/pulse'

export type { PulseItem, PulsePayload, RepoItem } from '../../shared/pulse'

const REFRESH_MS = 5 * 60 * 1000

async function loadPulse(): Promise<PulsePayload> {
  for (const endpoint of ['/api/pulse', '/.netlify/functions/pulse']) {
    try {
      const res = await fetch(`${endpoint}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) continue
      const json = (await res.json()) as PulsePayload
      if (Array.isArray(json.news)) return json
    } catch {
      // try next
    }
  }
  throw new Error('pulse unavailable')
}

export function usePulse() {
  const [data, setData] = useState<PulsePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      setData(await loadPulse())
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh(false)
    const id = window.setInterval(() => void refresh(true), REFRESH_MS)
    const onFocus = () => void refresh(true)
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  return { data, loading, error, refresh }
}
