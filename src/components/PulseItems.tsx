import { ArrowSquareOut, ChatCircle, GitFork, Star, TrendUp } from '@phosphor-icons/react'
import { useI18n } from '../i18n/I18nProvider'
import type { PulseItem, RepoItem } from '../hooks/usePulse'

export function useRelativeTime() {
  const { t } = useI18n()
  return (iso: string | null | undefined) => {
    if (!iso) return ''
    const diff = Date.now() - Date.parse(iso)
    if (!Number.isFinite(diff) || diff < 0) return ''
    const m = Math.floor(diff / 60000)
    if (m < 1) return t('justNow')
    if (m < 60) return `${m}${t('minutesAgo')}`
    const h = Math.floor(m / 60)
    if (h < 48) return `${h}${t('hoursAgo')}`
    return `${Math.floor(h / 24)}${t('daysAgo')}`
  }
}

export function formatStars(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}

export function NewsRow({ item, compact = false }: { item: PulseItem; compact?: boolean }) {
  const { t } = useI18n()
  const rel = useRelativeTime()
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-cyan/[0.06]"
    >
      <div className="min-w-0 flex-1">
        <p className={`text-mercury group-hover:text-cyan ${compact ? 'line-clamp-2 text-sm' : 'text-[15px] leading-snug'}`}>
          {item.title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-mercury-mute">
          <span className="text-mercury-dim">{item.source}</span>
          {item.publishedAt && <span>· {rel(item.publishedAt)}</span>}
          {item.points != null && (
            <span>
              · {item.points} {t('points')}
            </span>
          )}
          {item.comments != null && item.comments > 0 && (
            <span className="inline-flex items-center gap-0.5">
              · <ChatCircle size={11} /> {item.comments}
            </span>
          )}
        </p>
      </div>
      <ArrowSquareOut size={14} className="mt-1 shrink-0 text-mercury-mute/50 group-hover:text-cyan" />
    </a>
  )
}

export function RepoCard({ repo }: { repo: RepoItem }) {
  const { t } = useI18n()
  const rel = useRelativeTime()
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="panel group flex h-full flex-col rounded-xl p-4 transition hover:border-cyan/30"
    >
      <div className="flex items-start gap-3">
        {repo.avatar ? (
          <img src={repo.avatar} alt="" width={28} height={28} loading="lazy" className="h-7 w-7 shrink-0 rounded-md" />
        ) : (
          <GitFork size={20} className="mt-1 shrink-0 text-mercury-mute" />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium text-mercury group-hover:text-cyan">
            <span className="truncate">{repo.fullName}</span>
            {repo.ai && (
              <span className="shrink-0 rounded-full border border-cyan/30 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-cyan">
                AI
              </span>
            )}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mercury-mute">{repo.description ?? '—'}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-3 pt-3 font-mono text-[11px] text-mercury-mute">
        <span className="inline-flex items-center gap-1 text-amber-200">
          <Star size={12} weight="fill" /> {formatStars(repo.stars)}
        </span>
        {repo.starsPeriod != null && repo.starsPeriod > 0 && (
          <span className="inline-flex items-center gap-0.5 text-cyan">
            <TrendUp size={12} /> +{formatStars(repo.starsPeriod)}
          </span>
        )}
        {repo.language && <span>{repo.language}</span>}
        {repo.pushedAt && (
          <span className="ml-auto">
            {t('updatedRepo')} {rel(repo.pushedAt)}
          </span>
        )}
      </div>
    </a>
  )
}
