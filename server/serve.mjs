import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'
import models from '../netlify/functions/models.ts'
import pulse from '../netlify/functions/pulse.ts'

const distDir = process.env.MERCURY_DIST
const envFile = process.env.MERCURY_ENV_FILE
const port = Number(process.env.PORT || 4173)

if (!distDir) {
  console.error('MERCURY_DIST is not set')
  process.exit(1)
}

function loadEnvFile(text) {
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value
  }
}

if (envFile) {
  try {
    loadEnvFile(await readFile(envFile, 'utf8'))
  } catch {
    // Config is optional until a live API key is added.
  }
}

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

function safeFile(pathname) {
  const relative = pathname === '/' ? 'index.html' : normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '')
  const file = join(distDir, relative)
  if (!file.startsWith(distDir + sep) && file !== distDir) return null
  return file
}

async function sendFile(res, file) {
  const info = await stat(file)
  if (!info.isFile()) return false
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' })
  createReadStream(file).pipe(res)
  return true
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`)
    if (url.pathname === '/api/models' || url.pathname === '/api/pulse') {
      const handler = url.pathname === '/api/models' ? models : pulse
      const request = new Request(url, { method: req.method || 'GET' })
      const response = await handler(request, {})
      const headers = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      res.writeHead(response.status, headers)
      res.end(Buffer.from(await response.arrayBuffer()))
      return
    }

    const file = safeFile(decodeURIComponent(url.pathname))
    if (file && (await sendFile(res, file).catch(() => false))) return
    if (await sendFile(res, join(distDir, 'index.html')).catch(() => false)) return
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(error instanceof Error ? error.message : 'Server error')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Mercury Ai Analysis listening on http://127.0.0.1:${port}`)
})
