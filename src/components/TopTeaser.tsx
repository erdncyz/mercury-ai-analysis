import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useI18n } from '../i18n/I18nProvider'
import { creatorColor } from '../lib/creatorColors'
import { fadeUp, hoverLift, staggerFast } from '../lib/motion'
import { formatScore, formatUsd, scoreDigits, shortModelName } from '../lib/ranking'
import type { RankedModel, TaskId } from '../types/models'

export function TopTeaser({
  models,
  task,
  hideHeader = false,
}: {
  models: RankedModel[]
  task: TaskId
  hideHeader?: boolean
}) {
  const { t } = useI18n()
  const top = models.slice(0, 5)

  return (
    <section>
      {!hideHeader && (
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl text-mercury md:text-3xl">
            {t('topForTask')}
          </h2>
          <Link
            to={`/models?task=${task}`}
            className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan hover:text-mercury"
          >
            {t('viewFull')}
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <motion.ol
        className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-5"
        variants={staggerFast}
        initial="hidden"
        animate="show"
      >
        {top.map((model, index) => (
          <motion.li key={model.id} className="min-w-0" variants={fadeUp}>
            <motion.div whileHover={hoverLift} className="h-full">
              <Link
                to={`/model/${model.slug}?task=${task}`}
                title={model.name}
                className="panel flex h-full min-h-[168px] flex-col rounded-2xl p-5 transition hover:border-cyan/30 hover:bg-ink-panel"
              >
                <div className="flex items-baseline justify-between">
                  <span className="rank-metal font-display text-3xl">{model.rank}</span>
                  <span className="font-mono text-[11px] text-mercury-mute">
                    #{index + 1}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 min-h-[3.25rem] text-lg font-medium leading-snug text-mercury">
                  {shortModelName(model.name)}
                </p>
                <p className="flex items-center gap-1.5 truncate text-sm text-mercury-mute">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: creatorColor(model.model_creator.name) }}
                    aria-hidden
                  />
                  {model.model_creator.name}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-white/8 pt-3 font-mono text-xs">
                  <span className="text-mercury-dim">
                    {t('score')}{' '}
                    {formatScore(model.score, scoreDigits(task))}
                  </span>
                  <span className="text-cyan">
                    {task === 'image' || task === 'speech'
                      ? formatUsd(model.pricing.price_unit)
                      : formatUsd(model.pricing.price_1m_blended_3_to_1)}
                  </span>
                </div>
              </Link>
            </motion.div>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  )
}
