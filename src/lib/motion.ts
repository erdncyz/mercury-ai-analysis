import type { Transition, Variants } from 'motion/react'

export const cinemaEase = [0.16, 1, 0.3, 1] as const

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
  mass: 0.8,
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: cinemaEase },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.45, ease: cinemaEase },
  },
}

export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

export const staggerFast: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.04 },
  },
}

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: cinemaEase },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.22, ease: cinemaEase },
  },
}

export const hoverLift = {
  y: -3,
  transition: { duration: 0.22, ease: cinemaEase },
}
