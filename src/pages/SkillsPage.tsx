import { useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { RepoGrid } from '../components/RepoGrid'
import { usePulse } from '../hooks/usePulse'
import { useI18n } from '../i18n/I18nProvider'
import type { MessageKey } from '../i18n/messages'

type Kind = 'skills' | 'agents' | 'trendingDaily' | 'trendingWeekly'
const KINDS: { key: Kind; label: MessageKey }[] = [
  { key: 'skills', label: 'pulseSkills' },
  { key: 'agents', label: 'pulseAgents' },
  { key: 'trendingDaily', label: 'trendingDaily' },
  { key: 'trendingWeekly', label: 'trendingWeekly' },
]

function parseKind(value: string | null): Kind {
  return KINDS.some((k) => k.key === value) ? (value as Kind) : 'skills'
}

export function SkillsPage() {
  const { t } = useI18n()
  const { data, loading, error } = usePulse()
  const [params, setParams] = useSearchParams()
  const kind = parseKind(params.get('kind'))

  const setKind = (next: Kind) => {
    const p = new URLSearchParams(params)
    p.set('kind', next)
    setParams(p, { replace: true })
  }

  return (
    <PageShell fetchedAt={data?.fetchedAt} source={data?.source} wide>
      <header className="mb-6">
        <h1 className="font-display text-4xl text-mercury md:text-5xl">{t('navSkills')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-mercury-mute">{t('skillsHint')}</p>
        {error && <p className="mt-2 font-mono text-[11px] text-mercury-mute">{t('pulseError')}</p>}
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {KINDS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setKind(item.key)}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              kind === item.key
                ? 'border-cyan/40 bg-cyan/10 text-cyan'
                : 'border-white/8 text-mercury-mute hover:text-mercury'
            }`}
          >
            {t(item.label)}
            <span className="ml-1.5 font-mono text-[10px] opacity-60">{data?.repos[item.key].length ?? 0}</span>
          </button>
        ))}
      </div>

      <RepoGrid
        repos={data?.repos[kind] ?? []}
        loading={loading}
        aiFilter={kind === 'trendingDaily' || kind === 'trendingWeekly'}
      />
    </PageShell>
  )
}
