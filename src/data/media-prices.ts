/**
 * Approximate public list prices for popular media models.
 * Used only for F/P when Artificial Analysis free media payloads omit pricing.
 * Image: USD per 1,000 images. Speech: USD per 1M characters.
 */
export const MEDIA_PRICE_HINTS: {
  match: RegExp
  kind: 'image' | 'speech'
  price: number
  label: 'per_1k_images' | 'per_1m_chars'
}[] = [
  { match: /gpt.?image.?2.*high|gpt-image-2.*high/i, kind: 'image', price: 160, label: 'per_1k_images' },
  { match: /gpt.?image.?2|gpt-image-2/i, kind: 'image', price: 80, label: 'per_1k_images' },
  { match: /gpt.?image.?1\.5.*high/i, kind: 'image', price: 133, label: 'per_1k_images' },
  { match: /gpt.?image.?1/i, kind: 'image', price: 40, label: 'per_1k_images' },
  { match: /flux\.?1\.?1.?pro|flux 1\.1 pro/i, kind: 'image', price: 40, label: 'per_1k_images' },
  { match: /flux\.?1.?pro|flux pro/i, kind: 'image', price: 50, label: 'per_1k_images' },
  { match: /flux\.?1.?dev|flux dev/i, kind: 'image', price: 25, label: 'per_1k_images' },
  { match: /flux\.?1.?schnell|flux schnell/i, kind: 'image', price: 3, label: 'per_1k_images' },
  { match: /imagen.?4|imagen 4/i, kind: 'image', price: 40, label: 'per_1k_images' },
  { match: /imagen.?3|imagen 3/i, kind: 'image', price: 30, label: 'per_1k_images' },
  { match: /dall.?e.?3/i, kind: 'image', price: 80, label: 'per_1k_images' },
  { match: /recraft/i, kind: 'image', price: 40, label: 'per_1k_images' },
  { match: /ideogram/i, kind: 'image', price: 60, label: 'per_1k_images' },
  { match: /stable.?diffusion.?3|sd3/i, kind: 'image', price: 35, label: 'per_1k_images' },
  { match: /sonic.?3/i, kind: 'speech', price: 45, label: 'per_1m_chars' },
  { match: /sonic/i, kind: 'speech', price: 40, label: 'per_1m_chars' },
  { match: /eleven(labs)?|eleven.?turbo|eleven.?multilingual/i, kind: 'speech', price: 180, label: 'per_1m_chars' },
  { match: /openai.*tts|tts-1-hd|gpt.?4o.*mini.*tts/i, kind: 'speech', price: 30, label: 'per_1m_chars' },
  { match: /tts-1(?!-hd)/i, kind: 'speech', price: 15, label: 'per_1m_chars' },
  { match: /realtime.?tts/i, kind: 'speech', price: 50, label: 'per_1m_chars' },
  { match: /gemini.*tts|gemini.*flash.*tts/i, kind: 'speech', price: 20, label: 'per_1m_chars' },
  { match: /azure.*neural|azure.*tts/i, kind: 'speech', price: 16, label: 'per_1m_chars' },
]

export function lookupMediaPrice(
  name: string,
  slug: string,
  kind: 'image' | 'speech',
): { price: number; label: 'per_1k_images' | 'per_1m_chars' } | null {
  const hay = `${name} ${slug}`
  for (const hint of MEDIA_PRICE_HINTS) {
    if (hint.kind !== kind) continue
    if (hint.match.test(hay)) return { price: hint.price, label: hint.label }
  }
  return null
}
