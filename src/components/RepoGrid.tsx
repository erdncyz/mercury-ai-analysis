import { MagnifyingGlass } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { SkeletonBlock } from './PageShell'
import { RepoCard } from './PulseItems'
import { useI18n } from '../i18n/I18nProvider'
import type { RepoItem } from '../hooks/usePulse'

const PAGE = 24

export function RepoGrid({
  repos,
  loading,
  aiFilter = false,
}: {
  repos: RepoItem[]
  loading: boolean
  aiFilter?: boolean
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [aiOnly, setAiOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return repos.filter((r) => {
      if (aiFilter && aiOnly && !r.ai) return false
      if (!q) return true
      return (
        r.fullName.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        r.topics.some((topic) => topic.includes(q))
      )
    })
  }, [repos, query, aiFilter, aiOnly])

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-36" />
        ))}
      </div>
    )
  }

  const visible = filtered.slice(0, limit)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mercury-mute"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
            placeholder={t('searchRepos')}
            className="w-full rounded-lg border border-white/8 bg-ink py-2 pl-9 pr-3 text-sm text-mercury outline-none placeholder:text-mercury-mute focus:border-cyan/40"
          />
        </label>
        {aiFilter && (
          <button
            type="button"
            onClick={() => {
              setAiOnly((v) => !v)
              setLimit(PAGE)
            }}
            aria-pressed={aiOnly}
            className={`rounded-md border px-2.5 py-1.5 text-xs transition ${
              aiOnly ? 'border-cyan/40 bg-cyan/10 text-cyan' : 'border-white/8 text-mercury-mute hover:text-mercury'
            }`}
          >
            {t('aiOnly')}
          </button>
        )}
        <span className="font-mono text-[11px] text-mercury-mute">
          {visible.length} / {filtered.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="panel rounded-2xl p-8 text-center text-sm text-mercury-mute">{t('pulseEmpty')}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
          {filtered.length > limit && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE)}
                className="rounded-full border border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-mercury-mute transition hover:border-cyan/40 hover:text-cyan"
              >
                {t('showMore')} · {Math.min(PAGE, filtered.length - limit)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
