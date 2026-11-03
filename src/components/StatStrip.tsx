import { Database, Flask, Pulse, Trophy } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { AnimatedNumber } from './AnimatedNumber'
import { useI18n } from '../i18n/I18nProvider'
import { fadeUp, stagger } from '../lib/motion'

export function StatStrip({
  models,
  creators,
  frontier,
  live,
}: {
  models: number
  creators: number
  frontier: number
  live: boolean
}) {
  const { t } = useI18n()

  const items = [
    { icon: Database, label: t('statsModels'), value: models, live: false },
    { icon: Flask, label: t('statsCreators'), value: creators, live: false },
    { icon: Trophy, label: t('statsFrontier'), value: frontier, live: false },
    { icon: Pulse, label: t('liveNow'), value: live ? 1 : 0, live: true },
  ]

  return (
    <motion.ul
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {items.map((item) => (
        <motion.li key={item.label} variants={fadeUp} className="panel rounded-2xl px-4 py-4">
          <div className="flex items-center gap-2 text-mercury-mute">
            <item.icon size={16} weight="duotone" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
              {item.label}
            </span>
          </div>
          {item.live ? (
            <p className="mt-2 flex items-center gap-2 text-lg font-medium text-mercury">
              <span
                className={`live-dot inline-block h-2 w-2 rounded-full ${
                  live ? 'bg-cyan' : 'bg-mercury-mute'
                }`}
              />
              {live ? t('sourceLive') : t('sourceFallback')}
            </p>
          ) : (
            <p className="mt-2 font-display text-3xl text-mercury">
              <AnimatedNumber value={item.value} />
            </p>
          )}
        </motion.li>
      ))}
    </motion.ul>
  )
}
