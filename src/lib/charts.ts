import type { RankedModel, TaskId } from '../types/models'

export function modelPrice(model: RankedModel, task: TaskId): number | null {
  if (task === 'image' || task === 'speech') {
    const unit = model.pricing.price_unit ?? model.pricing.price_1m_blended_3_to_1
    return unit != null && unit > 0 ? unit : null
  }
  const price = model.pricing.price_1m_blended_3_to_1
  return price != null && price > 0 ? price : null
}

export function chartable(models: RankedModel[], task: TaskId): RankedModel[] {
  return models.filter(
    (model) => modelPrice(model, task) != null && Number.isFinite(model.score),
  )
}

/** Non-dominated models: cheaper-or-equal with strictly higher score as price rises. */
export function paretoFrontier(models: RankedModel[], task: TaskId): RankedModel[] {
  const sorted = [...chartable(models, task)].sort((a, b) => {
    const pa = modelPrice(a, task) ?? Number.POSITIVE_INFINITY
    const pb = modelPrice(b, task) ?? Number.POSITIVE_INFINITY
    return pa - pb
  })
  const front: RankedModel[] = []
  let bestScore = -Infinity
  for (const model of sorted) {
    if (model.score > bestScore) {
      front.push(model)
      bestScore = model.score
    }
  }
  return front
}

export function logScale(value: number, min: number, max: number): number {
  if (max <= min) return 0.5
  const lo = Math.log10(Math.max(min, 1e-6))
  const hi = Math.log10(Math.max(max, 1e-5))
  if (hi === lo) return 0.5
  return (Math.log10(Math.max(value, 1e-6)) - lo) / (hi - lo)
}

export function linearScale(value: number, min: number, max: number): number {
  if (max <= min) return 0.5
  return (value - min) / (max - min)
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

export interface SkillAxis {
  id: string
  value: number | null
  max: number
}

export function skillProfile(model: RankedModel): SkillAxis[] {
  const agents = model.evaluations.tau2 ?? model.evaluations.terminalbench_v2_1
  return [
    {
      id: 'intelligenceIndex',
      value: model.evaluations.artificial_analysis_intelligence_index,
      max: 100,
    },
    {
      id: 'codingIndex',
      value: model.evaluations.artificial_analysis_coding_index,
      max: 100,
    },
    {
      id: 'mathIndex',
      value: model.evaluations.artificial_analysis_math_index,
      max: 100,
    },
    {
      id: 'agentsIndex',
      value: agents == null ? null : agents <= 1.5 ? agents * 100 : agents,
      max: 100,
    },
    {
      id: 'longContextIndex',
      value: model.evaluations.lcr == null ? null : model.evaluations.lcr * 100,
      max: 100,
    },
    {
      id: 'instructionIndex',
      value: model.evaluations.ifbench == null ? null : model.evaluations.ifbench * 100,
      max: 100,
    },
    {
      id: 'speed',
      value: model.median_output_tokens_per_second,
      max: 250,
    },
  ]
}

export function normalizeSkill(axis: SkillAxis): number {
  if (axis.value == null || axis.max <= 0) return 0
  return Math.max(0, Math.min(100, (axis.value / axis.max) * 100))
}

export function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = (Math.PI / 180) * angle
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const
}

/** Values are 0–100 percentages, drawn clockwise from 12 o'clock. */
export function radarPolygon(values: number[], cx: number, cy: number, r: number) {
  const step = 360 / values.length
  return values
    .map((value, i) => {
      const [x, y] = polar(cx, cy, (value / 100) * r, -90 + i * step)
      return `${x},${y}`
    })
    .join(' ')
}
