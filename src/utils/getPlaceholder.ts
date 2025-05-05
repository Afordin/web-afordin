import type { ImageMetadata } from 'astro'
import type { Image, ImagePromise } from '@/types'

import placeholders from '@/data/placeholders.json'

import { getImage } from '@/utils/getImage'

export async function getPlaceholder(placeholderImage: Image): ImagePromise {
  const placeholder = typeof placeholderImage === 'string' ? placeholderImage : (placeholderImage as ImageMetadata).src

  const placeholderKey = Object.keys(placeholders).find((key) => placeholder.includes(key))

  if (placeholderKey) {
    return placeholders[placeholderKey as keyof typeof placeholders]
  }

  return getImage({ src: placeholder, format: 'webp' })
}
