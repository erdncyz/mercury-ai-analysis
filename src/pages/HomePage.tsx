import { ArrowRight, ChartBar, GitBranch, Newspaper, Plugs, Scales } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { ComparePanel } from '../components/ComparePanel'
import { MagneticLink } from '../components/MagneticLink'
import { MercuryOrb } from '../components/MercuryOrb'
import { PageShell, SkeletonBlock } from '../components/PageShell'
import { PulseMcpPanel, PulseNewsPanel, PulseReposPanel } from '../components/PulsePanels'
import { SectionHeader } from '../components/SectionHeader'
import { StatStrip } from '../components/StatStrip'
import { TaskPicker } from '../components/TaskPicker'
import { TopTeaser } from '../components/TopTeaser'
import { useModels } from '../hooks/useModels'
import { usePulse } from '../hooks/usePulse'
import { useI18n } from '../i18n/I18nProvider'
import { paretoFrontier } from '../lib/charts'
import { rankModels } from '../lib/ranking'
import type { TaskId } from '../types/models'

export function HomePage() {
  const { t } = useI18n()
  const { models, data, loading, error } = useModels()
  const pulse = usePulse()
  const [task, setTask] = useState<TaskId>('coding')

  const ranked = useMemo(
    () => rankModels(models, task, 'score'),
    [models, task],
  )
  const frontier = useMemo(() => paretoFrontier(ranked, task), [ranked, task])
  const creators = useMemo(
    () => new Set(ranked.map((m) => m.model_creator.name)).size,
    [ranked],
  )

  return (
    <PageShell fetchedAt={data?.fetchedAt} source={data?.source} wide>
      <section className="mb-10 grid items-center gap-6 md:grid-cols-[1.15fr_0.85fr] md:gap-8">
        <div className="relative">
          <p className="font-display text-5xl leading-none tracking-tight text-mercury md:text-7xl">
            {t('brand')}
          </p>
          <h1 className="mt-6 max-w-xl text-balance text-xl text-mercury-dim md:text-2xl">
            {t('heroHeadline')}
          </h1>
          <p className="mt-4 max-w-lg text-pretty text-sm leading-relaxed text-mercury-mute md:text-base">
            {t('heroSupport')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <MagneticLink
              to={`/models?task=${task}`}
              className="inline-flex items-center gap-2 rounded-full bg-mercury px-5 py-2.5 text-sm font-medium text-ink shadow-[0_0_32px_-10px_rgba(94,234,212,0.8)] transition hover:bg-cyan"
            >
              {t('openModels')}
              <ArrowRight size={16} weight="bold" />
            </MagneticLink>
            {error && (
              <span className="font-mono text-[11px] text-mercury-mute">{t('error')}</span>
            )}
          </div>
        </div>
        <div className="relative mx-auto h-52 w-52 sm:h-60 sm:w-60 md:h-72 md:w-72 lg:h-80 lg:w-80">
          <MercuryOrb />
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
      ) : (
        <StatStrip
          models={ranked.length}
          creators={creators}
          frontier={frontier.length}
          live={data?.source === 'live'}
        />
      )}

      <section className="mt-14">
        <SectionHeader
          index="01"
          icon={ChartBar}
          title={t('navModels')}
          description={t('homeModelsDesc')}
          to={`/models?task=${task}`}
          cta={t('viewFull')}
        />
        <div className="mb-5">
          <TaskPicker value={task} onChange={setTask} compact />
        </div>
        {loading ? <SkeletonBlock className="h-44" /> : <TopTeaser models={ranked} task={task} hideHeader />}
      </section>

      <section className="mt-14">
        <SectionHeader
          index="02"
          icon={Scales}
          title={t('navCompare')}
          description={t('homeCompareDesc')}
          to={`/compare?task=${task}`}
          cta={t('openCompare')}
        />
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-48" />
          </div>
        ) : (
          <ComparePanel ranked={ranked} models={models} task={task} />
        )}
      </section>

      <section className="mt-14">
        <SectionHeader
          index="03"
          icon={Newspaper}
          title={t('navNews')}
          description={t('homeNewsDesc')}
          to="/news"
          cta={t('openNews')}
        />
        <PulseNewsPanel data={pulse.data} loading={pulse.loading} />
      </section>

      <section className="mt-14">
        <SectionHeader
          index="04"
          icon={GitBranch}
          title={t('navSkills')}
          description={t('homeReposDesc')}
          to="/skills"
          cta={t('openSkills')}
        />
        <PulseReposPanel data={pulse.data} loading={pulse.loading} />
      </section>

      <section className="mt-14">
        <SectionHeader
          index="05"
          icon={Plugs}
          title={t('navMcp')}
          description={t('mcpHint')}
          to="/mcp"
          cta={t('openMcp')}
        />
        <PulseMcpPanel data={pulse.data} loading={pulse.loading} />
      </section>
    </PageShell>
  )
}
