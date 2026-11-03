import { NavLink } from 'react-router-dom'
import { ChartBar, GitBranch, House, Newspaper, Plugs, Scales } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useI18n } from '../i18n/I18nProvider'
import type { Locale, MessageKey } from '../i18n/messages'

const NAV: { to: string; icon: Icon; label: MessageKey }[] = [
  { to: '/', icon: House, label: 'navHome' },
  { to: '/models', icon: ChartBar, label: 'navModels' },
  { to: '/compare', icon: Scales, label: 'navCompare' },
  { to: '/news', icon: Newspaper, label: 'navNews' },
  { to: '/skills', icon: GitBranch, label: 'navSkills' },
  { to: '/mcp', icon: Plugs, label: 'navMcp' },
]

export function SiteHeader() {
  const { t, locale, setLocale } = useI18n()

  return (
    <header className="glass-header sticky top-0 z-30 border-b border-white/8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <NavLink to="/" className="group flex shrink-0 items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight text-mercury md:text-[1.75rem]">
            {t('brand')}
          </span>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.22em] text-mercury-mute transition group-hover:text-cyan sm:inline">
            {t('brandSuffix')}
          </span>
        </NavLink>

        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto md:gap-1.5">
          {NAV.map(({ to, icon: NavIcon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition md:px-3 ${
                  isActive ? 'bg-white/5 text-mercury' : 'text-mercury-mute hover:text-mercury'
                }`
              }
            >
              <NavIcon size={15} weight="duotone" />
              <span className="hidden lg:inline">{t(label)}</span>
            </NavLink>
          ))}
          <div className="ml-2 flex shrink-0 overflow-hidden rounded-md border border-white/10">
            {(['en', 'tr'] as Locale[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={`px-2.5 py-1 font-mono text-[11px] tracking-wider transition ${
                  locale === code
                    ? 'bg-cyan/15 text-cyan'
                    : 'text-mercury-mute hover:text-mercury'
                }`}
                aria-pressed={locale === code}
              >
                {code === 'en' ? t('langEn') : t('langTr')}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}
