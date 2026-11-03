import { DownloadSimple, MagnifyingGlass, Scales, Star, X } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BestFpCard } from '../components/BestFpCard'
import { FrontierChart } from '../components/charts/FrontierChart'
import { RankBars } from '../components/charts/RankBars'
import { CostControls, DEFAULT_COST, type CostSettings } from '../components/CostControls'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { PageShell, SkeletonBlock } from '../components/PageShell'
import { TaskPicker } from '../components/TaskPicker'
import { useFavorites } from '../hooks/useFavorites'
import { useModels } from '../hooks/useModels'
import { useI18n } from '../i18n/I18nProvider'
import { downloadText, rankedToCsv } from '../lib/export'
import { bestValueModels, rankModels, TASK_IDS } from '../lib/ranking'
import type { SortKey, TaskId } from '../types/models'

const SORT_IDS: SortKey[] = ['score', 'price', 'speed', 'value']
const RELEASE_WINDOWS = ['all', '3', '6', '12'] as const
type ReleaseWindow = (typeof RELEASE_WINDOWS)[number]
const MAX_COMPARE = 4

function parseTask(value: string | null): TaskId {
  return TASK_IDS.includes(value as TaskId) ? (value as TaskId) : 'coding'
}

function parseSort(value: string | null): SortKey {
  return SORT_IDS.includes(value as SortKey) ? (value as SortKey) : 'score'
}

function parseWindow(value: string | null): ReleaseWindow {
  return RELEASE_WINDOWS.includes(value as ReleaseWindow) ? (value as ReleaseWindow) : 'all'
}

function releasedAfter(months: number): number {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.getTime()
}

