import { useCallback, useEffect, useState } from 'react'
import { normalizeIncomingModels, normalizeLanguageModel, normalizeMediaModel } from '../lib/normalize'
import type { AiModel, ModelsResponse } from '../types/models'

const REFRESH_MS = 10 * 60 * 1000

// Lazy-loaded so the full fallback dataset stays out of the main bundle.
async function fromFallback(): Promise<ModelsResponse> {
  const fb = (await import('../data/fallback-models.json')).default as {
    language?: Record<string, unknown>[]
    image?: Record<string, unknown>[]
    speech?: Record<string, unknown>[]
    fetchedAt?: string
  }
  const language = (fb.language ?? []).map(normalizeLanguageModel)
  const image = (fb.image ?? []).map((m) => normalizeMediaModel(m, 'image'))
  const speech = (fb.speech ?? []).map((m) => normalizeMediaModel(m, 'speech'))
  return {
    data: [...language, ...image, ...speech],
    fetchedAt: fb.fetchedAt ?? new Date().toISOString(),
    source: 'fallback',
  }
}

async function loadModels(): Promise<ModelsResponse> {
  const endpoints = ['/api/models', '/.netlify/functions/models']
  const bust = `t=${Date.now()}`

  for (const endpoint of endpoints) {
    try {
      const sep = endpoint.includes('?') ? '&' : '?'
      const res = await fetch(`${endpoint}${sep}${bust}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) continue
      const json = await res.json()
      const data = normalizeIncomingModels(json)
      if (data.length > 0) {
        return {
          data,
          fetchedAt: json.fetchedAt ?? new Date().toISOString(),
          source: json.source ?? 'live',
          tier: json.tier,
        }
      }
    } catch {
      // try next
    }
  }

  return fromFallback()
}

export function useModels() {
  const [data, setData] = useState<ModelsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const result = await loadModels()
      setData(result)
      setError(result.source === 'fallback')
    } catch {
      setData(await fromFallback())
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

  return { data, loading, error, models: data?.data ?? ([] as AiModel[]), refresh }
}
