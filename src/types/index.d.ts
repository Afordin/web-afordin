import type { LocalImageProps, RemoteImageProps } from 'astro:assets'

export interface Contributor {
  login: string
  avatar_url: string
  html_url: string
}

export type contributorsIcons = 'linkedin' | 'github'

export type Image = Awaited<LocalImageProps['src']> | Awaited<RemoteImageProps['src']>
export type ImagePromise = Promise<LocalImageProps['src'] | RemoteImageProps['src']>
