import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { AmbientBackground } from './AmbientBackground'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { pageEnter } from '../lib/motion'

export function PageShell({
  children,
  fetchedAt,
  source,
  wide = false,
}: {
  children: ReactNode
  fetchedAt?: string
  source?: string
  wide?: boolean
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackground />
      <SiteHeader />
      <motion.main
        className={`relative z-10 mx-auto w-full flex-1 px-5 pb-16 pt-8 md:px-8 ${
          wide ? 'max-w-7xl' : 'max-w-6xl'
        }`}
        variants={pageEnter}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        {children}
      </motion.main>
      <SiteFooter fetchedAt={fetchedAt} source={source} />
    </div>
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className ?? 'h-40'}`} />
}
