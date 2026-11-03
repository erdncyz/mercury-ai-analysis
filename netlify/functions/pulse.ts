import type { Config, Context } from '@netlify/functions'
import { fetchPulse, mergeWithPrevious, type PulsePayload } from '../../shared/pulse'

// Short TTL: fresh enough for news, but keeps GitHub's keyless 10 req/min limit safe.
const CACHE_TTL_MS = 5 * 60 * 1000
let cache: { payload: PulsePayload; expiresAt: number } | null = null

function headers() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=300',
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers() })
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: headers() })
  }

  const now = Date.now()
  if (cache && cache.expiresAt > now) {
    return new Response(JSON.stringify({ ...cache.payload, source: 'cache' }), { status: 200, headers: headers() })
  }

  try {
    const payload = mergeWithPrevious(
      await fetchPulse({ githubToken: process.env.GITHUB_TOKEN }),
      cache?.payload ?? null,
    )
    const hasContent = payload.news.length > 0 || payload.papers.length > 0
    if (hasContent) cache = { payload, expiresAt: now + CACHE_TTL_MS }
    else if (cache) return new Response(JSON.stringify({ ...cache.payload, source: 'cache' }), { status: 200, headers: headers() })
    return new Response(JSON.stringify(payload), { status: 200, headers: headers() })
  } catch (err) {
    if (cache) {
      return new Response(JSON.stringify({ ...cache.payload, source: 'cache' }), { status: 200, headers: headers() })
    }
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 502, headers: headers() })
  }
}

export const config: Config = {
  path: '/api/pulse',
}
