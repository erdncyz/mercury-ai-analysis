import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PRIMARY_URL = 'https://artificialanalysis.ai/api/v2/data/llms/models'
const FREE_URL = 'https://artificialanalysis.ai/api/v2/language/models/free'
const IMAGE_URL = 'https://artificialanalysis.ai/api/v2/data/media/text-to-image'
const SPEECH_URL = 'https://artificialanalysis.ai/api/v2/data/media/text-to-speech'
const CACHE_TTL_MS = 10 * 60 * 1000

type Cache = { body: string; expiresAt: number } | null
let cache: Cache = null

function loadEnvKey(root: string): string | undefined {
  if (process.env.ARTIFICIAL_ANALYSIS_API_KEY) {
    return process.env.ARTIFICIAL_ANALYSIS_API_KEY
  }
  try {
    const envPath = resolve(root, '.env')
    const text = readFileSync(envPath, 'utf8')
    const match = text.match(/^ARTIFICIAL_ANALYSIS_API_KEY=(.+)$/m)
    return match?.[1]?.trim()
  } catch {
    return undefined
  }
}

function loadFallback(root: string) {
  const path = resolve(root, 'src/data/fallback-models.json')
  return JSON.parse(readFileSync(path, 'utf8'))
}

function normalizeList(raw: unknown): { data: unknown[]; tier?: string; hasMore?: boolean } {
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

export function modelsApiPlugin(): Plugin {
  return {
    name: 'mercury-models-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/models')) return next()

        const root = server.config.root
        const now = Date.now()
        res.setHeader('Content-Type', 'application/json')

        if (cache && cache.expiresAt > now) {
          const parsed = JSON.parse(cache.body)
          res.end(JSON.stringify({ ...parsed, source: 'cache' }))
          return
        }

        const apiKey = loadEnvKey(root)
        if (!apiKey) {
          const fallback = loadFallback(root)
          res.end(
            JSON.stringify({
              language: fallback.language ?? fallback,
              image: fallback.image ?? [],
              speech: fallback.speech ?? [],
              data: fallback.data ?? fallback.language ?? fallback,
              fetchedAt: fallback.fetchedAt ?? new Date().toISOString(),
              source: 'fallback',
            }),
          )
          return
        }

        try {
          const upstream = await fetchBundle(apiKey)
          if (upstream) {
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
              data: [...(upstream.language as unknown[]), ...image, ...speech],
              fetchedAt: new Date().toISOString(),
              source: 'live',
            }
            const body = JSON.stringify(payload)
            cache = { body, expiresAt: now + CACHE_TTL_MS }
            res.end(body)
            return
          }
        } catch {
          // fallback below
        }

        const fallback = loadFallback(root)
        res.end(
          JSON.stringify({
            language: fallback.language ?? fallback,
            image: fallback.image ?? [],
            speech: fallback.speech ?? [],
            data: fallback.data ?? fallback.language ?? fallback,
            fetchedAt: fallback.fetchedAt ?? new Date().toISOString(),
            source: 'fallback',
          }),
        )
      })
    },
  }
}
