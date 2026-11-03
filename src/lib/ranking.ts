import type { AiModel, CostScenario, RankedModel, SortKey, TaskId } from '../types/models'

export const COST_SCENARIOS: CostScenario[] = [
  { id: 'chat', inputTokens: 2000, outputTokens: 500 },
  { id: 'code', inputTokens: 4000, outputTokens: 1000 },
  { id: 'analysis', inputTokens: 8000, outputTokens: 2000 },
]

export const TASK_IDS: TaskId[] = [
  'coding',
  'agents',
  'math',
  'intelligence',
  'longcontext',
  'instruction',
  'image',
  'speech',
  'speed',
]

/** Tasks whose score is a 0–1 fraction rather than an index. */
export function isFractionTask(task: TaskId): boolean {
  return task === 'agents' || task === 'longcontext' || task === 'instruction'
}

export function scoreDigits(task: TaskId): number {
  if (task === 'image' || task === 'speech') return 0
  return isFractionTask(task) ? 2 : 1
}

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export function isNewRelease(model: AiModel, now = Date.now()): boolean {
  if (!model.release_date) return false
  const ts = Date.parse(model.release_date)
  return Number.isFinite(ts) && now - ts <= NEW_WINDOW_MS
}

export function modelsForTask(models: AiModel[], task: TaskId): AiModel[] {
  switch (task) {
    case 'image':
      return models.filter((m) => m.kind === 'image')
    case 'speech':
      return models.filter((m) => m.kind === 'speech')
    default:
      return models.filter((m) => m.kind === 'language')
  }
}

export function getTaskScore(model: AiModel, task: TaskId): number | null {
  const e = model.evaluations
  switch (task) {
    case 'coding':
      return e.artificial_analysis_coding_index
    case 'agents':
      return e.tau2 ?? e.terminalbench_v2_1 ?? null
    case 'math':
      return e.artificial_analysis_math_index
    case 'intelligence':
      return e.artificial_analysis_intelligence_index
    case 'longcontext':
      return e.lcr ?? null
    case 'instruction':
      return e.ifbench ?? null
    case 'image':
    case 'speech':
      return model.elo ?? null
    case 'speed':
      return model.median_output_tokens_per_second
    default:
      return null
  }
}

export function getValueScore(model: AiModel, task: TaskId): number | null {
  const score = getTaskScore(model, task)
  if (score == null) return null

  if (task === 'image' || task === 'speech') {
    const unit = model.pricing.price_unit ?? model.pricing.price_1m_blended_3_to_1
    if (unit == null || unit <= 0) return null
    return score / unit
  }

  const price = model.pricing.price_1m_blended_3_to_1
  if (price == null || price <= 0) return null

  // Speed ranks by tok/s, but value should still reflect quality per dollar.
  const quality =
    task === 'speed' ? model.evaluations.artificial_analysis_intelligence_index : score

  if (quality == null) return null
  return quality / price
}

export function estimateRequestCost(
  model: AiModel,
  inputTokens: number,
  outputTokens: number,
): number | null {
  if (model.kind === 'image') {
    const unit = model.pricing.price_unit
    if (unit == null) return null
    return unit / 1000
  }
  if (model.kind === 'speech') {
    const unit = model.pricing.price_unit
    if (unit == null) return null
    return (1000 / 1_000_000) * unit
  }
  const input = model.pricing.price_1m_input_tokens
  const output = model.pricing.price_1m_output_tokens
  if (input == null || output == null) return null
  return (inputTokens / 1_000_000) * input + (outputTokens / 1_000_000) * output
}

