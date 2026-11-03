import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fetchPulse, mergeWithPrevious, type PulsePayload } from './shared/pulse.ts'

const CACHE_TTL_MS = 5 * 60 * 1000
let cache: { payload: PulsePayload; expiresAt: number } | null = null

function loadGithubToken(root: string): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  try {
    const text = readFileSync(resolve(root, '.env'), 'utf8')
    return text.match(/^GITHUB_TOKEN=(.+)$/m)?.[1]?.trim()
  } catch {
    return undefined
  }
}

export function pulseApiPlugin(): Plugin {
  return {
    name: 'mercury-pulse-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/pulse')) return next()
        res.setHeader('Content-Type', 'application/json')

        const now = Date.now()
        if (cache && cache.expiresAt > now) {
          res.end(JSON.stringify({ ...cache.payload, source: 'cache' }))
          return
        }

        try {
          const payload = mergeWithPrevious(
            await fetchPulse({ githubToken: loadGithubToken(server.config.root) }),
            cache?.payload ?? null,
          )
          if (payload.news.length || payload.papers.length) cache = { payload, expiresAt: now + CACHE_TTL_MS }
          res.end(JSON.stringify(payload))
        } catch (err) {
          if (cache) {
            res.end(JSON.stringify({ ...cache.payload, source: 'cache' }))
            return
          }
          res.statusCode = 502
          res.end(JSON.stringify({ error: (err as Error).message }))
        }
      })
    },
  }
}
