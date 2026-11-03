import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useI18n } from '../../i18n/I18nProvider'
import {
  chartable,
  logScale,
  linearScale,
  modelPrice,
  paretoFrontier,
} from '../../lib/charts'
import { creatorColor, creatorShape, type CreatorShape } from '../../lib/creatorColors'
import { cinemaEase } from '../../lib/motion'
import {
  formatMediaPrice,
  formatScore,
  formatUsd,
  scoreDigits,
  shortModelName,
} from '../../lib/ranking'
import type { RankedModel, TaskId } from '../../types/models'

const W = 640
const H = 340
const PAD = { l: 54, r: 18, t: 22, b: 46 }

function priceLabel(model: RankedModel, task: TaskId) {
  return task === 'image' || task === 'speech'
    ? formatMediaPrice(model)
    : formatUsd(model.pricing.price_1m_blended_3_to_1)
}

function Marker({
  x,
  y,
  r,
  color,
  shape,
  active,
  onFront,
}: {
  x: number
  y: number
  r: number
  color: string
  shape: CreatorShape
  active: boolean
  onFront: boolean
}) {
  const stroke = active || onFront ? '#ededef' : 'transparent'
  const strokeWidth = active ? 2 : onFront ? 1.25 : 0
  const opacity = onFront ? 0.98 : active ? 0.9 : 0.55

  if (shape === 'square') {
    const s = r * 1.7
    return (
      <rect
        x={x - s / 2}
        y={y - s / 2}
        width={s}
        height={s}
        rx={1.5}
        fill={color}
        opacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    )
  }
  if (shape === 'diamond') {
    const s = r * 1.35
    return (
      <polygon
        points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`}
        fill={color}
        opacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    )
  }
  if (shape === 'triangle') {
    const s = r * 1.5
    return (
      <polygon
        points={`${x},${y - s} ${x + s},${y + s * 0.75} ${x - s},${y + s * 0.75}`}
        fill={color}
        opacity={opacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    )
  }
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={color}
      opacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  )
}

export function FrontierChart({
  models,
  task,
}: {
  models: RankedModel[]
  task: TaskId
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [hover, setHover] = useState<string | null>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })

  const { points, frontier, xTicks, yTicks, legend } = useMemo(() => {
    const pool = chartable(models, task).slice(0, 48)
    const prices = pool.map((m) => modelPrice(m, task)!)
    const scores = pool.map((m) => m.score)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const minS = Math.min(...scores)
    const maxS = Math.max(...scores)
    const yMin = Math.max(0, minS - (maxS - minS) * 0.12)
    const yMax = maxS + (maxS - minS) * 0.1 || 1
    const innerW = W - PAD.l - PAD.r
    const innerH = H - PAD.t - PAD.b

    const mapped = pool.map((model) => {
      const price = modelPrice(model, task)!
      const creator = model.model_creator.name
      return {
        model,
        price,
        x: PAD.l + logScale(price, minP, maxP) * innerW,
        y: PAD.t + (1 - linearScale(model.score, yMin, yMax)) * innerH,
        color: creatorColor(creator),
        shape: creatorShape(creator),
      }
    })

    const front = paretoFrontier(pool, task)
    const frontPts = front
      .map((model) => mapped.find((p) => p.model.id === model.id)!)
      .filter(Boolean)

    const xTicks = [0, 0.33, 0.66, 1].map((t) => {
      const lo = Math.log10(Math.max(minP, 1e-6))
      const hi = Math.log10(Math.max(maxP, 1e-5))
      const price = 10 ** (lo + t * (hi - lo))
      return {
        x: PAD.l + t * innerW,
        label: price < 1 ? `$${price.toFixed(2)}` : `$${Math.round(price)}`,
      }
    })

    const yTicks = [0, 0.33, 0.66, 1].map((t) => {
      const score = yMin + t * (yMax - yMin)
      return {
        y: PAD.t + (1 - t) * innerH,
        label: formatScore(score, score >= 20 ? 0 : Math.max(1, scoreDigits(task))),
      }
    })

    const counts = new Map<string, number>()
    for (const p of mapped) {
      const name = p.model.model_creator.name
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    const legend = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => ({
        name,
        color: creatorColor(name),
        shape: creatorShape(name),
      }))

    return { points: mapped, frontier: frontPts, xTicks, yTicks, legend }
  }, [models, task])

  const hoverPoint = points.find((p) => p.model.id === hover)
  const line = frontier.map((p) => `${p.x},${p.y}`).join(' ')

  if (points.length < 3) {
    return (
      <div className="panel flex h-full min-h-[280px] items-center justify-center rounded-2xl p-6 text-sm text-mercury-mute">
        {t('chartEmpty')}
      </div>
    )
  }

  return (
    <div
      className="panel relative flex h-full flex-col overflow-hidden rounded-2xl p-4 md:p-5"
      onMouseLeave={() => setHover(null)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
            {t('efficientFrontier')}
          </p>
          <h2 className="mt-1 font-display text-2xl text-mercury">{t('frontierTitle')}</h2>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-mercury-mute">
            {t('frontierHint')}
          </p>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={t('frontierTitle')}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setCursor({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            })
          }}
        >
          {xTicks.map((tick) => (
            <g key={`x-${tick.x}`}>
              <line
                x1={tick.x}
                x2={tick.x}
                y1={PAD.t}
                y2={H - PAD.b}
                stroke="rgba(255,255,255,0.05)"
              />
              <text
                x={tick.x}
                y={H - 14}
                textAnchor="middle"
                fill="#71717a"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
              >
                {tick.label}
              </text>
            </g>
          ))}
          {yTicks.map((tick) => (
            <g key={`y-${tick.y}`}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={tick.y}
                y2={tick.y}
                stroke="rgba(255,255,255,0.05)"
              />
              <text
                x={PAD.l - 8}
                y={tick.y + 4}
                textAnchor="end"
                fill="#71717a"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
              >
                {tick.label}
              </text>
            </g>
          ))}

          <text x={W / 2} y={H - 2} textAnchor="middle" fill="#a1a1aa" fontSize="11">
            {t('priceAxis')}
          </text>
          <text
            x={16}
            y={H / 2}
            fill="#a1a1aa"
            fontSize="11"
            transform={`rotate(-90 16 ${H / 2})`}
            textAnchor="middle"
          >
            {t('scoreAxis')}
          </text>

          {frontier.length > 1 && (
            <>
              <defs>
                <linearGradient id="frontier-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.polygon
                points={`${frontier[0].x},${H - PAD.b} ${line} ${frontier[frontier.length - 1].x},${H - PAD.b}`}
                fill="url(#frontier-fill)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9, ease: cinemaEase }}
              />
              <motion.polyline
                points={line}
                fill="none"
                stroke="#5eead4"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={{ opacity: reduced ? 0.9 : 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ duration: 0.9, ease: cinemaEase }}
              />
            </>
          )}

          {points.map((point, index) => {
            const onFront = frontier.some((f) => f.model.id === point.model.id)
            const active = hover === point.model.id
            return (
              <motion.g
                key={point.model.id}
                role="link"
                tabIndex={0}
                aria-label={point.model.name}
                style={{ cursor: 'pointer' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: reduced ? 0 : Math.min(index * 0.012, 0.45),
                  duration: 0.35,
                  ease: cinemaEase,
                }}
                onMouseEnter={() => setHover(point.model.id)}
                onFocus={() => setHover(point.model.id)}
                onBlur={() => setHover(null)}
                onClick={() => navigate(`/model/${point.model.slug}?task=${task}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/model/${point.model.slug}?task=${task}`)
                  }
                }}
              >
                <Marker
                  x={point.x}
                  y={point.y}
                  r={onFront ? 6.5 : 4.2}
                  color={point.color}
                  shape={point.shape}
                  active={active}
                  onFront={onFront}
                />
              </motion.g>
            )
          })}
        </svg>

        <AnimatePresence>
          {hoverPoint && (
            <motion.div
              className="pointer-events-none absolute z-10 min-w-[180px] rounded-xl border border-white/10 bg-ink-elevated/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-md"
              style={{
                left: Math.min(cursor.x + 14, 280),
                top: Math.max(cursor.y - 12, 8),
              }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: hoverPoint.color }}
                  aria-hidden
                />
                <p className="font-medium text-mercury">
                  {shortModelName(hoverPoint.model.name)}
                </p>
              </div>
              <p className="mt-0.5 text-mercury-mute">
                {hoverPoint.model.model_creator.name}
                {frontier.some((f) => f.model.id === hoverPoint.model.id)
                  ? ` · ${t('onFrontier')}`
                  : ''}
              </p>
              <p className="mt-1.5 font-mono text-cyan">
                {t('score')} {formatScore(hoverPoint.model.score, scoreDigits(task))} ·{' '}
                {priceLabel(hoverPoint.model, task)}
              </p>
              {hoverPoint.model.valueScore > 0 && (
                <p className="mt-0.5 font-mono text-[11px] text-mercury-dim">
                  {t('value')} {formatScore(hoverPoint.model.valueScore, 2)}×
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-white/6 pt-3">
        {legend.map((item) => (
          <li
            key={item.name}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] text-mercury-mute"
          >
            <span
              className="inline-block h-2 w-2 rounded-[2px]"
              style={{ background: item.color }}
              aria-hidden
            />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