/** Collapse effort/variant spam: keep best scoring row per creator + base name. */
function familyKey(model: AiModel): string {
  const base = model.name
    .replace(/\s*\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  return `${model.model_creator.name.toLowerCase()}::${base}`
}

function variantPreference(model: AiModel): number {
  const n = model.name.toLowerCase()
  if (/\(max\)|max effort/.test(n)) return 5
  if (/\(xhigh\)|xhigh effort/.test(n)) return 4
  if (/\(high\)|high effort/.test(n)) return 3
  if (/\(medium\)|medium effort/.test(n)) return 2
  if (/\(low\)|non-reasoning/.test(n)) return 1
  return 0
}

function isBetterVariant(next: RankedModel, prev: RankedModel): boolean {
  if (next.score > prev.score + 0.05) return true
  if (prev.score > next.score + 0.05) return false
  return variantPreference(next) >= variantPreference(prev)
}

function dedupeBestByFamily(models: RankedModel[]): RankedModel[] {
  const best = new Map<string, RankedModel>()
  for (const model of models) {
    const key = familyKey(model)
    const prev = best.get(key)
    if (!prev || isBetterVariant(model, prev)) best.set(key, model)
  }
  return [...best.values()]
}

export function rankModels(
  models: AiModel[],
  task: TaskId,
  sort: SortKey = 'score',
  inputTokens = 4000,
  outputTokens = 1000,
): RankedModel[] {
  const pool = modelsForTask(models, task)
  const enriched = pool
    .map((model) => {
      const score = getTaskScore(model, task)
      const valueScore = getValueScore(model, task)
      const requestCost = estimateRequestCost(model, inputTokens, outputTokens)
      if (score == null) return null
      return {
        ...model,
        rank: 0,
        score,
        valueScore: valueScore ?? 0,
        requestCost: requestCost ?? Number.POSITIVE_INFINITY,
      } satisfies RankedModel
    })
    .filter((m): m is RankedModel => m != null)

  const unique = dedupeBestByFamily(enriched)

  const byPrimary = [...unique].sort((a, b) => b.score - a.score)
  byPrimary.forEach((m, i) => {
    m.rank = i + 1
  })

  const sorted = [...byPrimary].sort((a, b) => {
    switch (sort) {
      case 'price': {
        const ap =
          a.pricing.price_unit ??
          a.pricing.price_1m_blended_3_to_1 ??
          Number.POSITIVE_INFINITY
        const bp =
          b.pricing.price_unit ??
          b.pricing.price_1m_blended_3_to_1 ??
          Number.POSITIVE_INFINITY
        return ap - bp
      }
      case 'speed':
        return (
          (b.median_output_tokens_per_second ?? 0) -
          (a.median_output_tokens_per_second ?? 0)
        )
      case 'value':
        return b.valueScore - a.valueScore
      case 'score':
      default:
        return b.score - a.score
    }
  })

  return sorted
}

export function bestValueModels(models: RankedModel[], limit = 3): RankedModel[] {
  return [...models]
    .filter((m) => m.valueScore > 0)
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, limit)
}

/** @deprecated use bestValueModels */
export function bestValueModel(models: RankedModel[]): RankedModel | null {
  return bestValueModels(models, 1)[0] ?? null
}

export function formatUsd(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return '—'
  if (value === 0) return '$0'
  if (value < 0.0001) return `$${value.toExponential(1)}`
  if (value < 0.01) return `$${value.toFixed(4)}`
  if (value < 1) return `$${value.toFixed(3)}`
  return `$${value.toFixed(digits)}`
}

export function formatScore(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

/** Strip effort/variant parentheticals for compact card titles. */
export function shortModelName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
}

export function formatSpeed(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Math.round(value)} t/s`
}

export function formatMediaPrice(model: AiModel): string {
  const unit = model.pricing.price_unit
  if (unit == null) return '—'
  if (model.pricing.price_unit_label === 'per_1k_images') {
    return `${formatUsd(unit)} / 1k img`
  }
  if (model.pricing.price_unit_label === 'per_1m_chars') {
    return `${formatUsd(unit)} / 1M chars`
  }
  return formatUsd(unit)
}

export function percentile(rank: number, total: number): number {
  if (total <= 1) return 100
  return Math.round(((total - rank) / (total - 1)) * 100)
}
