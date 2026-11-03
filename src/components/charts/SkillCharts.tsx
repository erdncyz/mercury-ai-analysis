import { motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n/I18nProvider'
import { median, normalizeSkill, polar, radarPolygon as polygon, skillProfile } from '../../lib/charts'
import { cinemaEase } from '../../lib/motion'
import type { MessageKey } from '../../i18n/messages'
import type { RankedModel } from '../../types/models'

export function SkillCharts({
  model,
  field,
}: {
  model: RankedModel
  field: RankedModel[]
}) {
  const { t } = useI18n()
  const reduced = useReducedMotion()
  const axes = skillProfile(model)
  const usable = axes.filter((axis) => axis.value != null)
  if (usable.length < 3) return null

  const fieldMedians = usable.map((axis) => {
    const values = field
      .map((m) => {
        const match = skillProfile(m).find((item) => item.id === axis.id)
        return match ? normalizeSkill(match) : 0
      })
      .filter((v) => v > 0)
    return median(values) ?? 0
  })
  const modelValues = usable.map(normalizeSkill)
  const labels = usable.map((axis) => t(axis.id as MessageKey))

  const size = 280
  const cx = size / 2
  const cy = size / 2
  const r = 96
  const step = 360 / usable.length

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="panel rounded-2xl p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
          {t('radarTitle')}
        </p>
        <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto mt-2 h-auto w-full max-w-sm" role="img" aria-label={t('radarTitle')}>
          {[0.25, 0.5, 0.75, 1].map((ring) => (
            <polygon
              key={ring}
              points={polygon(usable.map(() => ring * 100), cx, cy, r)}
              fill="none"
              stroke="rgba(215,224,239,0.1)"
            />
          ))}
          {usable.map((_, i) => {
            const [x, y] = polar(cx, cy, r, -90 + i * step)
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="rgba(215,224,239,0.12)"
              />
            )
          })}
          <motion.polygon
            points={polygon(fieldMedians, cx, cy, r)}
            fill="rgba(143,163,192,0.14)"
            stroke="#8fa3c0"
            strokeWidth="1.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: cinemaEase }}
          />
          <motion.polygon
            points={polygon(modelValues, cx, cy, r)}
            fill="rgba(94,234,212,0.2)"
            stroke="#5eead4"
            strokeWidth="2"
            initial={{ opacity: 0, scale: reduced ? 1 : 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            transition={{ duration: 0.7, ease: cinemaEase }}
          />
          {labels.map((label, i) => {
            const [x, y] = polar(cx, cy, r + 22, -90 + i * step)
            return (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#8fa3c0"
                fontSize="11"
              >
                {label}
              </text>
            )
          })}
        </svg>
        <div className="mt-2 flex justify-center gap-4 font-mono text-[11px] text-mercury-mute">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-cyan" /> {model.name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-mercury-dim" /> {t('vsField')}
          </span>
        </div>
      </section>

      <section className="panel rounded-2xl p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mercury-mute">
          {t('vsField')}
        </p>
        <ul className="mt-5 space-y-4">
          {usable.map((axis, index) => {
            const modelPct = modelValues[index]
            const fieldPct = fieldMedians[index]
            return (
              <li key={axis.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-mercury">{t(axis.id as MessageKey)}</span>
                  <span className="font-mono text-xs text-cyan">
                    {Math.round(modelPct)}
                    <span className="text-mercury-mute"> / {Math.round(fieldPct)}</span>
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-white/5">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-mercury-dim/50"
                    initial={{ width: reduced ? `${fieldPct}%` : 0 }}
                    animate={{ width: `${fieldPct}%` }}
                    transition={{ duration: 0.55, delay: 0.05 * index, ease: cinemaEase }}
                  />
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan to-cyan/60"
                    initial={{ width: reduced ? `${modelPct}%` : 0 }}
                    animate={{ width: `${modelPct}%` }}
                    transition={{ duration: 0.7, delay: 0.08 * index, ease: cinemaEase }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
