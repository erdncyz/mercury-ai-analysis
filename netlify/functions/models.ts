import type { Context, Config } from '@netlify/functions'
import fallbackModels from './fallback-models.json'

type CacheEntry = {
  body: string
  expiresAt: number
}

const CACHE_TTL_MS = 10 * 60 * 1000
let memoryCache: CacheEntry | null = null

const PRIMARY_URL = 'https://artificialanalysis.ai/api/v2/data/llms/models'
const FREE_URL = 'https://artificialanalysis.ai/api/v2/language/models/free'
const IMAGE_URL = 'https://artificialanalysis.ai/api/v2/data/media/text-to-image'
const SPEECH_URL = 'https://artificialanalysis.ai/api/v2/data/media/text-to-speech'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=600',
  }
}

function normalizeList(raw: unknown): {
  data: unknown[]
  tier?: string
  hasMore?: boolean
} {
  if (!raw || typeof raw !== 'object') return { data: [] }
  const obj = raw as Record<string, unknown>
  const data = Array.isArray(obj.data) ? obj.data : Array.isArray(raw) ? raw : []
  const pagination = obj.pagination as { has_more?: boolean } | undefined
  return {
    data,
    tier: typeof obj.tier === 'string' ? obj.tier : undefined,
    hasMore: Boolean(pagination?.has_more),
  }
}

async function fetchJson(url: string, apiKey: string) {
  const res = await fetch(url, {
    headers: { 'x-api-key': apiKey, Accept: 'application/json' },
  })
  if (!res.ok) return null
  return res.json()
}

async function fetchAllFree(apiKey: string) {
  const all: unknown[] = []
  let page = 1
  let tier: string | undefined
  for (let i = 0; i < 20; i += 1) {
    const json = await fetchJson(`${FREE_URL}?page=${page}`, apiKey)
    if (!json) break
    const normalized = normalizeList(json)
    if (!normalized.data.length) break
    all.push(...normalized.data)
    tier = normalized.tier ?? tier
    if (!normalized.hasMore) break
    page += 1
  }
  return all.length ? { data: all, tier } : null
}

async function fetchLanguage(apiKey: string) {
  try {
    const json = await fetchJson(PRIMARY_URL, apiKey)
    if (json) {
      const normalized = normalizeList(json)
      if (normalized.data.length) return { data: normalized.data, tier: normalized.tier }
    }
  } catch {
    // fall through
  }
  return fetchAllFree(apiKey)
}

async function fetchMedia(apiKey: string, url: string) {
  try {
    const json = await fetchJson(url, apiKey)
    if (!json) return []
    return normalizeList(json).data
  } catch {
    return []
  }
}

async function fetchBundle(apiKey: string) {
  const [language, image, speech] = await Promise.all([
    fetchLanguage(apiKey),
    fetchMedia(apiKey, IMAGE_URL),
    fetchMedia(apiKey, SPEECH_URL),
  ])
  if (!language?.data.length && !image.length && !speech.length) return null
  return {
    language: language?.data ?? [],
    image,
    speech,
    tier: language?.tier,
  }
}

function fallbackPayload() {
  const fb = fallbackModels as {
    language?: unknown[]
    image?: unknown[]
    speech?: unknown[]
    data?: unknown[]
    fetchedAt?: string
  }
  const language = fb.language ?? fb.data ?? (Array.isArray(fallbackModels) ? fallbackModels : [])
  const image = fb.image ?? []
  const speech = fb.speech ?? []
  return {
    language,
    image,
    speech,
    data: [...language, ...image, ...speech],
    fetchedAt: fb.fetchedAt ?? new Date().toISOString(),
    source: 'fallback' as const,
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders(),
    })
  }

  const now = Date.now()
  if (memoryCache && memoryCache.expiresAt > now) {
    return new Response(
      JSON.stringify({
        ...JSON.parse(memoryCache.body),
        source: 'cache',
      }),
      { status: 200, headers: corsHeaders() },
    )
  }

  const apiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify(fallbackPayload()), {
      status: 200,
      headers: corsHeaders(),
    })
  }

  const upstream = await fetchBundle(apiKey)
  if (!upstream) {
    const cached = memoryCache ? JSON.parse(memoryCache.body) : fallbackPayload()
    return new Response(
      JSON.stringify({
        ...cached,
        source: memoryCache ? 'cache' : 'fallback',
      }),
      { status: 200, headers: corsHeaders() },
    )
  }

  const image = (upstream.image as Record<string, unknown>[]).map((m) => ({
    ...m,
    kind: 'image',
  }))
  const speech = (upstream.speech as Record<string, unknown>[]).map((m) => ({
    ...m,
    kind: 'speech',
  }))
  const payload = {
    language: upstream.language,
    image,
    speech,
    tier: upstream.tier,
    data: [...upstream.language, ...image, ...speech],
    fetchedAt: new Date().toISOString(),
    source: 'live' as const,
  }
  const body = JSON.stringify(payload)
  memoryCache = { body, expiresAt: now + CACHE_TTL_MS }

  return new Response(body, { status: 200, headers: corsHeaders() })
}

export const config: Config = {
  path: '/api/models',
}
