import type { RankedModel } from '../types/models'

function cell(value: unknown): string {
  if (value == null || (typeof value === 'number' && !Number.isFinite(value))) return ''
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function rankedToCsv(models: RankedModel[]): string {
  const header = [
    'rank',
    'model',
    'creator',
    'score',
    'input_per_1m',
    'output_per_1m',
    'blended_per_1m',
    'unit_price',
    'tokens_per_second',
    'request_cost',
    'value',
    'release_date',
  ]
  const rows = models.map((m) => [
    m.rank,
    m.name,
    m.model_creator.name,
    m.score,
    m.pricing.price_1m_input_tokens,
    m.pricing.price_1m_output_tokens,
    m.pricing.price_1m_blended_3_to_1,
    m.pricing.price_unit,
    m.median_output_tokens_per_second,
    m.requestCost,
    m.valueScore > 0 ? m.valueScore : null,
    m.release_date,
  ])
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\n')
}

export function downloadText(filename: string, text: string, mime = 'text/csv') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
