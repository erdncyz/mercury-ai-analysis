export type TaskId =
  | 'coding'
  | 'agents'
  | 'math'
  | 'intelligence'
  | 'longcontext'
  | 'instruction'
  | 'image'
  | 'speech'
  | 'speed'

export type SortKey = 'score' | 'price' | 'speed' | 'value'

export type ModelKind = 'language' | 'image' | 'speech'

export interface ModelCreator {
  id: string
  name: string
  slug?: string
}

export interface ModelEvaluations {
  artificial_analysis_intelligence_index: number | null
  artificial_analysis_coding_index: number | null
  artificial_analysis_math_index: number | null
  terminalbench_v2_1?: number | null
  tau2?: number | null
  livecodebench?: number | null
  scicode?: number | null
  aime?: number | null
  aime_25?: number | null
  mmlu_pro?: number | null
  gpqa?: number | null
  hle?: number | null
  /** Long context reasoning, 0–1 */
  lcr?: number | null
  /** Instruction following, 0–1 */
  ifbench?: number | null
  terminalbench_hard?: number | null
  math_500?: number | null
}

export interface ModelPricing {
  price_1m_blended_3_to_1: number | null
  price_1m_input_tokens: number | null
  price_1m_output_tokens: number | null
  /** Media: USD per 1k images or per 1M characters */
  price_unit?: number | null
  price_unit_label?: 'per_1k_images' | 'per_1m_chars' | null
}

export interface AiModel {
  id: string
  name: string
  slug: string
  kind: ModelKind
  release_date?: string | null
  model_creator: ModelCreator
  evaluations: ModelEvaluations
  pricing: ModelPricing
  median_output_tokens_per_second: number | null
  median_time_to_first_token_seconds: number | null
  median_time_to_first_answer_token?: number | null
  elo?: number | null
  arena_rank?: number | null
  appearances?: number | null
}

export interface ModelsResponse {
  status?: number
  data: AiModel[]
  fetchedAt: string
  source: 'live' | 'cache' | 'fallback'
  tier?: string
}

export interface CostScenario {
  id: string
  inputTokens: number
  outputTokens: number
}

export interface RankedModel extends AiModel {
  rank: number
  score: number
  valueScore: number
  requestCost: number
}
