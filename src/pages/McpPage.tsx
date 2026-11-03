import { PageShell } from '../components/PageShell'
import { RepoGrid } from '../components/RepoGrid'
import { usePulse } from '../hooks/usePulse'
import { useI18n } from '../i18n/I18nProvider'

export function McpPage() {
  const { t } = useI18n()
  const { data, loading, error } = usePulse()

  return (
    <PageShell fetchedAt={data?.fetchedAt} source={data?.source} wide>
      <header className="mb-6">
        <h1 className="font-display text-4xl text-mercury md:text-5xl">{t('navMcp')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-mercury-mute">{t('mcpHint')}</p>
        {error && <p className="mt-2 font-mono text-[11px] text-mercury-mute">{t('pulseError')}</p>}
      </header>

      <RepoGrid repos={data?.repos.mcp ?? []} loading={loading} />
    </PageShell>
  )
}
