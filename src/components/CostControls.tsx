import { useI18n } from '../i18n/I18nProvider'
import { COST_SCENARIOS } from '../lib/ranking'
import type { MessageKey } from '../i18n/messages'

export interface CostSettings {
  inputTokens: number
  outputTokens: number
  monthlyRequests: number
}

export const DEFAULT_COST: CostSettings = {
  inputTokens: 4000,
  outputTokens: 1000,
  monthlyRequests: 10000,
}

const SCENARIO_LABEL: Record<string, MessageKey> = {
  chat: 'scenarioChat',
  code: 'scenarioCode',
  analysis: 'scenarioAnalysis',
}

function clampInt(value: string, fallback: number): number {
  const n = Number.parseInt(value.replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export function CostControls({
  value,
  onChange,
}: {
  value: CostSettings
  onChange: (next: CostSettings) => void
}) {
  const { t } = useI18n()
  const activeScenario = COST_SCENARIOS.find(
    (s) => s.inputTokens === value.inputTokens && s.outputTokens === value.outputTokens,
  )

  const field =
    'w-28 rounded-lg border border-white/8 bg-ink px-3 py-1.5 font-mono text-sm text-mercury outline-none focus:border-cyan/40'

  return (
    <section className="panel mb-6 rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">
            {t('costCalculator')}
          </p>
          <p className="mt-0.5 text-xs text-mercury-mute">{t('costHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {COST_SCENARIOS.map((s) => {
            const active = activeScenario?.id === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  onChange({ ...value, inputTokens: s.inputTokens, outputTokens: s.outputTokens })
                }
                className={`rounded-md border px-2.5 py-1.5 text-xs transition ${
                  active
                    ? 'border-cyan/40 bg-cyan/10 text-cyan'
                    : 'border-white/8 text-mercury-mute hover:text-mercury'
                }`}
              >
                {t(SCENARIO_LABEL[s.id] ?? 'custom')}
              </button>
            )
          })}
          <span
            className={`rounded-md border px-2.5 py-1.5 text-xs ${
              activeScenario ? 'border-white/8 text-mercury-mute' : 'border-cyan/40 bg-cyan/10 text-cyan'
            }`}
          >
            {t('custom')}
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-mercury-mute">
          {t('inputTokens')}
          <input
            className={field}
            inputMode="numeric"
            value={value.inputTokens}
            onChange={(e) =>
              onChange({ ...value, inputTokens: clampInt(e.target.value, value.inputTokens) })
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-mercury-mute">
          {t('outputTokens')}
          <input
            className={field}
            inputMode="numeric"
            value={value.outputTokens}
            onChange={(e) =>
              onChange({ ...value, outputTokens: clampInt(e.target.value, value.outputTokens) })
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-mercury-mute">
          {t('monthlyRequests')}
          <input
            className={field}
            inputMode="numeric"
            value={value.monthlyRequests}
            onChange={(e) =>
              onChange({
                ...value,
                monthlyRequests: clampInt(e.target.value, value.monthlyRequests),
              })
            }
          />
        </label>
      </div>
    </section>
  )
}
