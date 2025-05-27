import { defineConfig, fontProviders } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@astrojs/netlify'

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  site: 'https://afordintest.netlify.app',
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
