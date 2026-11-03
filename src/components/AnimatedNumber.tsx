import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'

export function AnimatedNumber({
  value,
  digits = 0,
  className,
}: {
  value: number
  digits?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const current = useRef(display)
  current.current = display

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const controls = animate(current.current, value, {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    })
    return () => controls.stop()
  }, [value, reduced])

  const formatted =
    digits > 0 ? display.toFixed(digits) : Math.round(display).toLocaleString()

  return <span className={className}>{formatted}</span>
}
