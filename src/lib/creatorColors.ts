/** Stable, accessible creator color — shape + hue (not color alone). */
const PALETTE = [
  '#5eead4', // cyan
  '#93c5fd', // sky
  '#f9a8d4', // pink
  '#fcd34d', // amber
  '#a5b4fc', // indigo
  '#86efac', // green
  '#fdba74', // orange
  '#c4b5fd', // violet
  '#67e8f9', // cyan-light
  '#fca5a5', // red-soft
  '#d4d4d8', // zinc
  '#6ee7b7', // emerald
] as const

const SHAPES = ['circle', 'square', 'diamond', 'triangle'] as const
export type CreatorShape = (typeof SHAPES)[number]

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return h
}

export function creatorColor(name: string): string {
  return PALETTE[hashName(name.toLowerCase()) % PALETTE.length]
}

export function creatorShape(name: string): CreatorShape {
  return SHAPES[hashName(name.toLowerCase()) % SHAPES.length]
}

export function creatorDotStyle(name: string): {
  color: string
  shape: CreatorShape
} {
  return { color: creatorColor(name), shape: creatorShape(name) }
}
