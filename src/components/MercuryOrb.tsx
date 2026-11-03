import { motion, useReducedMotion } from 'motion/react'

export function MercuryOrb() {
  const reduced = useReducedMotion()

  return (
    <svg
      viewBox="0 0 280 280"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <radialGradient id="orb-glow" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0.72" />
          <stop offset="42%" stopColor="#8fa3c0" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#030303" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="flask-glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ededef" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#5eead4" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="mercury-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f4f4f5" />
          <stop offset="45%" stopColor="#a1a1aa" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <clipPath id="flask-clip">
          <path d="M108 78 h64 v28 c0 10 6 18 14 28 18 22 30 42 30 68 0 38-24 62-76 62s-76-24-76-62c0-26 12-46 30-68 8-10 14-18 14-28z" />
        </clipPath>
      </defs>

      <motion.circle
        cx="140"
        cy="148"
        r="108"
        fill="url(#orb-glow)"
        animate={reduced ? undefined : { opacity: [0.7, 1, 0.7], scale: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.circle
          key={i}
          cx={140 + Math.cos((i / 6) * Math.PI * 2) * 96}
          cy={148 + Math.sin((i / 6) * Math.PI * 2) * 72}
          r={i % 2 === 0 ? 2.4 : 1.6}
          fill={i % 2 === 0 ? '#5eead4' : '#ededef'}
          opacity={0.45}
          animate={
            reduced
              ? undefined
              : { opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.15, 0.8] }
          }
          transition={{ duration: 3.2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <path
        d="M116 52 h48 c4 0 8 4 8 8 v18 h-64 V60 c0-4 4-8 8-8z"
        fill="none"
        stroke="url(#flask-glass)"
        strokeWidth="2.2"
      />
      <path
        d="M108 78 h64 v28 c0 10 6 18 14 28 18 22 30 42 30 68 0 38-24 62-76 62s-76-24-76-62c0-26 12-46 30-68 8-10 14-18 14-28z"
        fill="rgba(13,20,36,0.72)"
        stroke="url(#flask-glass)"
        strokeWidth="2.6"
      />

      <g clipPath="url(#flask-clip)">
        <motion.rect
          x="32"
          y="148"
          width="216"
          height="140"
          fill="url(#mercury-fill)"
          opacity="0.92"
          animate={reduced ? undefined : { y: [152, 146, 152] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          className="mercury-wave"
          d="M32 156 C 70 142, 110 170, 148 156 S 216 142, 248 156 V 280 H 32 Z"
          fill="#ededef"
          opacity="0.35"
          animate={reduced ? undefined : { x: [0, -10, 0] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </g>

      <path
        d="M122 92 h36"
        stroke="#ededef"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />
      <path
        d="M96 168 c18-10 36-6 52 0"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.18"
        strokeWidth="2"
      />
    </svg>
  )
}
