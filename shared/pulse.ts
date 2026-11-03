// Aggregates free, keyless AI news / paper / repo sources. Shared by the Netlify function and the Vite dev route.

export interface PulseItem {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string | null
  points?: number
  comments?: number
}

export interface RepoItem {
  id: string
  name: string
  fullName: string
  url: string
  description: string | null
  stars: number
  language: string | null
  topics: string[]
  pushedAt: string | null
  createdAt: string | null
  avatar: string | null
  /** Stars gained in the trending period (github.com/trending only). */
  starsPeriod?: number
  /** Heuristic: looks AI/agent related (trending lists are not pre-filtered). */
  ai?: boolean
}

export interface PulsePayload {
  news: PulseItem[]
  papers: PulseItem[]
  repos: {
    skills: RepoItem[]
    agents: RepoItem[]
    mcp: RepoItem[]
    trendingDaily: RepoItem[]
    trendingWeekly: RepoItem[]
  }
  fetchedAt: string
  source: 'live' | 'cache'
  errors: string[]
}

const UA = 'mercury-ai-analysis/1.0 (+https://github.com)'
const TIMEOUT_MS = 8000

const RSS_FEEDS: { source: string; url: string }[] = [
  { source: 'OpenAI', url: 'https://openai.com/news/rss.xml' },
  { source: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml' },
  { source: 'Google AI', url: 'https://blog.google/technology/ai/rss/' },
  { source: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },
  { source: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { source: 'The Verge', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { source: 'MIT Tech Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed' },
]

// Algolia treats multi-word queries as AND, so pull recent front-page stories and filter titles locally.
function hnUrl() {
  const since = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60
  return `https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=points>60,created_at_i>${since}&hitsPerPage=200`
}
const HN_AI_PATTERN =
  /\b(AI|A\.I\.|LLMs?|GPT[-\w]*|ChatGPT|Claude|Gemini|Llama|Mistral|OpenAI|Anthropic|DeepMind|Copilot|Cursor|(?:AI|coding|LLM|autonomous) agents?|agentic|MCP|transformers?|diffusion|RAG|fine-?tun\w*|inference|machine learning|neural|foundation model|frontier model)\b/i
const HF_PAPERS_URL = 'https://huggingface.co/api/daily_papers?limit=12'

// Many top repos carry no topics (gstack, gbrain) or different ones (hermes: ai-agent, graphify: mcp/skills),
// so each bucket merges several topic + keyword queries. GitHub rejects OR across qualifiers, hence separate calls.
// The first query of each bucket is the keyless fallback (10 req/min without a token).
const GH_BUCKETS: Record<'skills' | 'agents' | 'mcp', string[]> = {
  skills: [
    'topic:agent-skills',
    'topic:claude-skills',
    'topic:openclaw-skills',
    '"claude code" OR skills OR skill in:name,description,topics stars:>1000',
    'openclaw OR hermes OR codex OR cursor in:name,description,topics stars:>1000',
  ],
  agents: [
    'topic:ai-agents',
    'topic:ai-agent',
    'agent OR agents OR agentic OR assistant in:name,description,topics stars:>3000',
  ],
  mcp: [
    'topic:mcp-server',
    'topic:mcp',
    'mcp OR "model context protocol" in:name,description,topics stars:>500',
  ],
}
const REPO_LIMIT = 150
const AI_REPO_PATTERN =
  /\b(agents?|agentic|mcp|skills?|claude|llm|ai|gpt|copilot|assistant|openclaw|hermes|codex|cursor|gemini|model context|rag|prompt)\b/i
// Popular repos that stuff AI topics for SEO but aren't agents/skills/MCP (matched by repo name).
const REPO_DENYLIST = new Set([
  'javaguide',
  '30-seconds-of-code',
  'front-end-checklist',
  'daily_stock_analysis',
])

async function fetchText(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: '*/*', ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  return JSON.parse(await fetchText(url, { Accept: 'application/json', ...headers })) as T
}

function decodeEntities(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? decodeEntities(m[1]) : null
}

function atomLink(block: string): string | null {
  const alt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
  if (alt) return alt[1]
  const any = block.match(/<link[^>]*href=["']([^"']+)["']/i)
  return any ? any[1] : null
}

function toIso(value: string | null): string | null {
  if (!value) return null
  const ts = Date.parse(value)
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null
}

/** Minimal RSS 2.0 / Atom parser — enough for title, link, date. */
export function parseFeed(xml: string, source: string): PulseItem[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) ?? []
  const items: PulseItem[] = []
  for (const block of blocks) {
    const title = tag(block, 'title')
    const url = tag(block, 'link') || atomLink(block)
    if (!title || !url || !/^https?:/.test(url)) continue
    const publishedAt = toIso(
      tag(block, 'pubDate') ?? tag(block, 'published') ?? tag(block, 'updated') ?? tag(block, 'dc:date'),
    )
    items.push({ id: url, title, url, source, publishedAt })
  }
  return items
}

async function fetchRss(feed: { source: string; url: string }, errors: string[]) {
  try {
    return parseFeed(await fetchText(feed.url), feed.source)
  } catch (err) {
    errors.push(`${feed.source}: ${(err as Error).message}`)
    return []
  }
}

type HnHit = {
  objectID: string
  title: string
  url?: string
  points?: number
  num_comments?: number
  created_at?: string
}

async function fetchHn(errors: string[]): Promise<PulseItem[]> {
  try {
    const json = await fetchJson<{ hits: HnHit[] }>(hnUrl())
    return json.hits
      .filter((h) => h.title && HN_AI_PATTERN.test(h.title))
      .slice(0, 25)
      .map((h) => ({
        id: `hn-${h.objectID}`,
        title: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        source: 'Hacker News',
        publishedAt: toIso(h.created_at ?? null),
        points: h.points,
        comments: h.num_comments,
      }))
  } catch (err) {
    errors.push(`Hacker News: ${(err as Error).message}`)
    return []
  }
}

type HfPaper = {
  paper: { id: string; title: string; upvotes?: number; publishedAt?: string }
  publishedAt?: string
  numComments?: number
}

async function fetchPapers(errors: string[]): Promise<PulseItem[]> {
  try {
    const json = await fetchJson<HfPaper[]>(HF_PAPERS_URL)
    return json
      .filter((p) => p?.paper?.id && p.paper.title)
      .map((p) => ({
        id: `hf-${p.paper.id}`,
        title: p.paper.title,
        url: `https://huggingface.co/papers/${p.paper.id}`,
        source: 'HF Papers',
        publishedAt: toIso(p.publishedAt ?? p.paper.publishedAt ?? null),
        points: p.paper.upvotes,
        comments: p.numComments,
      }))
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
  } catch (err) {
    errors.push(`HF Papers: ${(err as Error).message}`)
    return []
  }
}

type GhRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  language: string | null
  topics?: string[]
  pushed_at?: string
  created_at?: string
  owner?: { avatar_url?: string }
}

function toRepo(r: GhRepo): RepoItem {
  return {
    id: String(r.id),
    name: r.name,
    fullName: r.full_name,
    url: r.html_url,
    description: r.description,
    stars: r.stargazers_count,
    language: r.language,
    topics: (r.topics ?? []).slice(0, 6),
    pushedAt: r.pushed_at ?? null,
    createdAt: r.created_at ?? null,
    avatar: r.owner?.avatar_url ?? null,
  }
}

async function fetchRepos(q: string, token: string | undefined, errors: string[], label: string, page = 1) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100&page=${page}`
  try {
    const json = await fetchJson<{ items: GhRepo[] }>(url, headers)
    return (json.items ?? []).map(toRepo)
  } catch (err) {
    errors.push(`GitHub ${label}: ${(err as Error).message}`)
    return []
  }
}

function looksLikeAiRepo(r: RepoItem) {
  if (REPO_DENYLIST.has(r.name.toLowerCase())) return false
  return AI_REPO_PATTERN.test(`${r.name} ${r.description ?? ''} ${r.topics.join(' ')}`)
}

function mergeRepos(lists: RepoItem[][]) {
  const byId = new Map<string, RepoItem>()
  for (const r of lists.flat()) if (!byId.has(r.id) && looksLikeAiRepo(r)) byId.set(r.id, r)
  return [...byId.values()].sort((a, b) => b.stars - a.stars).slice(0, REPO_LIMIT)
}

async function fetchBucket(queries: string[], token: string | undefined, errors: string[], label: string) {
  const active = token ? queries : queries.slice(0, 1)
  // Broad keyword queries are the ones that catch untagged repos; give them a second page.
  const jobs = active.flatMap((q, i) => {
    const pages = token && q.includes('in:name,description,topics') ? [1, 2] : [1]
    return pages.map((page) => fetchRepos(q, token, errors, `${label}#${i + 1}p${page}`, page))
  })
  return mergeRepos(await Promise.all(jobs))
}

