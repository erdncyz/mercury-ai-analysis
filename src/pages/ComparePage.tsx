import { ArrowLeft, MagnifyingGlass, X } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CopyLinkButton } from '../components/CopyLinkButton'
import { FavoriteButton } from '../components/FavoriteButton'
import { PageShell, SkeletonBlock } from '../components/PageShell'
import { useModels } from '../hooks/useModels'
import { useI18n } from '../i18n/I18nProvider'
import type { MessageKey } from '../i18n/messages'
import { normalizeSkill, polar, radarPolygon, skillProfile } from '../lib/charts'
import { cinemaEase } from '../lib/motion'
import {
  formatScore,
  formatSpeed,
  formatUsd,
  rankModels,
  shortModelName,
  TASK_IDS,
} from '../lib/ranking'
import type { AiModel, RankedModel, TaskId } from '../types/models'

const MAX_COMPARE = 4
const COLORS = ['#5eead4', '#f9a8d4', '#fcd34d', '#a5b4fc']

function parseTask(value: string | null): TaskId {
  return TASK_IDS.includes(value as TaskId) ? (value as TaskId) : 'intelligence'
}

type Row = {
  key: MessageKey
  get: (m: RankedModel) => number | null | undefined
  format: (v: number) => string
  /** true when a lower value wins (price, latency). */
  lowerIsBetter?: boolean
}

const ROWS: Row[] = [
  { key: 'intelligenceIndex', get: (m) => m.evaluations.artificial_analysis_intelligence_index, format: (v) => formatScore(v) },
  { key: 'codingIndex', get: (m) => m.evaluations.artificial_analysis_coding_index, format: (v) => formatScore(v) },
  { key: 'mathIndex', get: (m) => m.evaluations.artificial_analysis_math_index, format: (v) => formatScore(v) },
  { key: 'agentsIndex', get: (m) => m.evaluations.tau2 ?? m.evaluations.terminalbench_v2_1, format: (v) => formatScore(v, 2) },
  { key: 'longContextIndex', get: (m) => m.evaluations.lcr, format: (v) => formatScore(v, 2) },
  { key: 'instructionIndex', get: (m) => m.evaluations.ifbench, format: (v) => formatScore(v, 2) },
  { key: 'gpqa', get: (m) => m.evaluations.gpqa, format: (v) => formatScore(v, 2) },
  { key: 'hle', get: (m) => m.evaluations.hle, format: (v) => formatScore(v, 2) },
  { key: 'mmluPro', get: (m) => m.evaluations.mmlu_pro, format: (v) => formatScore(v, 2) },
  { key: 'liveCodeBench', get: (m) => m.evaluations.livecodebench, format: (v) => formatScore(v, 2) },
  { key: 'sciCode', get: (m) => m.evaluations.scicode, format: (v) => formatScore(v, 2) },
  { key: 'aime25', get: (m) => m.evaluations.aime_25, format: (v) => formatScore(v, 2) },
  { key: 'terminalBench', get: (m) => m.evaluations.terminalbench_v2_1, format: (v) => formatScore(v, 2) },
  { key: 'tau2', get: (m) => m.evaluations.tau2, format: (v) => formatScore(v, 2) },
  { key: 'inputPrice', get: (m) => m.pricing.price_1m_input_tokens, format: (v) => formatUsd(v), lowerIsBetter: true },
  { key: 'outputPrice', get: (m) => m.pricing.price_1m_output_tokens, format: (v) => formatUsd(v), lowerIsBetter: true },
  { key: 'blended', get: (m) => m.pricing.price_1m_blended_3_to_1, format: (v) => formatUsd(v), lowerIsBetter: true },
  { key: 'requestCost', get: (m) => (Number.isFinite(m.requestCost) ? m.requestCost : null), format: (v) => formatUsd(v, 4), lowerIsBetter: true },
  { key: 'speed', get: (m) => m.median_output_tokens_per_second, format: (v) => formatSpeed(v) },
  { key: 'ttft', get: (m) => m.median_time_to_first_token_seconds, format: (v) => `${v.toFixed(2)}s`, lowerIsBetter: true },
  { key: 'value', get: (m) => (m.valueScore > 0 ? m.valueScore : null), format: (v) => formatScore(v, 2) },
]

