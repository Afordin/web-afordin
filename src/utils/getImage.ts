import type { ImageMetadata, UnresolvedImageTransform } from 'astro'
import type { ImagePromise } from '@/types'

import { getImage as externalImage } from 'astro:assets'

async function getExternalImage(options: UnresolvedImageTransform): Promise<ImageMetadata | string> {
  try {
    const image = await externalImage({
      ...options,
      inferSize: true,
      format: 'webp',
    })
    const { src } = image

    return src
  } catch (error) {
    console.error('Error fetching external image:', error)

    throw new Error('Failed to fetch external image.')
  }
}

async function getLocalImage(imageUrl: string): Promise<ImageMetadata | string> {
  try {
    const getImages = import.meta.glob<{ default: ImageMetadata }>('../../public/**/*.{jpg,jpeg,png,svg}')

    const formatImagePath = `../../public${imageUrl}`

    // get image object from the import.meta.glob
    const images = await getImages[formatImagePath as keyof typeof getImages]()
    const { default: image } = images

    return image
  } catch (error) {
    console.error('Error getting local image:', error)

    throw new Error('Failed to get local image.')
  }
}

export async function getImage(options: UnresolvedImageTransform): ImagePromise {
  try {
    const { src: image } = options

    // return the image if it's an object
    if (typeof image === 'object' && 'src' in image) {
      return image
    }

    // check if the image path is an external image, if so, return the image URL
    const isExternalImage = typeof image === 'string' && image.startsWith('http')
    if (isExternalImage) {
      return await getExternalImage(options)
    }

    // return the local image
    return await getLocalImage(image as string)
  } catch (error) {
    console.error('Error in getImage function:', error)

    throw new Error('Failed to resolve the image.')
  }
}