function parseCount(s: string | undefined) {
  const n = Number.parseInt((s ?? '').replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

/** GitHub has no trending API; parse the public page. Selectors are kept loose and every field is optional. */
export function parseTrending(html: string): RepoItem[] {
  const articles = html.split('<article class="Box-row">').slice(1)
  const items: RepoItem[] = []
  for (const a of articles) {
    const fullName = a.match(/<h2[^>]*>[\s\S]*?href="\/([^"?#]+)"/)?.[1]?.trim()
    if (!fullName || !fullName.includes('/')) continue
    const [owner, name] = fullName.split('/')
    const description = a.match(/<p class="col-9[^"]*">([\s\S]*?)<\/p>/)?.[1]
    const language = a.match(/itemprop="programmingLanguage">([^<]+)</)?.[1]?.trim() ?? null
    // Strip the inline SVG before counting digits, otherwise path data leaks into the number.
    const starsRaw = a.match(/href="\/[^"]+\/stargazers"[^>]*>([\s\S]*?)<\/a>/)?.[1]
    const stars = parseCount(starsRaw ? decodeEntities(starsRaw) : undefined)
    const starsPeriod = parseCount(a.match(/([\d,]+)\s+stars (?:today|this week|this month)/)?.[1])
    const item: RepoItem = {
      id: `trending-${fullName.toLowerCase()}`,
      name,
      fullName,
      url: `https://github.com/${fullName}`,
      description: description ? decodeEntities(description) : null,
      stars,
      language,
      topics: [],
      pushedAt: null,
      createdAt: null,
      avatar: `https://github.com/${owner}.png?size=56`,
      starsPeriod,
    }
    item.ai = AI_REPO_PATTERN.test(`${item.name} ${item.description ?? ''}`)
    items.push(item)
  }
  return items
}

async function fetchTrending(since: 'daily' | 'weekly', errors: string[]) {
  try {
    const html = await fetchText(`https://github.com/trending?since=${since}`, { Accept: 'text/html' })
    return parseTrending(html)
  } catch (err) {
    errors.push(`GitHub trending ${since}: ${(err as Error).message}`)
    return []
  }
}

function dedupe(items: PulseItem[]) {
  const seen = new Set<string>()
  return items.filter((i) => {
    const key = i.url.replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function byDateDesc(a: PulseItem, b: PulseItem) {
  return Date.parse(b.publishedAt ?? '') - Date.parse(a.publishedAt ?? '')
}

export async function fetchPulse(opts: { githubToken?: string } = {}): Promise<PulsePayload> {
  const errors: string[] = []
  const [rss, hn, papers, skills, agents, mcp, trendingDaily, trendingWeekly] = await Promise.all([
    Promise.all(RSS_FEEDS.map((f) => fetchRss(f, errors))),
    fetchHn(errors),
    fetchPapers(errors),
    fetchBucket(GH_BUCKETS.skills, opts.githubToken, errors, 'skills'),
    fetchBucket(GH_BUCKETS.agents, opts.githubToken, errors, 'agents'),
    fetchBucket(GH_BUCKETS.mcp, opts.githubToken, errors, 'mcp'),
    fetchTrending('daily', errors),
    fetchTrending('weekly', errors),
  ])

  // Cap each RSS source so high-volume feeds don't drown the labs.
  const perSource = rss.map((items) => items.sort(byDateDesc).slice(0, 8))
  const news = dedupe([...perSource.flat(), ...hn]).sort(byDateDesc).slice(0, 60)

  return {
    news,
    papers: papers.slice(0, 12),
    repos: { skills, agents, mcp, trendingDaily, trendingWeekly },
    fetchedAt: new Date().toISOString(),
    source: 'live',
    errors,
  }
}

/** Keep last-good sections when an upstream (typically GitHub rate limit) returns nothing. */
export function mergeWithPrevious(next: PulsePayload, prev: PulsePayload | null): PulsePayload {
  if (!prev) return next
  const repos = { ...next.repos }
  for (const key of Object.keys(repos) as (keyof PulsePayload['repos'])[]) {
    if (repos[key].length === 0 && prev.repos[key].length > 0) repos[key] = prev.repos[key]
  }
  return {
    ...next,
    news: next.news.length ? next.news : prev.news,
    papers: next.papers.length ? next.papers : prev.papers,
    repos,
  }
}
