import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { t as translate, type Locale, type MessageKey } from './messages'

const STORAGE_KEY = 'mercury-locale'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('lang')
  if (fromUrl === 'tr' || fromUrl === 'en') return fromUrl
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'tr' || stored === 'en') return stored
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', next)
    window.history.replaceState({}, '', url.toString())
    document.documentElement.lang = next
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: MessageKey) => translate(locale, key),
    }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
