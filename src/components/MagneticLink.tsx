import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { type ComponentProps, useRef } from 'react'
import { Link } from 'react-router-dom'

export function MagneticLink({
  children,
  className,
  to,
}: {
  children: React.ReactNode
  className?: string
  to: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 280, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 280, damping: 18, mass: 0.4 })

  const onMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (reduced || !ref.current) return
    const box = ref.current.getBoundingClientRect()
    x.set((event.clientX - box.left - box.width / 2) * 0.28)
    y.set((event.clientY - box.top - box.height / 2) * 0.28)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div style={reduced ? undefined : { x: sx, y: sy }} className="inline-flex">
      <Link
        ref={ref}
        to={to}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className={className}
      >
        {children}
      </Link>
    </motion.div>
  )
}

export function MagneticButton(props: ComponentProps<'button'> & { className?: string }) {
  const { children, className, onMouseMove, onMouseLeave, ...rest } = props
  const reduced = useReducedMotion()
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 280, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 280, damping: 18, mass: 0.4 })

  return (
    <motion.div style={reduced ? undefined : { x: sx, y: sy }} className="inline-flex">
      <button
        {...rest}
        ref={ref}
        className={className}
        onMouseMove={(event) => {
          onMouseMove?.(event)
          if (reduced || !ref.current) return
          const box = ref.current.getBoundingClientRect()
          x.set((event.clientX - box.left - box.width / 2) * 0.28)
          y.set((event.clientY - box.top - box.height / 2) * 0.28)
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event)
          x.set(0)
          y.set(0)
        }}
      >
        {children}
      </button>
    </motion.div>
  )
}
