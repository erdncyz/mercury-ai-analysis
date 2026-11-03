import { motion, useReducedMotion } from 'motion/react'
import { cinemaEase } from '../../lib/motion'

export function ScoreBar({
  value,
  max,
  delay = 0,
}: {
  value: number
  max: number
  delay?: number
}) {
  const reduced = useReducedMotion()
  const pct = max > 0 ? Math.max(4, Math.min(100, (value / max) * 100)) : 0

  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan/90 to-cyan/50"
          initial={{ width: reduced ? `${pct}%` : 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, delay: reduced ? 0 : delay, ease: cinemaEase }}
        />
      </div>
    </div>
  )
}
