import { ArrowRight } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export function SectionHeader({
  index,
  icon: IconCmp,
  title,
  description,
  to,
  cta,
}: {
  index: string
  icon: Icon
  title: string
  description: string
  to: string
  cta: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-mercury-mute">
          <span className="text-cyan">{index}</span>
          <IconCmp size={14} weight="duotone" />
          {title}
        </p>
        <h2 className="mt-1.5 max-w-xl text-lg text-mercury-dim md:text-xl">{description}</h2>
      </div>
      <Link
        to={to}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan transition hover:border-cyan/40 hover:bg-cyan/10"
      >
        {cta}
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}
