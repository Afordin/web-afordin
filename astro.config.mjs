import icon from 'astro-icon'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@astrojs/netlify'

import { iconTyping } from './scripts/integrations.ts'
import { defineConfig, fontProviders } from 'astro/config'

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  site: 'https://afordintest.netlify.app',
  integrations: [icon(), iconTyping()],
  vite: {
    plugins: [tailwindcss()],
  },
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: 'Manrope',
        cssVariable: '--font-manrope',
      },
      {
        provider: fontProviders.google(),
        name: 'Cal Sans',
        cssVariable: '--font-calsans',
      },
    ],
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    fallback: {
      en: 'es',
    },
  },
  devToolbar: {
    enabled: false,
  },
})
