import globals from 'globals'
import configLove from 'eslint-config-love'
import configPrettier from 'eslint-config-prettier'
import pluginAstro from 'eslint-plugin-astro'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['dist/'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  ...pluginAstro.configs['flat/recommended'],
  ...pluginAstro.configs['flat/jsx-a11y-recommended'],
  {
    files: ['**/*.{js,mjs}', '**/*.ts'],
    ...configLove,
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    },
  },
  configPrettier,
]
