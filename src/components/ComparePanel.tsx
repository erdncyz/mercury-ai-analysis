import { Scales, Star } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites'
import { useI18n } from '../i18n/I18nProvider'
import { creatorColor } from '../lib/creatorColors'
import { shortModelName } from '../lib/ranking'
import type { AiModel, RankedModel, TaskId } from '../types/models'

export function ComparePanel({
  ranked,
  models,
  task,
}: {
  ranked: RankedModel[]
  models: AiModel[]
  task: TaskId
}) {
  const { t } = useI18n()
  const { favorites } = useFavorites()
  const top = ranked.slice(0, 3)
  const favModels = favorites
    .map((slug) => models.find((m) => m.slug === slug))
    .filter((m): m is AiModel => m != null)
    .slice(0, 4)

  const row = (m: AiModel, i: number) => (
    <li key={m.id} className="flex items-center gap-2 text-sm">
      <span className="w-4 font-mono text-[11px] text-mercury-mute">{i + 1}</span>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: creatorColor(m.model_creator.name) }} />
      <span className="truncate text-mercury">{shortModelName(m.name)}</span>
      <span className="ml-auto shrink-0 text-xs text-mercury-mute">{m.model_creator.name}</span>
    </li>
  )

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Link
        to={`/compare?task=${task}&m=${top.map((m) => m.slug).join(',')}`}
        className="panel group flex flex-col rounded-2xl p-5 transition hover:border-cyan/30"
      >
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
          <Scales size={14} weight="duotone" />
          {t('homeCompareTop')}
        </p>
        <ul className="mt-4 space-y-2.5">{top.map(row)}</ul>
        <p className="mt-auto pt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-mercury-mute group-hover:text-cyan">
          {t('compare')} →
        </p>
      </Link>

      <Link
        to={favModels.length >= 2 ? `/compare?task=${task}&m=${favModels.map((m) => m.slug).join(',')}` : '/models?fav=1'}
        className="panel group flex flex-col rounded-2xl p-5 transition hover:border-amber-300/30"
      >
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-amber-200">
          <Star size={14} weight="duotone" />
          {t('homeFavorites')}
          {favorites.length > 0 && <span className="opacity-60">· {favorites.length}</span>}
        </p>
        {favModels.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-mercury-mute">{t('noFavorites')}</p>
        ) : (
          <ul className="mt-4 space-y-2.5">{favModels.map(row)}</ul>
        )}
        <p className="mt-auto pt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-mercury-mute group-hover:text-amber-200">
          {favModels.length >= 2 ? t('compare') : t('favoritesOnly')} →
        </p>
      </Link>
    </div>
  )
}
