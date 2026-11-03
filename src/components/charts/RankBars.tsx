import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nProvider'
import { creatorColor } from '../../lib/creatorColors'
import { cinemaEase } from '../../lib/motion'
import { formatScore, scoreDigits, shortModelName } from '../../lib/ranking'
import type { RankedModel, TaskId } from '../../types/models'

export function RankBars({
  models,
  task,
  limit = 8,
}: {
  models: RankedModel[]
  task: TaskId
  limit?: number
}) {
  const { t } = useI18n()
  const reduced = useReducedMotion()
  const top = models.slice(0, limit)
  const max = Math.max(...top.map((m) => m.score), 1)
  const digits = scoreDigits(task)

  if (top.length === 0) return null

  return (
    <div className="panel flex h-full flex-col rounded-2xl p-4 md:p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
        {t('topRanked')}
      </p>
      <h2 className="mt-1 font-display text-2xl text-mercury">{t('scoreLadder')}</h2>
      <ol className="mt-4 flex flex-1 flex-col justify-center gap-2.5">
        {top.map((model, index) => {
          const pct = (model.score / max) * 100
          const color = creatorColor(model.model_creator.name)
          return (
            <li key={model.id}>
              <Link
                to={`/model/${model.slug}?task=${task}`}
                className="group block"
                title={`${model.name} · ${model.model_creator.name}`}
              >
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 truncate text-sm text-mercury group-hover:text-cyan">
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: color }}
                      aria-hidden
                    />
                    <span className="font-mono text-[11px] text-mercury-mute">
                      {index + 1}
                    </span>
                    <span className="truncate">{shortModelName(model.name)}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-mercury-dim">
                    {formatScore(model.score, digits)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        index === 0
                          ? `linear-gradient(90deg, ${color}, #5eead4)`
                          : `linear-gradient(90deg, ${color}, ${color}88)`,
                    }}
                    initial={{ width: reduced ? `${pct}%` : 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.7,
                      delay: reduced ? 0 : index * 0.06,
                      ease: cinemaEase,
                    }}
                  />
                </div>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
