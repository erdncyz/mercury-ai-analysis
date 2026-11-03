import { Link } from 'react-router-dom'
import { NewsRow, RepoCard } from './PulseItems'
import { SkeletonBlock } from './PageShell'
import { useI18n } from '../i18n/I18nProvider'
import type { PulsePayload } from '../hooks/usePulse'

export function PulseNewsPanel({ data, loading }: { data: PulsePayload | null; loading: boolean }) {
  const { t } = useI18n()
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>
    )
  }
  if (!data) return <p className="panel rounded-2xl p-6 text-sm text-mercury-mute">{t('pulseError')}</p>

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="panel rounded-2xl p-3">
        <div className="divide-y divide-white/5">
          {data.news.slice(0, 6).map((item) => (
            <NewsRow key={item.id} item={item} compact />
          ))}
        </div>
      </div>
      <div className="panel rounded-2xl p-3">
        <Link
          to="/news"
          className="mb-1 block px-3 pt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-mercury-mute hover:text-cyan"
        >
          {t('pulsePapers')}
        </Link>
        <div className="divide-y divide-white/5">
          {data.papers.slice(0, 4).map((item) => (
            <NewsRow key={item.id} item={item} compact />
          ))}
        </div>
      </div>
    </div>
  )
}

export function PulseReposPanel({ data, loading }: { data: PulsePayload | null; loading: boolean }) {
  const { t } = useI18n()
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32" />
        ))}
      </div>
    )
  }
  if (!data) return <p className="panel rounded-2xl p-6 text-sm text-mercury-mute">{t('pulseError')}</p>

  const columns = [
    { key: 'skills' as const, label: t('pulseSkills'), to: '/skills?kind=skills' },
    { key: 'agents' as const, label: t('pulseAgents'), to: '/skills?kind=agents' },
    { key: 'trendingDaily' as const, label: t('trendingShort'), to: '/skills?kind=trendingDaily' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((col) => (
        <div key={col.key} className="flex flex-col gap-3">
          <Link
            to={col.to}
            className="px-1 font-mono text-[11px] uppercase tracking-[0.22em] text-mercury-mute hover:text-cyan"
          >
            {col.label}
          </Link>
          {data.repos[col.key].slice(0, 3).map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PulseMcpPanel({ data, loading }: { data: PulsePayload | null; loading: boolean }) {
  const { t } = useI18n()
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32" />
        ))}
      </div>
    )
  }
  if (!data) return <p className="panel rounded-2xl p-6 text-sm text-mercury-mute">{t('pulseError')}</p>

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {data.repos.mcp.slice(0, 4).map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  )
}
