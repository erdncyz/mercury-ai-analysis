import { ArrowLeft, Scales } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { SkillCharts } from '../components/charts/SkillCharts'
import { CopyLinkButton } from '../components/CopyLinkButton'
import { FavoriteButton } from '../components/FavoriteButton'
import { PageShell, SkeletonBlock } from '../components/PageShell'
import { useModels } from '../hooks/useModels'
import { useI18n } from '../i18n/I18nProvider'
import {
  formatMediaPrice,
  formatScore,
  formatSpeed,
  formatUsd,
  isNewRelease,
  percentile,
  rankModels,
  scoreDigits,
  TASK_IDS,
} from '../lib/ranking'
import type { TaskId } from '../types/models'

function parseTask(value: string | null): TaskId {
  return TASK_IDS.includes(value as TaskId) ? (value as TaskId) : 'coding'
}

export function ModelPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const task = parseTask(params.get('task'))
  const { t } = useI18n()
  const { models, data, loading } = useModels()

  const ranked = useMemo(() => rankModels(models, task, 'score'), [models, task])
  const model = ranked.find((m) => m.slug === slug)
  const fallbackModel = models.find((m) => m.slug === slug)
  const display = model ?? fallbackModel
  const pct = model ? percentile(model.rank, ranked.length) : null
  const isMedia = display?.kind === 'image' || display?.kind === 'speech'

  if (loading) {
    return (
      <PageShell>
        <SkeletonBlock className="mb-6 h-28" />
        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-48" />
        </div>
      </PageShell>
    )
  }

  if (!display) {
    return (
      <PageShell>
        <p className="text-mercury-mute">{t('noResults')}</p>
        <Link to="/models" className="mt-4 inline-flex items-center gap-1 text-cyan">
          <ArrowLeft size={14} />
          {t('back')}
        </Link>
      </PageShell>
    )
  }

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
        <div className="flex items-center gap-2">
          <Link
            to={`/compare?task=${task}&m=${display.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/8 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-mercury-mute transition hover:border-cyan/40 hover:text-cyan"
          >
            <Scales size={13} />
            {t('compare')}
          </Link>
          <CopyLinkButton />
        </div>
      </div>

      <header className="mt-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mercury-mute">
          {display.model_creator.name}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl text-mercury md:text-6xl">
            {display.name}
          </h1>
          <FavoriteButton slug={display.slug} size={22} />
          {isNewRelease(display) && (
            <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan">
              {t('newBadge')}
            </span>
          )}
        </div>
        {model && pct != null && (
          <p className="mt-3 font-mono text-sm text-cyan">
            #{model.rank} · {t('percentile')} {pct}
          </p>
        )}
        {model && (
          <p className="mt-1 text-xs text-mercury-mute">{t('compareNote')}</p>
        )}
      </header>

      {model && !isMedia && (
        <div className="mt-10">
          <SkillCharts model={model} field={ranked} />
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <section className="panel rounded-2xl p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-mercury-mute">
            {t('evaluations')}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {isMedia ? (
              <div className="flex justify-between">
                <dt className="text-mercury-mute">{t('eloScore')}</dt>
                <dd className="font-mono text-mercury">
                  {formatScore(display.elo, 0)}
                </dd>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('intelligenceIndex')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatScore(
                      display.evaluations.artificial_analysis_intelligence_index,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('codingIndex')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatScore(display.evaluations.artificial_analysis_coding_index)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('mathIndex')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatScore(display.evaluations.artificial_analysis_math_index)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('agentsIndex')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatScore(
                      display.evaluations.tau2 ?? display.evaluations.terminalbench_v2_1,
                      2,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('longContextIndex')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatScore(display.evaluations.lcr, 2)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('instructionIndex')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatScore(display.evaluations.ifbench, 2)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('gpqa')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatScore(display.evaluations.gpqa, 2)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('hle')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatScore(display.evaluations.hle, 2)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </section>

        <section className="panel rounded-2xl p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-mercury-mute">
            {t('pricing')}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {isMedia ? (
              <div className="flex justify-between">
                <dt className="text-mercury-mute">{t('unitPrice')}</dt>
                <dd className="font-mono text-cyan">{formatMediaPrice(display)}</dd>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('inputPrice')}</dt>
                  <dd className="font-mono text-cyan">
                    {formatUsd(display.pricing.price_1m_input_tokens)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('outputPrice')}</dt>
                  <dd className="font-mono text-cyan">
                    {formatUsd(display.pricing.price_1m_output_tokens)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('blended')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatUsd(display.pricing.price_1m_blended_3_to_1)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </section>

        <section className="panel rounded-2xl p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-mercury-mute">
            {t('performance')}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {!isMedia && (
              <>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('speed')}</dt>
                  <dd className="font-mono text-mercury">
                    {formatSpeed(display.median_output_tokens_per_second)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-mercury-mute">{t('ttft')}</dt>
                  <dd className="font-mono text-mercury">
                    {display.median_time_to_first_token_seconds != null
                      ? `${display.median_time_to_first_token_seconds.toFixed(2)}s`
                      : '—'}
                  </dd>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <dt className="text-mercury-mute">{t('release')}</dt>
              <dd className="font-mono text-mercury">
                {display.release_date ?? '—'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {model && (
        <section className="panel mt-4 rounded-2xl p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-mercury-mute">
            {t('overview')}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-mercury-mute">{t('score')}</p>
              <p className="rank-metal font-display text-4xl">
                {formatScore(model.score, scoreDigits(task))}
              </p>
            </div>
            <div>
              <p className="text-xs text-mercury-mute">{t('value')}</p>
              <p className="font-display text-4xl text-mercury">
                {model.valueScore > 0 ? formatScore(model.valueScore, 2) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-mercury-mute">{t('requestCost')}</p>
              <p className="font-display text-4xl text-cyan">
                {formatUsd(
                  Number.isFinite(model.requestCost) ? model.requestCost : null,
                  4,
                )}
              </p>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  )
}
