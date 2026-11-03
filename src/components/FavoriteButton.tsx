import { Star } from '@phosphor-icons/react'
import { useFavorites } from '../hooks/useFavorites'
import { useI18n } from '../i18n/I18nProvider'

export function FavoriteButton({ slug, size = 16 }: { slug: string; size?: number }) {
  const { t } = useI18n()
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(slug)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(slug)
      }}
      aria-pressed={active}
      aria-label={active ? t('removeFavorite') : t('addFavorite')}
      title={active ? t('removeFavorite') : t('addFavorite')}
      className={`rounded-md p-1 transition ${
        active ? 'text-amber-300' : 'text-mercury-mute/60 hover:text-mercury'
      }`}
    >
      <Star size={size} weight={active ? 'fill' : 'regular'} />
    </button>
  )
}
