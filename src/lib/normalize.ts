import type { AiModel, ModelKind } from '../types/models'
import { lookupMediaPrice } from '../data/media-prices'

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function creator(raw: Record<string, unknown> | undefined) {
  return {
    id: String(raw?.id ?? 'unknown'),
    name: String(raw?.name ?? 'Unknown'),
    slug: raw?.slug ? String(raw.slug) : undefined,
  }
}

export function normalizeLanguageModel(raw: Record<string, unknown>): AiModel {
  const evaluations = (raw.evaluations ?? {}) as Record<string, unknown>
  const pricing = (raw.pricing ?? {}) as Record<string, unknown>
  return {
    id: String(raw.id),
    name: String(raw.name),
    slug: String(raw.slug ?? raw.id),
    kind: 'language',
    release_date: raw.release_date ? String(raw.release_date) : null,
    model_creator: creator(raw.model_creator as Record<string, unknown>),
    evaluations: {
      artificial_analysis_intelligence_index: asNumber(
        evaluations.artificial_analysis_intelligence_index,
      ),
      artificial_analysis_coding_index: asNumber(
        evaluations.artificial_analysis_coding_index,
      ),
      artificial_analysis_math_index: asNumber(
        evaluations.artificial_analysis_math_index,
      ),
      terminalbench_v2_1: asNumber(evaluations.terminalbench_v2_1),
      tau2: asNumber(evaluations.tau2),
      livecodebench: asNumber(evaluations.livecodebench),
      scicode: asNumber(evaluations.scicode),
      aime: asNumber(evaluations.aime),
      aime_25: asNumber(evaluations.aime_25),
      mmlu_pro: asNumber(evaluations.mmlu_pro),
      gpqa: asNumber(evaluations.gpqa),
      hle: asNumber(evaluations.hle),
      lcr: asNumber(evaluations.lcr),
      ifbench: asNumber(evaluations.ifbench),
      terminalbench_hard: asNumber(evaluations.terminalbench_hard),
      math_500: asNumber(evaluations.math_500),
    },
    pricing: {
      price_1m_blended_3_to_1: asNumber(pricing.price_1m_blended_3_to_1),
      price_1m_input_tokens: asNumber(pricing.price_1m_input_tokens),
      price_1m_output_tokens: asNumber(pricing.price_1m_output_tokens),
    },
    median_output_tokens_per_second: asNumber(raw.median_output_tokens_per_second),
    median_time_to_first_token_seconds: asNumber(
      raw.median_time_to_first_token_seconds,
    ),
    median_time_to_first_answer_token: asNumber(
      raw.median_time_to_first_answer_token,
    ),
  }
}

export function normalizeMediaModel(
  raw: Record<string, unknown>,
  kind: Extract<ModelKind, 'image' | 'speech'>,
): AiModel {
  const name = String(raw.name)
  const slug = String(raw.slug ?? raw.id)
  const hint = lookupMediaPrice(name, slug, kind)
  const elo = asNumber(raw.elo)

  return {
    id: String(raw.id),
    name,
    slug,
    kind,
    release_date: raw.release_date ? String(raw.release_date) : null,
    model_creator: creator(raw.model_creator as Record<string, unknown>),
    evaluations: {
      artificial_analysis_intelligence_index: null,
      artificial_analysis_coding_index: null,
      artificial_analysis_math_index: null,
    },
    pricing: {
      price_1m_blended_3_to_1: hint?.price ?? null,
      price_1m_input_tokens: null,
      price_1m_output_tokens: null,
      price_unit: hint?.price ?? null,
      price_unit_label: hint?.label ?? null,
    },
    median_output_tokens_per_second: null,
    median_time_to_first_token_seconds: null,
    elo,
    arena_rank: asNumber(raw.rank),
    appearances: asNumber(raw.appearances),
  }
}

export function normalizeIncomingModels(payload: unknown): AiModel[] {
  if (!payload || typeof payload !== 'object') return []
  const obj = payload as Record<string, unknown>

  if (Array.isArray(obj.language) || Array.isArray(obj.image) || Array.isArray(obj.speech)) {
    const language = Array.isArray(obj.language)
      ? obj.language.map((m) => normalizeLanguageModel(m as Record<string, unknown>))
      : []
    const image = Array.isArray(obj.image)
      ? obj.image.map((m) =>
          normalizeMediaModel(m as Record<string, unknown>, 'image'),
        )
      : []
    const speech = Array.isArray(obj.speech)
      ? obj.speech.map((m) =>
          normalizeMediaModel(m as Record<string, unknown>, 'speech'),
        )
      : []
    return [...language, ...image, ...speech]
  }

  if (Array.isArray(obj.data)) {
    return obj.data.map((m) => {
      const row = m as Record<string, unknown>
      if (row.kind === 'image') return normalizeMediaModel(row, 'image')
      if (row.kind === 'speech') return normalizeMediaModel(row, 'speech')
      if (row.evaluations) return normalizeLanguageModel(row)
      if (typeof row.elo === 'number') {
        return normalizeMediaModel(row, 'image')
      }
      return normalizeLanguageModel(row)
    })
  }

  return []
}