export function ModelsPage() {
  const { t } = useI18n()
  const { models, data, loading, error } = useModels()
  const { favorites } = useFavorites()
  const [params, setParams] = useSearchParams()

  const task = parseTask(params.get('task'))
  const sort = parseSort(params.get('sort'))
  const releaseWindow = parseWindow(params.get('since'))
  const favoritesOnly = params.get('fav') === '1'
  const maxPrice = Number.parseFloat(params.get('max') ?? '') || 0
  const [query, setQuery] = useState('')
  const [creator, setCreator] = useState('all')
  const [cost, setCost] = useState<CostSettings>(DEFAULT_COST)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const creators = useMemo(() => {
    const pool =
      task === 'image'
        ? models.filter((m) => m.kind === 'image')
        : task === 'speech'
          ? models.filter((m) => m.kind === 'speech')
          : models.filter((m) => m.kind === 'language')
    const set = new Set(pool.map((m) => m.model_creator.name))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [models, task])

  const ranked = useMemo(() => {
    let list = rankModels(models, task, sort, cost.inputTokens, cost.outputTokens)
    if (creator !== 'all') {
      list = list.filter((m) => m.model_creator.name === creator)
    }
    if (favoritesOnly) {
      list = list.filter((m) => favorites.includes(m.slug))
    }
    if (releaseWindow !== 'all') {
      const cutoff = releasedAfter(Number(releaseWindow))
      list = list.filter((m) => {
        const ts = m.release_date ? Date.parse(m.release_date) : NaN
        return Number.isFinite(ts) && ts >= cutoff
      })
    }
    if (maxPrice > 0) {
      list = list.filter((m) => {
        const p = m.pricing.price_unit ?? m.pricing.price_1m_blended_3_to_1
        return p != null && p <= maxPrice
      })
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.model_creator.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q),
      )
    }
    return list
  }, [models, task, sort, creator, query, cost, favoritesOnly, favorites, releaseWindow, maxPrice])

  const bestFp = useMemo(() => bestValueModels(ranked, 3), [ranked])
  const isMedia = task === 'image' || task === 'speech'

  const updateParams = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    mutate(next)
    setParams(next, { replace: true })
  }

  const setTask = (next: TaskId) => {
    setCreator('all')
    setSelected(new Set())
    updateParams((p) => p.set('task', next))
  }

  const setSort = (next: SortKey) => updateParams((p) => p.set('sort', next))

  const toggleSelect = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else if (next.size < MAX_COMPARE) next.add(slug)
      return next
    })
  }

  const exportCsv = () => {
    downloadText(`mercury-${task}-${sort}.csv`, rankedToCsv(ranked))
  }

  const sortLabel = (key: SortKey) => {
    switch (key) {
      case 'price':
        return t('sortPrice')
      case 'speed':
        return t('sortSpeed')
      case 'value':
        return t('sortValue')
      default:
        return t('sortScore')
    }
  }

  const windowLabel = (w: ReleaseWindow) => {
    switch (w) {
      case '3':
        return t('last3m')
      case '6':
        return t('last6m')
      case '12':
        return t('last12m')
      default:
        return t('anyTime')
    }
  }

  const control =
    'rounded-lg border border-white/8 bg-ink px-3 py-2 text-sm text-mercury outline-none focus:border-cyan/40'

  return (
    <PageShell fetchedAt={data?.fetchedAt} source={data?.source} wide>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-mercury md:text-5xl">
          {t('navModels')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-mercury-mute">{t('heroSupport')}</p>
        {error && (
          <p className="mt-2 font-mono text-[11px] text-mercury-mute">{t('error')}</p>
        )}
      </div>

      <div className="mb-6">
        <TaskPicker value={task} onChange={setTask} compact />
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonBlock className="h-72" />
          <SkeletonBlock className="h-96" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <FrontierChart models={ranked} task={task} />
            <RankBars models={ranked} task={task} />
          </div>

          <BestFpCard models={bestFp} task={task} />

          {!isMedia && (
            <div className="mt-6">
              <CostControls value={cost} onChange={setCost} />
            </div>
          )}

          <div className="panel mb-6 mt-6 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="relative min-w-0 flex-1 sm:max-w-xs">
              <MagnifyingGlass
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mercury-mute"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search')}
                className={`${control} w-full py-2 pl-9 pr-3 placeholder:text-mercury-mute`}
              />
            </label>
            <select value={creator} onChange={(e) => setCreator(e.target.value)} className={control}>
              <option value="all">{t('allCreators')}</option>
              {creators.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={releaseWindow}
              onChange={(e) =>
                updateParams((p) => {
                  if (e.target.value === 'all') p.delete('since')
                  else p.set('since', e.target.value)
                })
              }
              className={control}
              aria-label={t('releasedWithin')}
            >
              {RELEASE_WINDOWS.map((w) => (
                <option key={w} value={w}>
                  {windowLabel(w)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step={0.5}
              value={maxPrice || ''}
              onChange={(e) =>
                updateParams((p) => {
                  if (!e.target.value || Number(e.target.value) <= 0) p.delete('max')
                  else p.set('max', e.target.value)
                })
              }
              placeholder={t('maxPrice')}
              aria-label={t('maxPrice')}
              className={`${control} w-32 font-mono placeholder:text-mercury-mute`}
            />
            <button
              type="button"
              onClick={() =>
                updateParams((p) => {
                  if (favoritesOnly) p.delete('fav')
                  else p.set('fav', '1')
                })
              }
              aria-pressed={favoritesOnly}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                favoritesOnly
                  ? 'border-amber-300/40 bg-amber-300/10 text-amber-200'
                  : 'border-white/8 text-mercury-mute hover:text-mercury'
              }`}
            >
              <Star size={14} weight={favoritesOnly ? 'fill' : 'regular'} />
              {t('favoritesOnly')}
              {favorites.length > 0 && (
                <span className="font-mono text-[11px] opacity-70">{favorites.length}</span>
              )}
            </button>
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <span className="font-mono text-[11px] uppercase tracking-wider text-mercury-mute">
                {t('sortBy')}
              </span>
              {SORT_IDS.filter((key) => !(isMedia && key === 'speed')).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSort(key)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs transition ${
                    sort === key
                      ? 'border-cyan/40 bg-cyan/10 text-cyan'
                      : 'border-white/8 text-mercury-mute hover:text-mercury'
                  }`}
                >
                  {sortLabel(key)}
                </button>
              ))}
              <button
                type="button"
                onClick={exportCsv}
                disabled={ranked.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/8 px-2.5 py-1.5 text-xs text-mercury-mute transition hover:text-mercury disabled:opacity-40"
              >
                <DownloadSimple size={13} />
                {t('exportCsv')}
              </button>
            </div>
          </div>

          {favoritesOnly && favorites.length === 0 ? (
            <p className="panel rounded-2xl p-8 text-center text-mercury-mute">{t('noFavorites')}</p>
          ) : (
            <LeaderboardTable
              models={ranked}
              task={task}
              shimmerKey={task}
              selected={selected}
              onToggleSelect={toggleSelect}
              monthlyRequests={cost.monthlyRequests}
            />
          )}

          {selected.size > 0 && (
            <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
              <div className="pointer-events-auto panel flex items-center gap-3 rounded-full border border-cyan/30 px-4 py-2 shadow-[0_0_40px_-12px_rgba(94,234,212,0.7)]">
                <span className="font-mono text-xs text-mercury-mute">
                  {selected.size}/{MAX_COMPARE} {t('compareSelected')}
                </span>
                <Link
                  to={`/compare?task=${task}&m=${[...selected].join(',')}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    selected.size >= 2
                      ? 'bg-mercury text-ink hover:bg-cyan'
                      : 'pointer-events-none bg-white/10 text-mercury-mute'
                  }`}
                  aria-disabled={selected.size < 2}
                >
                  <Scales size={15} weight="bold" />
                  {t('compare')}
                </Link>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="rounded-full p-1 text-mercury-mute hover:text-mercury"
                  aria-label={t('compareClear')}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  )
}
