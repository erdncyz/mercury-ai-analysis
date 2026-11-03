import { Check, LinkSimple } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nProvider'

export function CopyLinkButton({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      // clipboard unavailable; ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-md border border-white/8 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-mercury-mute transition hover:border-cyan/40 hover:text-cyan ${className}`}
    >
      {copied ? <Check size={13} weight="bold" /> : <LinkSimple size={13} />}
      {copied ? t('copied') : t('copyLink')}
    </button>
  )
}