function bestIndex(values: (number | null | undefined)[], lowerIsBetter?: boolean): number {
  let best = -1
  values.forEach((v, i) => {
    if (v == null) return
    if (best === -1) {
      best = i
      return
    }
    const cur = values[best] as number
    if (lowerIsBetter ? v < cur : v > cur) best = i
  })
  return best
}

function CompareRadar({ models }: { models: RankedModel[] }) {
  const { t } = useI18n()
  const profiles = models.map((m) => skillProfile(m))
  const axes = profiles[0].filter((_, i) => profiles.some((p) => p[i].value != null))
  if (axes.length < 3) return null
  const axisIds = new Set(axes.map((a) => a.id))

  const size = 320
  const cx = size / 2
  const cy = size / 2
  const r = 110
  const step = 360 / axes.length

  return (
    <section className="panel rounded-2xl p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">{t('radarTitle')}</p>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto mt-2 h-auto w-full max-w-md" role="img" aria-label={t('radarTitle')}>
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={radarPolygon(axes.map(() => ring * 100), cx, cy, r)}
            fill="none"
            stroke="rgba(215,224,239,0.1)"
          />
        ))}
        {axes.map((_, i) => {
          const [x, y] = polar(cx, cy, r, -90 + i * step)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(215,224,239,0.12)" />
        })}
        {profiles.map((profile, mi) => {
          const values = profile.filter((a) => axisIds.has(a.id)).map(normalizeSkill)
          return (
            <motion.polygon
              key={models[mi].id}
              points={radarPolygon(values, cx, cy, r)}
              fill={`${COLORS[mi]}26`}
              stroke={COLORS[mi]}
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: mi * 0.08, ease: cinemaEase }}
            />
          )
        })}
        {axes.map((axis, i) => {
          const [x, y] = polar(cx, cy, r + 24, -90 + i * step)
          return (
            <text key={axis.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#8fa3c0" fontSize="11">
              {t(axis.id as MessageKey)}
            </text>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-4 font-mono text-[11px] text-mercury-mute">
        {models.map((m, i) => (
          <span key={m.id} className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} /> {shortModelName(m.name)}
          </span>
        ))}
      </div>
    </section>
  )
}

export function ComparePage() {
  const { t } = useI18n()
  const { models, data, loading } = useModels()
  const [params, setParams] = useSearchParams()
  const task = parseTask(params.get('task'))
  const slugs = useMemo(
    () => [...new Set((params.get('m') ?? '').split(',').filter(Boolean))].slice(0, MAX_COMPARE),
    [params],
  )
  const [query, setQuery] = useState('')

  const ranked = useMemo(() => rankModels(models, task, 'score'), [models, task])
  const bySlug = useMemo(() => new Map(ranked.map((m) => [m.slug, m])), [ranked])
  // Models without a score for this task still deserve a column; rank/score just read as empty.
  const selected = slugs
    .map((s): RankedModel | undefined => {
      const hit = bySlug.get(s)
      if (hit) return hit
      const raw = models.find((m) => m.slug === s)
      return raw
        ? { ...raw, rank: 0, score: Number.NaN, valueScore: 0, requestCost: Number.NaN }
        : undefined
    })
    .filter((m): m is RankedModel => m != null)

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return ranked
      .filter((m) => !slugs.includes(m.slug))
      .filter(
        (m) => m.name.toLowerCase().includes(q) || m.model_creator.name.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [query, ranked, slugs])

  const setSlugs = (next: string[]) => {
    const p = new URLSearchParams(params)
    if (next.length) p.set('m', next.join(','))
    else p.delete('m')
    setParams(p, { replace: true })
  }

  const add = (m: AiModel) => {
    if (slugs.length >= MAX_COMPARE) return
    setSlugs([...slugs, m.slug])
    setQuery('')
  }

  const remove = (slug: string) => setSlugs(slugs.filter((s) => s !== slug))

  return (
    <PageShell fetchedAt={data?.fetchedAt} source={data?.source} wide>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/models?task=${task}`}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-mercury-mute hover:text-cyan"
        >
          <ArrowLeft size={14} />
          {t('back')}
        </Link>
        {selected.length > 0 && <CopyLinkButton />}
      </div>

      <header className="mt-6 mb-6">
        <h1 className="font-display text-4xl text-mercury md:text-5xl">{t('compareTitle')}</h1>
        <p className="mt-2 text-sm text-mercury-mute">{t('compareHint')}</p>
      </header>

      {loading ? (
        <div className="space-y-4">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-96" />
        </div>
      ) : (
        <>
          <div className="panel mb-6 rounded-2xl p-3">
            <div className="flex flex-wrap items-center gap-2">
              {selected.map((m, i) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-mercury"
                  style={{ borderColor: `${COLORS[i]}66`, background: `${COLORS[i]}14` }}
                >
                  <i className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                  {m.name}
                  <button
                    type="button"
                    onClick={() => remove(m.slug)}
                    className="rounded-full p-0.5 text-mercury-mute hover:text-mercury"
                    aria-label={`${t('remove')}: ${m.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {slugs.length < MAX_COMPARE ? (
                <div className="relative min-w-[220px] flex-1">
                  <MagnifyingGlass
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mercury-mute"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('compareAdd')}
                    className="w-full rounded-lg border border-white/8 bg-ink py-2 pl-9 pr-3 text-sm text-mercury outline-none placeholder:text-mercury-mute focus:border-cyan/40"
                  />
                </div>
              ) : (
                <span className="font-mono text-[11px] text-mercury-mute">{t('compareMax')}</span>
              )}
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSlugs([])}
                  className="ml-auto rounded-md border border-white/8 px-2.5 py-1.5 text-xs text-mercury-mute hover:text-mercury"
                >
                  {t('compareClear')}
                </button>
              )}
            </div>
            {suggestions.length > 0 && (
              <ul className="mt-2 max-h-72 overflow-auto rounded-xl border border-white/8 bg-ink p-1">
                {suggestions.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => add(m)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-mercury hover:bg-cyan/10"
                    >
                      <span>{m.name}</span>
                      <span className="text-xs text-mercury-mute">{m.model_creator.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selected.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              {selected.every((m) => m.kind === 'language') && <CompareRadar models={selected} />}

              <section className="panel overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.16em] text-mercury-mute">
                        <th className="px-4 py-3 font-medium" />
                        {selected.map((m, i) => (
                          <th key={m.id} className="px-4 py-3 font-medium normal-case tracking-normal">
                            <div className="flex items-start gap-2">
                              <i className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i] }} />
                              <div>
                                <Link to={`/model/${m.slug}?task=${task}`} className="text-sm text-mercury hover:text-cyan">
                                  {shortModelName(m.name)}
                                </Link>
                                <p className="text-[11px] text-mercury-mute">
                                  {m.model_creator.name}
                                  {m.rank > 0 ? ` · #${m.rank}` : ''}
                                </p>
                              </div>
                              <FavoriteButton slug={m.slug} size={14} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ROWS.map((row) => {
                        const values = selected.map((m) => row.get(m) ?? null)
                        if (values.every((v) => v == null)) return null
                        const best = selected.length > 1 ? bestIndex(values, row.lowerIsBetter) : -1
                        return (
                          <tr key={row.key} className="border-b border-white/6">
                            <td className="px-4 py-2.5 text-mercury-mute">{t(row.key)}</td>
                            {values.map((v, i) => (
                              <td
                                key={selected[i].id}
                                className={`px-4 py-2.5 font-mono ${
                                  i === best ? 'font-semibold text-cyan' : 'text-mercury-dim'
                                }`}
                              >
                                {v == null ? '—' : row.format(v)}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                      <tr>
                        <td className="px-4 py-2.5 text-mercury-mute">{t('release')}</td>
                        {selected.map((m) => (
                          <td key={m.id} className="px-4 py-2.5 font-mono text-mercury-dim">
                            {m.release_date ?? '—'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : suggestions.length > 0 ? null : query.trim() ? (
            <p className="panel rounded-2xl p-8 text-center text-mercury-mute">{t('noResults')}</p>
          ) : (
            <p className="panel rounded-2xl p-8 text-center text-mercury-mute">{t('compareEmpty')}</p>
          )}
        </>
      )}
    </PageShell>
  )
}
