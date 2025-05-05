import { defineConfig, fontProviders } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          assetFileNames: '_astro/[name].[ext]',
        },
      },
    },
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
